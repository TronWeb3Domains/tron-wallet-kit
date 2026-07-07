import { type TransactionPayload, type TronMethodHint } from "@tron-wallet-kit/core";
import { createWalletButton, createWalletModal, createWalletToast } from "@tron-wallet-kit/ui";
import { createDefaultTrxBalanceResolver, normalizeBalance } from "./balance";
import { createWalletClient } from "./client";
import { resolveIdentityResolver } from "./identity";
import type { TronIdentity, WalletClientConfig, WalletKit } from "./types";
import { toThemeConfig } from "./utils";

export function createWalletKit(config: WalletClientConfig = {}): WalletKit {
  const manager = createWalletClient(config);
  const modal = createWalletModal({ manager, ...(config.ui ? { ui: config.ui } : {}) });
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
  const toast = config.ui?.toast ? createWalletToast({ manager, ui: config.ui }) : null;
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

  return {
    manager,
    modal,
    button,
    toast,
    setTheme: (theme) => {
      modal.setTheme(theme);
      button?.setTheme(theme);
      toast?.setTheme(theme);
    },
    openModal: () => modal.open(),
    closeModal: () => modal.close(),
    disconnect: () => manager.disconnect(),
    refreshBalance: async () => {
      const session = manager.getSession();
      if (!session || !balanceResolver) return session?.balance;
      try {
        const result = await balanceResolver(session.account, { network: manager.getNetwork(), walletId: session.adapterId });
        const balance = normalizeBalance(result);
        if (!balance) return session.balance;
        await manager.setSession({ ...session, balance, updatedAt: Date.now() });
        return balance;
      } catch (error) {
        if (config.balance?.failSilently !== false) return session.balance;
        throw error;
      }
    },
    refreshAccount: async () => manager.getAccount(),
    refreshIdentity: async () => {
      const session = manager.getSession();
      const account = session?.account;
      if (!session || !account || !identityResolver) return undefined;
      const key = `${manager.getNetwork().id}:${account.address}`;
      const cached = identityCache.get(key);
      if (cached && cached.expiresAt > Date.now()) return cached.identity;
      try {
        const identity = await identityResolver(account, { network: manager.getNetwork(), walletId: session.adapterId });
        identityCache.set(key, { identity, expiresAt: Date.now() + identityCacheTtlMs });
        if (identity) {
          await manager.setSession({
            ...session,
            account: {
              ...session.account,
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
