import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const adminKey:string = process.env.ADMIN_KEY || '';
export default async function verifyKey(user_id: string, salt: string, key: string) {
    if (adminKey !== '' && key === adminKey) {
        return true;
    }
    const apiKey:string = crypto.createHash('sha256').update(user_id+salt).digest('hex');
    if (apiKey !== key) {
        return false;
    }
    return true;
}