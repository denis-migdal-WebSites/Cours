import {LISS, WithBare, WithContent, WithOutput} from "@LISS/src/extensions"
import define from "@LISS/src/define";

const html = __LOAD_FILE__("./index.html");
const css  = __LOAD_FILE__("./index.css");

export class PlayerToolbar extends LISS({html, css},
                                 WithBare, WithContent, WithOutput<number>) {

    readonly speed = + (this.getAttribute("speed") ?? 500);

    #timerID: number|null = null;

    constructor() {
        super();

        this._output.value = 0;

        this.content.querySelector(".prev" ) !.addEventListener("click", () => this.prev());
        this.content.querySelector(".next" ) !.addEventListener("click", () => this.next());
        this.content.querySelector(".play" ) !.addEventListener("click", () => this.play());
        this.content.querySelector(".pause" )!.addEventListener("click", () => this.pause());
        this.content.querySelector(".stop") !.addEventListener("click", () => this.stop());
    }

    nextStep() {
        ++this._output.value!;
    }

    cancelAutoPlay() {

        if(this.#timerID === null)
            return false;

        clearInterval(this.#timerID);
        this.#timerID = null;

        this.host.classList.remove("play");

        return true;
    }

    prev() {
        this.cancelAutoPlay();

        const current_value = this._output.value!;
        if( current_value === 0)
            return;

        this._output.value = current_value - 1;
    }
    next() {
        this.cancelAutoPlay();
        this.nextStep();
    }
    stop() {
        this.cancelAutoPlay();
        this._output.value = 0;
        this.host.dispatchEvent( new CustomEvent("reset") );
    }
    pause() {
        this.cancelAutoPlay();
    }

    play() {
        if( this.#timerID !== null)
            return; // shouldn't be called.
        
        // @ts-ignore
        this.#timerID = setInterval( () => this.nextStep(),  this.speed);

        this.host.classList.add("play");
    }
}

define("player-toolbar", PlayerToolbar)