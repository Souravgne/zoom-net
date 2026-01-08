export type TransactionType = 'credit' | 'debit' | 'hold' | 'release';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  referenceId: string;
  createdAt: Date;
}

export interface WalletBalanceView {
  balance: number;
  pending: number;
  available: number;
}
