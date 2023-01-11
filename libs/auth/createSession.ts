import getConnection from "../db/mariadb";

export default async function createSession(refresh_token:string, access_token:string, expires_in:number, discord_id:number):Promise<any> {
    const conn = await getConnection();
    try {
        const expires_at = new Date();
        expires_at.setSeconds(expires_at.getSeconds() + expires_in);
        const session_token = crypto.getRandomValues(new Uint8Array(64)).toString();
        //check if the session token already exists
        const doublSessionTokenCheck = await conn.query('SELECT session_token FROM sessions WHERE session_token = ?', [session_token]);
        if (doublSessionTokenCheck.length > 0) {
            return await createSession(refresh_token, access_token, expires_in, discord_id);
        }
        const checkDiscordId = await conn.query('SELECT discord_id FROM sessions WHERE discord_id = ?', [discord_id]);
        if (checkDiscordId.length > 0) {
            await conn.query('UPDATE sessions SET refresh_token = ?, access_token = ?, expires_at = ? WHERE discord_id = ?', [refresh_token, access_token, expires_at.getSeconds(), discord_id]);
            return session_token;
        }    
        await conn.query('INSERT INTO sessions (session_token, refresh_token, access_token, expires_at, discord_id) VALUES (?, ?, ?, ?, ?)', [session_token, refresh_token, access_token, expires_at.getSeconds(), discord_id]);
        return session_token;
    } catch (err) {
        console.error(err);
        return null;
    } finally {
        await conn?.release();
    }
}