import { date2Float, Formats } from "../Format";
import type { CalcSheet, ValueType } from "../CalcSheet";

export class Formula {

    #str: string;
    #exec: (sheet: CalcSheet) => ValueType;
    #ranges: Token[];

    #cache: ValueType|null = null;

    constructor(str: string, exec: (sheet: CalcSheet) => ValueType, ranges_token: Token[] = []) {

        this.#str = str;
        this.#exec = exec;
        this.#ranges = ranges_token;
    }
    
    relativeTo( sheet: CalcSheet, drow: number, dcol: number) {
        
        let new_ranges = this.#ranges.map(r => {

            //TODO: if range...
            let pos = [...sheet.cellPos( sheet.getRange(r.value).firstCell )];
    
            if( r.value.lastIndexOf('$') <= 0 )
                pos[0] += drow;
            if( r.value[0] !== '$' )
                pos[1] += dcol;

            return `${String.fromCharCode(65+pos[1]-1)}${pos[0]}`;
        });

        let new_formula = "";

        let offset = 0;
        for(let i = 0; i < this.#ranges.length; ++i) {

            new_formula += this.#str.slice(offset, this.#ranges[i].beg);
            new_formula += new_ranges[i];

            offset = this.#ranges[i].end;
        }
        new_formula += this.#str.slice(offset);
        
        //can be optimized...
        return parse_formula( new_formula );
    }

    get rangesToken() {
        return this.#ranges;
    }

    resetCache() {
        this.#cache = null;
    }

    cachedValue() {
        return this.#cache!;
    }

    exec(sheet: CalcSheet) {

        if( this.#cache !== null)
            return this.#cache;

        return this.#cache = this.#exec(sheet);
    }

    toString() {
        return this.#str;
    }
}

type Token = {
    beg: number,
    end: number,
    value: string,
    type: "string"|"number"|"call"|"range"|"op"
}


function extractToken(str: string, offset: number) {

    while( [' ', '\n', '\t'].includes(str[offset]) ) // ignore whitespaces
        ++offset;

    let token: Partial<Token> = {
        beg: offset
    };

    if(str[offset] === '"') {
        token.type = "string";
        while( str[++offset] !== '"' && str[offset-1] !== '\\') {
            if(offset+1 >= str.length )
                throw new Error('Formula parsing error');
        }
        ++offset;
    } else if( str[offset] === ',' || (str[offset] >= '0' && str[offset] <= '9') ) {
        token.type = "number";
        let hasComma = false;
        while( str[offset] === ',' || str[offset] >= '0' && str[offset] <= '9' ) {

            if( str[offset] === ',' ) {
                if(hasComma === true)
                    throw new Error('Formula parsing error');
                hasComma = true;
            }

            ++offset;
        }

    } else if( str[offset] === '$' || str[offset] >= 'A' && str[offset] <= 'Z') { //+$
        
        while( offset < str.length
                && (str[offset] === '$' || str[offset] >= 'A' && str[offset] <= 'Z'
                                        || str[offset] >= '0' && str[offset] <= '9'
                    ) )
            ++offset;

        token.type = str[offset] === '(' ? 'call' : 'range';

        if( str[offset] === '(' )
            throw new Error('not implemented')
    } else {
        token.type = "op"; // only on char ???

        if( str[offset + 1] === '=') // >= / <=
            ++offset;
        else if( str[offset + 1] === '>') // <>
            ++offset;

        ++offset;
    }

    token.end = offset;
    token.value = str.slice(token.beg, token.end);

    return token as Required<Token>;
}

class Node {

    children: Node[];
    #fct: (sheet: CalcSheet, ...args:(ValueType)[]) => ValueType;

    constructor(fct: (sheet: CalcSheet, ...args:(ValueType)[]) => ValueType, ...children: Node[]) {
        this.children = children;
        if(children === undefined)
            throw new Error("WTF");
        this.#fct = fct;
    }

    eval(sheet: CalcSheet): ValueType {
        const args = this.children.map( c => c.eval(sheet) );
        return this.#fct(sheet, ...args );
    }
    
}

function toNumber(a: unknown): number {

    if(a === undefined)
        return 0;

    if( typeof a === "string")
        return Number(a);

    if( a instanceof Date)
        return date2Float(a);

    return a as unknown as number;
}

