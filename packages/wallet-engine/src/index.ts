import { WalletService, DbTransactionManager } from "./wallet.service";
import { WalletRepository, DbClient } from "./wallet.repository";
import {
  InsufficientBalanceError,
  WalletBalanceView,
  WalletTransaction,
  TransactionType,
} from "./wallet.types";

// --- Main Service ---
export { WalletService } from "./wallet.service";

// --- Factory Function ---

/**
 * Creates and configures an instance of the WalletService.
 * This is the recommended way to get a WalletService instance, as it hides
 * the internal construction and repository details.
 * @param dbManager A database transaction manager that conforms to the DbTransactionManager interface.
 * @returns A new instance of WalletService.
 */
export function createWalletService(
  dbManager: DbTransactionManager,
): WalletService {
  const repository = new WalletRepository();
  return new WalletService(repository, dbManager);
}

// --- Interfaces for Consumers ---

/**
 * The DbTransactionManager interface must be implemented by the consumer of this package
 * to provide a way for the WalletService to execute operations within a database transaction.
 */
export type { DbTransactionManager } from "./wallet.service";

/**
 * The DbClient interface defines the methods the repository expects to find on a
 * database client. The consumer's DbTransactionManager should provide a client
 * that adheres to this interface.
 */
export type { DbClient } from "./wallet.repository";

// --- Types and Errors ---

/**
 * Publicly exposed types and custom errors for type-safe interaction with the service.
 */
export {
  InsufficientBalanceError,
  WalletBalanceView,
  WalletTransaction,
  TransactionType,
};
