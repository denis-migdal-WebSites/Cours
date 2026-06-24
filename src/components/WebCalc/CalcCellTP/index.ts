import {LISS} from "@LISS/src/extensions"
import define from "@LISS/src/define";

import { Formula } from "../FormulaParser";
import { TPSheet } from "../CalcSheetTP";
import { hl } from "@LISS/components/code/hl";

const css = __LOAD_FILE__("./index.css");

export class CellFromSheet extends LISS({css}) {

    static observedAttributes = ["cell", "sheet"];

    constructor() {
        super();

        const cellref   = this.getAttribute("cell");
        const sheetname = this.getAttribute("sheet");

        const cell_content = document.createElement("pre");
        this.content.append(`${cellref} : `, cell_content);

        const sheet = document.querySelector<TPSheet>(`tp-sheet[sheet="${sheetname}"]`)!;

        sheet.addEventListener('change', () => {
            const cell = sheet.sheet.getRange(cellref!).cells[0];
            
            if( cell.rawContent instanceof Formula ) {
                
                cell_content.innerHTML = hl(cell.rawContent.toString(),
                                            "excel");
                return;
            }

            cell_content.textContent = cell.textContent;
        });
        //TODO: get content...
    }
}

define('tp-cell_from_sheet', CellFromSheet);