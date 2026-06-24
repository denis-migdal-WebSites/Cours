import "./sqlite3.js";
// @ts-ignore
const sqlite3 = (await globalThis.sqlite3InitModule()).oo1;
function js2sql(value) {
    if (value === null)
        return "NULL";
    if (typeof value === "number")
        return `${value}`;
    if (typeof value === "string")
        return `'${value}'`;
    throw new Error('???');
}
//TODO merge queries...
class DB {
    #desc;
    #db;
    constructor(name, desc) {
        this.#desc = desc;
        // add t for tracing.
        this.#db = new sqlite3.DB(name, 'c');
        this.#db.exec('PRAGMA foreign_keys=ON;');
        this.fullReset();
    }
    #dropTable(name) {
        this.#db.exec(`drop table if exists ${name}`);
    }
    #createTable(name) {
        const desc = this.#desc[name];
        const cols = Object.entries(desc.schema).map(([name, type]) => `${name} ${type}`).join(", ");
        let constraints = "";
        if ("constraints" in desc)
            constraints = `, ${desc.constraints}`;
        this.#db.exec(`CREATE TABLE IF NOT EXISTS ${name}(${cols}${constraints}) STRICT;`);
        // Populate...
        const values = desc.entries.map(e => `(${e.map(c => js2sql(c)).join(', ')})`).join(", ");
        this.#db.exec(`INSERT INTO ${name} VALUES ${values};`);
    }
    resetTable(name) {
        this.#dropTable(name);
        this.#createTable(name);
    }
    #created_table = new Set();
    #updated_table = new Set();
    reset() {
        for (let name of [...this.#created_table.values()].reverse())
            this.#db.exec(`drop table if exists ${name};`);
        for (let name in this.#desc)
            if (this.#updated_table.has(name))
                this.resetTable(name);
        this.#created_table.clear();
        this.#updated_table.clear();
    }
    fullReset() {
        for (let name of [...this.#created_table.values()].reverse())
            this.#db.exec(`drop table if exists ${name}`);
        const names = Object.keys(this.#desc);
        // required due to FK...
        for (let table of names.reverse())
            this.#dropTable(table);
        for (let table of names.reverse())
            this.#createTable(table);
        this.#created_table.clear();
        this.#updated_table.clear();
    }
    #isTableName(c) {
        return c !== " " && c !== ";" && c !== "\n" && c !== "(";
    }
    #extractTableNameFromSQL(sql) {
        const types = [
            "CREATE TABLE IF NOT EXISTS ",
            "CREATE TABLE ",
            "ALTER TABLE ",
            "DROP TABLE ",
            "UPDATE ",
            "INSERT INTO ",
            "DELETE FROM "
        ];
        const sql_type = types.find(v => sql.startsWith(v));
        let start_pos = sql_type.length;
        while (!this.#isTableName(sql[start_pos]))
            ++start_pos;
        let end_pos = start_pos;
        while (this.#isTableName(sql[end_pos]))
            ++end_pos;
        const table_name = sql.slice(start_pos, end_pos);
        return [sql_type, table_name];
    }
    exec_one(sql) {
        if (sql.startsWith("VALUES ") || sql.startsWith("SELECT "))
            return this.#db.selectObjects(sql);
        this.#db.exec(sql);
        const [type, name] = this.#extractTableNameFromSQL(sql);
        if (name in this.#desc)
            this.#updated_table.add(name);
        else
            this.#created_table.add(name);
        return null;
    }
    exec_many(sql) {
        let results = [];
        for (let i = 0; i < sql.length; ++i) {
            try {
                results.push(this.exec_one(sql[i]));
            }
            catch (e) {
                console.warn(e);
                const message = "Error:" + e.message.split(':').slice(2).join(':');
                results.push(message);
                break;
            }
        }
        return results;
    }
}
const db2 = new DB("BDR1_CM", {
    Users: {
        schema: {
            ID: "INTEGER PRIMARY KEY AUTOINCREMENT",
            Nom: "TEXT",
            Prenom: "TEXT",
            Age: "INT"
        },
        entries: [
            [null, 'Doe', 'John', 43],
            [null, 'Durant', 'Paul', 9],
            [null, 'Nescio', 'Nomen', 43]
        ]
    },
    Produits: {
        schema: {
            Date: "TEXT",
            Ref: "TEXT",
            Q: "INT"
        },
        entries: [
            ['2023-01-01', 'Gomme', 10],
            ['2023-02-23', 'Gomme', 9],
            ['2023-06-13', 'Gomme', 24],
            ['2023-01-01', 'Crayon', 20],
            ['2023-02-23', 'Crayon', 18],
            ['2023-06-13', 'Crayon', 50]
        ]
    },
    T1: {
        schema: {
            ID: "INTEGER PRIMARY KEY AUTOINCREMENT",
            T1: "TEXT"
        },
        entries: [
            [null, '1'],
            [null, '2'],
            [null, '3']
        ]
    },
    T2: {
        schema: {
            ID: "INT",
            T2: "TEXT"
        },
        constraints: "FOREIGN KEY(ID) REFERENCES T1(ID)",
        entries: [
            [1, '1'],
            [3, '2'],
            [3, '3'],
            [null, '4']
        ]
    }
});
export { db2 };
//# sourceMappingURL=SQLite.js.map