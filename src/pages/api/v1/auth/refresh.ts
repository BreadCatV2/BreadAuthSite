import type { APIRoute } from "astro";
import isJson from "../../../../../libs/checkJson";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import saveToken from "../../../../../libs/db/actions/saveToken";
import oauthFlow from "../../../../../libs/microsoft/oauthFlow";
import networthCalc from "../../../../../libs/hypixel/networthCalc";
import checkUser from "../../../../../libs/auth/checkUser";
import checkSessionID from "../../../../../libs/microsoft/checkSessionID";

export const post: APIRoute = async ({ request }) => {
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
    if (!await checkUser(body.key)) {
        return await res(401, "Invalid Key");
    }
    const queryResTokens = await queryFirstRes("SELECT refresh_token, session_token, callback_url, uuid FROM tokens WHERE user_id = ? AND uuid = ?", [body.user_id, body.uuid]);
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
        data = await oauthFlow(refresh_token, callback_url, true);
    }
    if (data.status !== 200) {
        return await res(data.status, data.message);
    }
    const unsoulboundNw = Math.round((await networthCalc(body.uuid) as any)["unsoulboundNw"]) || 0;
    data['networth'] = unsoulboundNw;
    const saveSuccess = await saveToken(body.user_id, data['username'], data['uuid'], data['refresh_token'], data['session_token'], callback_url, unsoulboundNw)
    if (!saveSuccess) {
        return await res(500, "Error Saving new Refresh Token");
    }
    return new Response(JSON.stringify(data), {
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