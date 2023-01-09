import type { APIRoute } from "astro";
import axios from "axios";
import urlHandler from "../../../../../../libs/urlHandler";

export const get: APIRoute = async ({ request }) => {
    try {
        const requestUrl = new urlHandler(request.url.replace('http://', 'https://'));
        const query:any = await requestUrl.getQuery();
        if (!["session_token", "username"].every((key) => query.hasOwnProperty(key))) {
            return await res(400, "Session Token or Username Parameter Missing");
        }
        const regex = /^[a-zA-Z0-9_]{3,16}$/;
        if (!regex.test(query.username)) {
            return await res(400, "Username must be between 3 and 16 characters and can only contain letters, numbers and underscores");
        }
        try {
            const response = await axios.put(`https://api.minecraftservices.com/minecraft/profile/name/${query.username}`, {}, {
                headers: {
                    "Authorization": `Bearer ${query.session_token}`,
                    "Content-Type": "application/json"
                }
            });
            return new Response(JSON.stringify({
                status: 200,
                message: "Username changed successfully"
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            })
        } catch (err:any) {
            let message = err.response.data.errorMessage;
            switch (err.response.status) {
                case 400:
                    message = 'Name is invalid, longer than 16 characters or contains characters other than (a-zA-Z0-9_)';
                    break;
                case 403:
                    message = 'Name is unavailable (Either taken or has not become available)';
                    break;
                case 401:
                    message = 'Unauthorized (Bearer token expired or is not correct)';
                    break;
                case 429:
                    message = 'Too many requests sent';
                    break;
                case 500:
                    message = 'Timed out (API lagged out and could not respond)';
                    break;
                default:
                    break;
            }
            return new Response(JSON.stringify({
                status: err.response.status,
                message: message
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