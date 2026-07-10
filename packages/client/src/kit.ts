import { type TransactionPayload, type TronMethodHint } from "@tron-wallet-kit/core";
import { createWalletButton, createWalletModal, createWalletToast, resolveWalletUiConfig } from "@tron-wallet-kit/ui";
import { createDefaultTrxBalanceResolver, normalizeBalance } from "./balance";
import { createWalletClient } from "./client";
import { resolveIdentityResolver } from "./identity";
import type { TronIdentity, WalletClientConfig, WalletKit } from "./types";
import { toThemeConfig } from "./utils";
import { buildCatalog } from "./wallets/build-catalog";
import { resolveWalletDescriptors } from "./wallets/registry";

export function createWalletKit(config: WalletClientConfig = {}): WalletKit {
  const manager = createWalletClient(config);
  const catalog = buildCatalog(resolveWalletDescriptors(config.wallets));
  const ui = { ...config.ui, catalog };
  const uiConfig = resolveWalletUiConfig(ui);
  const modal = createWalletModal({ manager, ui });
  const buttonTheme = toThemeConfig(config.ui);
  const button = config.connectButton
    ? createWalletButton({
        manager,
        modal,
        ...(buttonTheme ? { theme: buttonTheme } : {}),
        ...(config.connectButton.label ? { label: config.connectButton.label } : {}),
        ...(config.connectButton.connectedLabel ? { connectedLabel: config.connectButton.connectedLabel } : {})
      })
    : null;
  const toast = config.ui?.toast ? createWalletToast({ manager, ui }) : null;
  const identityResolver = resolveIdentityResolver(config.identity, manager);
  const identityCache = new Map<string, { identity: TronIdentity | undefined; expiresAt: number }>();
  const identityCacheTtlMs = config.identity?.cacheTtlMs ?? 10 * 60 * 1000;
  const balanceResolver = config.balance?.enabled === false ? undefined : (config.balance?.resolver ?? createDefaultTrxBalanceResolver());

  if (typeof document !== "undefined") {
    modal.mount();
    toast?.mount();
    if (config.connectButton?.target) button?.mount(config.connectButton.target);
  }

  const submit = (methodHint: TronMethodHint, transaction: TransactionPayload, description?: string) =>
    manager.submitTransaction({ methodHint, transaction, ...(description ? { description } : {}) });
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
    },
    destroy: () => {
      button?.destroy();
      toast?.destroy();
      modal.destroy();
      manager.destroy();
      identityCache.clear();
    },
    openModal: () => modal.open(),
    closeModal: () => modal.close(),
    disconnect: () => manager.disconnect(),
    refreshBalance: async () => {
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
    },
    refreshAccount: async () => manager.getAccount(),
    refreshIdentity: async () => {
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
        if (config.identity?.failSilently !== false) return undefined;
        throw error;
      }
    },
    getSession: manager.getSession.bind(manager),
    signMessage: (request) => manager.signMessage(request),
    signTransaction: (transaction) => manager.signTransaction(transaction),
    sendTransaction: (transaction) => submit("generic", transaction),
    transferTrx: (request) => submit("transferTrx", { to: request.to, amountSun: String(request.amountSun) }, request.description),
    transferTrc10: (request) =>
      submit("transferTrc10", { tokenId: request.tokenId, to: request.to, amount: String(request.amount) }, request.description),
    transferTrc20: (request) =>
      submit(
        "transferTrc20",
        { contractAddress: request.contractAddress, to: request.to, amount: String(request.amount), feeLimit: request.feeLimit ? String(request.feeLimit) : undefined },
        request.description
      ),
    triggerSmartContract: (request) => submit("triggerSmartContract", { ...request }, request.description),
    freezeBalance: (request) => submit("freezeBalance", { amountSun: String(request.amountSun), resource: request.resource }, request.description),
    unfreezeBalance: (request) => submit("unfreezeBalance", { amountSun: String(request.amountSun), resource: request.resource }, request.description),
    delegateResource: (request) => submit("delegateResource", { to: request.to, amountSun: String(request.amountSun), resource: request.resource }, request.description),
    undelegateResource: (request) => submit("undelegateResource", { to: request.to, amountSun: String(request.amountSun), resource: request.resource }, request.description),
    voteWitness: (request) => submit("voteWitness", { votes: request.votes }, request.description)
  };
}
