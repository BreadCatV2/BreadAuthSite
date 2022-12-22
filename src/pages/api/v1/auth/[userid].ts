import type { APIRoute } from "astro";
import { queryFirstRes } from "../../../../../libs/db/actions/query";
import urlHandler from "../../../../../libs/urlHandler";

import dotenv from 'dotenv';
dotenv.config();
const clientId = process.env.CLIENT_ID;

export const get: APIRoute = async ({ params, request, redirect }) => {
  const user_id = params.userid as string;
  console.log(user_id);
  const requestUrl = new urlHandler(request.url);
  const callback_url = 'https://' + await requestUrl.getURLRoot() + '/api/v1/auth/callback';
  const microsoft_url = `https://login.live.com/oauth20_authorize.srf?response_type=code&client_id=${clientId}&redirect_uri=${callback_url}&scope=XboxLive.signin+offline_access&state=${user_id}`;
  const useridCheck = await queryFirstRes("SELECT * FROM `users` WHERE `user_id` = ?", [user_id]);
  if (!useridCheck) {
    return new Response(JSON.stringify({
      message: "Invalid User ID",
      status: 400
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    })
  }
  return redirect(microsoft_url);
}