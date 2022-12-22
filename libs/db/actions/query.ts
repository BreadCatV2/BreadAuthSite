import pool from '../mariadb';

export async function queryFirstRes(query:string, values:[string]) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(query, values);
        console.log(rows);
        if (rows.length === 0) {
            return null;
        }
        return rows[0];
    } catch (err) {
        return null;
    }
    finally {
        if (conn) conn.end();
    }
}