import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const sheet = document.querySelector<CalcSheet>('#sheet_complex_formula')!;

sheet.getRange("A1:C1").format("bold", "align_center")
                           .content = [
                                "X",
                                "Y",
                                "Formule"
                           ];

sheet.getRange("A2:B4").content = [
    2, 4,
    1, 5,
    4, 6];

sheet.getRange("C2").content =
`= A2*B2
 +A3*B3
 +A4*B4`;