const output = document.querySelector<HTMLElement>(".results")!;
const unicode = document.querySelector<HTMLElement>(".unicode")!;

const input = document.querySelector<HTMLInputElement>(".input")!;

const variantsCodes = [14,15];

function showSymbol(symbol: string) {

    let variants = "";
    for (let i = 0; i < variantsCodes.length; ++i) {

        const base = [...symbol].filter(cp => {
            const code = cp.codePointAt(0)!;

            return !(
                (code >= 0xFE00  && code <= 0xFE0F) ||
                (code >= 0xE0100 && code <= 0xE01EF)
            );
        }).join("");

        variants += base + String.fromCodePoint(0xFE00 + variantsCodes[i]);
    }

    unicode.textContent = symbol.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
    output.style.setProperty("--symbol", `"${variants}"`);
}

input.addEventListener("input", () => {
    showSymbol(input.value)
})

document.querySelector(".symbols")!.addEventListener("click", (ev) => {

    if( ! (ev.target instanceof HTMLSpanElement) )
        return;

    showSymbol(ev.target.textContent!);
});

setTimeout(async () => {

    const t = performance.now();

    const font = new FontFace(
        "Test",
        'url("/assets/font/NotoColorEmoji.woff2")'
    );

    await font.load();

    console.log(performance.now() - t);
}, 20000);