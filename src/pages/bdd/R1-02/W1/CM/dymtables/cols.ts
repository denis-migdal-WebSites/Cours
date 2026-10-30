import { SQLDymTable    } from "@Cours/components/@topics/bdr/SQL/SQLDymTable";
import { SQLInteractive } from "@Cours/components/@topics/bdr/SQL/SQLInteractive";
import { SQLExecutionResult } from "@Cours/components/@topics/bdr/SQL/SQLOutput";
import { getOutput } from "@LISS/src";

import "@Cours/components/@topics/bdr/SQL/SQLDymTable"; // ensure init.

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