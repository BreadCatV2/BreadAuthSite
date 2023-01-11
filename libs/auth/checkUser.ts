import { queryFirstRes } from "../db/actions/query";
import getConnection from "../db/mariadb";
import verifyKey from "./verifyKey";

export default async function checkUser(apikey: string, user_id:string) {
    const conn = await getConnection("Check User");
    const queryResUsers = await conn.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
    await conn.release();
    if (!queryResUsers) {
        console.log('User not found');
        return false
    }
    const keyValid = await verifyKey(user_id, queryResUsers.apikey, apikey);
    if (!keyValid) {
        console.log('Invalid API key');
        console.log('Salt: ' + queryResUsers.apikey)
        return false
    }
    return true
}