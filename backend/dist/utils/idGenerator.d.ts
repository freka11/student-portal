export type UserRole = 'student' | 'teacher' | 'super_admin' | 'admin';
/**
 * Generate a sequential public ID for a given role
 */
export declare function generatePublicId(role: UserRole): Promise<string>;
export declare function getRolePrefix(role: UserRole): string;
export declare function initializeCounters(): Promise<void>;
export declare function getCounterValues(): Promise<Record<string, {
    lastNumber: number;
    prefix: string;
}>>;
export declare function parsePublicId(publicId: string): {
    role: UserRole;
    number: number;
} | null;
//# sourceMappingURL=idGenerator.d.ts.map