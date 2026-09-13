import { SQLDymTable    } from "@Cours/components/SQL/SQLDymTable";
import { SQLInteractive } from "@Cours/components/SQL/SQLInteractive";
import { SQLExecutionResult } from "@Cours/components/SQL/SQLOutput";
import { getOutput } from "@LISS/src";

import "@Cours/components/SQL/SQLDymTable"; // ensure init.
import { SelectResult } from "@Cours/components/SQL/SQLResult";

const table = document.querySelector<SQLDymTable>   ("#join2_T1_T2W")!;
const sql   = document.querySelector<SQLInteractive>("#join2_sql")!;

const signal = getOutput<SQLExecutionResult>(sql);

signal.listen( update );
update();

function update() {
    const value = signal.value;
    if( value === null) return;

    const datas = value.results as SelectResult[];

    const t2 = datas[0].map( e => e.T2);

    table.highlightRow( (row) => {
        return { lowlight: ! t2.includes(row["T2.T2"]) }
    });
}

table.highlightCells( (row, colname) => {
    const id = row[ colname.split('.')[0] + ".ID"];
    return `high_${id}`;
});