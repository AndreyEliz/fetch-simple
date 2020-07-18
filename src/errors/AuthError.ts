export default class AuthError extends Error {
  constructor(...props: any[]) {
    super(...props);
    this.name = 'AuthError';
  }
}
