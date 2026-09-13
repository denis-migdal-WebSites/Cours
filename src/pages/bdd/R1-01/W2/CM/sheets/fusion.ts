import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";
import { CalcToolbar } from "@Cours/components/WebCalc/CalcToolbar";

const sheet = document.querySelector<CalcSheet>('#sheet_fusion')!;

sheet.getRange('B2').format({
    span: [2,2],
    align_center: true,
    valign_middle: true
}).content = "A";

const sheet_toolbar = document.querySelector<CalcToolbar>('#sheet_toolbar_fusion')!;
sheet_toolbar.syncTo(sheet);
sheet_toolbar.disableAllExcept("merge_center", "merge", "unmerge");