import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const sheet = document.querySelector<CalcSheet>('#sheet_cursor')!;

sheet.getRange("A1:H1").format("bold", "align_center").content = "*";
sheet.getRange("A4:H4").format("bold", "align_center").content = "*";

sheet.getRange("D1:E4").format("bold", "align_center").content = "*";

sheet.getRange("A1:A4").format("bold", "align_center").content = "*";
sheet.getRange("H1:H4").format("bold", "align_center").content = "*";
