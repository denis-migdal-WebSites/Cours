import {LISS} from "@LISS/src/extensions"
import define from "@LISS/src/define";

import { formatRaw } from "../Format";
import type { CalcSheet, Cell } from "../CalcSheet";

const css = __LOAD_FILE__("./index.css");

export class CalcFormulaEditor extends LISS({
    css
}) {

    #input = document.createElement('pre');
    #sheet  !: CalcSheet;
    #cur_cell: Cell|null = null;
    #onInput: (ev: Event) => void;

    constructor() {
        super();

        this.content.append( this.#input );

        this.#input.addEventListener('focusout', () => {

            if( this.#cur_cell === null )
                return;

            //this.#sheet.cursor.content = this.#input.textContent!;
            this.#sheet.states.cell_edit.state = null;
        });

        this.#input.addEventListener('focusin', () => {

            if( this.#cur_cell === null )
                return;

            this.#sheet.states.cell_edit.state = this.#cur_cell;
            //this.#cur_cell!.textContent = this.#input.textContent!;
        });

        this.#input.addEventListener('input', () => {
            if( this.#cur_cell === null )
                return;

            this.#cur_cell!.textContent = formatRaw(this.#cur_cell, this.#input.textContent! );
            this.#cur_cell.dispatchEvent( new CustomEvent('input', {detail: true}) );
        });

        this.#onInput = (ev: Event) => {

            //@ts-ignore
            if( ev.detail === true)
                return;
            this.#input.textContent = formatRaw( this.#cur_cell!, this.#cur_cell!.textContent! );
        };
    }

    syncTo(sheet: CalcSheet) {

        this.#sheet = sheet;
        const cursor = this.#sheet.cursor;

        sheet.host.addEventListener('update', () => {
            // @ts-ignore
            this.#input.textContent = formatRaw(cursor.firstCell );
        })

        cursor.addEventListener('change', () => {

            const cells = cursor.cells;

            this.#input.toggleAttribute('contenteditable', ! sheet.isRO );

            if( cells.length === 0) {

                if( this.#cur_cell !== null )
                    this.#cur_cell.removeEventListener('input', this.#onInput);
                this.#cur_cell = null;

                this.#input.textContent = "";
                return;
            }

            this.#cur_cell = cells[0];
            this.#cur_cell.addEventListener('input', this.#onInput);
            
            this.#input.textContent = formatRaw( this.#cur_cell );
        });
    }

}

define('calc-formula-editor', CalcFormulaEditor);