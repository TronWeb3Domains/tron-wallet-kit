import { type TransactionPayload, type TronMethodHint } from "@tron-wallet-kit/core";
import { createTransactionPreviewDialog, createWalletButton, createWalletModal, createWalletToast, resolveWalletUiConfig } from "@tron-wallet-kit/ui";
import { createDefaultTrxBalanceResolver, normalizeBalance } from "./balance";
import { createWalletClient } from "./client";
import { resolveIdentityResolver } from "./identity";
import { createTransactionRuntime, type TransactionPreviewConfig, type TransactionPreviewConfirmer } from "./transactions";
import { configureSharedTronWeb } from "./tronweb";
import type { TronIdentity, WalletClientConfig, WalletKit } from "./types";
import { toThemeConfig } from "./utils";
import { buildCatalog } from "./wallets/build-catalog";
import { resolveWalletDescriptors } from "./wallets/registry";

export function createWalletKit(config: WalletClientConfig = {}): WalletKit {
  configureSharedTronWeb(config.tronWeb);
  const manager = createWalletClient(config);
  const catalog = buildCatalog(resolveWalletDescriptors(config.wallets));
  const ui = { ...config.ui, catalog };
  const uiConfig = resolveWalletUiConfig(ui);
  const modal = createWalletModal({ manager, ui });
  const buttonTheme = toThemeConfig(config.ui);
  const transactionPreviewDialog =
    typeof document !== "undefined" && uiConfig.transactionPreview.enabled
      ? createTransactionPreviewDialog({
          ...(buttonTheme ?? {}),
          confirmLabel: uiConfig.transactionPreview.confirmLabel,
          cancelLabel: uiConfig.transactionPreview.cancelLabel,
          showRaw: uiConfig.transactionPreview.showRaw
        })
      : null;
  const identityResolver = resolveIdentityResolver(config.identity, manager);
  const identityCache = new Map<string, { identity: TronIdentity | undefined; expiresAt: number }>();
  const identityInFlight = new Map<string, Promise<TronIdentity | undefined>>();
  const identityCooldown = new Map<string, number>();
  const identityCacheTtlMs = config.identity?.cacheTtlMs ?? 10 * 60 * 1000;
  const identityRateLimitCooldownMs = Math.min(2 * 60 * 1000, Math.max(30 * 1000, identityCacheTtlMs / 5));
  const balanceResolver = config.balance?.enabled === false ? undefined : (config.balance?.resolver ?? createDefaultTrxBalanceResolver());
  const getRefreshTargetSession = (session: NonNullable<ReturnType<typeof manager.getSession>>) => {
    const latest = manager.getSession();
    if (!latest) return null;
    if (latest.adapterId !== session.adapterId) return null;
    if (latest.account.address !== session.account.address) return null;
    if (latest.network.id !== session.network.id) return null;
    return latest;
  };
  const getEffectiveWalletId = (session: NonNullable<ReturnType<typeof manager.getSession>>) => {
    const walletId = session.metadata?.walletId;
    return typeof walletId === "string" && walletId.length > 0 ? walletId : session.adapterId;
  };
  const refreshBalance = async () => {
    const session = manager.getSession();
    if (!session || !balanceResolver) return session?.balance;
    try {
      const result = await balanceResolver(session.account, { network: session.network, walletId: getEffectiveWalletId(session) });
      const balance = normalizeBalance(result);
      const latest = getRefreshTargetSession(session);
      if (!latest) return undefined;
      if (!balance) return latest.balance;
      await manager.setSession({ ...latest, balance, updatedAt: Date.now() });
      return balance;
    } catch (error) {
      if (config.balance?.failSilently !== false) return getRefreshTargetSession(session)?.balance;
      throw error;
    }
  };
  const refreshIdentity = async () => {
    const session = manager.getSession();
    const account = session?.account;
    if (!session || !account || !identityResolver) return undefined;
    const key = `${session.network.id}:${account.address}`;
    const cached = identityCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      const latest = getRefreshTargetSession(session);
      if (cached.identity && latest) {
        await manager.setSession({
          ...latest,
          account: {
            ...latest.account,
            ...(cached.identity.domain ? { domain: cached.identity.domain } : {}),
            ...(cached.identity.displayName ? { displayName: cached.identity.displayName } : {}),
            ...(cached.identity.avatar ? { avatar: cached.identity.avatar } : {})
          },
          updatedAt: Date.now()
        });
      }
      return cached.identity;
    }
    const cooldownUntil = identityCooldown.get(key);
    if (cooldownUntil && cooldownUntil > Date.now()) return undefined;
    const inFlight = identityInFlight.get(key);
    if (inFlight) return inFlight;
    try {
      const request = (async () => {
        try {
          const identity = await identityResolver(account, { network: session.network, walletId: getEffectiveWalletId(session) });
          if (identity) identityCache.set(key, { identity, expiresAt: Date.now() + identityCacheTtlMs });
          const latest = getRefreshTargetSession(session);
          if (!latest) return identity;
          if (identity) {
            await manager.setSession({
              ...latest,
              account: {
                ...latest.account,
                ...(identity.domain ? { domain: identity.domain } : {}),
                ...(identity.displayName ? { displayName: identity.displayName } : {}),
                ...(identity.avatar ? { avatar: identity.avatar } : {})
              },
              updatedAt: Date.now()
            });
          }
          return identity;
        } catch (error) {
          if (isRateLimitError(error)) identityCooldown.set(key, Date.now() + identityRateLimitCooldownMs);
          throw error;
        } finally {
          identityInFlight.delete(key);
        }
      })();
      identityInFlight.set(key, request);
      return await request;
    } catch (error) {
      if (config.identity?.failSilently !== false) return undefined;
      throw error;
    }
  };
  const button = config.connectButton
    ? createWalletButton({
        manager,
        modal,
        ...(buttonTheme ? { theme: buttonTheme } : {}),
        ...(config.connectButton.label ? { label: config.connectButton.label } : {}),
        ...(config.connectButton.connectedLabel ? { connectedLabel: config.connectButton.connectedLabel } : {}),
        ...(config.connectButton.showBalance !== undefined ? { showBalance: config.connectButton.showBalance } : {}),
        accountPanelMode: uiConfig.accountPanel.mode === "inline" ? "dropdown" : "modal",
        refreshAccountDetails: async () => {
          await Promise.allSettled([refreshIdentity(), refreshBalance()]);
        }
      })
    : null;
  const toast = config.ui?.toast ? createWalletToast({ manager, ui }) : null;

  if (typeof document !== "undefined") {
    modal.mount();
    toast?.mount();
    transactionPreviewDialog?.mount();
    if (config.connectButton?.target) button?.mount(config.connectButton.target);
  }

  const resolvedTransactionPreview = resolveKitTransactionPreview(config.transactionPreview, transactionPreviewDialog?.confirm);
  const transactionRuntime = createTransactionRuntime(
    manager,
    resolvedTransactionPreview ? { transactionPreview: resolvedTransactionPreview } : {}
  );
  const submit = (methodHint: TronMethodHint, transaction: TransactionPayload, description?: string) =>
    transactionRuntime.signAndSendTransaction({ methodHint, transaction }, methodHint, description);

  return {
    manager,
    modal,
    button,
    toast,
    catalog,
    uiConfig,
    setTheme: (theme) => {
      modal.setTheme(theme);
      button?.setTheme(theme);
      toast?.setTheme(theme);
      transactionPreviewDialog?.setTheme(theme);
    },
    destroy: () => {
      button?.destroy();
      toast?.destroy();
      transactionPreviewDialog?.destroy();
      modal.destroy();
      manager.destroy();
      identityCache.clear();
      identityInFlight.clear();
      identityCooldown.clear();
    },
    openModal: () => modal.open(),
    closeModal: () => modal.close(),
    disconnect: () => manager.disconnect(),
    refreshBalance,
    refreshAccount: async () => manager.getAccount(),
    refreshIdentity,
    getSession: manager.getSession.bind(manager),
    signMessage: (request) => manager.signMessage(request),
    signTransaction: (transaction) => manager.signTransaction(transaction),
    sendTransaction: (transaction) => transactionRuntime.sendRawTransaction(transaction),
    sendRawTransaction: transactionRuntime.sendRawTransaction,
    signAndSendTransaction: (transaction) => transactionRuntime.signAndSendTransaction(transaction),
    getTronWeb: transactionRuntime.getTronWeb,
    transactionBuilder: transactionRuntime.transactionBuilder,
    transferTrx: (request) =>
      transactionRuntime.signAndSendBuiltTransaction(
        () => transactionRuntime.transactionBuilder.sendTrx(request.to, request.amountSun, manager.getSession()?.account.address),
        "transferTrx",
        request.description
      ),
    transferTrc10: (request) =>
      submit("transferTrc10", { tokenId: request.tokenId, to: request.to, amount: String(request.amount) }, request.description),
    transferTrc20: (request) =>
      transactionRuntime.signAndSendBuiltTransaction(
        () =>
          transactionRuntime.transactionBuilder.triggerSmartContract({
            contractAddress: request.contractAddress,
            functionSelector: "transfer(address,uint256)",
            parameters: [
              { type: "address", value: request.to },
              { type: "uint256", value: String(request.amount) }
            ],
            ...(request.feeLimit !== undefined ? { feeLimit: request.feeLimit } : {}),
            ...(request.description ? { description: request.description } : {})
          }),
        "transferTrc20",
        request.description,
        {
          to: request.to,
          amount: String(request.amount),
          token: "TRC20"
        }
      ),
    triggerSmartContract: transactionRuntime.triggerSmartContract,
    freezeBalance: (request) => submit("freezeBalance", { amountSun: String(request.amountSun), resource: request.resource }, request.description),
    unfreezeBalance: (request) => submit("unfreezeBalance", { amountSun: String(request.amountSun), resource: request.resource }, request.description),
    delegateResource: (request) => submit("delegateResource", { to: request.to, amountSun: String(request.amountSun), resource: request.resource }, request.description),
    undelegateResource: (request) => submit("undelegateResource", { to: request.to, amountSun: String(request.amountSun), resource: request.resource }, request.description),
    voteWitness: (request) => submit("voteWitness", { votes: request.votes }, request.description),
    withdrawReward: (request = {}) =>
      transactionRuntime.signAndSendBuiltTransaction(
        () => transactionRuntime.transactionBuilder.withdrawReward(request.ownerAddress ?? manager.getSession()?.account.address),
        "withdrawReward",
        request.description,
        { ownerAddress: request.ownerAddress ?? manager.getSession()?.account.address }
      )
  };
}

function resolveKitTransactionPreview(
  config: TransactionPreviewConfig | undefined,
  confirm: TransactionPreviewConfirmer | undefined
): TransactionPreviewConfig | undefined {
  if (!config) return confirm ? { confirm } : undefined;
  if (typeof config === "function") return confirm ? { resolver: config, confirm } : config;
  if (config.enabled === false) return config;
  return {
    ...config,
    ...(confirm && !config.confirm ? { confirm } : {})
  };
}

function isRateLimitError(error: unknown): boolean {
  const value = error as { message?: unknown; status?: unknown; response?: { status?: unknown }; code?: unknown };
  const text = [
    typeof value?.message === "string" ? value.message : "",
    typeof value?.code === "string" ? value.code : "",
    typeof value?.status === "number" ? String(value.status) : "",
    typeof value?.response?.status === "number" ? String(value.response.status) : ""
  ].join(" ");
  return /\b429\b|too many requests|rate limit/i.test(text);
}
