import {LISS, WithBare, WithContent, WithOutput} from "@LISS/src/extensions"
import define from "@LISS/src/define";
import { keepSpaces, raw2html, unindent } from "@LISS/components/code/code-script";

const css = __LOAD_FILE__("./index.css");
const theme = __LOAD_FILE__("@LISS/components/code/Tomorrow.css");

export type SelectedQueries = { 
                                html   : string[],
                                queries: string[],
                                vars   : Record<string, string>
                            };

export default class SQLSelector extends LISS({css: [theme, css]},
                                                WithBare,
                                                WithContent,
                                                WithOutput<SelectedQueries>) {

    #select_queries: string[]|null = null;
    #select_html   : string[]|null = null;

    constructor() {
        super();

        const query_script = this.host.querySelector<HTMLElement>("code-script, script")!;
        const query = unindent(query_script.textContent!);

        const select_script = this.host.querySelector<HTMLElement>(":is(code-script, script).select");
        if(select_script !== null) {
            const q = unindent(select_script.textContent!.replaceAll('\u00a0',
                                                                     ' ') );
            this.#select_queries = this.#splitQueries( q );
            this.#select_html = this.#select_queries.map(q=> raw2html(q,"sql"));
        }

        const template = document.createElement('template');
        template.innerHTML = `<div><div class="code">${raw2html(query, "sql")}</div></div>`;

        const h = template.content.querySelectorAll<HTMLElement>("h");
        const vars: Record<string, HTMLElement[]> = {};
        const varnames: string[] = [];
        for(let i = 0; i < h.length; ++i) {
            const varname = varnames[i] = h[i].textContent!.slice(1)
                                                           .toLowerCase();
            (vars[varname] ??= []).push(h[i]);
        }

        this.#buildOptions(template, vars);
        this.#buildQuery  (template, varnames );
        
        this.content.addEventListener("click", (ev) => {

            const target = ev.target as HTMLElement;

            let option = target.closest<HTMLElement>(".option");
            if(option === null)
                return;

            ev.preventDefault();

            const prev_selected = this.content.querySelector('.selected')
            if(prev_selected !== null)
                prev_selected.classList.remove('selected');

            option.classList.add('selected');

            // @ts-ignore
            const values = option.values;

            for(let varname in this.#query_vars )
                for(let i = 0; i < this.#query_vars[varname].length; ++i)
                    this.#query_vars[varname][i].innerHTML = keepSpaces(values[varname] ?? "");
            
            this.#onQueryChange();
        });

        const opt_attr = this.getAttribute('option');
        if( opt_attr !== null) {
            this.#options[+opt_attr].click();
            return;
        }
        if( this.#select_queries === null )
            this.#options[0].click();
    }
    
    static observedAttributes = ["option"];
    override attributeChangedCallback(name: string,
                                      oldval: string|null,
                                      newval: string|null) {

        if(name !== "option" || oldval === newval)
            return;

        this.#options[+newval!].click();
    }

    #splitQueries(query: string) {
        return query.split(";\n").map( q => {
            q = q.trim();
            if( ! q.endsWith(';') )
                q += ";"

            return q;
        });
    }
    #splitHTML(query: string) {
        return query.split(";<br>\n").map( q => {
            
            q = q.trim();
            if( ! q.endsWith(';') )
                q += ";"

            return q;
        });
    }

    #onQueryChange() {

        //TODO: by default if not select
        const print_schema = this.host.getAttribute('print-schema') !== "false";

        // rules :
            // not SELECT or VALUES -> execute select before & after
            // CREATE TABLE : pragma + no show.

        const vars: Record<string, string> = {};
        for(let varname in this.#query_vars)
            vars[varname] = this.#query_vars[varname][0].textContent!;

        const selected_html    = this.#splitHTML(this.#query.firstElementChild!.innerHTML);
        const selected_queries = this.#splitQueries(this.#query.textContent!.replaceAll('\u00a0', ' '));

        const html    = new Array();
        const queries = new Array();

        const query = selected_queries[0];
        if(    ! query.startsWith("SELECT ")
            && ! query.startsWith("VALUES ")
            && ! query.startsWith("CREATE TABLE ") ) {

            if( this.#select_queries !== null ) {
                   html.push(...this.#select_html   !);
                queries.push(...this.#select_queries!);
            }
        }

        for(let i = 0; i < selected_queries.length; ++i) {
               html.push(   selected_html[i]);
            queries.push(selected_queries[i]);

            const query = selected_queries[i];

            if( query.startsWith("SELECT ") || query.startsWith("VALUES ") )
                continue;

            if( query.startsWith("CREATE TABLE ") && print_schema ) {
                let q = "CREATE TABLE ";
                if( query.startsWith("CREATE TABLE IF NOT EXISTS") )
                    q = "CREATE TABLE IF NOT EXISTS ";

                let offset = q.length;
                while( query[offset] !== '(' &&  query[offset] !== ' ' && query[offset] !== '\n' )
                    ++offset;

                const tb_name = query.slice(q.length, offset);
                const sq = `SELECT name, type, "notnull", dflt_value, pk, hidden\n        FROM pragma_table_xinfo('${tb_name}');`
                
                queries.push(sq);
                   html.push(raw2html(sq, "sql"));
            }

            if(      this.#select_queries !== null
                && ! query.startsWith("CREATE TABLE ") ) {
                   html.push(...this.#select_html   !);
                queries.push(...this.#select_queries!);
            }
        }

        this._output.value = {
            html,
            queries,
            vars
        }
    }

    #query!: HTMLElement;
    #query_vars!: Record<string, HTMLElement[]>;
    #buildQuery(template: HTMLTemplateElement,
                varnames: string[]) {

        this.#query = template.content.cloneNode(true).childNodes[0] as HTMLElement;

        this.#query.classList.add("query");

        const h = this.#query.querySelectorAll<HTMLElement>("h");
        const vars: Record<string, HTMLElement[]> = {};
        for(let i = 0; i < h.length; ++i) {
            (vars[ varnames[i] ] ??= []).push( h[i] );
            h[i].textContent = "";
            h[i].toggleAttribute("contenteditable", true);
            h[i].setAttribute("spellcheck", "false");

            h[i].addEventListener('keypress', (ev) => {
                if(ev.key !== "Enter") return;
                ev.preventDefault();
                h[i].blur();
            });

            h[i].addEventListener("input", () => {
                const prev_selected = this.content.querySelector('.selected')
                if(prev_selected !== null)
                    prev_selected.classList.remove('selected');

                this.#onQueryChange();
            })
        }

        this.#query_vars = vars;
        this.content.append(this.#query);
    }

    #options!: HTMLElement[];
    #buildOptions(template: HTMLTemplateElement,
                      vars: Record<string, HTMLElement[]>) {

        const options = [...this.host.querySelectorAll<HTMLElement>("sql-option")];

        this.#options = new Array(options.length);

        for(let i = 0; i < options.length; ++i) {

            const option = options[i];
            const values = JSON.parse(option.textContent!.trim());

            for(let varname in vars)
                for(let i = 0; i < vars[varname].length; ++i)
                    vars[varname][i].innerHTML = keepSpaces(values[varname] ?? "");

            const opt = template.content.cloneNode(true).childNodes[0] as HTMLElement;
            opt.classList.add("option");
            // @ts-ignore
            opt.values = values;

            const desc = option.getAttribute("desc");
            if( desc !== null) {
                opt.classList.add('withdesc');

                const title = document.createElement('div');
                title.classList.add("desc");
                title.textContent = desc! + " :";

                opt.prepend(title);
            }

            this.#options[i] = opt;
        }
        this.content.append(...this.#options);
    }
}

define("sql-selector", SQLSelector);