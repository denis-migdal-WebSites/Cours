import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";
import { Formats } from "@Cours/components/WebCalc/Format";

const sheet = document.querySelector<CalcSheet>('#sheet_formula')!;

sheet.getRange("A1:C1").format("bold", "align_center")
                           .content = [
                                "Quantité",
                                "Prix unitaire",
                                "Prix total"
                           ];

sheet.getRange("A2:A4").content = [23  , 12, 44];
sheet.getRange("B2:B4").format(Formats.euros).content = [0.2, 0.3, 0.4];

sheet.getRange("C2:C4").format(Formats.euros).content = [
    "=A2*B2",
    "=A3*B3",
    "=A4*B4"
];

export {};