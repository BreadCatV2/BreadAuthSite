
export default class urlHandler {
    url:string;
    constructor(url:string) {
        this.url = url;
    }
    async getQuery() {
        try {
            const regex = /^[^?#]+\?([^#]+)/gm;
            const match = regex.exec(this.url);
            if (!match) return {};
            const query = match[1];
            const pairs = query.split('&');
            const result = {};
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split('=');
                if (!pair[0]) continue;
                if (!pair[1]) continue;
                let paring = {
                    [pair[0]]: pair[1]
                }
                Object.assign(result, paring);
            }
            return result;
        } catch (err) {
            return {};
        }
    }
    async getURLNoQuery() {
        return this.url.split('?')[0];
    }
    async getURLRoot() {
        //return the root of the url with the protocol
        return this.url.split('/')[2];
    }
}