import { CalcSheet } from "@Cours/components/@topics/tableur/WebCalc/CalcSheet";
import { CalcToolbar } from "@Cours/components/@topics/tableur/WebCalc/CalcToolbar";

const sheet = document.querySelector<CalcSheet>('#sheet_bordures')!;

sheet.getRange('B2').format({
    border_top: true,
    border_bottom: true,
    border_left: true,
    border_right: true,
    border_color: 'red',
})

const sheet_toolbar = document.querySelector<CalcToolbar>('#sheet_toolbar_bordures')!;
sheet_toolbar.syncTo(sheet);
sheet_toolbar.disableAllExcept("border", "border_color");