const op_impl = {
    '%': (_: CalcSheet, a: unknown) => toNumber(a)/100,
    'u.+': (_: CalcSheet, a: unknown) => +toNumber(a),
    'u.-': (_: CalcSheet, a: unknown) => -toNumber(a),
    '*': (_: CalcSheet, a: unknown, b: unknown) => toNumber(a)*toNumber(b),
    '/': (_: CalcSheet, a: unknown, b: unknown) => toNumber(a)/toNumber(b),
    '+': (_: CalcSheet, a: unknown, b: unknown) => toNumber(a)+toNumber(b),
    '-': (_: CalcSheet, a: unknown, b: unknown) => toNumber(a)-toNumber(b),
    '^': (_: CalcSheet, a: unknown, b: unknown) => Math.pow(toNumber(a),toNumber(b) ),
    '&': (_: CalcSheet, a: string, b: string) => `${Formats.default.call(null, a)}${Formats.default.call(null, b)}`,
    '=':  (_: CalcSheet, a: any, b: any) => a === b,
    '<>': (_: CalcSheet, a: any, b: any) => a !== b,
    '>':  (_: CalcSheet, a: any, b: any) => a > b,
    '>=': (_: CalcSheet, a: any, b: any) => a >= b,
    '<':  (_: CalcSheet, a: any, b: any) => a < b,
    '<=': (_: CalcSheet, a: any, b: any) => a <= b,
} as Record<string, (_: CalcSheet, ...args:ValueType[]) => ValueType>;

// https://help.libreoffice.org/latest/en-US/text/scalc/01/04060199.html
const op_prio = [
    [':'], // range
    ['!'], // range intersection
    ['~'], // range union
    ['u.+', 'u.-'], // unary - from right to left...
    ['%'], // postfix, /100
    ['^'], // power
    ['*', '/'],
    ['+', '-'],
    ['&'], // string concat
    ['=', '<>', '<', '<=', '>', '>='] // compare
];

let ops: Record<string, number> = {};
for(let i = 0; i < op_prio.length; ++i)
    for(let op of op_prio[i] )
        ops[op] = i;

function tokenlist2Tree(tokens: Token[]): Node {

    if( tokens.length === 1) {

        if( tokens[0].type === "number") {
            const nb = +tokens[0].value.replace(',', '.');
            return new Node( () => nb);
        }
        if( tokens[0].type === "string") {
            const str = tokens[0].value.slice(1,-1);
            return new Node( () => str);
        }
        if( tokens[0].type === "range") {
            return new Node( (sheet: CalcSheet) => {

                let raw = sheet.getRange(tokens[0].value).firstCell.rawContent;

                if( raw instanceof Formula)
                    raw = raw.exec(sheet); // TODO: cache result

                return raw as ValueType;
            });
        }
        throw new Error("???");
    }

    if(tokens[0].value === '(' && tokens[tokens.length-1].value === ')')
        return tokenlist2Tree(tokens.slice(1,-1) );

    let cur = {
        priority: op_prio.length,
        idx     : -1
    };

    for(let i = tokens.length - 1; i >= 0; --i) {
        if( tokens[i].type !== "op" ) // call not handled yet...
            continue;

        if( tokens[i].value === ')' ) { // go to first '('
            i = tokens.findIndex( t => t.type === 'op' && t.value === '(');

            if( i === 0)
                break;
            --i;
        }

        // asserts if unary op.
        if( tokens[i].value === '-' || tokens[i].value === '+' ) {

            if( i === 0 || tokens[i-1].type === "op" ) {

                const u_op = `u.${tokens[i].value}`;
                tokens[i].value = u_op;
                const priority = ops[u_op];

                // priority is reversed + evaluated from right to left.
                if( priority <= cur.priority) {
                    cur.priority = priority;
                    cur.idx      = i;
                }

                continue;
            }
        }

        const priority = ops[tokens[i].value];

        // priority is reversed.
        if( priority < cur.priority) {
            cur.priority = priority;
            cur.idx      = i;
        }
    }

    if( cur.idx === -1)
        throw new Error('???');

    let op_token = tokens[cur.idx];
    if( op_token.value === '%' ) {
        const left  = tokens.slice(0, cur.idx);
        const op = op_impl[op_token.value as keyof typeof op_impl];
        return new Node(
            op,
            tokenlist2Tree(left)
        );
    }

    if( op_token.value === 'u.-' ||  op_token.value === 'u.+' ) {

        const right  = tokens.slice(cur.idx+1);
        const op = op_impl[op_token.value as keyof typeof op_impl];
        return new Node(
            op,
            tokenlist2Tree(right)
        );
    }

    const left  = tokens.slice(0, cur.idx);
    const right = tokens.slice(cur.idx+1);

    const op = op_impl[op_token.value as keyof typeof op_impl];

    return new Node(
        op,
        tokenlist2Tree(left),
        tokenlist2Tree(right)
    );
}

export function parse_formula(str:string) {

    let offset = 1;
    let tokens = new Array<Token>();

    while( offset < str.length) {
        let curToken = extractToken(str, offset);
        tokens.push( curToken );
        offset = curToken.end;
    }

    const node = tokenlist2Tree(tokens)!;

    const ranges = tokens.filter(t => t.type === "range" );

    return new Formula(str, (sheet: CalcSheet) => node.eval(sheet), ranges );
}