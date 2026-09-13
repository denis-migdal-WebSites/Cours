import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const s_$formula = [
    document.querySelector<CalcSheet>('#sheet____formula')!,
    document.querySelector<CalcSheet>('#sheet_x__formula')!,
    document.querySelector<CalcSheet>('#sheet__x_formula')!,
    document.querySelector<CalcSheet>('#sheet_xx_formula')!
]

for(let i = 0; i < s_$formula.length; ++i) {
    const s_$form = s_$formula[i];

    s_$form.getRange("A1:D1").format("bold")
                             .content = [0, 1, 2, 3];

    s_$form.getRange("A2:A4").format("bold")
                             .content = [1, 2, 3];

    let ref = "=A1";
    if( i === 1)
        ref = "=$A1";
    if( i === 2)
        ref = "=A$1";
    if( i === 3)
        ref = "=$A$1";

    s_$form.getRange("B2").content = ref;

    s_$form.getRange("A1:D4").format("align_center")
}
