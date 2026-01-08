// apps/api-server/src/db.ts
import { Pool } from 'pg';
import config from './config';

// This creates a new connection pool using the DATABASE_URL.
const pool = new Pool({
  connectionString: config.databaseUrl,
});

// Export the pool so it can be used by other parts of the application,
// such as the transaction manager.
export default pool;
