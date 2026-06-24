import {LISS} from "@LISS/src/extensions"
import define from "@LISS/src/define";
import { db2 } from "@sqlite/SQLite";

const css = __LOAD_FILE__("./index.css");

export class SQLDymTable extends LISS({css}) {

    readonly colsnames = this.getAttribute("cols") ?? "*";
    readonly tablename = this.getAttribute("table")!;
    readonly header    = this.getAttribute("header")!;

    readonly groupby   = this.getAttribute("groupby");

    cols!: Record<string, HTMLTableColElement>;
    rows!: any[];
    data!: any;

    constructor() {
        super();

        this.exec(`SELECT ${this.colsnames} FROM ${this.tablename};`);

        if( this.groupby !== null)
            this.groupBy(this.groupby);
    }

    get nbRows() {
        return this.rows.length;
    }
    getRow(rowid: number) {
        return this.rows[rowid];
    }

    exec(query: string) {

        this.cols = {};
        this.rows = [];
        this.data = db2.exec_one(query);

        const table = document.createElement('table');

        const caption = document.createElement('caption');
        caption.textContent = this.header ?? `Table ${this.tablename} :`;

        //TODO: colgroup (for highlight).
        const colgroup = document.createElement('colgroup');
        const thead    = document.createElement('thead');
        const trhead   = document.createElement('tr');

        const colnames =  Object.keys(this.data[0]);
        for(let colname of colnames) {
            const col = document.createElement('col');
            //col.classList.add('highlight');
            colgroup.append(col);

            this.cols[colname] = col;

            const th = document.createElement('th');
            th.textContent = colname;
            trhead.append(th);
        }
        thead.append(trhead);

        const tbody = document.createElement('tbody');
        for(let line of this.data) {

            const tr = document.createElement('tr');
            for(let colname of colnames) {
                const td = document.createElement('td');
                td.textContent = line[colname] ?? "N/A";
                tr.append(td);
            }
            tbody.append(tr);

            this.rows.push([line,tr]);
        }

        table.append(caption, colgroup, thead, tbody);
        this.content.replaceChildren(table);
    }

    groupBy( group_colname: string ) {

        const tbody = this.content.querySelector("tbody")!;

        let groups: Record<any, any[]> = {};

        for(let line of this.data) {
            const group = line[group_colname];
            (groups[group] ??= []).push( line );
        }

        let rows = [];
        for(let groupname in groups) {

            const group = groups[groupname];

            for(let i = 0; i < group.length; ++i) {

                const entry = group[i];
                const tr = document.createElement('tr');

                for(let col in group[i]) {

                    const cell = document.createElement('td');
                    cell.textContent = entry[col];

                    if( col === group_colname ){
                        if(i !== 0)
                            continue;

                        cell.setAttribute("rowspan", `${group.length}`);
                    }

                    tr.append(cell);
                }
                rows.push(tr);
            }
                
            rows.push(document.createElement("tr"));
        }

        tbody.replaceChildren(...rows);
    }

    highlightCol( filter: (name: string) => boolean ) {
        for(let colname in this.cols)
            this.#highlight(this.cols[colname], filter(colname) );
    }

    #highlight(target: HTMLElement, highlight: boolean|string|Record<string, boolean>) {

        if( typeof highlight === "boolean")
            return target.classList.toggle('highlight', highlight);
        if( typeof highlight === "string" )
            return target.classList.add(highlight);
        
        for(let name in highlight)
            target.classList.toggle(name, highlight[name]);

    }

    highlightRow( filter: (value: any, rowid: number) => boolean|string|Record<string, boolean>) {
        for(let i = 0; i < this.rows.length; ++i)
            this.#highlight( this.rows[i][1], filter(this.rows[i][0], i) );
    }

    highlightCells( filter: (data: any, name: string) => boolean|string|Record<string, boolean> ) {

        for(let i = 0; i < this.rows.length; ++i) {

            const [row_data, row_html] = this.rows[i];
            const cols = Object.keys(row_data);

            for(let j = 0; j < cols.length; ++j)
                this.#highlight( row_html.children[j] , filter(row_data, cols[j]) );
        }
    }
};

define("sql-dymtable", SQLDymTable)