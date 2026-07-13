import { WalletKitError, type SignTransactionRequest, type TransactionPayload, type TronMethodHint, type TxResult, type WalletManager } from "@tron-wallet-kit/core";
import { getSharedTronWeb, type TronDomainTronWeb } from "./tronweb";
import type { TriggerSmartContractRequest } from "./types";

export type SendTrxBuilder = (to: string, amountSun: string | number | bigint, from?: string) => Promise<TransactionPayload>;

export type TriggerSmartContractBuilder = {
  (
    contractAddress: string,
    functionSelector: string,
    options?: Record<string, unknown>,
    parameters?: unknown[],
    issuerAddress?: string
  ): Promise<TransactionPayload>;
  (request: TriggerSmartContractRequest): Promise<TransactionPayload>;
};

export type WalletTransactionBuilder = {
  sendTrx: SendTrxBuilder;
  triggerSmartContract: TriggerSmartContractBuilder;
};

export type TriggerSmartContractExecutor = {
  (
    contractAddress: string,
    functionSelector: string,
    options?: Record<string, unknown>,
    parameters?: unknown[],
    issuerAddress?: string
  ): Promise<TxResult>;
  (request: TriggerSmartContractRequest): Promise<TxResult>;
};

export type TransactionRuntime = {
  transactionBuilder: WalletTransactionBuilder;
  getTronWeb(): Promise<TronDomainTronWeb>;
  sendRawTransaction(transaction: TransactionPayload): Promise<TxResult>;
  signAndSendTransaction(transaction: TransactionPayload | SignTransactionRequest, methodHint?: TronMethodHint, description?: string): Promise<TxResult>;
  signAndSendBuiltTransaction(buildTransaction: () => Promise<TransactionPayload>, methodHint?: TronMethodHint, description?: string): Promise<TxResult>;
  triggerSmartContract: TriggerSmartContractExecutor;
};

const DEFAULT_CONTRACT_FEE_LIMIT_SUN = 100_000_000;

