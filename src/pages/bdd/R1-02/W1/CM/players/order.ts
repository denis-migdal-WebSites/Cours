import { PlayerToolbar } from "@Cours/components/PlayerToolbar";
import { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";
import { getOutput } from "@LISS/src";

import "@Cours/components/SQL/SQLDymTable"; // ensure init.
import { _doStep } from "./order_helpers";

const player    = document.querySelector<PlayerToolbar>("#order-player")!;
const table     = document.querySelector<SQLDymTable>("#order-table")!;
const order_sql = document.querySelector("#order_sql")!;
const list      = [...document.querySelectorAll("#order-list > li")];

function doStep(i: number) {

    if( i > 6)
      return player.stop();

    _doStep(order_sql, list, table, i);

}

const signal = getOutput<number>(player);

signal.listen( () => doStep(signal.value!) );
doStep(0);