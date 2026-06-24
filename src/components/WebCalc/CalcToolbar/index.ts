import {LISS} from "@LISS/src/extensions"
import define from "@LISS/src/define";

import { Format, Formats } from "../Format";
import { CalcSheet, CellList } from "../CalcSheet";


const html = __LOAD_FILE__("./index.html");

function merge(celllist: CellList, is_align = false) {

    const sheet = celllist.sheet;

    const [beg,end] = celllist.plage_name!.split(':').map( e => sheet.ref2pos(e) ); // plage can't be undefined

    let rows = end[0] - beg[0] + 1;
    let cols = end[1] - beg[1] + 1;

    let format: Record<string,any> = {
        span: [ rows, cols ]
    }

    if( is_align ) {
        format.valign_middle = true;
        format.align_center  = true;
    }

    sheet.getRange(beg).format(format);
}

function unmerge(celllist: CellList) {

    celllist.format({
        span: [ 1, 1 ]
    }); // unmerge...
}

function retrait(cells: CellList, delta_indent: number) {
    
    for(let cell of cells.cells) {

        const format = Format.extractFormat(cell);
        let new_format: Record<string, any> = {};
        if( ! format.hasProperty("align_right") && ! format.hasProperty("align_left") )
            new_format.align_left = true;

        new_format.indent = +(format.getProperty("indent") ?? 0) + delta_indent;
        
        if( new_format.indent < 0)
            new_format.indent = 0;

        cells.format(new_format);     
    }
}

function precision(cells: CellList, delta_prec: number) {

    let precision = undefined;
    for(let cell of cells.cells) {
        const prec = +(Format.extractFormat(cell).getProperty("precision") ?? 2);
        if( precision === undefined || prec < precision )
            precision = prec;
    }

    precision ??= 2;
    precision += delta_prec;
    if(precision < 0)
        precision = 0;

    cells.format({precision});
}

const fcts: Record<string, { action: (cells: CellList) =>void, enabled?: (cells: CellList) => boolean }> = {
    "format_zero_p1": {
        action: function(cells: CellList) {
            precision(cells, +1);
        }
    },
    "format_zero_m1": {
        action: function(cells: CellList) {
            precision(cells, -1);
        }
    },"format_pourcent": {
        action: function(cells: CellList) {

            if( Format.extractFormat(cells).getProperty('format') === Formats.pourcent ) {
                cells.format(Formats.number); // h4ck
                cells.format({format: null});
                return;
            }
            cells.format(Formats.pourcent);
        },
        enabled: function(cells: CellList) {
            return Format.extractFormat(cells).getProperty('format') === Formats.pourcent;
        }
    },"format_nb": {
        action: function(cells: CellList) {

            if( Format.extractFormat(cells).getProperty('format') === Formats.number ) {
                cells.format({format: null});
                return;
            }
            cells.format(Formats.number);
        },
        enabled: function(cells: CellList) {
            return Format.extractFormat(cells).getProperty('format') === Formats.number;
        }
    },
    "format_monnaie": {
        action: function(cells: CellList) {

            if( Format.extractFormat(cells).getProperty('format') === Formats.euros ) {
                cells.format({format: null});
                return;
            }
            cells.format(Formats.euros);
        },
        enabled: function(cells: CellList) {
            return Format.extractFormat(cells).getProperty('format') === Formats.euros;
        }
    },
    "format_date": {
        action: function(cells: CellList) {

            if( Format.extractFormat(cells).getProperty('format') === Formats.date ) {
                cells.format(Formats.number); // h4ck
                cells.format({format: null});
                return;
            }
            cells.format(Formats.date);
        },
        enabled: function(cells: CellList) {
            return Format.extractFormat(cells).getProperty('format') === Formats.date;
        }
    },
    "retrait_m1": {
        action: function(cells: CellList) {
            retrait(cells, -1);
        }
    },
    "retrait_p1": { // TODO: m1...
        action: function(cells: CellList) {
            retrait(cells, +1);
        }
    },
    "border": {
        action: function(cells: CellList) {
            cells.format({
                border_top: true,
                border_bottom: true,
                border_left: true,
                border_right: true
            });
        }
    },
    "unmerge": {
        action: unmerge
    },
    "merge": {
        action: merge
    },
    "merge_center": {
        action: function(celllist: CellList) {

            let unmerged = false;

            const sheet = celllist.sheet;

            for(let cell of celllist.cells)
                if( Format.extractFormat(cell).hasProperty("span") ) {
                    unmerge( new CellList(sheet, [cell]) );
                    unmerged = true;
                }

            if(unmerged)
                return;

            merge(celllist, true);
        },
        enabled: function(celllist: CellList) {

            for(let cell of celllist.cells)
                if( Format.extractFormat(cell).hasProperty("span") )
                    return true;

            return false;
        }
    }
}

