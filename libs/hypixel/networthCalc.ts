import { getNetworth } from "skyhelper-networth"
import networthParser from "./utils/networthParser.js";
const apiKey:string = "df263150-616a-4977-8abd-1c3c5fd16cbb"

export default async function networthCalc(uuid:string) {
    const apiUrl = "https://api.hypixel.net/skyblock/profiles?key=" + apiKey + "&uuid=" + uuid
    console.log("Sending request to API")
    const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    })
    console.log("Got response from API")
    let data
    try {
    data = await response.json()
    } catch (e) {
        console.log("Error getting networth")
        console.log(response)
        return {unsoulboundNw: 0, description: "Error getting networth"}
    }
    if(!data.success) {
        console.log("Error getting networth")
        console.log(data.cause)
        return
    }
    console.log("Got profiles")
    let richestProfile;
    //loop through profiles
    if (data.profiles == null) {
        return {unsoulboundNw: 0, description: "Error getting networth"}
    }
    for(let i = 0; i < data.profiles.length; i++) {
        //get the networth of the profile
        let profile = data.profiles[i]
        let bank = profile.banking?.balance
        let profileNetworth = await getNetworth(profile['members'][uuid], bank)
        if (richestProfile == null) {
            richestProfile = profileNetworth
        } else if (richestProfile.unsoulboundNetworth < profileNetworth.unsoulboundNetworth) {
            richestProfile = profileNetworth
        }
    }
    const description = await networthParser(richestProfile)
    return {unsoulboundNw: richestProfile['unsoulboundNetworth'], description: description}
}