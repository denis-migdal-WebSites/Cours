import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const sheet = document.querySelector<CalcSheet>('#sheet_recopie_motivation_empty')!;

sheet.getRange("A1:D4").format("align_center").content = [
    "Conso/jour", "Crayons", "Gommes", "Total (jour)",
    "01/01"  , 2, 3, "", 
    "02/01"  , 4, 1, "", 
    "Total (prod)"  , "", "", ""
];
sheet.getRange("A1:D1").format("bold");
sheet.getRange("A2:A4").format("bold");
