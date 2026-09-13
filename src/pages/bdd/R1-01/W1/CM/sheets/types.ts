import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const sheet = document.querySelector<CalcSheet>('#sheet_types')!;

sheet.getRange("A1:E1").format("bold", "align_center")
                         .content = [
                            "Texte",
                            "Nombre",
                            "Booléen",
                            "Date",
                            "Formule"
                         ];

sheet.getRange("A2:E2").content = [
    "Hello",
    2.3,
    true,
    new Date(),
    "=B2+2"
]