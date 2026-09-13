import type { SQLDymTable } from "@Cours/components/SQL/SQLDymTable";

const query = [ `SELECT `,
                [4, `DISTINCT `],
                `Date, Ref, Q `,
                [2, "as Nb"],
                [ 1, `\n    FROM Produits`],
                [ 3, `\n    WHERE Ref = 'Gomme'`],
                [ 5, `\n    ORDER BY Q`],
                [ 6, `\n    LIMIT 2`],
                ';'
            ] as (string|[number, string])[];

export function buildQuery(step: number) {
    let output = "";
    for(let elem of query) {
      if( Array.isArray(elem) ) {
        if( elem[0] > step && step !== 0 )
          continue;
        elem = elem[1];
      }
      output += elem;
    }

    return output;
}

export function buildOutput(step: number) {
    let output: (string|HTMLElement)[] = [];
    for(let elem of query) {
        let output_elem: string|HTMLElement;
        if( ! Array.isArray(elem) )
            output_elem = elem;
        else {
            const html = document.createElement('span');
            html.textContent = elem[1];
            html.classList.toggle("cur", elem[0] === step);
            
            if( elem[0] > step && step !== 0 )
            html.classList.add("notyet");
            output_elem = html;
        }
        output.push(output_elem);
    }

    return output;
}

export function _doStep(order_sql: Element,
                        list: Element[], 
                        table: SQLDymTable,
                        i: number) {

    order_sql.replaceChildren( ...buildOutput(i) ); //TODO highlight

    for(let li of list)
      li.classList.toggle("cur", li.getAttribute("step") === `${i}`);

    table.exec( buildQuery(i) );
}
