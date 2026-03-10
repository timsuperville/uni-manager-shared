/**
 * TACTICAL: Type shim for authService.js until Wave 3 TypeScript migration.
 */

declare class AuthService {
    [key: string]: unknown;
}

declare const authService: AuthService;
export { AuthService, authService };
export default authService;
