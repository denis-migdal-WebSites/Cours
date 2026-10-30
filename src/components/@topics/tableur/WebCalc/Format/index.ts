import { Formula } from "../FormulaParser";
import { CalcSheet, Cell, CellList } from "../CalcSheet";

export class FormatManager {
    constructor(sheet: CalcSheet) {

        // @ts-ignore
        sheet.content.addEventListener('keydown', (ev: KeyboardEvent) => {

            if( ! ev.ctrlKey )
                return;

            let changed = false;

            if( ev.key === 'b') {
                changed = true;
                sheet.selection.toggleFormat("bold");
            }
            if( ev.key === 'i') {
                changed = true;
                sheet.selection.toggleFormat("italic");
            }
            if( ev.key === 'u') {
                changed = true;
                sheet.selection.toggleFormat("underline");
            }
            if( ev.key === 'l') {
                changed = true;
                sheet.selection.toggleFormat("align_left");
            }
            if( ev.key === 'r') {
                changed = true;
                sheet.selection.toggleFormat("align_right");
            }
            if( ev.key === 'e') {
                changed = true;
                sheet.selection.toggleFormat("align_center");
            }
            if( ev.key === '4' && ev.shiftKey) {
                changed = true;
                sheet.selection.toggleFormat(Formats.euros);
            }
            if( ev.key === '5' && ev.shiftKey) {
                changed = true;
                sheet.selection.toggleFormat(Formats.pourcent);
            }
            if( ev.key === '1' && ev.shiftKey) {
                changed = true;
                sheet.selection.toggleFormat(Formats.number);
            }

            if(changed) {
                ev.preventDefault();
                sheet.selection.dispatchEvent(new CustomEvent("change") );
            }

        });
        /* TODO listen */

    }
}

export function float2Date(float: number) {

    let content = new Date("1899-12-30");

    content.setDate( content.getDate() + float);

    return content;
}
export function date2Float(date: Date) {
    const beg = new Date("1899-12-30");
    return +((date.getTime() - beg.getTime()) / (24*3600*1000)).toFixed(7);
}

export function formatRaw(pthis: Cell, value = pthis.rawContent) {
    if( value instanceof Formula)
        return value.toString();
    return Formats.default.call(pthis, value);
}

export const Formats = {

    default: function(this: Cell|null, value = this?.rawContent) {

        if( value instanceof Formula)
            // @ts-ignore
            value = value.cachedValue();

        const prec = +(this?.getAttribute('precision') ?? 2);
        void prec;

        if( typeof value === "number") {

            if( this?.getAttribute('data-type') === "pourcent")
                return `${+( (+value)*100).toPrecision(7)}`.replace('.', ',') + "%";

            return `${+value.toPrecision(7)}`.replace('.', ',');
        }

        if( typeof value === "boolean")
            return value ? 'VRAI' : 'FAUX';

        if( value instanceof Date) {
            return value.toLocaleDateString("fr-FR");
        }

        return value!;
    },
    number: function(this:Cell, value = this.rawContent) {

        if( value instanceof Formula)
            // @ts-ignore
            value = value.cachedValue();

        if(value === undefined)
            return '';
        if(typeof value === "string")
            return value;

        if(value instanceof Date)
            value = date2Float(value);

        if( this.getAttribute("data-type") !== "number") {
            this.setAttribute("data-type", "number");

            if( ! (this.rawContent instanceof Formula) )
                CalcSheet.getSheetFromCell(this).getRange(this).content = value;
        }

        const prec = +(this.getAttribute('precision') ?? 2);

        return value.toLocaleString(undefined, {
            minimumFractionDigits: prec,
            maximumFractionDigits: prec
            });
    },
    pourcent: function(this:Cell, value = this.rawContent) {

        if( value instanceof Formula)
            // @ts-ignore
            value = value.cachedValue();

        if(value === undefined)
            return '';
        if(typeof value === "string")
            return value;
        if(typeof value === "boolean")
            value = +value;
        if(value instanceof Date)
            value = date2Float(value);

        if( this.getAttribute("data-type") !== "pourcent") {
            this.setAttribute("data-type", "pourcent");
            if( ! (this.rawContent instanceof Formula) )
                CalcSheet.getSheetFromCell(this).getRange(this).content = value;
        }

        const prec = +(this.getAttribute('precision') ?? 2);

        return (value * 100).toLocaleString(undefined, {
            minimumFractionDigits: prec,
            maximumFractionDigits: prec
            }) + '%';
    },
    date: function(this:Cell, value = this.rawContent) {
        
        if( value instanceof Formula)
            // @ts-ignore
            value = value.cachedValue();
            
        if(value === undefined)
            return '';
        if( typeof value === "string")
            return value;

        this.setAttribute("data-type", "date");

        if( value instanceof Date ) {
            let date = value.toLocaleDateString("fr-FR");
            return date.slice(0, 6) + date.slice(8);
        }
        if( typeof value === "boolean" )
            value = +value;
        if( typeof value === "number") {
            
            const content = float2Date(value);

            if( ! (this.rawContent instanceof Formula) )
                CalcSheet.getSheetFromCell(this).getRange( this ).content = content;
            
            let date = content.toLocaleDateString("fr-FR");
            return date.slice(0, 6) + date.slice(8);
        }

        return value;
    },
    euros: function(this:Cell, value = this.rawContent) {

        if( value instanceof Formula)
            // @ts-ignore
            value = value.cachedValue();
            
        if(value === undefined)
            return '';
        if(typeof value === "string")
            return value;

        if(value instanceof Date)
            value = date2Float(value);

        if( this.getAttribute("data-type") !== "number") {
            this.setAttribute("data-type", "number");
            if( ! (this.rawContent instanceof Formula) )
                CalcSheet.getSheetFromCell(this).getRange(this).content = value;
        }

        const prec = +(this.getAttribute('precision') ?? 2);

        return value.toLocaleString(undefined, {
            minimumFractionDigits: prec,
            maximumFractionDigits: prec
            }) + ' €';
    },
}

