// apps/api-server/src/transaction.manager.ts
import { DbTransactionManager, DbClient } from '@zoom-net/wallet-engine';
import pool from './db';

/**
 * A concrete implementation of the DbTransactionManager interface for node-postgres (pg).
 * It uses the application's connection pool to acquire a client, begin a transaction,
 * execute the work, and then commit or roll back.
 */
export class PgTransactionManager implements DbTransactionManager {
  async execute<T>(work: (dbClient: DbClient) => Promise<T>): Promise<T> {
    // Get a client from the connection pool
    const client = await pool.connect();
    try {
      // Start a new transaction
      await client.query('BEGIN');

      // Execute the provided work function with the transaction client
      const result = await work(client);

      // If the work is successful, commit the transaction
      await client.query('COMMIT');

      return result;
    } catch (error) {
      // If any error occurs, roll back the transaction
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }
}

// Export a singleton instance of the transaction manager
export const transactionManager = new PgTransactionManager();
