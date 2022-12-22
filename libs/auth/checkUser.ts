import { queryFirstRes } from "../db/actions/query";
import verifyKey from "./verifyKey";

export default async function checkUser(apikey: string, user_id:string) {
    const queryResUsers = await queryFirstRes("SELECT * FROM users WHERE user_id = ?", [user_id]);

    const keyValid = await verifyKey(user_id, queryResUsers.apikey, apikey);
    if (!keyValid) {
        return false
    }
    return true
}