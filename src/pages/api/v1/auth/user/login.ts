import type { APIRoute } from "astro";
import createSession from "../../../../../../libs/auth/createSession";
import getUserInfo from "../../../../../../libs/auth/getUserInfo";
import authenticate from "../../../../../../libs/discord/auth/authenticate";
import urlHandler from "../../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request, redirect }) => {
    const requestUrl = new urlHandler(request.url.replace('http://', 'https://'));
    const query:any = await requestUrl.getQuery();
    if (!["code"].every((key) => query.hasOwnProperty(key))) {
        return redirect('https://discord.com/api/oauth2/authorize?client_id=1047908328887550002&redirect_uri=https%3A%2F%2Fbreadcat.cc%2Fapi%2Fv1%2Fauth%2Fuser%2Flogin&response_type=code&scope=identify')
    }
    const code = query["code"];
    const data:any = await authenticate(code, request.url, false);
    if (data.status !== 200) {
        return redirect('/breadauth?state=error&message=Failed to authenticate');
    }
    const { discord_id } = await getUserInfo(data.access_token);
    const session_token = await createSession(data.refresh_token, data.access_token, data.expires_in, discord_id);
    if (!session_token) {
        return redirect('/breadauth?state=error&message=Failed to create session');
    }
    return redirect('/breadauth?state=success&token=' + session_token);
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