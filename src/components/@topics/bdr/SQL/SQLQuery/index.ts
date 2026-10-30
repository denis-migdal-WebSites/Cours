import {LISS, WithBare, WithContent, WithInput} from "@LISS/src/extensions"
import define from "@LISS/src/define";

const css = __LOAD_FILE__("./index.css");
const theme = __LOAD_FILE__("@LISS/components/code/Tomorrow.css");

export default class SQLQuery extends LISS({css: [theme, css]},
                                            WithBare,
                                            WithContent,
                                            WithInput<string>) {

    constructor() {
        super();

        this._input.listen( () => {

            let value = this._input.value;
            this.content.textContent = "sqlite> ";
            if( value === null)
                return;

            value = value.replaceAll("contenteditable", "");

            this.content.innerHTML += value.replaceAll("\n", "\n&nbsp;&nbsp;&nbsp;...> ") + "<br/>";
        });
    }
}

define("sql-query", SQLQuery);