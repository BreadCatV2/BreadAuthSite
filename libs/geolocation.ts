export default async function ipGeolocation(ip:string) {
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=a4dbc087843244669475e172d131bab7&ip=${ip}`;
    const res = await fetch(url);
    if (res.status !== 200) {
        return {"status": 400}
    }
    const body = await res.json();
    return {"status": 200, "city": body.city, "country": body.country_name}
}