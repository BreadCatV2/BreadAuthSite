export default async function isJson(request: Request){
    try {
        request.json();
    } catch (e) {
        return false;
    }
    return true;
}