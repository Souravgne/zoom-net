import { randomUUID } from "crypto";
import { WalletTransaction, TransactionType } from "./wallet.types";

/**
 * Defines a generic interface for a database client, allowing the repository
 * to be agnostic of the specific PostgreSQL driver implementation (e.g., pg, node-postgres).
 * This is crucial for allowing the service layer to manage transactions.
 */
export interface DbClient {
  query(sql: string, params?: any[]): Promise<{ rows: any[] }>;
}

/**
 * The WalletRepository is responsible for all direct database interactions
 * concerning wallet data. It operates on a given DbClient, which can be
 * a standard client or a client from a transaction pool.
 */
export class WalletRepository {
  /**
   * Fetches all wallet transactions for a specific user, ordered by creation time.
   * @param userId The UUID of the user.
   * @param dbClient The database client to execute the query against.
   * @returns A promise that resolves to an array of WalletTransaction objects.
   */
  async getTransactionsForUser(
    userId: string,
    dbClient: DbClient,
  ): Promise<WalletTransaction[]> {
    const result = await dbClient.query(
      "SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at ASC",
      [userId],
    );
    // It's safer to map the rows to the expected type to avoid leaking extra fields.
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: row.amount,
      referenceId: row.reference_id,
      createdAt: row.created_at,
    }));
  }

  /**
   * Inserts a new transaction into the wallet ledger.
   * A new UUID is generated for the transaction ID.
   * @param userId The user's UUID.
   * @param type The type of transaction.
   * @param amount The monetary amount (must be positive).
   * @param referenceId An optional reference UUID (e.g., for a job).
   * @param dbClient The database client to execute the insert against.
   * @returns A promise that resolves to the newly created WalletTransaction.
   */
  async insertTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    referenceId: string | null,
    dbClient: DbClient,
  ): Promise<WalletTransaction> {
    const newId = randomUUID();
    const result = await dbClient.query(
      "INSERT INTO wallet_transactions (id, user_id, type, amount, reference_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [newId, userId, type, amount, referenceId],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: row.amount,
      referenceId: row.reference_id,
      createdAt: row.created_at,
    };
  }
}
