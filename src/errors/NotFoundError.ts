export default class NotFoundError extends Error {
    constructor(...props:any[]) {
        super(...props);
        this.name = 'NotFoundError';
    }
}