/**
 * TACTICAL: Type shim for securityService.js until Wave 3 TypeScript migration.
 */

declare class SecurityService {
    [key: string]: unknown;
}

declare const securityService: SecurityService;
export default securityService;
