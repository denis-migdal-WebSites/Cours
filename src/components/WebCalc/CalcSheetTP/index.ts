import {LISS, WithBare, WithContent, WithInput} from "@LISS/src/extensions"
import define from "@LISS/src/define";

import { CalcSheet } from "../CalcSheet";
import { load } from "./ods_loader";

const html = __LOAD_FILE__("./index.html");

export class TPSheet extends LISS({html}, WithBare,
                                          WithContent,
                                          WithInput<string>) {

    readonly sheetname = this.getAttribute('sheet')!;

    #sheet = this.content.querySelector<CalcSheet>("calc-sheet")!;

    constructor() {
        super();

        this._input.listen( () => this.#onInputChange());
        this.#onInputChange();
    }

    async #onInputChange() {

        const value = this._input.value;
        if( value === null)
            return; // reset ?

        // @ts-ignore
        const content = Uint8Array.fromBase64(value);

        await load(this.#sheet, content, this.sheetname );
        this.host.dispatchEvent(new CustomEvent('change') );
    }

    get sheet() {
        return this.#sheet;
    }
}

define('tp-sheet', TPSheet);