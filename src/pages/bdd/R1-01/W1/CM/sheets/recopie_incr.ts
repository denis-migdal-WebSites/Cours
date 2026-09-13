import { CalcSheet } from "@Cours/components/WebCalc/CalcSheet";

const sheet = document.querySelector<CalcSheet>('#sheet_recopie_incr')!;

sheet.getRange('A1:A2').content = [ 1, new Date() ];