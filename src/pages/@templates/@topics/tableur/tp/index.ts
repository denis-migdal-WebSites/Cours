import "@Cours/pages/@templates/TPSubject@2026/";

import "@Cours/components/@topics/tableur/WebCalc/CalcSheet";
import "@Cours/components/@topics/tableur/WebCalc/CalcToolbar";

import "@Cours/components/@topics/tableur/WebCalc/CalcSheetTP";
import "@Cours/components/@topics/tableur/WebCalc/CalcCellTP";
import { getInput, getOutput } from "@LISS/src";

// TODO: QFileWidget type isn't exported ?
//import { type QFileWidget } from "TPEngine@2026/widgets/Questions/QFile";

const output = getOutput<HTMLElement>(document.querySelector('q-file')!);
const sheets = [...document.querySelectorAll("tp-sheet")]
                    .map( e => getInput<string>(e) );

function onFileChange() {

    const value = output.value;

    if( value === null)
        return;

    for(let i = 0; i < sheets.length; ++i)
        ; //sheets[i].value = value.content;
}

output.listen( onFileChange )
onFileChange();