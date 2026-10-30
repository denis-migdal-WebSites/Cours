import {LISS} from "@LISS/src/extensions"
import define from "@LISS/src/define";

import type { CalcSheet } from "../CalcSheet";

//TODO: syntax highlight ;)

const css = __LOAD_FILE__("./index.css");


export class CalcPlageEditor extends LISS({
    css
}) {

    #input = document.createElement('pre');

    constructor() {
        super();

        this.content.append( this.#input );
        this.#input.toggleAttribute('contenteditable');

        this.#input.addEventListener('keydown', (ev) => {
            if(ev.code !== 'Enter')
                return;

            ev.stopImmediatePropagation();
            ev.preventDefault();

            const selected = this.#sheet.getRange( this.#input.textContent! )
                                        .cells;

            this.#sheet.selection.clear();
            this.#sheet.selection.add( ...selected );

            this.#sheet.cursor.clear();
            this.#sheet.cursor.add( selected[0] );

            this.#input.blur();
        })

        //TODO....
        this.#input.toggleAttribute('disabled');
        /*this.#input.addEventListener('change', () => {

        });*/
    }

    #sheet!: CalcSheet;

    syncTo(sheet: CalcSheet) {

        this.#sheet = sheet;

        const selection = sheet.selection;

        selection.addEventListener('change', (_: any) => {
            this.#input.textContent = selection.plage_name ?? "";
        });
    }
}

define('calc-plage-editor', CalcPlageEditor);