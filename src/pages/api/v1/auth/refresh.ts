import type { APIRoute } from "astro";
import verifyKey from "../../../../../libs/auth/verifyKey";
import isJson from "../../../../../libs/checkJson";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import saveToken from "../../../../../libs/db/actions/saveToken";
import oauthFlow from "../../../../../libs/microsoft/oauthFlow";

export const post: APIRoute = async ({ request }) => {
    if (!isJson) {
        return await res(400, "Invalid Body");
    }
    const body = await request.json();
    if (!body) {
        return await res(400, "Invalid Body");
    }
    for (const key of ["uuid", "key", "user_id"]) {
        if (!body.hasOwnProperty(key)) {
            return await res(400, "Body Missing " + key);
        }
    }
    const queryResUsers = await queryFirstRes("SELECT * FROM users WHERE user_id = ?", [body.user_id]);
    const queryResTokens = await queryFirstRes("SELECT * FROM tokens WHERE user_id = ?", [body.user_id]);
    const keyValid = await verifyKey(body.user_id, queryResUsers.apikey, body.key);
    if (!keyValid) {
        return await res(401, "Invalid Key");
    }
    if (queryResTokens.uuid !== body.uuid) {
        return await res(400, "UUID not in database");
    }
    const refresh_token = queryResTokens.refresh_token;
    const callback_url = queryResTokens.callback_url;
    const data:any = await oauthFlow(refresh_token, callback_url, true);
    if (data.status !== 200) {
        return await res(data.status, data.message);
    }
    const saveSuccess = await saveToken(body.user_id, data['username'], data['uuid'], data['refresh_token'], callback_url)
    if (!saveSuccess) {
        return await res(500, "Error Saving new Refresh Token");
    }
    return new Response(JSON.stringify({
        message: "Success",
        status: 200,
        data: data
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    })
}

async function res(status:number, message:string) {
    return new Response(JSON.stringify({
        message: message,
        status: status
    }), {
        status: status,
        headers: {
            "Content-Type": "application/json"
        }
    })
}