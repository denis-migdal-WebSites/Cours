import "@Cours/components/SQL/SQLDymTable"; // ensure init.

import { PlayerToolbar } from "@Cours/components/PlayerToolbar";
import { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";
import { getOutput } from "@LISS/src";

const T1     = document.querySelector<SQLDymTable>("#cart_T1")!;
const T2     = document.querySelector<SQLDymTable>("#cart_T2")!;
const T1_T2  = document.querySelector<SQLDymTable>("#cart_T1_T2")!;
const T1_T2W = document.querySelector<SQLDymTable>("#cart_T1_T2W")!;

const player = document.querySelector<PlayerToolbar>("#cart_anim")!;

T1.highlightRow( ({ID}) => `high_${ID}` );
T2.highlightRow( ({ID}) => `high_${ID}` );

T1_T2.highlightCells( (row, colname) => {
    const id = row[ colname.split('.')[0] + ".ID"];
    return `high_${id}`;
});
T1_T2W.highlightCells( (row, colname) => {
    const id = row[ colname.split('.')[0] + ".ID"];
    return `high_${id}`;
});

const x = document.querySelector(".table_flex > .x")!;
const w = document.querySelector(".table_flex > .where")!;

function doStep(step:number) {

    let genT1_T2_max_step = T1.nbRows * (T2.nbRows + 2) + 2;

    x.classList.toggle("highlight", step !== 0 && step < genT1_T2_max_step);
    w.classList.toggle("highlight", step >= genT1_T2_max_step);

    if( step - genT1_T2_max_step > T1_T2.nbRows )
        return player.stop();

    let T1_rownum   : number;
    let T2_rownum   : number|undefined;
    let T1_T2_rownum: number;
    let T1_T2_generated = step === 0 ? undefined : -1;

    if( step > 1 && step < genT1_T2_max_step ) { // build T1xT2
        T1_rownum = Math.trunc( (step - 2) / (T2.nbRows + 2) );
        T2_rownum =             (step - 2) % (T2.nbRows + 2) - 1;

        T1_T2_generated = T1_rownum * T2.nbRows + T2_rownum;

        if( T2_rownum === -1 )
            T2_rownum = undefined;
        if( T2_rownum === T2.nbRows ) {
            T2_rownum = undefined;
            --T1_T2_generated;
        }

        T1_T2_rownum = T1_rownum * T2.nbRows + T2_rownum!; //?
    }

    let T1_T2W_rownum = step === 0 ? T1_T2.nbRows : -1;

    if( step >= genT1_T2_max_step ) { // filter T1xT2
        T1_T2_generated = T1_T2.nbRows;
        T1_T2W_rownum = T1_T2_rownum = step - genT1_T2_max_step;
    }


    T1.highlightRow( (_, row_num) => {
        return {cur: row_num === T1_rownum}
    });
    T2.highlightRow( (_, row_num) => {
        return {cur: row_num === T2_rownum}
    });

    T1_T2.highlightRow( (_, row_num) => {
        return {
        cur : row_num === T1_T2_rownum,
        hide: row_num >   T1_T2_generated! // ?
        }
    });
    T1_T2W.highlightRow( (row, row_num) => {
        return {
        cur : row_num === T1_T2W_rownum,
        hide: row_num >   T1_T2W_rownum || row["T1.ID"] !== row["T2.ID"]
        }
    });
}

const signal = getOutput<number>(player);
signal.listen( () => doStep(signal.value!) );
doStep(0);