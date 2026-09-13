import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";
import { CalcToolbar } from "@Cours/components/WebCalc/CalcToolbar";
import { Formats } from "@Cours/components/WebCalc/Format";

const sheet = document.querySelector<CalcSheet>('#sheet_format')!;

sheet.getRange("A1:E1").format("bold", "align_center").content = [
    1, "Monnaie", "Pourcent", "Nombre", "Date"
];

sheet.getRange("A2:A4").format("bold", "align_center").content = [
    "Normal", "+1 decimal", "-1 decimal"
];

sheet.getRange("B2:E4").content = "=$A$1";
sheet.getRange("B2:B4").format(Formats.euros);
sheet.getRange("C2:C4").format(Formats.pourcent);
sheet.getRange("D2:D4").format(Formats.number);
sheet.getRange("E2:E4").format(Formats.date);

sheet.getRange("B3:E3").format({precision: 3});
sheet.getRange("B4:E4").format({precision: 1});

const sheet_toolbar = document.querySelector<CalcToolbar>('#sheet_toolbar_format')!;
sheet_toolbar.syncTo(sheet);
sheet_toolbar.disableAllExcept("format_monnaie", "format_pourcent", "format_nb", "format_date", "format_zero_p1", "format_zero_m1");