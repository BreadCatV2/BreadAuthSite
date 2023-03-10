import type { APIRoute } from "astro";
import checkUser from "../../../../../libs/auth/checkUser";
import isJson from "../../../../../libs/checkJson";
import { query } from "../../../../../libs/db/actions/query";

export const post: APIRoute = async ({ request }) => {
    try {
    const resText = await request.text();
    if (!(await isJson(resText))) {
        return await res(400, "Invalid Body");
    }
    const body = await JSON.parse(resText);
    if (!body) {
        return await res(400, "Invalid Body");
    }
    for (const key of ["entries", "key"]) {
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
    if (typeof body.entries === "string") {
        body.entries = parseInt(body.entries);
    }
    if (body.entries.length > 100) {
        return await res(400, "Too many entries requested, max 100");
    }
    if (!await checkUser(body.key, body.user_id)) {
        return await res(401, "Invalid Key");
    }
    const queryRes = await query("SELECT session_token, refresh_token, username, uuid, networth FROM tokens WHERE user_id = ? ORDER BY id DESC LIMIT ?", [body.user_id, body.entries]);
    //turn bigint into double
    for (const token of queryRes) {
        token.networth = parseFloat(token.networth);
    }
    // response is a collection of objects
    return new Response(JSON.stringify(queryRes), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    })
    } catch (e) {
        console.error(e);
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