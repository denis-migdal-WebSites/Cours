import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const sheet = document.querySelector<CalcSheet>('#sheet_recopie_motivation')!;

sheet.getRange("A1:D4").format("align_center").content = [
    "Conso/jour", "Crayons", "Gommes", "Total (jour)",
    "01/01"  , 2, 3, "=B2+C2", 
    "02/01"  , 4, 1, "=C3+C3", 
    "Total (prod)"  , "=B2+B3", "=C2+C3", "=D2+D3", 
];
sheet.getRange("A1:D1").format("bold");
sheet.getRange("A2:A4").format("bold");