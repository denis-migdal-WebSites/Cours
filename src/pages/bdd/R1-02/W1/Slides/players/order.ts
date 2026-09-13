import { type FrameUCA } from "WebSlides@2026/widgets/frames/FrameUCA";
import { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";
import { _doStep } from "../../CM/players/order_helpers";

// ensure init.
import "@Cours/components/SQL/SQLDymTable";

async function init_slide(slide: FrameUCA) {

    //const player = await LISS.qs("#order-player", parent);
    const table     = slide.querySelector<SQLDymTable>("#order-table")!;
    const order_sql = slide.querySelector("#order_sql")!;
    const list      = [...slide.querySelectorAll("#order-list > li")!];

    const i         = +slide.getAttribute("slide")!;

    _doStep( order_sql, list, table, i );
}

const slides = document.querySelectorAll<FrameUCA>("#slide-order");

for(let i = 0; i < slides.length; ++i)
    init_slide(slides[i]);