import type { CalcSheet, CellList } from "..";

export class RangeOverlay extends EventTarget {

    #sheet: CalcSheet;
    #range: string|null = null;
    protected overlay: HTMLElement;

    constructor(sheet: CalcSheet, ...classlist: string[]) {

        super();

        this.#sheet = sheet;
        this.#sheet.host.addEventListener('resize', () => {
            this.update();
        });

        this.overlay = document.createElement('div');
        this.overlay.classList.add('overlay', ...classlist);

        sheet.content.append( this.overlay );
    }

    setRange(range: CellList|null) {
        this.#range = range === null ? null : range.plage_name!;
        this.update();
    }

    protected getRect(...rect: readonly [number, number, number, number]) {
        return rect;
    }

    update() {

        this.overlay.classList.toggle("hidden", this.#range === null);

        if( this.#range === null)
            return;
        const rect = this.getRect( ...this.#sheet.getRect( this.#sheet.getRange(this.#range) ) );
        this.#sheet.setRect(this.overlay, rect );
    }

    override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
        // @ts-ignore
        this.overlay.addEventListener(type, callback, options);
    }

    override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        // @ts-ignore
        this.overlay.removeEventListener(type, callback, options);
    }
}

export class FormulaRef extends RangeOverlay {

    constructor(sheet: CalcSheet) {
        super(sheet, "range_highlight");
    }

    #cur_color = 0;
    setColor(color_id: number) {
        this.overlay.classList.remove(`highlight_${this.#cur_color}`); 
        this.overlay.classList.add(`highlight_${color_id}`);
        this.#cur_color = color_id;
    }
}

export class RecopyHandle extends RangeOverlay {

    constructor(sheet: CalcSheet) {
        super(sheet, "recopy");
    }

    protected override getRect(x: number, y: number, w: number, h: number) {
        return [x+w-2, y+h-2, 5, 5] as const;
    }

}