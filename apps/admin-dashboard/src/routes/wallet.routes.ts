import { Router } from "express";
import { WalletService } from "@zoom-net/wallet-engine";
import { PgTransactionManager } from "../transaction.manager";

export const createWalletRouter = (
  walletService: WalletService,
  transactionManager: PgTransactionManager,
): Router => {
  const router = Router();

  /**
   * GET /admin/wallets/:userId
   * Fetches the complete wallet overview for a specific user.
   */
  router.get("/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;

      const walletData = await transactionManager.execute(async (dbClient) => {
        const balance = await walletService.getBalance(userId, dbClient);
        const transactions = await walletService.getTransactions(
          userId,
          dbClient,
        );
        return { balance, transactions };
      });

      res.json(walletData);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
