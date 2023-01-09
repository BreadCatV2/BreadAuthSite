import type { APIRoute } from "astro";
import axios from "axios";
import urlHandler from "../../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request }) => {
    try {
        const requestUrl = new urlHandler(request.url.replace('http://', 'https://'));
        const query:any = await requestUrl.getQuery();
        if (!["session_token", "skin_url"].every((key) => query.hasOwnProperty(key))) {
            return await res(400, "Session Token or Skin URL Parameter Missing");
        }
        let modelType = "classic";
        //if param slim is true, then the model type is slim
        if (query.slim === "true") {
            modelType = "slim";
        }
        const regex = /^[a-zA-Z0-9_]{3,16}$/;
        if (!regex.test(query.username)) {
            return await res(400, "Username must be between 3 and 16 characters and can only contain letters, numbers and underscores");
        }
        try {
            const response = await axios.post(`https://api.minecraftservices.com/minecraft/profile/skins`, {
                "url": query.skin_url,
                "variant": modelType
            }, {
                headers: {
                    "Authorization": `Bearer ${query.session_token}`,
                    "Content-Type": "application/json"
                }
            });
            return new Response(JSON.stringify({
                status: 200,
                message: "Skin changed successfully"
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            })
        } catch (err:any) {
            return new Response(JSON.stringify({
                status: err.response.status,
                message: err.response.data.errorMessage
            }), {
                status: err.response.status,
                headers: {
                    "Content-Type": "application/json"
                }
            })
        }
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