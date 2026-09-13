import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";
import { CalcToolbar } from "@Cours/components/WebCalc/CalcToolbar";

const sheet = document.querySelector<CalcSheet>('#sheet_format_content')!;

sheet.getRange("A1:F1").format("bold", "align_center").content = [
    "Taille", "Gras", "Italique", "Souligné", "Couleur texte", "Couleur fond"
]

sheet.getRange("A2:F2").format("align_center").content = "A";
sheet.getRange("A2").format({font_size: '15pt'});
sheet.getRange("B2").format('bold');
sheet.getRange("C2").format('italic');
sheet.getRange("D2").format('underline');
sheet.getRange("E2").format({foreground_color: 'blue'});
sheet.getRange("F2").format({background_color: 'yellow'});

const toolbar = document.querySelector<CalcToolbar>('#sheet_toolbar_format_content')!;
toolbar.syncTo(sheet);
toolbar.disableAllExcept("font_size", "bold", "italic", "underline", "foreground_color", "background_color");