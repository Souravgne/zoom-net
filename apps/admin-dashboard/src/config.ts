// apps/admin-dashboard/src/config.ts
import 'dotenv/config';

const config = {
    databaseUrl: process.env.DATABASE_URL,
    port: process.env.PORT || '3001',
    jwtAdminSecret: process.env.JWT_ADMIN_SECRET,
};

export function validateConfig(): void {
    if (!config.databaseUrl) {
        throw new Error("FATAL: DATABASE_URL environment variable is not set.");
    }
    if (!config.jwtAdminSecret) {
        throw new Error("FATAL: JWT_ADMIN_SECRET environment variable is not set.");
    }
    console.log("✓ Config validation passed.");
}

export default config;
