import {LISS} from "@LISS/src/extensions"
import define from "@LISS/src/define";

import { PlageSelector } from "./PlageSelector";
import { FormulaRef, RangeOverlay, RecopyHandle } from "./RangeOverlay";
import { Format, FormatManager, Formats } from "../Format";
import { Formula, parse_formula } from "../FormulaParser";
import { CalcPlageEditor } from "../CalcPlageEditor/CalcPlage";
import { CalcFormulaEditor } from "../CalcFormulaEditor";

export type ValueType = string|number|Date|boolean;
export type RawContentType = ValueType|Formula;

export type Cell = HTMLTableCellElement & {
    rawContent: RawContentType,
    format: (this: Cell, v?: RawContentType) => string,
    is_ro: boolean,
    cell ?: Cell
};

const css = __LOAD_FILE__("./index.css");

function onInput(ev: Event) {

    const target = ev.target as HTMLElement;

    // https://stackoverflow.com/questions/21234741/place-caret-back-where-it-was-after-changing-innerhtml-of-a-contenteditable-elem

    let rrange = window.getSelection()!.getRangeAt(0);
    let c = rrange.startOffset;

    //let text = "";
    let length = 0;
    for(let i = 0; i < target.childNodes.length; ++i) {

        let child = target.childNodes[i];
        if( child.nodeType !== Node.TEXT_NODE)
            child = child.childNodes[0];

        if( rrange.startContainer === child ) {
            //text += p.childNodes[i].textContent!.slice(0, c);
            length += c;
            break;
        }
        //text += p.childNodes[i].textContent;
        length += target.childNodes[i].textContent!.length;
    }

    // Update innerHTML
    target.textContent = target.textContent;

    let child!: ChildNode;
    let i;
    for(i = 0; i < target.childNodes.length; ++i) {
        if( length <= target.childNodes[i].textContent!.length ) {
            child = target.childNodes[i];
            break;
        }
        length -= target.childNodes[i].textContent!.length;
    }

    if( child.nodeType !== Node.TEXT_NODE)
        child = child.childNodes[0];

    var range = document.createRange();
    var sel = window.getSelection()!;

    range.setStart(child, length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function parseInput( str: string ): RawContentType {

    if(str === 'VRAI')
        return true;
    if(str === 'FAUX')
        return false;

    if(str.trim() === '')
        return str;

    if(str[0] === "=") {
        return parse_formula(str);
    }

    let test_number = Number( str.replace(',', '.').replaceAll('\xA0', '') );
    if( ! Number.isNaN( test_number ) )
        return test_number;
    if( str[str.length-1] === "%" || str[str.length-1] === "€" ) {
        test_number = Number( str.slice(0,-1).replaceAll('\xA0', '').replace(',', '.') );
        if( ! Number.isNaN( test_number ) ) {
            if( str[str.length-1] === "€" )
                return test_number;
            return +(test_number / 100).toPrecision(7);
        }
    }

    const parts = str.split('/');
    if(parts.length <= 3) {

        let test_date = new Date(
            // @ts-ignore
            +parts[2] ?? new Date().getFullYear(),
            +parts[1]-1,
            +parts[0]
        );

        if( test_date.toString() !== "Invalid Date" )
            return test_date;
    }

    return str;
}

class State<T> {

    #state : T|null = null;
    #target: EventTarget;
    #name  : string;

    constructor(target: EventTarget, name: string) {
        this.#target = target;
        this.#name   = name;
    }

    get state() {
        return this.#state;
    }

    set state(state: T|null) {

        if( this.#state === state)
            return;

        let prev_state = this.#state;
        this.#state = state;
        

        if( prev_state !== null)
            this.#target.dispatchEvent( new CustomEvent(`${this.#name}_end`, {detail: prev_state}) );            

        if( state !== null )
            this.#target.dispatchEvent( new CustomEvent(`${this. #name}_start`, {detail: state}) );
    }
}

const States = {
    "cell_edit": State<Cell>,
    "recopy"   : State<CellList>
 } as const;

export class CalcSheet extends LISS({css}) {

    static observedAttributes = ["cols", "rows", "ro"];

    states = Object.fromEntries( Object.entries(States).map( ([n,s]) => [n, new s(this.host, n)] as const ));

    #cursor    = new CellList(this, []);
    #selection: CellList = new CellList(this, []);

    #plage_selector = new PlageSelector(this);
    #format_mngr = new FormatManager(this);

    static getSheetFromCell(cell: Cell) {
        return (cell.getRootNode() as ShadowRoot).host as CalcSheet;
    }

    get cursor() {
        return this.#cursor;
    }
    get selection() {
        return this.#selection;
    }

    setRect(target: HTMLElement, [x,y,w,h]: readonly [number,number,number,number]) {

        const tbl_offset = this.content.querySelector('table')!.offsetTop;

        target.style.setProperty('top'   , `${tbl_offset + y}px`);
        target.style.setProperty('height', `${h}px`);

        target.style.setProperty('left'   , `${x}px`);
        target.style.setProperty('width', `${w}px`);

    }

    getRect(cells: CellList|Cell[]) {

        cells = "cells" in cells ? cells.cells : cells;

        const start = cells[0];
        const end   = cells[cells.length-1];
        
        return [
            start.offsetLeft,
            start.offsetTop,
            end.offsetLeft + end.clientWidth - start.offsetLeft + 1,
            end.offsetTop + end.clientHeight - start.offsetTop + 1
        ] as const;
    }

    relativeTo(cell: Cell, row_diff: number, col_diff: number) {
        
        let [row, col] = this.cellPos(cell);

        row += row_diff;
        col += col_diff;

        // for normal : get stuck inside grid.
        if( row < 1)
            row = 1;
        if( row >= this.#tbody.children.length )
            row = this.#tbody.children.length - 1;

        if( col < 1)
            col = 1;
        if( col >= this.#tbody.children[row].children.length )
            col = this.#tbody.children[row].children.length - 1;

        return this.#tbody.children[row].children[col] as Cell;
    }

    //TODO: 2D...
    #pastebin: CellList | null = null;

    #formula_refs = new Array<FormulaRef>();
    #getFormulaRef(i: number) {
        while( i >= this.#formula_refs.length)
            this.#formula_refs.push( new FormulaRef(this) );

        return this.#formula_refs[i];
    }
    #clearFormulaRefs() {
        for(let ref of this.#formula_refs)
            ref.setRange(null);
    }

    constructor() {
        super();

        void this.#plage_selector;
        void this.#format_mngr;

        const cursor = new RangeOverlay(this, "cursor");
        const recopy = new RecopyHandle(this);
        const copy   = new RangeOverlay(this, "copy_highlight");

        const main = document.querySelector("main")!;

        this.host.addEventListener('cell_edit_end', () => {
            this.#clearFormulaRefs();
        });

        let last_recopy_target: Cell|null = null;
        let last_recopy_dir   : [number, number]|null = null

        const on_recopy_move = (ev: MouseEvent) => {

            let cells = (this.states.recopy.state as CellList).cells;
            const src = cells[cells.length-1];

            let pos = src.getBoundingClientRect();

            let d_px = ev.clientX - (pos.x + pos.width /2);
            let d_py = ev.clientY - (pos.y + pos.height/2);

            let d_x = 0;
            let d_y = Math.sign(d_py);

            if( Math.abs(d_px) > Math.abs(d_py) ) {
                d_x = Math.sign(d_px);
                d_y = 0;
            }

            let prev = src;
            let cur  = src;

            let diff_x, diff_y;

            do {

                prev= cur;
                cur = this.relativeTo(prev, d_y, d_x);

                if( cur === prev)
                    break;

                let pos_cur = cur.getBoundingClientRect();
                diff_x = ev.clientX - (pos_cur.x + pos_cur.width /2);
                diff_y = ev.clientY - (pos_cur.y + pos_cur.height/2);

            } while( diff_x * d_x + diff_y * d_y > 0 );

            last_recopy_target = prev;
            last_recopy_dir    = [d_x,d_y];

            let beg = src;
            let end = prev;
            if( src.offsetLeft > prev.offsetLeft || src.offsetTop > prev.offsetTop )
                [beg, end] = [end, beg];

            //TODO: highlight...
            this.#clearFormulaRefs();
            this.#getFormulaRef(1).setRange( this.getRange(beg, end) );
        };

        recopy.addEventListener("mousedown", (ev) => {
            ev.preventDefault();

            this.states.recopy.state = this.#selection;

            // @ts-ignore
            main.addEventListener("mousemove", on_recopy_move);

            document.addEventListener("mouseup", () => {
                
                let [d_x, d_y] =  last_recopy_dir!;

                let cells = (this.states.recopy.state as CellList).cells;
                const src = cells[cells.length-1];

                let nb = 0;

                if( last_recopy_target !== src) { // copy...

                    let cur = src;
                    do {
                        ++nb;

                        cur = this.relativeTo(cur, d_y, d_x);

                        let content: RawContentType|Cell = src;
                        if( typeof content.rawContent === "number")
                            content = (src.rawContent as number) + nb*(d_x + d_y);
                        else if( content.rawContent instanceof Date ) {
                            content = new Date(src.rawContent as Date);
                            content.setDate( content.getDate() + nb*(d_x + d_y));
                        }

                        new CellList(this, [cur]).content = content;
                        cur.className = src.className; //TODO: format...


                    } while( cur!== last_recopy_target );
                }

                this.#clearFormulaRefs(); // recopy
                this.states.recopy.state = null;
                last_recopy_target = null;
                last_recopy_dir    = null;

                // @ts-ignore
                main.removeEventListener("mousemove", on_recopy_move);

            }, {once: true});
        });

        this.host.addEventListener('recopy_start', () => {
            this.host.classList.add('recopy');
        });
        this.host.addEventListener('recopy_end', () => {
            this.host.classList.remove('recopy');
        })

        this.#cursor.addEventListener('change', () => {

            if( this.#cursor.length !== 1 )
                throw new Error('Cursor has invalid number of cells');

            cursor.setRange( new CellList(this, [this.getVisibleCell(this.#cursor)]) );
        });

        this.#selection.addEventListener('change', () => {

            for( let cell of this.content.querySelectorAll('.highlight') )
                cell.classList.remove('highlight');

            const cells = this.#selection.cells;

            if( cells.length === 0)
                return;

            for( let cell of cells ) {

                if( cells.length !== 1)
                    cell.classList.add('highlight');
                const [row, col] = this.#cellPos(cell);
                this.#tbody.children[0].children[col].classList.add("highlight");
                this.#tbody.children[row].children[0].classList.add("highlight");
            }

            recopy.setRange(this.#selection);

            // only if simple...
            // const last = cells[cells.length-1];
            // pointer...
        });

        //TODO: move out ?
        const formula_bar = document.createElement('div');
        formula_bar.classList.add('toolbar');

        ( async () => {

            const plage = new CalcPlageEditor();
            plage.syncTo(this);
            formula_bar.append( plage.host );

            const formula = new CalcFormulaEditor();
            formula.syncTo(this);
            formula_bar.append( formula.host );

        })();
        this.content.append(formula_bar);

        this.#initGrid();

        this.content.addEventListener("mousedown", (ev) => {
            
            const target = ev.target as HTMLElement;

            // the cell is being edited...
            if( target.hasAttribute('contenteditable') )
                return;

            if( target.tagName === "TD" )
                this.#cursor.replaceAll( target as Cell );

            //TODO: not correct...
            if( target.tagName === "TH" && target.textContent !== "") {
                
                const cell = this.getRange(target.textContent!).firstCell;

                this.#cursor.replaceAll(cell);
            }

        });

        this.content.addEventListener("dblclick", (ev) => {

            let target = ev.target as HTMLElement;

            if( target.tagName !== "TD")
                return;

            if( ! this.isRO && (target as Cell).is_ro !== true ) {
                target.toggleAttribute("contenteditable", true);
                target.focus();
            }
        });

        // @ts-ignore
        this.content.addEventListener('keydown', (ev: KeyboardEvent) => {

            if( ev.code.startsWith('Arrow') ) {

                ev.preventDefault();

                const cur = this.cursor.cells;
                if( cur.length === 0)
                    return;

                let d_row = 0;
                let d_col = 0;

                if( ev.code === 'ArrowLeft')
                    --d_col;
                if( ev.code === 'ArrowRight')
                    ++d_col;
                if( ev.code === 'ArrowUp')
                    --d_row;
                if( ev.code === 'ArrowDown')
                    ++d_row;

                let next: Cell;
                if( ev.ctrlKey ) {

                    let prev   = cur[0];
                    let cursor = this.relativeTo(prev, d_row, d_col);

                    if( prev.rawContent !== undefined && cursor.rawContent !== undefined) {

                        while( prev !== cursor && cursor.rawContent !== undefined) { // we reached the end.
                            prev   = cursor;
                            cursor = this.relativeTo(prev, d_row, d_col);
                        }
                        cursor = prev;
                    } else {
                        while( prev !== cursor && cursor.rawContent === undefined) { // we reached the end.
                            prev   = cursor;
                            cursor = this.relativeTo(prev, d_row, d_col);
                        }
                    }

                    next = cursor;
                } else
                    next = this.relativeTo( cur[0], d_row, d_col);
                
                this.#tbody.focus();
                this.cursor.replaceAll(next);

                return;
            }

            // no edition allowed...
            if( this.isRO )
                return;

            const target = ev.target as HTMLElement;
            if( target === this.#tbody ) {
                if( ev.code === "KeyV" && ev.ctrlKey && this.#pastebin !== null) {
                    ev.preventDefault();
                    const data = this.#pastebin.cells;
                    this.#selection.content = data;

                    // copy format... TODO utility thingy...
                    if( ! ev.shiftKey || ! ev.altKey ) {
                        const src = this.#pastebin.cells;
                        const dst = this.#selection.cells;

                        for(let i = 0; i < src.length; ++i ) {
                            dst[i].className = src[i].className;
                            //TODO: add format...
                        }
                    }

                    return;
                }

                if( ( ev.key === "c" || ev.key === "x") && ev.ctrlKey ) {
                    ev.preventDefault();

                    copy.setRange(this.#selection);
                    // WHY ???
                    //h.style.setProperty('top'   , `${selection[0].offsetTop}px`);

                    this.#pastebin = this.#selection.deepClone();

                    if( ev.key === "x" ) {
                        this.#selection.deleteFormat();
                        this.#selection.deleteContent();
                    }

                    return;
                }

                if( ev.key === "Control" || ev.key === "Shift" || ev.key === "Alt" ) {
                    return; // ignore
                } if( ev.code === "Delete" ) {

                    this.selection.deleteContent();
                    this.selection.dispatchEvent( new CustomEvent("change") );

                    return;
                } if( ev.code === "Enter" ) {
                    // handled elsewhere
                } else if(ev.ctrlKey) { // ignore ctrl
                    return;
                }
                else { // we start editing...

                    const cur = this.cursor.cells;

                    if( cur.length > 0) {
                        cur[0].dispatchEvent( new CustomEvent("dblclick", {bubbles: true}) );
                        cur[0].textContent = "";
                    }

                    return;
                }
            }

            if( target !== this.#tbody && ev.code === 'Enter' && ev.shiftKey )
                return; // default browser behavior.

            if(ev.code === "Enter") { //TODO: Enter is for current plage...
                ev.preventDefault();

                const cur = this.cursor.cells;
                if( cur.length === 0)
                    return;

                let [row,col] = this.cellPos( cur[0] );

                ++row;
                if( row >= this.#tbody.children.length ) {
                    row = 1;
                    ++col;
                }
                if( col >= this.#tbody.children[row].children.length ) {
                    col = 1;
                }

                let next = this.#tbody.children[row].children[col] as Cell;

                this.#tbody.focus();
                this.cursor.replaceAll(next);
                return;
            }
        });

        const onInput2 = (ev: Event) => {
            this.#clearFormulaRefs();
            // @ts-ignore
            if(ev.detail !== true)
                onInput(ev);
        }

        //TODO: here...
        this.content.addEventListener('focusin', (ev) => {

            const target = ev.target as HTMLElement;

            copy.setRange(null);

            if( target.tagName !== "TD")
                return;

            this.states.cell_edit.state = target as Cell;
        });

        //@ts-ignore
        this.host.addEventListener("cell_edit_start", (ev: CustomEvent<Cell>) => {

            this.host.classList.toggle("cell_edit", true);

            const cell = ev.detail;

            if(cell.rawContent instanceof Formula) {

                const str = cell.rawContent.toString();
                const ranges = cell.rawContent.rangesToken;

                let children: (string|HTMLElement)[] = [str];

                let ranges_colors: Record<string, number> = {};
                let cur_offset = 0;

                for(let i = 0; i < ranges.length; ++i) {
                    let str = children[children.length-1] as string;

                    children[children.length-1] = str.slice(0, ranges[i].beg - cur_offset);

                    let s = document.createElement('span');

                    const range_name = ranges[i].value;
                    if( ! (range_name in ranges_colors) )
                        ranges_colors[range_name] = i%8;

                    s.classList.add('formula_highlight', `highlight_${ranges_colors[range_name]}`); //TODO...
                    s.textContent = ranges[i].value;
                    children.push( s ); // range...

                    children.push( str.slice(ranges[i].end - cur_offset) );
                    cur_offset = ranges[i].end;
                }

                cell.replaceChildren( ...children );

                const ranges_names = Object.keys(ranges_colors);
                for(let i = 0; i < ranges_names.length; ++i) {
                    const range = ranges_names[i];
                    const ref = this.#getFormulaRef(i);
                    ref.setColor( ranges_colors[range] );
                    ref.setRange( this.getRange(range) );
                }
                cell.addEventListener('input', onInput2 ); // remove colors...
            } else {
                cell.textContent = Formats.default.call(cell);
            }
        })

        //@ts-ignore
        this.host.addEventListener("cell_edit_end", (ev: CustomEvent<Cell>) => {

            this.host.classList.toggle("cell_edit", false);

            const cell = ev.detail;

            cell.removeEventListener("input", onInput2); // to be safe
            cell.toggleAttribute("contenteditable", false);

            console.warn("leave edit", cell.textContent);
            new CellList(this, [cell]).content = cell.textContent!;
            this.update();

            // leave
            this.#selection.clear();
        });

        this.content.addEventListener("focusout", ev => {

            const target = ev.target as HTMLElement;

            if( target.tagName !== "TD")
                return;

            this.states.cell_edit.state = null;
        });

        if( this.nbRows >= 1 && this.nbCols >= 1)
            this.cursor.replaceAll( this.getRange("A1") );
    }

    getVisibleCell(c: Cell|CellList): Cell {
        if(c instanceof CellList)
            c = c.firstCell;

        return c.cell ?? c;
    }

    cellPos(cell: HTMLTableCellElement) {
        return this.#cellPos(cell);
    }

    #cellPos(cell: HTMLTableCellElement) {

        if( "pos" in cell)
            return cell.pos as [number, number];

        const col = [...cell.parentElement!.children].findIndex( c => c === cell);
        const row = [...cell.parentElement!.parentElement!.children].findIndex( r => r === cell.parentElement!);

        return [row, col] as const;
    }

    #tbody!: HTMLTableSectionElement;
    get tbody() { return this.#tbody; }

    resize(nbrows: number, nbcols: number) {

        const col_html = document.createElement('tr');
        col_html.append( document.createElement('th') );

        const colgroup = this.content.querySelector('colgroup')!;
        colgroup.replaceChildren();

        const tbody = this.#tbody;
        tbody.replaceChildren();

        colgroup.append( document.createElement("col") );
        
        for(let col = 0; col <  nbcols ; ++col) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + col);
            col_html.append(th);

            colgroup.append( document.createElement("col") );
        }
        tbody.append(col_html);

        for(let row = 0; row < nbrows; ++row) {
            const row_html = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = `${row+1}`;
            row_html.append(th);

            for(let col = 0; col <  nbcols ; ++col) {
                const cell = document.createElement('td') as Cell;
                //cell.toggleAttribute('contenteditable');
                cell.format = Formats.default;
                row_html.append( cell );
            }
            tbody.append(row_html);
        }
    }

    setColSize(col: number|string, size: string) {
        if( typeof col === "string")
            col = this.ref2pos(col)[1];

        const html = this.content.querySelector('colgroup')!.children[col] as HTMLElement;
        html.style.setProperty("width", size);
        html.style.setProperty('overflow-x', 'hidden');
    }

    #initGrid() {

        const nbrows = +(this.getAttribute("rows") ?? 1);
        const nbcols = +(this.getAttribute("cols") ?? 1);

        const table = document.createElement('table');
        const tbody  = document.createElement('tbody');
        this.#tbody = tbody;

        const resizeObs = new ResizeObserver( () => {
            this.host.dispatchEvent( new CustomEvent('resize') );
        });
        resizeObs.observe( this.host );

        this.#tbody.setAttribute('tabindex', '0');

        table.append( document.createElement("colgroup") );
        table.append(tbody);
        this.content.append(table);

        this.resize(nbrows, nbcols);
    }

    getRange(from: Cell|string|readonly[number,number],
               to: Cell|string|readonly[number,number] = from ): CellList {

        // process refs...
        if( from instanceof HTMLTableCellElement)
            return this.getRange( this.cellPos(from), to );
        if( to instanceof HTMLTableCellElement)
            return this.getRange( from, this.cellPos(to) );

        if( typeof from === "string") {
            if( from.includes(":") )
                [from, to] = from.split(':');

            from = this.ref2pos(from, false);
            return this.getRange( from, to );
        }
        if( typeof to === "string")
            return this.getRange( from, this.ref2pos(to, true) );

        // get range

        let beg_row = from[0] || 1;
        let beg_col = from[1] || 1;

        let end_row = from[0] === 0 ? this.nbRows : to[0];
        let end_col = from[1] === 0 ? this.nbCols : to[1];

        if( end_row < beg_row )
            [beg_row, end_row] = [end_row, beg_row];
        if( end_col < beg_col )
            [beg_col, end_col] = [end_col, beg_col];

        const cells = new Array<Cell>( (end_row - beg_row + 1) * (end_col - beg_col + 1) );

        let offset = 0;
        for(let i = beg_row; i <= end_row; ++i )
            for(let j = beg_col; j <= end_col; ++j )
                cells[offset++] = this.tbody.children[i].children[j] as Cell;

        return new CellList(this, cells);
    }

    ref2pos(ref: string, end_line_col = true): [number, number] {
        
        ref = ref.replaceAll('$', '');

        let sep = ref.search(/[0-9]/);

        if( sep === 0)  // this is a line...
            return end_line_col ? this.ref2pos(`A${ref}`) : [this.nbCols, +ref];
        if( sep === -1) // this is a col...
            return this.ref2pos(`${ref}${end_line_col ? this.nbRows : 1}`);

        const row = +ref.slice(sep);

        let col = 0;
        for(let i = 0; i < sep; ++i) {
            col *= 26;
            col += ref.charCodeAt(i) - 65;
        }
        ++col;

        return [row, col];
    }
    pos2ref(row: number, col: number) {

        let col_str = "";
        do {

            let id = (col-1) % 26;

            col_str = String.fromCharCode(65+id) + col_str;

            col -= id + 1;
            col /= 26; // should be integer, so ok.

        } while( col > 0 );

        return `${col_str}${row}`;
    }
    get nbRows() {
        return this.#tbody.children.length - 1;
    }
    get nbCols() {
        return this.#tbody.firstElementChild!.children.length - 1;
    }

    #isUpdating: boolean = false;
    update() {
        if( this.#isUpdating === true )
            return;
        this.#isUpdating = true;

        window.requestAnimationFrame( () => {

            const cells = [...this.content.querySelectorAll<Cell>('td')].filter( e => e.rawContent instanceof Formula);
            
            for(let cell of cells )
                // @ts-ignore
                cell.rawContent.resetCache();

            for(let cell of cells) {

                if( cell.rawContent instanceof Formula ) {
                    let value = cell.rawContent.exec(this); //TODO...

                    //TODO: factorize...
                    let type: string = typeof value;
                    if( value instanceof Date )
                        type="date";

                    cell.textContent = (cell as any).format(value);
                    cell.setAttribute('data-type', type);
                }
            }

            this.host.dispatchEvent( new CustomEvent('update') );
            this.#isUpdating = false;
        })
    }

    override attributeChangedCallback(  name: string,
                                        _oldval: string | null,
                                        newval: string | null): void {
        if( name === "ro")
            this.#isRO = newval === "true";
    }

    #isRO = false;
    get isRO() {
        return this.#isRO
    }
}

export class CellList extends EventTarget {

    #sheet: CalcSheet;
    #cells: Cell[];
    constructor(sheet: CalcSheet, cells: Cell[]) {
        super();
        this.#cells = cells;
        this.#sheet = sheet;
    }

    get plage_name() {

        if( this.#cells.length === 0)
            return;

        if( this.#cells.length === 1 )
            return this.#sheet.pos2ref( ...this.#sheet.cellPos(this.#cells[0]) );

        let cells = this.#cells.map( c => this.#sheet.cellPos(c) ).sort( (a,b) => {
            if( a[0] !== b[0] )
                return a[0] - b[0];
            return a[1] - b[1];
        });

        let min = cells[0];
        let max = cells[cells.length - 1];

        let nb_cols = max[1] - min[1] + 1;

        for(let i = 0; i < cells.length; ++i)
            if( cells[i][0] !== Math.floor(i/nb_cols)+min[0] && cells[i][1] !== (i%nb_cols)+ min[1] )
                return;

        return `${this.#sheet.pos2ref(...min)}:${this.#sheet.pos2ref(...max)}`;
    }

    get cells(): Cell[] {
        return this.#cells;
    }
    get sheet(): CalcSheet {
        return this.#sheet;
    }

    toggleFormat(name: string|((v: any, prec: number|null) => string) ) {
        let f = Format.extractFormat(this);

        if( typeof name === "function") {

            let isFormat = f.getProperty("format") === name;

            this.format({format: isFormat ? null : name });

            return;
        }

        this.format({[name]: f.getProperty(name) !== true});
    }

    format(...f: string[]                          ): this;
    format(f: Format|Record<string, any>           ): this;
    format(f: (v: any, prec: number|null) => string): this;
    format(...f: (( (v: any, prec: number|null) => string )
                    |string
                    |Format
                    |Record<string, any>)[]
            ) {

        let format: Format;

        const f0 = f[0];
        if( f0 instanceof Format )
            format = f0;
        else {

            let obj: Record<string, any>;

            if( f.length > 1 )
                obj = Object.fromEntries( f.map(e=>[e,true]) );
            else if( typeof f0 === "function" )
                obj = {"format": f0};
            else if( typeof f0 === 'string' )
                obj = {[f0]: true};
            else
                obj = f0;

            format = new Format(obj);
        }
        
        format.applyTo(this);

        return this;
    }

    get content(): (RawContentType)[] {
        let content = new Array(this.#cells.length);
        for(let i = 0; i < this.#cells.length; ++i)
            content[i] = this.#cells[i].rawContent!;

        return content;
    }

    deleteFormat() {
        for(let cell of this.#cells) //TODO add hoc format...
            cell.className = '';
    }

    deleteContent() {

        for(let cell of this.#cells) {
            cell.rawContent = undefined as any;
            cell.textContent = "";
            cell.removeAttribute('data-type');
        }

        this.#sheet.update();
    }

    set content(content: Cell|RawContentType|(RawContentType|Cell)[]) {

        if( Array.isArray(content) ) {
            for(let i = 0; i < content.length; ++i)
                new CellList(this.#sheet, [this.#cells[i]] ).content = content[i];

            return;
        }

        if( typeof content === 'string') {

            let raw = content;
            content = parseInput(content);
            if( typeof content === "number" && raw[raw.length-1] === "%") {
                let f = Format.extractFormat(this);
                if( ! f.hasProperty("format") || f.getProperty("format") === Formats.default )
                    this.format(Formats.pourcent);
            }
            if( typeof content === "number" && raw[raw.length-1] === "€") {
                let f = Format.extractFormat(this);
                if( ! f.hasProperty("format") || f.getProperty("format") === Formats.default )
                    this.format(Formats.euros);
            }
        }

        let raw_val = content instanceof HTMLTableCellElement ? content.rawContent
                                                              : content;

        for(let cell of this.#cells) {

            if(content instanceof HTMLTableCellElement && content.rawContent instanceof Formula ) {
            
                let v = content.rawContent;

                const dst = this.#sheet.cellPos( cell );
                const src = this.#sheet.cellPos(content)

                const diff = [ dst[0] - src[0], dst[1] - src[1]] as const;

                raw_val = v.relativeTo( this.#sheet, ...diff );
            }

            cell.rawContent = raw_val;

            let value = raw_val;
            if( raw_val instanceof Formula) {

                const formats = Object.values( Formats );

                //If no number format, deduce format.
                if( cell.format === undefined || cell.format === Formats.default) {
                    let format = Formats.default;
                    let nb_dates = 0;
                    for(let r of raw_val.rangesToken) {
                        let f = Format.extractFormat(this.sheet.getRange(r.value) ).getProperty("format");
                        if( format !== f && formats.indexOf(f) > formats.indexOf(format) )
                            format = f;
                        if(f === Formats.date)
                            ++nb_dates;
                    }

                    // h4ck
                    if( format === Formats.date && nb_dates > 1 )
                        format = Formats.default;

                    if(format !== Formats.default)
                        // @ts-ignore
                        cell.format = format;
                }

                value = raw_val.exec(this.#sheet);
            }

            let type: string = typeof value;
            if( value instanceof Date ) {
                type="date";
                cell.format = Formats.date;
            }

            // @ts-ignore
            cell.textContent = cell.format(value);

            if( cell.format === Formats.date)
                type = 'date';
            if( cell.format === Formats.pourcent)
                type = 'pourcent';
            if( cell.format === Formats.euros || cell.format === Formats.number )
                type = 'number';

            cell.setAttribute('data-type', type);
        }

        this.#sheet.update();
    }

    setRO(is_ro: boolean = true) {
        for(let cell of this.#cells)
            cell.is_ro = is_ro;
    
        return this;
    }

    get length() {
        return this.#cells.length;
    }

    has(...cells: Cell[]) {
        for(let cell of cells)
            if( ! this.#cells.includes(cell) )
                return false;
        return true;
    }

    remove(...cells: Cell[]) {
        this.#cells = this.#cells.filter( c => ! cells.includes(c) );
        this.dispatchEvent( new CustomEvent("change") );
    }

    replaceAll(...cells: Cell[]|[CellList]) {
        this.#cells.length = 0;
        this.add(...cells);
    }

    add(...cells: Cell[]|[CellList]) {

        if( cells[0] instanceof CellList)
            cells = cells[0].cells;

        this.#cells.push(...cells as Cell[]);

        this.dispatchEvent( new CustomEvent("change") );
    }

    get firstCell() {
        if( this.#cells.length < 1)
            throw new Error("nope");
        return this.#cells[0];
    }

    clear() {
        this.#cells.length = 0;

        this.dispatchEvent( new CustomEvent("change") );
    }


    deepClone() {

        let cells = this.#cells.map( c => {
            const clone = c.cloneNode(true) as Cell;

            clone.rawContent = c.rawContent;
            clone.format     = c.format;
            (clone as any).pos        = this.#sheet.cellPos(c);

            return clone;
        })

        return new CellList(this.#sheet, cells);
    }
}

define('calc-sheet', CalcSheet);