import { RangeOverlay } from "../RangeOverlay";
import type { CalcSheet, Cell } from "..";

export class PlageSelector {

    #overlays = new Array<RangeOverlay>();
    #getOverlay(id: number) {
        while(id >= this.#overlays.length)
            this.#overlays.push( new RangeOverlay(this.#sheet, "selection_highlight") );
        return this.#overlays[id];
    }

    #updateSelection() {

        let selected_cells = this.#sheet.getRange( this.#orig_pos, this.#final_pos ).cells;

        this.#sheet.selection.clear(); // we add it...

        if( this.#isCtrl ) {

            // restore initial state...
            this.#sheet.selection.add(...this.#prev_selection);

            //TODO only orig_target...
            if(this.#sheet.selection.has( ...selected_cells ) )
                this.#sheet.selection.remove( ...selected_cells );
            else
                this.#sheet.selection.add( ...selected_cells );

            return;
        }

        this.#sheet.selection.add( ...selected_cells );

    }

    #updateSelectionHighlight() {

        const cells = this.#sheet.selection.cells;
        for(let overlay of this.#overlays)
            overlay.setRange(null);

        if( cells.length === 1 && this.#sheet.cursor.firstCell === cells[0] )
            return;

        for(let i = 0; i < cells.length; ++i)
            this.#getOverlay(i).setRange( this.#sheet.getRange( cells[i] ) );
    }

    #isCtrl        !: boolean;
    #sheet          : CalcSheet;
    #orig_target   !: HTMLElement;
    #orig_pos      !: [number, number];
    #final_pos     !: [number, number];
    #prev_selection!: Cell[];

    #ev2pos(ev: MouseEvent): [number,number] {

        const cols = [...this.#sheet.tbody.children[0].children];
        let col_id;
        for(col_id = cols.length-1; col_id >= 0; --col_id) {
            if( ev.clientX >= cols[col_id].getBoundingClientRect().x )
                break;
        }
        
        const rows = [...this.#sheet.tbody.children].map( e => e.children[0] );
        let row_id;
        for(row_id = rows.length-1; row_id >= 0; --row_id) {
            if( ev.clientY >= rows[row_id].getBoundingClientRect().y )
                break;
        }

        return [row_id, col_id];
    }

    constructor(sheet: CalcSheet) {

        this.#sheet = sheet;

        const main = document.querySelector('main')!;

        const on_mouse_move = (ev: MouseEvent) => {

            this.#final_pos = this.#ev2pos(ev);

            this.#updateSelection();
        };

        sheet.cursor.addEventListener('change', () => {
            sheet.selection.replaceAll( sheet.getVisibleCell(sheet.cursor) );
        });

        sheet.selection.addEventListener('change', () => {
            this.#updateSelectionHighlight();
        });

        // @ts-ignore
        sheet.content.addEventListener("mousedown", (ev:MouseEvent) => {

            const target = ev.target as HTMLElement;
            if( sheet.states.cell_edit.state === target )  // a cell being edited.
                return;
            if( ! ["TH", "TD"].includes( target.tagName ) )// ...
                return;

            if( target.tagName === "TH" && target.textContent === "" ) { // mousemove does nothing.

                this.#sheet.selection.clear();

                const end   = [this.#sheet.nbRows, this.#sheet.nbCols] as const;
                const range = this.#sheet.getRange("A1", end);

                this.#sheet.selection.add(...range.cells);

                return;
            }

            this.#isCtrl         = ev.ctrlKey;
            this.#orig_target    = target;
            void this.#orig_target;
            
            this.#orig_pos       = this.#ev2pos(ev); // Can be TH...
            this.#final_pos      = this.#orig_pos;
            this.#prev_selection = sheet.selection.cells.slice();

            this.#updateSelection();
            main.addEventListener('mousemove', on_mouse_move);

            document.addEventListener('mouseup', () => {
                main.removeEventListener('mousemove', on_mouse_move);
            }, {once: true});
            
        });
    }
}