// apps/api-server/src/db.ts
import { Pool } from 'pg';

// This creates a new connection pool.
// In a real application, the connection details (user, host, database, password, port)
// would come from environment variables, not be hardcoded.
const pool = new Pool({
  // For now, we'll rely on environment variables like PGUSER, PGHOST, PGDATABASE, PGPASSWORD
  // This is a common practice for the `pg` library.
});

// Export the pool so it can be used by other parts of the application,
// such as the transaction manager.
export default pool;
