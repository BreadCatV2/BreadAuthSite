export default async function getUserInfo(access_token:string) {
    const url = 'https://discord.com/api/v10/users/@me';
    const body = {
        "Authorization": access_token
    }
    const res = await fetch(url, {
        method: "GET",
        headers: body
    });
    const json = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "Error getting user info"
        }
    }
    return { 
        status: 200,
        username: json.username, 
        discriminator: json.discriminator, 
        discord_id: json.id,
        avatar_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.png`
    }
}