export function createTransactionRuntime(manager: WalletManager): TransactionRuntime {
  const getTronWebForSession = async () => {
    const session = manager.getSession();
    return getSharedTronWeb(manager, session?.network, getEffectiveWalletId(manager));
  };

  const buildSendTrx: SendTrxBuilder = async (to, amountSun, from) => {
    const session = manager.getSession();
    const tronWeb = await getTronWebForSession();
    const ownerAddress = from ?? session?.account.address;
    if (!tronWeb.transactionBuilder?.sendTrx) {
      throw new WalletKitError("CONFIGURATION_ERROR", "TronWeb transactionBuilder.sendTrx is not available.");
    }
    return tronWeb.transactionBuilder.sendTrx(to, toSafeNumber(amountSun), ownerAddress);
  };

  const buildTriggerSmartContract = (async (
    requestOrContractAddress: TriggerSmartContractRequest | string,
    functionSelector?: string,
    options?: Record<string, unknown>,
    parameters?: unknown[],
    issuerAddress?: string
  ): Promise<TransactionPayload> => {
    const session = manager.getSession();
    const request =
      typeof requestOrContractAddress === "string"
        ? {
            contractAddress: requestOrContractAddress,
            functionSelector: functionSelector ?? "",
            ...(options ? { options } : {}),
            ...(parameters ? { parameters } : {}),
            issuerAddress: issuerAddress ?? session?.account.address
          }
        : normalizeTriggerRequest(requestOrContractAddress, session?.account.address);
    const tronWeb = await getTronWebForSession();
    if (!tronWeb.transactionBuilder?.triggerSmartContract) {
      throw new WalletKitError("CONFIGURATION_ERROR", "TronWeb transactionBuilder.triggerSmartContract is not available.");
    }
    const prepared = await tronWeb.transactionBuilder.triggerSmartContract(
      request.contractAddress,
      request.functionSelector,
      request.options,
      request.parameters,
      request.issuerAddress
    );
    const transaction = extractPreparedTransaction(prepared);
    if (!transaction) {
      throw new WalletKitError("INVALID_TRANSACTION", "TronWeb did not return a triggerSmartContract transaction.", prepared);
    }
    return transaction;
  }) as TriggerSmartContractBuilder;

  const broadcastRawTransaction = async (transaction: TransactionPayload, methodHint?: TronMethodHint, description?: string): Promise<TxResult> => {
    const tronWeb = await getTronWebForSession();
    if (!tronWeb.trx?.sendRawTransaction) {
      throw new WalletKitError("CONFIGURATION_ERROR", "TronWeb trx.sendRawTransaction is not available.");
    }
    const raw = await tronWeb.trx.sendRawTransaction(transaction);
    assertBroadcastSucceeded(raw);
    const hash = extractTransactionHash(raw, transaction);
    if (!hash) throw new WalletKitError("SEND_TRANSACTION_FAILED", "TronWeb did not return a transaction hash.", raw);
    const walletTransaction = manager.addTransaction({
      hash,
      status: "submitted",
      raw,
      ...(methodHint ? { methodHint } : {}),
      ...(description ? { description } : {})
    });
    return { hash, status: "submitted", ...(walletTransaction.explorerUrl ? { explorerUrl: walletTransaction.explorerUrl } : {}), raw };
  };

  const sendRawTransaction = async (transaction: TransactionPayload): Promise<TxResult> => broadcastRawTransaction(transaction);

  const signAndSendTransaction = async (
    transactionOrRequest: TransactionPayload | SignTransactionRequest,
    methodHint?: TronMethodHint,
    description?: string
  ): Promise<TxResult> => {
    const request = normalizeSignRequest(transactionOrRequest, methodHint);
    const signed = await manager.signTransaction(request);
    const transaction = signed.signedTransaction ?? signed.transaction;
    if (!transaction) throw new WalletKitError("INVALID_TRANSACTION_SIGNATURE", "Wallet did not return a signed transaction.");
    return broadcastRawTransaction(transaction, request.methodHint ?? methodHint, description);
  };

  const signAndSendBuiltTransaction = async (
    buildTransaction: () => Promise<TransactionPayload>,
    methodHint?: TronMethodHint,
    description?: string
  ): Promise<TxResult> => {
    try {
      const transaction = await buildTransaction();
      return await signAndSendTransaction({ transaction, ...(methodHint ? { methodHint } : {}) }, methodHint, description);
    } catch (error) {
      if (!isTransactionExpirationError(error)) throw error;
      const transaction = await buildTransaction();
      return signAndSendTransaction({ transaction, ...(methodHint ? { methodHint } : {}) }, methodHint, description);
    }
  };

  const triggerSmartContract = (async (...args: Parameters<TriggerSmartContractBuilder>): Promise<TxResult> => {
    const request = args.length === 1 && typeof args[0] === "object" ? args[0] : undefined;
    return signAndSendBuiltTransaction(
      () => (buildTriggerSmartContract as (...innerArgs: typeof args) => Promise<TransactionPayload>)(...args),
      "triggerSmartContract",
      request?.description
    );
  }) as TriggerSmartContractExecutor;

  return {
    transactionBuilder: {
      sendTrx: buildSendTrx,
      triggerSmartContract: buildTriggerSmartContract
    },
    getTronWeb: getTronWebForSession,
    sendRawTransaction,
    signAndSendTransaction,
    signAndSendBuiltTransaction,
    triggerSmartContract
  };
}

function normalizeTriggerRequest(request: TriggerSmartContractRequest, fallbackIssuerAddress: string | undefined): Required<Pick<TriggerSmartContractRequest, "contractAddress" | "functionSelector">> & {
  options?: Record<string, unknown>;
  parameters?: unknown[];
  issuerAddress?: string;
  description?: string;
} {
  const functionSelector = request.functionSelector ?? request.function;
  if (!functionSelector) throw new WalletKitError("INVALID_TRANSACTION", "functionSelector is required.");
  const feeLimit = normalizeOptionalAmount(request.feeLimit ?? request.options?.feeLimit) ?? DEFAULT_CONTRACT_FEE_LIMIT_SUN;
  const options = {
    ...(request.options ?? {}),
    feeLimit,
    ...(request.callValue !== undefined ? { callValue: toSafeNumber(request.callValue) } : {})
  };
  const issuerAddress = request.issuerAddress ?? fallbackIssuerAddress;
  return {
    contractAddress: request.contractAddress,
    functionSelector,
    ...(Object.keys(options).length > 0 ? { options } : {}),
    ...(request.parameters ?? request.parameter ? { parameters: request.parameters ?? request.parameter } : {}),
    ...(issuerAddress ? { issuerAddress } : {}),
    ...(request.description ? { description: request.description } : {})
  };
}

