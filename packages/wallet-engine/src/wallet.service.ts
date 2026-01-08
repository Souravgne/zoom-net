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

  private async _execute<T>(
    work: (dbClient: DbClient) => Promise<T>,
    dbClient?: DbClient,
  ): Promise<T> {
    if (dbClient) {
      return work(dbClient);
    }
    return this.dbManager.execute(work);
  }

  async getBalance(
    userId: string,
    dbClient?: DbClient,
  ): Promise<WalletBalanceView> {
    return this._execute(async (client) => {
      const transactions = await this.walletRepository.getTransactionsForUser(
        userId,
        client,
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
    }, dbClient);
  }

  async placeHold(
    userId: string,
    amount: number,
    referenceId: string,
    dbClient?: DbClient,
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error("Hold amount must be positive.");
    }
    await this._execute(async (client) => {
      const balance = await this.getBalance(userId, client);
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
        client,
      );
    }, dbClient);
  }

  async settleJob(
    userId: string,
    referenceId: string,
    heldAmount: number,
    finalAmount: number,
    dbClient?: DbClient,
  ): Promise<void> {
    if (finalAmount < 0) {
      throw new Error("Final amount cannot be negative.");
    }
    if (heldAmount <= 0) {
      throw new Error("Held amount must be positive.");
    }

    await this._execute(async (client) => {
      await this.walletRepository.insertTransaction(
        userId,
        "release",
        heldAmount,
        referenceId,
        client,
      );

      if (finalAmount > 0) {
        await this.walletRepository.insertTransaction(
          userId,
          "debit",
          finalAmount,
          referenceId,
          client,
        );
      }
    }, dbClient);
  }

  async credit(
    userId: string,
    amount: number,
    dbClient?: DbClient,
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive.");
    }
    await this._execute(async (client) => {
      await this.walletRepository.insertTransaction(
        userId,
        "credit",
        amount,
        null,
        client,
      );
    }, dbClient);
  }

  async getTransactions(
    userId: string,
    dbClient?: DbClient,
  ): Promise<import("./wallet.types").WalletTransaction[]> {
    return this._execute(async (client) => {
      return this.walletRepository.getTransactionsForUser(userId, client);
    }, dbClient);
  }
}
