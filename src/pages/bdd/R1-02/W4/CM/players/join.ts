import { PlayerToolbar } from "@Cours/components/PlayerToolbar";
import { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";

import "@Cours/components/SQL/SQLDymTable"; // force init.
import { getOutput } from "@LISS/src";

const T1     = document.querySelector<SQLDymTable>("#join_T1")!;
const T2     = document.querySelector<SQLDymTable>("#join_T2")!;
const T1_T2W = document.querySelector<SQLDymTable>("#join_T1_T2W")!;

const player = document.querySelector<PlayerToolbar>("#join_anim")!;

T1.highlightRow( ({ID}) => `high_${ID}` );
T2.highlightRow( ({ID}) => `high_${ID}` );

T1_T2W.highlightCells( (row, colname) => {
    const id = row[ colname.split('.')[0] + ".ID"];
    return `high_${id}`;
});

function doStep(step: number) {

    let T2_rownum: number|undefined;
    let substep  : number;

    if( step > 1 ) { // build T1 JOIN T2
        T2_rownum = Math.trunc( (step - 2) / 3);
        substep = (step - 2) % 3;
    }

    if( T2_rownum !== undefined && T2_rownum >= T2.nbRows){
        player.stop();
        return 
    }

    T1.highlightRow( ({ID}) => {

        return {cur: T2_rownum !== undefined && ID === T2.getRow(T2_rownum)[0].ID && substep > 0 }
    });
    T2.highlightRow( (_, row_num) => {
        return {cur: row_num === T2_rownum}
    });

    T1_T2W.highlightRow( (_row, row_num) => {
        return {
            cur : step !== 0 && row_num === T2_rownum && substep === 2,
            hide: step !== 0 && (step === 1 || row_num > T2_rownum! || row_num === T2_rownum && substep !== 2)
        }
    });
}

const signal = getOutput<number>(player);

signal.listen( () => doStep(signal.value!) );
doStep(0);