import dotenv from 'dotenv';
dotenv.config();
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

export default async function oauthFlow(code:string, url:string, refresh:boolean) {
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
        let stepOneRes
        let stepTwoRes
        let stepThreeRes
        let stepFourRes
        let stepFiveRes
        try {
            stepOneRes = await stepOne(code, url, token_type, grant_type);
            if (stepOneRes.status) {
                return stepOneRes;
            }
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
        } catch (err) {
            console.log("Step Four Error")
            throw err;
        }
        try {
            stepFiveRes = await stepFive(stepFourRes.bearerToken);
            if (stepFiveRes.status) {
                return stepFiveRes;
            }
        } catch (err) {
            console.log("Step Five Error")
            throw err;
        }
        return {
            status: 200,
            message: "Success",
            access_token: stepOneRes.access_token,
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
    const req_url = "'https://login.live.com/oauth20_token.srf";
    const body = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": url,
        token_type: code,
        "grant_type": grant_type
    }
    console.log(body);
    const res = await fetch(req_url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    console.log(res);
    const json = await res.json();
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
    const json = await res.json();
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
    const json = await res.json();
    if (res.status !== 200) {
        return {
            status: 400,
            message: "Error on step 3"
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

async function stepFive(bearerToken:string) {
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
            message: "Error on step 5"
        }
    }
    return { uuid: json.id, name: json.name }
}