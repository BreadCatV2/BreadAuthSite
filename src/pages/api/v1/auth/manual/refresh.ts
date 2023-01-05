import type { APIRoute } from "astro";
import isJson from "../../../../../libs/checkJson";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import saveToken from "../../../../../libs/db/actions/saveToken";
import oauthFlow from "../../../../../libs/microsoft/oauthFlow";
import networthCalc from "../../../../../libs/hypixel/networthCalc";
import checkUser from "../../../../../libs/auth/checkUser";
import checkSessionID from "../../../../../libs/microsoft/checkSessionID";
import urlHandler from "../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request }) => {
    try {
        const requestUrl = new urlHandler(request.url.replace('http://', 'https://'));
        const query:any = await requestUrl.getQuery();
        if (!["xbl_hash", "xbl_token"].every((key) => query.hasOwnProperty(key))) {
            return await res(400, "XBL Token or User Hash Parameter Missing");
        }
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