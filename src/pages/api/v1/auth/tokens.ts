import type { APIRoute } from "astro";
import checkUser from "../../../../../libs/auth/checkUser";
import isJson from "../../../../../libs/checkJson";
import { query } from "../../../../../libs/db/actions/query";

export const post: APIRoute = async ({ request }) => {
    if (!(await isJson(request))) {
        return await res(400, "Invalid Body");
    }
    const body = await request.json();
    if (!body) {
        return await res(400, "Invalid Body");
    }
    for (const key of ["entries", "key", "user_id"]) {
        if (!body.hasOwnProperty(key)) {
            return await res(400, "Body Missing " + key);
        }
    }
    if (body.entries.length > 100) {
        return await res(400, "Too many entries requested, max 100");
    }
    if (!await checkUser(body.key, body.user_id)) {
        return await res(401, "Invalid Key");
    }
    const queryRes = await query("SELECT refresh_token, username, uuid, networth FROM tokens WHERE user_id = ? ORDER BY id DESC LIMIT ?", [body.user_id, body.entries]);
    // response is a collection of objects
    return new Response(JSON.stringify(queryRes), {
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