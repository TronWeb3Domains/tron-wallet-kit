import { WALLET_TRANSACTION_STORAGE_VERSION, type WalletStorage, type WalletTransaction, type WalletTransactionStoreOptions } from "./types";

export type StoredWalletTransactionsEnvelope = {
  version: typeof WALLET_TRANSACTION_STORAGE_VERSION;
  transactions: WalletTransaction[];
  updatedAt: number;
};

export class WalletTransactionStore {
  readonly max: number;
  readonly staleSubmittedMs: number;
  private readonly storage: WalletStorage;
  private readonly keyPrefix: string;

  constructor(options: WalletTransactionStoreOptions & { storage: WalletStorage; keyPrefix?: string }) {
    this.storage = options.storage;
    this.keyPrefix = options.keyPrefix ?? "transactions";
    this.max = Math.max(1, Math.trunc(options.max ?? 20));
    this.staleSubmittedMs = Math.max(0, Math.trunc(options.staleSubmittedMs ?? 10 * 60 * 1000));
  }

  async load(account: string, networkId: string): Promise<WalletTransaction[]> {
    const serialized = await this.storage.getItem(this.getKey(account, networkId));
    if (!serialized) return [];
    try {
      const parsed = JSON.parse(serialized) as Partial<StoredWalletTransactionsEnvelope> | WalletTransaction[];
      const transactions = Array.isArray(parsed)
        ? parsed
        : parsed.version === WALLET_TRANSACTION_STORAGE_VERSION && Array.isArray(parsed.transactions)
          ? parsed.transactions
          : [];
      return this.normalize(transactions);
    } catch {
      await this.storage.removeItem(this.getKey(account, networkId));
      return [];
    }
  }

  async save(account: string, networkId: string, transactions: WalletTransaction[]): Promise<void> {
    const normalized = this.normalize(transactions);
    const envelope: StoredWalletTransactionsEnvelope = {
      version: WALLET_TRANSACTION_STORAGE_VERSION,
      transactions: normalized,
      updatedAt: Date.now()
    };
    await this.storage.setItem(this.getKey(account, networkId), JSON.stringify(envelope));
  }

  async clear(account: string, networkId: string): Promise<void> {
    await this.storage.removeItem(this.getKey(account, networkId));
  }

  normalize(transactions: WalletTransaction[]): WalletTransaction[] {
    const now = Date.now();
    return transactions
      .filter(isValidWalletTransaction)
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, this.max)
      .map((transaction) =>
        transaction.status === "submitted" && this.staleSubmittedMs > 0 && now - transaction.submittedAt > this.staleSubmittedMs
          ? { ...transaction, status: "unknown", updatedAt: now }
          : transaction
      );
  }

  getKey(account: string, networkId: string): string {
    return `${this.keyPrefix}:${networkId}:${account}`;
  }
}

function isValidWalletTransaction(value: unknown): value is WalletTransaction {
  if (!value || typeof value !== "object") return false;
  const transaction = value as Partial<WalletTransaction>;
  return (
    typeof transaction.id === "string" &&
    typeof transaction.hash === "string" &&
    typeof transaction.adapterId === "string" &&
    typeof transaction.account === "string" &&
    typeof transaction.submittedAt === "number" &&
    typeof transaction.updatedAt === "number" &&
    Boolean(transaction.network)
  );
}
