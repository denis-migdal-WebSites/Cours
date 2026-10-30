import { Formats } from "../Format";
import { CalcSheet } from "../CalcSheet";

const JSZip = require("jszip");

export async function load(target: CalcSheet,
                           file  : Uint8Array,
                           sheet : string = "Feuille1") {

    const zip = new JSZip();
    await zip.loadAsync(file);

    const parser = new DOMParser();
    const content = await zip.file("content.xml").async("string");

    const xml = parser.parseFromString(content, "text/xml");

    const tables = [...xml.querySelectorAll('table')];

    const table = tables.find( e => e.getAttribute("table:name") === sheet)!;
    let rows = table.querySelectorAll("table-row");

    let nb_rows = rows.length;
    for(let row of rows)
        if(row.hasAttribute('table:number-rows-repeated') )
            nb_rows += +row.getAttribute('table:number-rows-repeated')! - 1;


    let nb_cols = 1;
    for(let row of rows) {
        let nb_cells = row.children.length;
        for(let child of row.children)
            if(child.hasAttribute('table:number-columns-repeated'))
                nb_cells += +child.getAttribute('table:number-columns-repeated')! - 1;
        if( nb_cells > nb_cols)
            nb_cols = nb_cells;
    }

    let columns_default_style = [];
    const cols = table.querySelectorAll("table-column");
    for(let col of cols) {
        let style = col.getAttribute('table:default-cell-style-name')!;

        let nb = 1;
        if( col.hasAttribute("table:number-columns-repeated") )
            nb = +col.getAttribute("table:number-columns-repeated")!;

        for(let i = 0; i < nb; ++i)
            columns_default_style.push(style);
    }

    const nb_styles: Record<string, Record<string, any>> = {};
    for(let nb_style of xml.querySelectorAll("number-style") ) {
        const name = nb_style.getAttribute("style:name")!;
        let format: Record<string, any> = {};
        nb_styles[name] = format;

        for(let c of nb_style.children) {
            if( c.getAttribute('number:grouping') === "true" )
                format.format = Formats.number;
            if( c.hasAttribute('number:decimal-places') )
                format.precision = +c.getAttribute('number:decimal-places')!;
        }

    }

    let col_sizes: Record<string, string> = {};
    const styles: Record<string, Record<string, any>> = {};
    for(let style of xml.querySelectorAll("style") ) {

        let format: Record<string, any> = {};

        if( style.hasAttribute('style:data-style-name') )
            format = {...nb_styles[style.getAttribute('style:data-style-name')!]};

        styles[style.getAttribute("style:name")!] = format;

        for(let prop of style.children ) {

            if(prop.hasAttribute("style:column-width") )
                col_sizes[style.getAttribute("style:name")!] = prop.getAttribute("style:column-width")!;

            if(prop.hasAttribute('fo:background-color') )
                format.background_color = prop.getAttribute('fo:background-color');

            if(prop.hasAttribute('fo:border-top') ) {

                const border = prop.getAttribute('fo:border-top')!;
                if(border !== "none") {
                    format.border_top    = true;
                    format.border_color  = border.split(' ').slice(-1)[0];
                } else {
                    format.border_top    = false;
                }
            }
            if(prop.hasAttribute('fo:border-bottom') ) {

                const border = prop.getAttribute('fo:border-bottom')!;
                if(border !== "none") {
                    format.border_bottom    = true;
                    format.border_color  = border.split(' ').slice(-1)[0];
                } else {
                    format.border_bottom    = false;
                }
            }
            if(prop.hasAttribute('fo:border-left') ) {

                const border = prop.getAttribute('fo:border-left')!;
                if(border !== "none") {
                    format.border_left    = true;
                    format.border_color  = border.split(' ').slice(-1)[0];
                } else {
                    format.border_left    = false;
                }
            }
            if(prop.hasAttribute('fo:border-right') ) {

                const border = prop.getAttribute('fo:border-right')!;
                if(border !== "none") {
                    format.border_right    = true;
                    format.border_color  = border.split(' ').slice(-1)[0];
                } else {
                    format.border_right    = false;
                }
            }
            /*
            fo:border-left="0.06pt solid #000000" fo:border-right="0.06pt solid #000000" fo:border-top="none"
            */
            if(prop.hasAttribute('fo:border') ) {

                const border = prop.getAttribute('fo:border')!;
                if(border !== "none") {

                    format.border_top    = true;
                    format.border_bottom = true;
                    format.border_left   = true;
                    format.border_right  = true;
                    format.border_color  = border.split(' ').slice(-1)[0];
                } else {
                    format.border_top    = false;
                    format.border_bottom = false;
                    format.border_left   = false;
                    format.border_right  = false;
                }
            }

            if( prop.hasAttribute('fo:font-weight') )
                format.bold = true;
            if( prop.getAttribute('fo:font-style') === "italic" )
                format.italic = true;
            if( prop.hasAttribute('fo:font-size') )
                format.font_size = prop.getAttribute('fo:font-size')!;

            if( prop.hasAttribute('fo:margin-left') || prop.hasAttribute('fo:margin-right') ) {
                let margin = +(prop.getAttribute('fo:margin-left') ?? prop.getAttribute('fo:margin-right') )!.slice(0, -2);
                format.indent = Math.round( margin/0.353 );
            }

            if( prop.hasAttribute('fo:text-align') ) {
                let align = prop.getAttribute('fo:text-align')!
                if( align === "end")
                    align = "right";
                if( align === "start")
                    align = "left";
                format[`align_${align}`] = true;
            }
            if( prop.hasAttribute('style:vertical-align') ) {
                let align = prop.getAttribute('style:vertical-align')!
                if( align === "end")
                    align = "right";
                format[`valign_${align}`] = true;
            }
        }
    }

    target.resize(nb_rows + 1, nb_cols + 1);
    
    for(let i = 0; i < cols.length; ++i) {
        const style = cols[i].getAttribute("table:style-name")!;
        target.setColSize( i+1, col_sizes[style] );
    }
    
    let row_offset = 1;
    for(let i = 0; i < rows.length; ++i) {

        let nb = 1;
        if(rows[i].hasAttribute('table:number-rows-repeated') )
            nb = +rows[i].getAttribute('table:number-rows-repeated')!;

        for(let row_id = row_offset; row_id < row_offset + nb; ++ row_id) {
      
            let offset = 0;
            for(let j = 0; j < rows[i].children.length; ++j) {
                const cell = rows[i].children[j];

                let content: string|Date|number = [...cell.children].map(e => e.textContent).join('\n');

                if( cell.hasAttribute("table:formula")) {
                    content = cell.getAttribute("table:formula")!;
                    content = content.slice(3).replaceAll('[.', '').replaceAll(']', '');
                } else if( cell.getAttribute("office:value-type") === "date" ) {
                    content = new Date( cell.getAttribute("office:date-value")! );
                } else if( cell.getAttribute('office:value-type') === "float") {
                    content = +cell.getAttribute("office:value")!;
                }

                let nb = 1;
                if( cell.hasAttribute('table:number-columns-repeated') )
                    nb = +cell.getAttribute('table:number-columns-repeated')!;

                const range = target.getRange([row_id,offset+1], [row_id, offset+nb]);
                

                range.content = content;

                if( rows[i].children[j].hasAttribute("table:number-columns-spanned") || rows[i].children[j].hasAttribute("table:number-rows-spanned") ) {

                    range.format({
                        span: [ 
                            +(rows[i].children[j].getAttribute("table:number-rows-spanned")! ?? 1),
                            +(rows[i].children[j].getAttribute("table:number-columns-spanned")! ?? 1)
                        ]
                    });
                }

                for(let r = 0; r < nb; ++r) {

                    let style_name = cell.getAttribute('table:style-name') ?? columns_default_style[offset+r];
                
                    if( style_name === "Default" )
                        continue;

                    if( ! (style_name in styles) )
                        continue;

                    target.getRange([row_id, offset+1+r]).format( styles[style_name] );
                }
                
                offset += nb;
            }
        }
        row_offset += nb;
    }

    target.cursor.replaceAll( target.getRange('A1') );

    /*
    "styles.xml"
    "content.xml"
    */
/*
    xmlDoc = parser.parseFromString(text,"text/xml");*/

}