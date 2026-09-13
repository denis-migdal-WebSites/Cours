import { SQLDymTable    } from "@Cours/components/SQL/SQLDymTable";
import { SQLInteractive } from "@Cours/components/SQL/SQLInteractive";
import { SQLExecutionResult } from "@Cours/components/SQL/SQLOutput";
import { getOutput } from "@LISS/src";

import "@Cours/components/SQL/SQLDymTable"; // ensure init.
import { SelectResult } from "@Cours/components/SQL/SQLResult";

const table = document.querySelector<SQLDymTable>("#row-table")!;
const sql   = document.querySelector<SQLInteractive>("#row-sql")!;

const signal = getOutput<SQLExecutionResult>(sql);

signal.listen( update );
update();

function update() {

    const value = signal.value;
    if( value === null) return;

    const ids = (value.results[0]! as SelectResult).map(r => r.ID);

    table.highlightRow( ({ID}) => ids.includes(+ID) );
}