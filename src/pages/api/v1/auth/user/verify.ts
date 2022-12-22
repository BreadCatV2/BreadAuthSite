import type { APIRoute } from "astro";
import isJson from "../../../../../../libs/checkJson";
import { queryFirstRes } from "../../../../../../libs/db/actions/query";

export const post: APIRoute = async ({ request, redirect }) => {
    const resText = await request.text();
    if (!await (isJson(resText))) {
        return await res(400, "Invalid Body");
    }
    const body = await JSON.parse(resText);
    if (!body) {
        return await res(400, "Invalid Body");
    }
    for (const key of ["session_token"]) {
        if (!body.hasOwnProperty(key)) {
            return await res(400, "Body Missing " + key);
        }
    }
    const query_res = await queryFirstRes("SELECT * FROM tokens WHERE session_token = ?", [body.session_token]);
    if (!query_res) {
        return await res(400, "Invalid Session Token");
    }
    else {
        return await res(200, "Valid Session Token");
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