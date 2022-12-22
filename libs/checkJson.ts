export default async function isJson(body:string){
    try {
        JSON.parse(body);
    } catch (e) {
        return false;
    }
    return true;
}