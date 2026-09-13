import "@Cours/components/PlayerToolbar"; // ensure init.
import type { PlayerToolbar } from "@Cours/components/PlayerToolbar";
import { getOutput } from "@LISS/src";

const hamming = document.querySelector('#hamming')!;

const cols = hamming.querySelectorAll("col");
const rows = hamming.querySelectorAll("tr");

function highlight(i: 0|1|2) {

    const rowid  = rows.length - 1 - i;

    rows[rowid].classList.add("high");

    for(let n = 0; n < 8; ++n) {
        if( n & 1<<i) {
            const colid = 8 - n
            cols[colid].classList.add("high");

            rows[0]    .children[colid].classList.add("high");
            rows[rowid].children[colid].classList.add("high");
        }
    }
}

function showS(i: 0|1|2) {
    let n = 1<<i;
    const colid = 8 - n;
    rows[0]    .children[colid].classList.add("show");
}


function doStep(i: number) {

    if( i > 8)
      return player.stop();

    // reset
    {
        const prev = hamming.querySelectorAll(".high");
        for(let i = 0; i < prev.length; ++i)
            prev[i].classList.remove("high");
    }
    {
        const prev = hamming.querySelectorAll(".show");
        for(let i = 0; i < prev.length; ++i)
            prev[i].classList.remove("show");
    }

    if( i === 0) {
        for(let n = 0; n <= 2; ++n)
            showS(2-n as any);
        rows[0]    .children[8].classList.add("show");
        return;
    }

    --i;
    if( i === 0) return;
    --i;

    if( i < 3) {
        highlight(2-i as any);
        for(let n = 0; n <= i; ++n)
            showS(2-n as any);
        return;
    }

    for(let n = 0; n <= 2; ++n)
        showS(2-n as any);
    rows[0]    .children[8].classList.add("show");

    i -= 4;
    if( i < 0)
        return;

    if( i < 3)
        highlight(2-i as any);

    for(let n = 0; n <= i && n < 3; ++n)
        rows[2+n]    .children[9].classList.add("show");
}

const player = document.querySelector<PlayerToolbar>("#hamming-player")!;
const signal = getOutput<number>(player);

signal.listen( () => doStep(signal.value!) );
doStep(0);