function normalizeSignRequest(transactionOrRequest: TransactionPayload | SignTransactionRequest, methodHint: TronMethodHint | undefined): SignTransactionRequest {
  if (typeof transactionOrRequest === "object" && transactionOrRequest !== null && "transaction" in transactionOrRequest) {
    return {
      ...transactionOrRequest,
      ...(methodHint && !transactionOrRequest.methodHint ? { methodHint } : {})
    } as SignTransactionRequest;
  }
  return {
    transaction: transactionOrRequest as TransactionPayload,
    ...(methodHint ? { methodHint } : {})
  };
}

function extractPreparedTransaction(prepared: Record<string, unknown>): TransactionPayload | undefined {
  const result = prepared.result;
  if (isFailedTriggerResult(result)) return undefined;
  const transaction = prepared.transaction;
  return typeof transaction === "object" && transaction !== null ? (transaction as TransactionPayload) : undefined;
}

function isFailedTriggerResult(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  if (!("result" in result)) return false;
  return (result as { result?: unknown }).result === false;
}

function extractTransactionHash(raw: unknown, transaction: TransactionPayload): string | undefined {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const hash = record.txid ?? record.txID ?? (record.transaction && typeof record.transaction === "object" ? (record.transaction as Record<string, unknown>).txID : undefined);
    if (typeof hash === "string" && hash.length > 0) return hash;
  }
  const fallback = transaction.txID ?? transaction.txid;
  return typeof fallback === "string" && fallback.length > 0 ? fallback : undefined;
}

function assertBroadcastSucceeded(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const record = raw as Record<string, unknown>;
  if (record.result !== false && record.result !== "false") return;
  const code = typeof record.code === "string" ? record.code : "SEND_TRANSACTION_FAILED";
  const message = decodeBroadcastMessage(record.message) ?? code;
  throw new WalletKitError(code, message, raw);
}

function decodeBroadcastMessage(message: unknown): string | undefined {
  if (typeof message !== "string" || message.length === 0) return undefined;
  if (/^[0-9a-f]+$/i.test(message) && message.length % 2 === 0) {
    try {
      const bytes = message.match(/.{1,2}/g)?.map((part) => Number.parseInt(part, 16)) ?? [];
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return message;
    }
  }
  return message;
}

function isTransactionExpirationError(error: unknown): boolean {
  const errorRecord = error && typeof error === "object" ? (error as Record<string, unknown>) : undefined;
  const source = errorRecord && "cause" in errorRecord && errorRecord.cause !== undefined ? errorRecord.cause : error;
  const message = stringifyErrorParts([
    error instanceof Error ? error.message : undefined,
    errorRecord && "code" in errorRecord ? String(errorRecord.code) : undefined,
    source && typeof source === "object" && "message" in source ? String((source as Record<string, unknown>).message) : undefined,
    source && typeof source === "object" && "code" in source ? String((source as Record<string, unknown>).code) : undefined,
    safeStringify(error),
    safeStringify(source)
  ]);
  return /TRANSACTION_EXPIRATION_ERROR|expired/i.test(message);
}

function stringifyErrorParts(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function safeStringify(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function normalizeOptionalAmount(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
    throw new WalletKitError("INVALID_TRANSACTION", "Amount must be a string, number, or bigint.");
  }
  return toSafeNumber(value);
}

function getEffectiveWalletId(manager: WalletManager): string | undefined {
  const session = manager.getSession();
  const walletId = session?.metadata?.walletId;
  return typeof walletId === "string" && walletId.length > 0 ? walletId : session?.adapterId;
}

function toSafeNumber(value: string | number | bigint): number {
  if (typeof value === "bigint") {
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
    if (value > maxSafe) throw new WalletKitError("INVALID_TRANSACTION", "Amount exceeds JavaScript safe integer range.");
    return Number(value);
  }
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new WalletKitError("INVALID_TRANSACTION", "Amount must be a positive number.");
  if (numberValue > Number.MAX_SAFE_INTEGER) throw new WalletKitError("INVALID_TRANSACTION", "Amount exceeds JavaScript safe integer range.");
  return numberValue;
}
