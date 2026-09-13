import { SQLDymTable    } from "@Cours/components/SQL/SQLDymTable";
import { SQLInteractive } from "@Cours/components/SQL/SQLInteractive";
import { SQLExecutionResult } from "@Cours/components/SQL/SQLOutput";
import { getOutput } from "@LISS/src";

import "@Cours/components/SQL/SQLDymTable"; // ensure init.

const table = document.querySelector<SQLDymTable>("#col-table")!;
const sql   = document.querySelector<SQLInteractive>("#col-sql")!;

const signal = getOutput<SQLExecutionResult>(sql);

signal.listen( update );
update();

function update() {
    const value = signal.value;
    if( value === null) return;

    const cols = Object.keys(value.results[0]![0]);
    table.highlightCol( (colname) => cols.includes(colname) );
}