import getConnection from '../mariadb';

export async function queryFirstRes(query:string, values:string[]) {
    let conn;
    try {
        conn = await getConnection();
        const rows = await conn.query(query, values);
        conn.end();
        if (rows.length === 0) {
            return null;
        }
        return rows[0];
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function query(query:string, values:string[]) {
    let conn;
    try {
        conn = await getConnection();
        const rows = await conn.query(query, values);
        conn.end();
        return rows;
    } catch (err) {
        console.error(err);
        return null;
    }
}