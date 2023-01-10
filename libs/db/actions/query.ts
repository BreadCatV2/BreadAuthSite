import getConnection from '../mariadb';

export async function queryFirstRes(query:string, values:string[]) {
    let conn;
    try {
        conn = await getConnection();
        const rows = await conn.query(query, values);
        await conn.release();
        if (rows.length === 0) {
            return null;
        }
        return rows[0];
    } catch (err) {
        console.error(err);
        await conn?.release();
        return null;
    }
}

export async function query(query:string, values:string[]) {
    let conn;
    try {
        conn = await getConnection();
        const rows = await conn.query(query, values);
        await conn.release();
        return rows;
    } catch (err) {
        console.error(err);
        await conn?.release();
        return null;
    }
}