import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";
import { CalcToolbar } from "@Cours/components/WebCalc/CalcToolbar";

const sheet = document.querySelector<CalcSheet>('#sheet_retraits')!;

sheet.getRange("A1:B1").format("bold", "align_center").content = [
    "Gauche", "Droite"
];

sheet.getRange('A2:B5').content = "A";
sheet.getRange('A2:A5').format("align_left");
sheet.getRange('B2:B5').format("align_right");

sheet.getRange('A3:B3').format({indent: 1});
sheet.getRange('A4:B4').format({indent: 2});
sheet.getRange('A5:B5').format({indent: 3});

const sheet_toolbar = document.querySelector<CalcToolbar>('#sheet_toolbar_retraits')!;
sheet_toolbar.syncTo(sheet);
sheet_toolbar.disableAllExcept("retrait_p1", "retrait_m1");