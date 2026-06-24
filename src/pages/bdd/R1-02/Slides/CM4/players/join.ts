import { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";
import { FrameUCA } from "@WebSlides/components/FrameUCA";

// ensure init.
import "@Cours/components/SQL/SQLDymTable";

function init_slide(slide: FrameUCA) {

    const T1     = slide.querySelector<SQLDymTable>("#join_T1")!;
    const T2     = slide.querySelector<SQLDymTable>("#join_T2")!;
    const T1_T2W = slide.querySelector<SQLDymTable>("#join_T1_T2W")!;

    T1.highlightRow( ({ID}) => `high_${ID}` );
    T2.highlightRow( ({ID}) => `high_${ID}` );

    T1_T2W.highlightCells( (row, colname) => {
        const id = row[ colname.split('.')[0] + ".ID"];
        return `high_${id}`;
    });

    function doStep(step: number) {

        let T2_rownum: number|undefined;
        let substep: number;

        if( step > 1 ) { // build T1 JOIN T2
            T2_rownum = Math.trunc( (step - 2) / 3);
            substep = (step - 2) % 3;
        }

        if( T2_rownum !== undefined && T2_rownum >= T2.nbRows)
            return;

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

    //doStep(0);
    doStep(+slide.getAttribute("slide")! + 1 );
}




const slides = document.querySelectorAll<FrameUCA>("#slide_join");

for(let i = 0; i < slides.length; ++i)
    init_slide(slides[i]);