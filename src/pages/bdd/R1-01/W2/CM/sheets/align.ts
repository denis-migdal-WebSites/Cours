import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";
import { CalcToolbar } from "@Cours/components/WebCalc/CalcToolbar";

const sheet = document.querySelector<CalcSheet>('#sheet_align')!;

sheet.getRange("B1:E1").format("bold", "align_center").content = [
    "Haut", "Milieu", "Bas", "Ajuster"
]

sheet.getRange("A2:A4").format("bold", "align_center", "valign_middle").content = [
    "Gauche", "Centre", "Droit"
]

sheet.getRange("B2:D4").content = "A";
sheet.getRange("B2:E2").format("align_left");
sheet.getRange("B3:E3").format('align_center');
sheet.getRange("B4:E4").format('align_right');
sheet.getRange("B2:B4").format('valign_top');
sheet.getRange("C2:C4").format('valign_middle');
sheet.getRange("D2:D4").format('valign_bottom');

sheet.getRange("E2:E4").format("ajuster").content = `AAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

const toolbar = document.querySelector<CalcToolbar>('#sheet_toolbar_align')!;
toolbar.syncTo(sheet);
toolbar.disableAllExcept("align_left", "align_center", "align_right", "valign_top", "valign_middle", "valign_bottom", "ajuster");