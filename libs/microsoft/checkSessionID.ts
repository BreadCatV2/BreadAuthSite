export default async function checkSessionID(session_token:string) {
    const url = "https://api.minecraftservices.com/minecraft/profile";
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${session_token}`
        }
    });
    if (res.status !== 200) {
        return false;
    }
    return true;
}