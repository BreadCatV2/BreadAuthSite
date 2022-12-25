export default async function checkSessionID(session_token:string) {
    const url = "https://api.minecraftservices.com/minecraft/profile";
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${session_token}`
        }
    });
    if (res.status !== 200) {
        return {"status": 400}
    }
    const body = await res.json();
    if (!body.hasOwnProperty("id")) {
        return {"status": 400}
    }
    const uuid = body.id;
    const name = body.name;
    return {"status": 200, "username": name, "uuid": uuid}
}