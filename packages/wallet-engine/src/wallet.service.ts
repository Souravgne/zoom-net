import { WalletRepository, DbClient } from "./wallet.repository";
import { InsufficientBalanceError, WalletBalanceView } from "./wallet.types";

/**
 * Defines a generic interface for a database transaction manager.
 * The API server will provide a concrete implementation of this, allowing
 * the wallet service to remain ignorant of the underlying DB driver details.
 */
export interface DbTransactionManager {
  execute<T>(work: (dbClient: DbClient) => Promise<T>): Promise<T>;
}

/**
 * WalletService contains all the business logic for wallet operations.
 * It enforces the rules of the ledger system, such as preventing negative balances
 * and ensuring all monetary operations are atomic.
 */
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly dbManager: DbTransactionManager,
  ) {}

  /**
   * Calculates the current, pending, and available balance for a user
   * by aggregating their transaction history. This is always done within
   * a database transaction to ensure a consistent view of the data.
   *
   * Balance formula:
   * - Total Balance = sum(credits) - sum(debits)
   * - Pending Balance = sum(holds) - sum(releases)
   * - Available Balance = Total Balance - Pending Balance
   *
   * @param userId The UUID of the user.
   * @param dbClient The active database client (from the transaction manager).
   * @returns A promise resolving to a WalletBalanceView object.
   */
  async getBalance(
    userId: string,
    dbClient: DbClient,
  ): Promise<WalletBalanceView> {
    const transactions = await this.walletRepository.getTransactionsForUser(
      userId,
      dbClient,
    );

    let credits = 0;
    let debits = 0;
    let holds = 0;
    let releases = 0;

    for (const tx of transactions) {
      switch (tx.type) {
        case "credit":
          credits += tx.amount;
          break;
        case "debit":
          debits += tx.amount;
          break;
        case "hold":
          holds += tx.amount;
          break;
        case "release":
          releases += tx.amount;
          break;
      }
    }

    const totalBalance = credits - debits;
    const pending = holds - releases;
    const available = totalBalance - pending;

    return {
      balance: totalBalance,
      pending: pending,
      available: available,
    };
  }

  /**
   * Places a hold on a user's funds for an estimated job cost.
   * This operation is transactional and will fail if the user's available
   * balance is less than the amount to be held.
   *
   * @param userId The UUID of the user.
   * @param amount The amount to hold (must be positive).
   * @param referenceId The UUID of the job this hold is for.
   * @returns A promise that resolves when the hold is successfully placed.
   * @throws {InsufficientBalanceError} if funds are not sufficient.
   * @throws {Error} if the amount is not positive.
   */
  async placeHold(
    userId: string,
    amount: number,
    referenceId: string,
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error("Hold amount must be positive.");
    }
    await this.dbManager.execute(async (dbClient) => {
      const balance = await this.getBalance(userId, dbClient);
      if (balance.available < amount) {
        throw new InsufficientBalanceError(
          "Insufficient available balance to place hold.",
        );
      }
      await this.walletRepository.insertTransaction(
        userId,
        "hold",
        amount,
        referenceId,
        dbClient,
      );
    });
  }

  /**
   * Settles a job by releasing the original hold and debiting the final actual cost.
   * This operation is transactional.
   *
   * @param userId The UUID of the user.
   * @param referenceId The UUID of the job being settled.
   * @param heldAmount The original amount that was held for the job.
   * @param finalAmount The final cost to be debited.
   * @returns A promise that resolves when the settlement is complete.
   */
  async settleJob(
    userId: string,
    referenceId: string,
    heldAmount: number,
    finalAmount: number,
  ): Promise<void> {
    if (finalAmount < 0) {
      throw new Error("Final amount cannot be negative.");
    }
    if (heldAmount <= 0) {
      throw new Error("Held amount must be positive.");
    }

    await this.dbManager.execute(async (dbClient) => {
      // 1. Release the original hold. The referenceId links this release back to the job.
      await this.walletRepository.insertTransaction(
        userId,
        "release",
        heldAmount,
        referenceId,
        dbClient,
      );

      // 2. Debit the final, actual cost. Can be 0 if the job failed instantly.
      if (finalAmount > 0) {
        await this.walletRepository.insertTransaction(
          userId,
          "debit",
          finalAmount,
          referenceId,
          dbClient,
        );
      }
      // The difference between heldAmount and finalAmount is automatically "refunded"
      // to the available balance by the virtue of the ledger math.
    });
  }

  /**
   * Credits a user's wallet with a certain amount.
   *
   * @param userId The UUID of the user.
   * @param amount The amount to credit (must be positive).
   * @returns A promise that resolves when the credit is successfully applied.
   */
  async credit(userId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive.");
    }
    await this.dbManager.execute(async (dbClient) => {
      // The null referenceId indicates this is not tied to a specific job, but a direct credit.
      await this.walletRepository.insertTransaction(
        userId,
        "credit",
        amount,
        null,
        dbClient,
      );
    });
  }
}
