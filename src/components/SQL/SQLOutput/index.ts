import {getInput, LISS, WithBare, WithContent, WithInput} from "@LISS/src/extensions"
import define from "@LISS/src/define";

const css = __LOAD_FILE__("./index.css");

import '../SQLQuery';
import SQLQuery from "../SQLQuery";

import '../SQLResult';
import SQLResult, { PrintResult } from "../SQLResult";

export type SelectResult = Record<string, any>[];
export type Result = null|string|SelectResult;

export type SQLExecutionResult = {
    queries: string[],
    results: Result[]
};

// can't use shadow, else won't be able to build...
export default class SQLOutput extends LISS({ css, html: "<slot/>" },
                                    WithBare, WithContent,WithInput<SQLExecutionResult>
){

    #queries = [...this.host.querySelectorAll<HTMLElement>("sql-query")];
    #results = [...this.host.querySelectorAll<HTMLElement>("sql-result")];

    #queries_input = this.#queries.map( e => getInput<string>(e) );
    #results_input = this.#results.map( e => getInput<PrintResult>(e) );

    #dynamic = this.#queries.length + this.#results.length === 0;

    constructor() {
        super();

        this._input.listen( () => this.#onInputChange() );
    }

    #onInputChange() {
        const value = this._input.value;
        if( value === null)
            return;

        if( this.#dynamic )
            this.#createDynamicOutput(value.results.length);

        for(let i = 0; i < this.#queries.length; ++i) {
            const id = +this.#queries[i].getAttribute('q')! - 1;
            this.#queries_input[i].value = value.queries[id];
        }

        for(let i = 0; i < this.#results.length; ++i) {

            const id = +this.#results[i].getAttribute('q')! - 1;

            let cmp_to: SelectResult[] = [];
            const result = value.results[id];
            if(result === undefined)
                continue; // prev query likely exited with error.

            if( Array.isArray(result) ) // this is a SELECT query
                cmp_to = value.results.filter( (_, i) => {
                    return i !== id
                            && value.queries[id] === value.queries[i]
                            && typeof value.results[i] !== "string"; // error
                }) as SelectResult[];

            const cmp_idx = this.#results[i].getAttribute('cmp_with');
            let cmp_with: null|SelectResult = null;
            if( cmp_idx !== null)
                cmp_with = value.results[+cmp_idx-1] as SelectResult;

            this.#results_input[i].value = { result, cmp_to, cmp_with };
        }
    }

    #createDynamicOutput(nb: number) {

        this.#queries.length = this.#results.length = nb;
        let content = new Array( nb * 2 );

        for(let i = 0; i < nb; ++i) {
            // todo similar_to="?"
            const sql_query = new SQLQuery();
            const sql_result = new SQLResult();

            sql_query.setAttribute ("q", `${i+1}`);
            sql_result.setAttribute("q", `${i+1}`);

            content[2*i  ] = this.#queries[i] = sql_query;
            content[2*i+1] = this.#results[i] = sql_result;
        }

        this.host.replaceChildren(...content);

        this.#queries_input = this.#queries.map(e => getInput<string     >(e));
        this.#results_input = this.#results.map(e => getInput<PrintResult>(e));
    }
}

define("sql-output", SQLOutput);