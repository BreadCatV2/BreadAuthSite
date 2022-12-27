import type { APIRoute } from "astro";
import isJson from "../../../../../libs/checkJson";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import saveToken from "../../../../../libs/db/actions/saveToken";
import oauthFlow from "../../../../../libs/microsoft/oauthFlow";
import networthCalc from "../../../../../libs/hypixel/networthCalc";
import checkUser from "../../../../../libs/auth/checkUser";
import checkSessionID from "../../../../../libs/microsoft/checkSessionID";

export const post: APIRoute = async ({ request }) => {
    try {
    const resText = await request.text();
    if (!await (isJson(resText))) {
        return await res(400, "Invalid Body");
    }
    const body = await JSON.parse(resText);
    if (!body) {
        return await res(400, "Invalid Body");
    }
    for (const key of ["uuid", "key"]) {
        if (!body.hasOwnProperty(key)) {
            return await res(400, "Body Missing " + key);
        }
    }
    if (!body.hasOwnProperty("user_id") && body.key.length === 128) {
        body.user_id = body.key.substring(0, 64);
        body.key = body.key.substring(64);
    } else if (!body.hasOwnProperty("user_id")) {
        return await res(400, "Body Missing user_id");
    }
    if (!await checkUser(body.key, body.user_id)) {
        return await res(401, "Invalid Key");
    }
    const queryResTokens = await queryFirstRes("SELECT refresh_token, session_token, xbl_token, xbl_hash, callback_url, uuid FROM tokens WHERE user_id = ? AND uuid = ?", [body.user_id, body.uuid]);
    if (queryResTokens.uuid !== body.uuid) {
        return await res(400, "UUID not in database");
    }
    const refresh_token = queryResTokens.refresh_token;
    const callback_url = queryResTokens.callback_url;
    let data:any;
    if (await checkSessionID(queryResTokens.session_token)) {
        data = {
            status: 200,
            message: "Old Token Valid",
            refresh_token: queryResTokens.refresh_token,
            session_token: queryResTokens.session_token,
            uuid: queryResTokens.uuid,
            username: queryResTokens.username
        }
    } else {
        if (queryResTokens.xbl_token != 'undefined' && queryResTokens.xbl_hash != 'undefined') {
            data = await oauthFlow(refresh_token, callback_url, true, queryResTokens.xbl_token, queryResTokens.xbl_hash);
        } else {
            data = await oauthFlow(refresh_token, callback_url, true);
        }
    }
    if (data.status !== 200) {
        return await res(data.status, data.message);
    }
    const unsoulboundNw = Math.round((await networthCalc(body.uuid) as any)["unsoulboundNw"]) || 0;
    data['networth'] = unsoulboundNw;
    if (!data["xbl_token"]) {
        data["xbl_token"] = "undefined";
    }
    if (!data["xbl_hash"]) {
        data["xbl_hash"] = "undefined";
    }
    const saveSuccess = await saveToken(body['user_id'], data['username'], data['uuid'], data['refresh_token'], data["session_token"], data["xbl_token"], data["xbl_hash"], callback_url, data['networth'])
    if (!saveSuccess) {
        return await res(500, "Error Saving new Refresh Token");
    }
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    })
} catch (err) {
    console.error(err)
}
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