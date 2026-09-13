import { SQLExecutionOutput } from "@Cours/components/SQL/SQLInteractive";
import { getOutput } from "@LISS/src";

const uml_output = document.querySelector("#uml .output")!;
const umlsql     = document.querySelector("#uml-sql")!;

const signal = getOutput<SQLExecutionOutput>(umlsql);

signal.listen( update );
update();

function update() {

    const value = signal.value;
    if(value === null) return;

    const { cols_a,
            cols_b,
            fk: fk_str,
            pk: pk_str} = value.vars;

    const fk = (fk_str as string).split(',').map( k => k.trim() );
    const pk = (pk_str as string).split(',').map( k => k.trim() );

    function buildTable(cols_str: string, hcols: string[], isPK: boolean) {
        let content = [];

        const hmethod = isPK ? "strong" : "em";

        let max_w  = 0;
        let max_nw = 0;
        let max_cw = 0;

        const cnstr = `${isPK ? "PK" : "FK"}(${(isPK ? pk : fk).join(', ')})`;
        max_w = cnstr.length;

        const cols = cols_str.split(',').map( l => {
            l = l.trim();
            const pos = l.indexOf(' ');
            const colname = l.slice(0, pos);
            const constrainst = l.slice(pos+1);

            const nw = colname.length;
            const cw = constrainst.length;
            if( nw > max_nw)
                max_nw = nw;
            if( cw > max_cw)
                max_cw = cw;

            return [colname, constrainst];
        });

        if( max_w > max_nw + max_cw)
            max_cw = max_w - max_nw;
        if( max_w < max_nw + max_cw )
            max_w = max_nw + max_cw;

        let prefix = "";
        let suffix = "";

        if( isPK )
            suffix = "   ";
        else
            prefix = "   ";


        content.push(`${prefix}+-${"".padEnd(max_w+2, "-")}-+${suffix}`);
        const lpad_len = Math.floor( (max_w+2-1)/2);
        let lpad = "".padEnd(lpad_len);
        let rpad = "".padEnd(max_w+2-1 - lpad_len);
        content.push(`${prefix}| ${lpad}<strong>${(isPK ? "A" : "B")}</strong>${rpad} |${suffix}`);
        content.push(`${prefix}+-${"".padEnd(max_w+2, "-")}-+${suffix}`);

        for(let col of cols) {

            let w = max_w;
            void w;

            let lsuffix = suffix;
            let lprefix = prefix

            let colname = col[0].padEnd(max_nw);

            if( hcols.includes(col[0]) ) {
                colname = `<${hmethod}>${colname}</${hmethod}>`;

                if( isPK )
                lsuffix = "<--";
                else
                lprefix = "---";
            }
            
            const line = `${colname}: ${col[1].padEnd(max_cw)}`;
            content.push(`${lprefix}| ${line} |${lsuffix}`);
        }

        content.push(`${prefix}+-${"".padEnd(max_w+2, "-")}-+${suffix}`);
        content.push(`${prefix}| ${cnstr.padEnd(max_w+2)} |${suffix}`);
        content.push(`${prefix}+-${"".padEnd(max_w+2, "-")}-+${suffix}`);

        return content;
    }

    let tA = buildTable(cols_a, pk, true);
    let tB = buildTable(cols_b, fk, false);

    if( tB.length > tA.length) {
        tA.push(... new Array(tB.length - tA.length).fill("".padEnd(tA[0].length)) );
    }
    if( tA.length > tB.length) { // just to simplify code.
        tB.push(... new Array(tA.length - tB.length).fill("".padEnd(tB[0].length)) );
    }

    let start_idx!: number;
    let end_idx  !: number;
    for(let i = 0; i < tA.length; ++i) {
        const idx = tA[i].length-1;
        if(tA[i][idx] === "-" || tB[i][0] === "-") {
        start_idx = i;
        break;
        }
    }
    for(let i = tA.length - 1; i >= 0 ; --i) {
        const idx = tA[i].length-1;
        if(tA[i][idx] === "-" || tB[i][0] === "-") {
        end_idx = i;
        break;
        }
    }

    let content = "";
    for(let i = 0; i < tA.length; ++i) {

        let sep = "   ";

        if( pk.length === 1 && fk.length === 1) { // unique.
        if(start_idx === end_idx) {
            if(i === start_idx)
            sep = "---";
        } else {
            if(i === start_idx || i === end_idx) {
            if(tA[i][ tA[i].length - 1 ] !== " ")
                sep = "-+ ";
            else
                sep = " +-";
            }
            if( i > start_idx && i < end_idx)
            sep = " | ";
        }
        }

        if( pk.length > 1 || fk.length > 1) { // 1 vs N and N vs 1 shouldn't occur ?
            if( i >= start_idx && i <= end_idx) {

                const sep_cars = [" ", "|", " "];

                if(tA[i][ tA[i].length - 1 ] !== " ") {
                    sep_cars[0] = "-";
                    sep_cars[1] = "+";
                }
                if(tB[i][0] !== " ") {
                    sep_cars[1] = "+";
                    sep_cars[2] = "-";
                }

                sep = sep_cars.join("");
            }
        } 

        content += `${tA[i]}${sep}${i < tB.length ? tB[i] : ""}\n`;
    }

    uml_output.innerHTML = content;
}