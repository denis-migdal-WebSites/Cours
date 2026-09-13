import { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";
import { type FrameUCA } from "WebSlides@2026/widgets/frames/FrameUCA";

// ensure init.
import "@Cours/components/SQL/SQLDymTable";

function init_slide(slide: FrameUCA) {

    const T1 = slide.querySelector<SQLDymTable>("#cart_T1")!;
    const T2 = slide.querySelector<SQLDymTable>("#cart_T2")!;

    const T1_T2  = slide.querySelector<SQLDymTable>("#cart_T1_T2")!;
    const T1_T2W = slide.querySelector<SQLDymTable>("#cart_T1_T2W")!;

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
    
    function doStep(step: number) {

        let genT1_T2_max_step = T1.nbRows * (T2.nbRows + 2) + 2;

        if( step - genT1_T2_max_step > T1_T2.nbRows )
            return;

        let T1_rownum: number;
        let T2_rownum: number|undefined;
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

            T1_T2_rownum = T1_rownum * T2.nbRows + T2_rownum!;
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
            hide: row_num >   T1_T2_generated!
            }
        });
        T1_T2W.highlightRow( (row, row_num) => {
            return {
            cur : row_num === T1_T2W_rownum,
            hide: row_num >   T1_T2W_rownum || row["T1.ID"] !== row["T2.ID"]
            }
        });
    }

    //doStep(0);
    doStep(+slide.getAttribute("slide")! + 1 );
}

const slides = document.querySelectorAll<FrameUCA>("#slide_cart");

for(let i = 0; i < slides.length; ++i)
    init_slide(slides[i]);