import dotenv from 'dotenv';
dotenv.config();
const client_id = process.env.DISCORD_CLIENT_ID;
const client_secret = process.env.DISCORD_CLIENT_SECRET;

export default async function authenticate(code:string, url:string, refresh:boolean) {
    let token_type = "code";
    let grant_type = "authorization_code";
    if (refresh) {
        token_type = "refresh_token";
        grant_type = "refresh_token";
    }
    const req_url = "https://discord.com/api/v10";
    const body = {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": url,
        [token_type]: code,
        "grant_type": grant_type
    }
    const realBody = Object.keys(body).map(key => `${key}=${body[key]}`).join("&");
    const res = await fetch(req_url, {
        method: "POST",
        body: realBody,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    const json = await res.json();
    if (json.error) {
        return {
            status: 400,
            message: json.error_description
        }
    }
    return { refresh_token: json.refresh_token, access_token: json.access_token, expires_in: json.expires_in }
}
