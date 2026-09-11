const output = document.querySelector<HTMLElement>(".results")!;
const unicode = document.querySelector<HTMLElement>(".unicode")!;
const variants = document.querySelector<HTMLElement>(".variants")!;

const variantsCodes = [14,15];

document.querySelector(".symbols")!.addEventListener("click", (ev) => {

    if( ! (ev.target instanceof HTMLSpanElement) )
        return;

    const symbol = ev.target.textContent!;

    const results = new Array<HTMLElement>(variantsCodes.length);
    for (let i = 0; i < variantsCodes.length; ++i) {

        const span = results[i] = document.createElement("span");

        const base = [...symbol].filter(cp => {
            const code = cp.codePointAt(0)!;

            return !(
                (code >= 0xFE00  && code <= 0xFE0F) ||
                (code >= 0xE0100 && code <= 0xE01EF)
            );
        }).join("");

        span.textContent = base + String.fromCodePoint(0xFE00 + variantsCodes[i]);
    }
    variants.replaceChildren(...results);

    unicode.textContent = symbol.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
    output.style.setProperty("--symbol", `"${symbol}"`);
});