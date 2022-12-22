import dotenv from 'dotenv';
import urlHandler from '../urlHandler';
dotenv.config();
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

export default async function oauthFlow(code:string, url:string, refresh:boolean) {
    let urlParser = new urlHandler(url);
    let callback_url = 'https://' + await urlParser.getURLRoot() + '/api/v1/auth/callback';
    let token_type;
    let grant_type;
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
        let stepOneRes:any
        let stepTwoRes:any
        let stepThreeRes:any
        let stepFourRes:any
        let stepFiveRes:any
        //loop through the steps dynamically
        const stepMap = new Map();
        stepMap.set(stepOne, [code, callback_url, token_type, grant_type]);
        stepMap.set(stepTwo, [stepOneRes.access_token]);
        stepMap.set(stepThree, [stepTwoRes.userToken]);
        stepMap.set(stepFour, [stepThreeRes.xstsToken, stepTwoRes.userHash]);
        stepMap.set(stepFive, [stepFourRes.bearerToken]);
        const stepRes = [stepOneRes, stepTwoRes, stepThreeRes, stepFourRes, stepFiveRes]
        for (let i = 0; i < stepMap.size; i++) {
            try {
                const step = stepMap.get(stepMap.keys().next().value);
                const stepRes = await stepMap.keys().next().value(...step);
                if (stepRes.status) {
                    return stepRes;
                }
            } catch (err) {
                console.log("Error in step " + (i+1))
                console.error(err);
                return {
                    status: 500,
                    message: "Internal Server Error"
                }
            }
        }
        return {
            status: 200,
            message: "Success",
            refresh_token: stepOneRes.refresh_token,
            session_token: stepFourRes.bearerToken,
            uuid: stepFiveRes.uuid,
            username: stepFiveRes.name
        }
    } catch (err) {
        console.error(err);
        return {
            status: 500,
            message: "Internal Server Error"
        }
    }
}

async function stepOne(code:string, url:string, token_type:string, grant_type:string) {
    const req_url = "https://login.live.com/oauth20_token.srf";
    const body = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
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
    return { access_token: json.access_token, refresh_token: json.refresh_token}
}

async function stepTwo(access_token:any) {
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
    const json = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "Error on step 2"
        }
    }
    return { userHash: json['DisplayClaims']['xui'][0]['uhs'], userToken: json.Token}
}

async function stepThree(userToken:any) {
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
    const json = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "Error on step 3"
        }
    }
    return { xstsToken: json.Token }
}

async function stepFour(xstsToken:any, userHash:any) {
    const req_url = "https://api.minecraftservices.com/authentication/login_with_xbox";
    const body = {
        "identityToken": `XBL3.0 x=${userHash};${xstsToken}`,
        ensureLegacyEnabled: true
    }
    const res = await fetch(req_url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });
    const json = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "Error on step 4"
        }
    }
    return { bearerToken: json.access_token }
}

async function stepFive(bearerToken:any) {
    const url = "https://api.minecraftservices.com/minecraft/profile";
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${bearerToken}`
        }
    });
    const json = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "No Minecraft Account Linked"
        }
    }
    return { uuid: json.id, name: json.name }
}