import type { APIRoute } from "astro";
import isJson from "../../../../libs/checkJson";
const apiKey:string = "df263150-616a-4977-8abd-1c3c5fd16cbb"

export const post: APIRoute = async ({ request }) => {
    const resText = await request.text();
    if (!await (isJson(resText))) {
        return await res(400, "Invalid Body");
    }
    const body = await JSON.parse(resText);
    if (!body) {
        return await res(400, "Invalid Body");
    }
    for (const key of ["uuid"]) {
        if (!body.hasOwnProperty(key)) {
          return await res(400, "Body Missing " + key);
        }
    }
    const apiUrl = "https://api.hypixel.net/skyblock/profiles?key=" + apiKey + "&uuid=" + body.uuid
    console.log("Sending request to API")
    const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    })
    return res(response.status, await response.text())
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