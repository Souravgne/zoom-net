import {
  WalletTransaction,
  TransactionType,
  WalletBalanceView,
} from "@shared-types/wallet";

// Re-exporting shared types for consumers of this package
export { WalletTransaction, TransactionType, WalletBalanceView };

/**
 * Custom error thrown when an operation cannot be completed due to insufficient funds.
 */
export class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientBalanceError";
    // Set the prototype explicitly to allow for `instanceof` checks.
    Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
  }
}
