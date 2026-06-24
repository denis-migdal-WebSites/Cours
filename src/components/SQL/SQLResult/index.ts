import {LISS, WithBare, WithContent, WithInput} from "@LISS/src/extensions"
import define from "@LISS/src/define";
import { keepSpaces } from "@LISS/components/code/code-script";

export type SelectResult = Record<string, any>[];
export type Result = null|string|SelectResult;

export type PrintResult = {
                            result: Result,
                            cmp_to: SelectResult[],
                            cmp_with: SelectResult|null
                        };

const css = __LOAD_FILE__("./index.css");

export default class SQLResult extends LISS({css},
                                            WithBare,
                                            WithContent,
                                            WithInput<PrintResult>) {

    constructor() {
        super();

        this._input.listen( () => {

            const value = this._input.value;
            if( value === null)
                return;

            const html = this.#buildResult(value.result,
                                           value.cmp_to,
                                           value.cmp_with);
            this.content.innerHTML = keepSpaces(html);
        });
    }


    #buildResult(result: Result,
                 cmp_to: SelectResult[],
                 cmp_with: SelectResult|null) {

        if( result === null)
            return "";

        if( ! Array.isArray(result) ) { // no update for now...
            this.host.classList.add('error');
            return result;
        }

        if( result.length === 0 ) {
            return "No row returned.\n";
        }

        const headers = Object.keys(result[0]);
        const results = [
            ... result.map(entry => Object.values(entry).map(value => {
                    if( value == null )
                        return 'N/A';
                    if(typeof value === 'string')
                        return `'${value}'`;
                    return value.toString()
                }) )   
        ];

        const colsizes = new Array(headers.length);
        for(let i = 0; i < colsizes.length; ++i) {
            colsizes[i] = headers[i].length;
            for(let row of results)
                if( row[i].length > colsizes[i] )
                    colsizes[i] = row[i].length;
        }

        let cols_highlight = [];
        if( cmp_with !== null) {

            const cmp_with_headers = Object.keys(cmp_with[0]);

            for(let i = 0; i < headers.length; ++i)
                if( cmp_with_headers.includes(headers[i]) )
                    cols_highlight.push( i );

            if( cols_highlight.length === headers.length)
                cols_highlight.length = 0;
        }

        const output = new OutputBuilder(colsizes, cols_highlight);

        output.addHLine()
              .addLine (headers, null, true)
              .addHLine(true);

        const key = headers[0]; //dirty...

        for(let j = 0; j < results.length; ++j) {
            let row = results[j];

            let highlights: boolean|Array<number> = false;

            if( cmp_with !== null && cols_highlight.length === 0)
                highlights = cmp_with.find( l => l[key] === result[j][key] ) !== undefined;

            if( cmp_to.length !== 0) {
                let lines = cmp_to.map( res => res!.find( l => l[key] === result[j][key] ) );

                highlights = lines.includes(undefined);

                if( ! highlights ) {
                    highlights = [];
                    for(let i = 0; i < headers.length; ++i) {
                        const colname = headers[i];
                        if( lines.some( l => l![colname] !== result[j][colname] ) )
                            highlights.push( i );
                    }

                    if( ! highlights.length )
                        highlights = false;
                }
            }

            output.addLine(row, highlights);
        }

        output.addHLine();
        
        return output.html;
    }

}

// TODO: highlight...
class OutputBuilder {

    #colsizes : number[];
    #colshight: number[];
    #html    : string = "";

    constructor(colsizes: number[], colshight: number[] = []) {
        this.#colsizes = colsizes;
        this.#colshight = colshight;
    }

    #addPaddedLine(line: string[], vsep = "|") {

        this.#html += `${vsep}${line.join(vsep)}${vsep}\n`;
    }

    #padLine(line: string[], char: string|null = " ", isHeader = false) {

        if( char === null)
            char = " ";

        let result = new Array(this.#colsizes.length);
        for(let i = 0; i < result.length; ++i) {

            const txt = line[i] ?? "";

            let padMethod = "padEnd";
            if( ! isHeader && txt[0] !== "'")
                padMethod = "padStart"

            // @ts-ignore
            result[i] = char + txt[padMethod](this.#colsizes[i], char) + char;
        }

        return result;
    }

    addLine(line: string[],
            highlight:boolean|number[]|null = false,
            isHeader = false) {

        if( highlight === null )
            highlight = false;

        const row = this.#padLine(line, null, isHeader); // cell highlight here.

        if( Array.isArray(highlight) )
            for(let idx of highlight)
                row[idx] = `<span class="highlight">${row[idx]}</span>`;

        for(let idx of this.#colshight)
            row[idx] = `<span class="highlight">${row[idx]}</span>`;

        let row_txt = `|${row.join('|')}|`;
        
        if( highlight === true)
            row_txt = `<span class="highlight">${row_txt}</span>`;

        this.#html += `${row_txt}\n`;

        return this;
    }

    addHLine(highlight_cols = false) {
        
        const row = this.#padLine([], "-")

        if(highlight_cols)
            for(let idx of this.#colshight)
                row[idx] = `<span class="highlight">${row[idx]}</span>`;

        this.#addPaddedLine(row, "+" );

        return this;
    }

    get html() {
        return this.#html;
    }
}

define("sql-result", SQLResult);