import { queryFirstRes } from "../db/actions/query";
import verifyKey from "./verifyKey";

export default async function checkUser(apikey: string, user_id?:string) {
    //if user_id is not provided, get it from the apikey, the user_id should be the first 64 characters of the apikey
    if (!user_id && apikey.length == 128) {
        user_id = apikey.slice(0, 64)
        apikey = apikey.slice(64)
    } else if (!user_id) {
        return false
    }
    const queryResUsers = await queryFirstRes("SELECT * FROM users WHERE user_id = ?", [user_id]);
    if (!queryResUsers) {
        return false
    }
    const keyValid = await verifyKey(user_id, queryResUsers.apikey, apikey);
    if (!keyValid) {
        return false
    }
    return true
}