export class Format {

    #format: Record<string, any>;

    constructor(format: Record<string, any>) {
        this.#format = format;
    }

    applyTo(cell: Cell|CellList) {

        if( cell instanceof CellList) {

            for(let c of cell.cells)
                this.applyTo(c);

            return;
        }

        for(let name in this.#format) {
            let val = this.#format[name];

            if(name === 'format') {

                if( val === null) {

                    cell.format = Formats.default;
                    cell.textContent = cell.format(); //TODO: if fct
    
                    continue;
                }

                cell.format = val;
                cell.textContent = cell.format( cell.rawContent); //TODO: if fct

                continue;
            }

            if(name === 'precision') {
                cell.setAttribute('precision', val);
                cell.textContent = cell.format?.( cell.rawContent); //TODO: if fct
                continue;
            }

            if( name === 'span' ) {


                const sheet = CalcSheet.getSheetFromCell(cell);
                
                if( val[0] === 1 && val[1] === 1) { // unmerge

                    let r = +(cell.getAttribute('rowspan') ?? 0);
                    let c = +(cell.getAttribute('colspan') ?? 0);

                    for(let i = 0; i < r; ++i)
                        for(let j = 0; j < c; ++j) {
                            const target = sheet.relativeTo(cell, i, j);
                            delete target.cell;
                            target.classList.remove('hidden');
                        }
                    cell.removeAttribute('rowspan');
                    cell.removeAttribute('colspan');

                    continue;
                }

                cell.setAttribute('rowspan', `${val[0]}`);
                cell.setAttribute('colspan', `${val[1]}`);

                for(let i = 0; i < val[0]; ++i)
                    for(let j = 0; j < val[1]; ++j) {
                        if(i === 0 && j === 0)
                            continue;

                        const target = sheet.relativeTo(cell, i, j);
                        target.cell = cell;
                        target.classList.add('hidden');
                    }

                continue;
            }

            if( typeof val === "boolean") {

                if( name.startsWith('align_') ) {
                    cell.classList.remove('align_left');
                    cell.classList.remove('align_center');
                    cell.classList.remove('align_right');
                }
                if( name.startsWith('valign_') ) {
                    cell.classList.remove('valign_top');
                    cell.classList.remove('valign_middle');
                    cell.classList.remove('valign_bottom');
                }

                cell.classList.toggle(name, val);

                continue;
            }

            cell.style.setProperty(`--${name}`, val);
        }
    }

    getProperty(name: string) {
        return this.#format[name];
    }
    hasProperty(name: string) {
        return name in this.#format;
    }

    static extractFormat(cell: Cell|CellList): Format {
        
        if( cell instanceof CellList) {

            const cells = cell.cells;

            let format = Format.extractFormat(cells[0]);

            for(let i = 1; i < cells.length; ++i) {
                let f2 = Format.extractFormat(cells[i]);

                for(let key in format.#format)
                    if( ! (key in f2.#format) || f2.#format[key] !== format.#format[key] )
                        delete format.#format[key];
            }

            return format;
        }
        
        let format = Object.fromEntries<any>( [...cell.classList.values()].map(e => [e, true]) );
        
        for(let i = 0; i < cell.style.length; ++i) {
            let name = cell.style.item(i);
            if( ! name.startsWith('--') )
                continue;
            format[name.slice(2)] = cell.style.getPropertyValue(name);
        }

        const colspan = +(cell.getAttribute('colspan') ?? 1);
        const rowspan = +(cell.getAttribute('rowspan') ?? 1);

        if( colspan > 1 || rowspan > 1 )
            format.span = [ rowspan, colspan ];

        if( ! ("font_size" in format) )
            format['font_size'] = '10pt';

        if( "format" in cell)
            format.format = cell.format;

        if( cell.hasAttribute('precision') )
            format.precision = cell.getAttribute('precision');

        return new Format(format);
    }
}