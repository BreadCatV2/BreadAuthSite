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
    if (typeof body.entries === "string") {
        body.entries = parseInt(body.entries);
    }
    const queryRes = await query("SELECT refresh_token, username, uuid, networth FROM tokens WHERE user_id = ? ORDER BY id DESC LIMIT ?", [body.user_id, body.entries]);
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