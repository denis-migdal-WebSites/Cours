const nb_tables_input  = document.querySelector<HTMLInputElement>('.join_nbTables')!;
const nb_entries_input = document.querySelector<HTMLInputElement>('.join_nbEntries')!;

const result_cartesien = document.querySelector('.join_cartesien')!;
const result_mieux     = document.querySelector('.join_best')!;

function update() {
    const nb_table   = +nb_tables_input.value;
    const nb_entries = +nb_entries_input.value;

    result_cartesien.textContent = Math.pow(nb_entries, nb_table).toLocaleString();

    result_mieux.textContent = nb_entries.toLocaleString();
}

nb_tables_input.addEventListener('input', update);
nb_entries_input.addEventListener('input', update);

update();