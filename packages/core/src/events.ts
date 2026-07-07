import type { WalletAccount, WalletNetwork, WalletSession, WalletTransaction } from "./types";

export type WalletEventName = keyof WalletEvents;

export interface WalletEvents {
  connecting: { adapterId: string };
  connected: { session: WalletSession };
  disconnected: { adapterId?: string; session?: WalletSession };
  error: { error: unknown; adapterId?: string };
  qr: { uri: string; adapterId: string };
  signing: { kind: "message" | "transaction"; adapterId: string };
  signed: { kind: "message" | "transaction"; adapterId: string; result: unknown };
  rejected: { kind: "connect" | "message" | "transaction"; adapterId?: string; error: unknown };
  accountChanged: { account: WalletAccount; session?: WalletSession };
  networkChanged: { network: WalletNetwork; session?: WalletSession };
  tx_submitted: { transaction: WalletTransaction };
  tx_confirmed: { transaction: WalletTransaction };
  tx_failed: { transaction: WalletTransaction; error?: unknown };
  session_restored: { session: WalletSession };
  session_stale: { session?: WalletSession };
  session_expired: { session?: WalletSession };
}

export type WalletEventListener<T extends WalletEventName> = (payload: WalletEvents[T]) => void;

export class WalletEventEmitter {
  private readonly listeners = new Map<WalletEventName, Set<(payload: unknown) => void>>();

  on<T extends WalletEventName>(event: T, listener: WalletEventListener<T>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener as (payload: unknown) => void);
    this.listeners.set(event, set);
    return () => this.off(event, listener);
  }

  off<T extends WalletEventName>(event: T, listener: WalletEventListener<T>): void {
    this.listeners.get(event)?.delete(listener as (payload: unknown) => void);
  }

  emit<T extends WalletEventName>(event: T, payload: WalletEvents[T]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
