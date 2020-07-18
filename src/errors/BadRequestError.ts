export default class BadRequestError extends Error {
    constructor(...props:any[]) {
        super(...props);
        this.name = 'BadRequestError';
    }
}