const css = __LOAD_FILE__("./index.css");
const itemcss = __LOAD_FILE__("./index-item.css");

export class CalcToolbarItem extends LISS({
    css: itemcss
}) {
    constructor() {
        super();

        const content = document.createElement('img');
        content.src = `../../../../assets/tableur/img/toolbar/${this.host.getAttribute('name')}.png`;

        if( ! this.host.hasAttribute('value') ) {
            this.content.append( content );
            return;
        }

        const span = document.createElement('div');

        span.addEventListener('click', (ev) => {
            ev.preventDefault();

            let color_picker = document.querySelector<HTMLInputElement>('input[type="color"]');
            if( color_picker === null ) {
                color_picker = document.createElement('input');
                color_picker.setAttribute("type", "color");
                color_picker.style.setProperty('display', 'none');
            }


            color_picker.dispatchEvent(new CustomEvent('cancel'));

            let cancel = false;
            color_picker.addEventListener('cancel', () => {
                cancel = true;
            }, {once: true});

            color_picker.addEventListener('change', () => {
                if( cancel )
                    return;

                this.host.setAttribute('value', color_picker.value);
                this.host.dispatchEvent( new CustomEvent("click", {bubbles: true}) );

            }, {once: true});

            document.body.append(color_picker);
            color_picker.click();
        });

        this.content.append( content, span );
    }
}

define('calc-toolbar-item', CalcToolbarItem);

export class CalcToolbar extends LISS({html, css}) {

    #btns: Record<string, HTMLElement> = {};

    disableAllExcept(...exception: string[]) {
        for(let btn_name in this.#btns)
            if( ! exception.includes(btn_name) )
                this.#btns[btn_name].toggleAttribute('disabled', true);
        
        if( ! exception.includes("font_size") )
            this.content.querySelector<HTMLSelectElement>('.font_size')!.toggleAttribute('disabled', true);
    }

    constructor() {
        super();

        let font_sizes = [
            6, 7, 8, 9, 10, 10.5, 11, 12, 13, 14, 15, 16, 18, 20, 21, 22, 24, 26, 28, 32, 36, 40, 42, 44, 48, 54, 60, 66, 72, 80, 88, 96
        ];

        const btns = this.content.querySelectorAll<HTMLElement>('calc-toolbar-item');
        for(let btn of btns)
            this.#btns[btn.getAttribute('name')!] = btn;

        const font_sizes_select = this.content.querySelector<HTMLSelectElement>('.font_size')!;
        for(let font_size of font_sizes) {
            const option = new Option(`${font_size.toString().replace('.', ',')} pt`, `${font_size}pt`);
            font_sizes_select.append(option);
        }

        this.content.addEventListener('click', (ev) => {

            const elem = ev.target! as HTMLElement;
            if( elem.tagName !== 'CALC-TOOLBAR-ITEM')
                return;

            const n = elem.getAttribute('name')! as keyof typeof fcts;
            if( elem.getAttribute('type') === 'fct') {

                fcts[n].action(this.#sheet.selection);
                this.#update();

                return;
            }

            const value =  elem.hasAttribute('value')
                            ? elem.getAttribute('value')
                            : elem.classList.toggle('enabled');

            let format = new Format({[n]: value });
            format.applyTo( this.#sheet.selection );
            this.#update();
        });

        font_sizes_select.addEventListener("change", () => {

            //TODO...
            let format = new Format({font_size: font_sizes_select.value});
            format.applyTo( this.#sheet.selection );
            this.#update();
        });
    }

    #sheet!:CalcSheet;


    #update() {

        if( this.#sheet.selection.cells.length === 0)
            return;

        const format = Format.extractFormat(this.#sheet.selection);

        for(let name in this.#btns) {

            let enabled = format.getProperty(name) === true;
            if(name in fcts)
                enabled = fcts[name as keyof typeof fcts].enabled?.(this.#sheet.selection) ?? false;

            this.#btns[name].classList.toggle('enabled', enabled )
        }

        //TODO...
        const font_sizes_select = this.content.querySelector<HTMLSelectElement>('.font_size')!;
        font_sizes_select.value = format.getProperty('font_size');
        //TODO: update...
    }

    syncTo(sheet: CalcSheet) {

        this.#sheet = sheet;


        sheet.selection.addEventListener('change', () => {
            this.#update();
        });
        this.#update();

    }

}

define('calc-toolbar', CalcToolbar);