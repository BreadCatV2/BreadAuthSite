import type { APIRoute } from "astro";
import oauthFlow from "../../../../../../libs/microsoft/oauthFlow";
import urlHandler from "../../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request }) => {
    try {
        const requestUrl = new urlHandler(request.url.replace('http://', 'https://'));
        const query:any = await requestUrl.getQuery();
        if (!["xbl_hash", "xbl_token"].every((key) => query.hasOwnProperty(key))) {
            return await res(400, "XBL Token or User Hash Parameter Missing");
        }
        let callback_url = "https://breadcat.cc/api/v1/auth/callback"
        if (!query.hasOwnProperty("url")) {
            callback_url = query.url;
        }
        const data = await oauthFlow(null, callback_url, true, query.xbl_token, query.xbl_hash);
        if (data.status !== 200) {
            return await res(data.status, data.message);
        }
        delete data.refresh_token;
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        })
    } catch (err) {
        console.log(err);
        return await res(500, "Internal Server Error");
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