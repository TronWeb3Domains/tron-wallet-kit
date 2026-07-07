import type { WalletSessionBalance } from "@tron-wallet-kit/core";
import { resolveBalanceTronWeb } from "./tronweb";
import type { TronBalanceResolver, TronBalanceResolverResult } from "./types";

export function normalizeBalance(result: TronBalanceResolverResult): WalletSessionBalance | undefined {
  if (result === undefined) return undefined;
  if (typeof result === "object") return result;
  const formatted = typeof result === "number" ? String(result) : result;
  return {
    value: formatted,
    formatted,
    symbol: "TRX"
  };
}

export function createDefaultTrxBalanceResolver(): TronBalanceResolver {
  return async (account, context) => {
    const tronWeb = resolveBalanceTronWeb(context.walletId);
    const value = await tronWeb?.trx?.getBalance?.(account.address);
    if (value === undefined || value === null) return undefined;
    return normalizeSunBalance(value);
  };
}

export function normalizeSunBalance(value: unknown): WalletSessionBalance | undefined {
  const sun = toBalanceBigInt(value);
  if (sun === undefined) return undefined;
  const whole = sun / 1_000_000n;
  const fraction = sun % 1_000_000n;
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");
  const formatted = fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
  return {
    value: sun.toString(),
    formatted,
    symbol: "TRX",
    raw: value
  };
}

function toBalanceBigInt(value: unknown): bigint | undefined {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return BigInt(value.trim());
  return undefined;
}
