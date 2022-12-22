import crypto from 'crypto';
export default async function verifyKey(user_id: string, salt: string, key: string) {
    const apiKey:string = crypto.createHash('sha256').update(user_id+salt).digest('hex');
    if (apiKey !== key) {
        return false;
    }
    return true;
}

    