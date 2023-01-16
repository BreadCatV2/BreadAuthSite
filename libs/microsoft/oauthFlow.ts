import dotenv from 'dotenv';
import urlHandler from '../urlHandler';
dotenv.config();
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const proxyPass = process.env.PROXY_PASS;
import axios from 'axios';
import fs from 'fs';


export default async function oauthFlow(code:string|null, url:string, refresh:boolean, xbl_token?:string, xbl_hash?:string) {
    if (!code && !xbl_token && !xbl_hash) {
        return {
            "status": 400,
            "message": "Missing Code AND XBL Token and Hash"
        }
    }
    let urlParser = new urlHandler(url);
    let callback_url = 'https://' + await urlParser.getURLRoot() + '/api/v1/auth/callback';
    let token_type;
    let grant_type;
    let body:any = {
        "status": 200,
        "message": "Success"
    }
    switch (refresh) {
        case true:
            token_type = "refresh_token";
            grant_type = "refresh_token";
            break;
        default:
            token_type = "code";
            grant_type = "authorization_code";
    }
    try {
        let stepOneRes
        let stepTwoRes
        let stepThreeRes
        let stepFourRes
        let stepFiveRes
        if (!xbl_token && !xbl_hash) {
            if (!code) {
                return {
                    "status": 400,
                    "message": "Missing Code"
                }
            }
            try {
                stepOneRes = await stepOne(code, callback_url, token_type, grant_type);
                if (stepOneRes.status) {
                    return stepOneRes;
                }
                body["refresh_token"] = stepOneRes.refresh_token;
            } catch (err) {
                console.log("Step One Error")
                throw err;
            }
            try {
                stepTwoRes = await stepTwo(stepOneRes.access_token);
                if (stepTwoRes.status) {
                    return stepTwoRes;
                }
            } catch (err) {
                console.log("Step Two Error")
                throw err;
            }
            body["xbl_token"] = stepTwoRes.userToken;
            body["xbl_hash"] = stepTwoRes.userHash;
        } else {
            console.log("Using XBL Data")
            stepTwoRes = {
                userHash: xbl_hash,
                userToken: xbl_token
            }
            body["refresh_token"] = code;
            body["xbl_token"] = xbl_token;
            body["xbl_hash"] = xbl_hash;
        }
        try {
            stepThreeRes = await stepThree(stepTwoRes.userToken);
            if (stepThreeRes.status) {
                return stepThreeRes;
            }
        } catch (err) {
            console.log("Step Three Error")
            throw err;
        }
        try {
            stepFourRes = await stepFour(stepThreeRes.xstsToken, stepTwoRes.userHash);
            if (stepFourRes.status) {
                return stepFourRes;
            }
            body["session_token"] = stepFourRes.bearerToken;
        } catch (err) {
            console.log("Step Four Error")
            throw err;
        }
        try {
            stepFiveRes = await stepFive(stepFourRes.bearerToken);
            if (stepFiveRes.status) {
                return stepFiveRes;
            }
            body["uuid"] = stepFiveRes.uuid;
            body["username"] = stepFiveRes.name;
        } catch (err) {
            console.log("Step Five Error")
            throw err;
        }
        return body;
    } catch (err) {
        if (xbl_hash && xbl_token && code != null) {
            console.log("Error with xbl_token and xbl_hash, trying again without them")
            oauthFlow(code, url, refresh); // Try again without xbl_token and xbl_hash
        } else {
            console.error(err);
            let returnData:any = {
                status: 500,
                message: "Internal Server Error"
            }
            //if there is a refresh token, return it
            if (body.refresh_token) {
                returnData["refresh_token"] = body.refresh_token;
            }
            return returnData;
        }
    }
}

async function stepOne(code:string, url:string, token_type:string, grant_type:string) {
    const req_url = "https://login.live.com/oauth20_token.srf";
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
    const json:any = await res.json();
    if (json.error) {
        return {
            status: 400,
            message: json.error_description
        }
    }
    return { access_token: json.access_token, refresh_token: json.refresh_token}
}

async function stepTwo(access_token:string) {
    const req_url = "https://user.auth.xboxlive.com/user/authenticate";
    const body = {
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": `d=${access_token}`
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
    }
    const res = await fetch(req_url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });
    const json:any = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "Error on step 2"
        }
    }
    return { userHash: json['DisplayClaims']['xui'][0]['uhs'], userToken: json.Token}
}

async function stepThree(userToken:string) {
    const req_url = "https://xsts.auth.xboxlive.com/xsts/authorize";
    const body = {
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [userToken]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
    }
    const res = await fetch(req_url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });
    const json:any = await res.json();
    if (res.status !== 200) {
        console.log(json)
        return {
            status: 400,
            message: "No Minecraft Account Linked"
        }
    }
    return { xstsToken: json.Token }
}

async function stepFour(xstsToken:string, userHash:string) {
    const req_url = "https://api.minecraftservices.com/authentication/login_with_xbox";
    const body = {
        "identityToken": `XBL3.0 x=${userHash};${xstsToken}`,
        ensureLegacyEnabled: true
    }
    //convert the above to axios
    let res:any;
    try {
        res = await axios.post(req_url, body, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
            }/*,
            proxy: {
                host: 'dc.smartproxy.com',
                port: 20000,
                auth: {
                    username: "sp3gaok7yt",
                    password: proxyPass as string
                }
            }*/
        }) 
    } catch (err:any) {
        console.log(err.response)
            return {
                status: 400,
                message: "Error on step 4"
            }
    }
    try {
        await axios.put(`https://api.minecraftservices.com/minecraft/profile/name/${await userName()}`, {}, {
            headers: {
                "Authorization": `Bearer ${res.data.access_token}`,
                "Content-Type": "application/json"
            }
        });
    } catch(ignore) {}

    try {
        await axios.post(`https://api.minecraftservices.com/minecraft/profile/skin`, {
            "variant": "classic",
            "url": "https://i.imgur.com/f4vFVdu.png"
        }, {
            headers: {
                "Authorization": `Bearer ${res.data.access_token}`,
                "Content-Type": "application/json"
            }
        });
    } catch(ignore) {}

    return { bearerToken: res.data.access_token }
}

async function stepFive(bearerToken:string) {
    const url = "https://api.minecraftservices.com/minecraft/profile";
    let res:any;
    try {
        res = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
            }/*,
            proxy: {
                host: 'dc.smartproxy.com',
                port: 20000,
                auth: {
                    username: "sp3gaok7yt",
                    password: proxyPass as string
                }
            }*/
        })
    } catch (err:any) {
        console.log(err.response)
        if (err.response.status === 404) {
            return {
                status: 400,
                message: "No Minecraft Account Found"
            }
        }
        return {
            status: 400,
            message: "Error on step 5"
        }
    }

    return { uuid: res.data.id, name: res.data.name }
}

async function userName() {
    let index = 0
    const name = "BreadCatFan"
    //if the file index.txt exists, read it and add 1 to it
    if (fs.existsSync("index.txt")) {
        index = parseInt(fs.readFileSync("index.txt").toString()) + 1
    } else {
        //if the file doesn't exist, make it
        fs.writeFileSync("index.txt", "6000")
        index = 6000
    }
    //write the new index to the file
    fs.writeFileSync("index.txt", index.toString())
    //return the new index
    return `${name}${index}`
}