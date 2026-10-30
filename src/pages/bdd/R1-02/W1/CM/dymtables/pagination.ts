import { SQLDymTable    } from "@Cours/components/@topics/bdr/SQL/SQLDymTable";
import { SQLInteractive } from "@Cours/components/@topics/bdr/SQL/SQLInteractive";
import { SQLExecutionResult } from "@Cours/components/@topics/bdr/SQL/SQLOutput";
import { getOutput } from "@LISS/src";

import "@Cours/components/@topics/bdr/SQL/SQLDymTable"; // ensure init.
import { SelectResult } from "@Cours/components/@topics/bdr/SQL/SQLResult";

const table = document.querySelector<SQLDymTable>("#pagination-table")!;
const sql   = document.querySelector<SQLInteractive>("#pagination-sql")!;

const signal = getOutput<SQLExecutionResult>(sql);

signal.listen( update );
update();

function update() {

    const value = signal.value;
    if( value === null) return;

    const ids = (value.results[0]! as SelectResult).map(r => r.ID);

    table.highlightRow( ({ID}) => ids.includes(+ID) );
}