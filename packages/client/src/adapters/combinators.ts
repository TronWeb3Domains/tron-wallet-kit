import { WalletKitError, type WalletAdapter } from "@tron-wallet-kit/core";

export function createAvailabilityProbeWalletAdapter(primary: WalletAdapter, probe: () => boolean | Promise<boolean>): WalletAdapter {
  return {
    ...(primary.adapterApiVersion ? { adapterApiVersion: primary.adapterApiVersion } : {}),
    metadata: primary.metadata,
    capabilities: primary.capabilities,
    detect: async () => {
      if (await Promise.resolve(probe()).catch(() => false)) return true;
      return Boolean(await Promise.resolve(primary.detect?.()).catch(() => false));
    },
    isAvailable: async () => {
      if (await Promise.resolve(probe()).catch(() => false)) return true;
      return Boolean(await Promise.resolve(primary.isAvailable?.()).catch(() => false));
    },
    connect: (options) => primary.connect(options),
    ...(primary.disconnect ? { disconnect: () => primary.disconnect!() } : {}),
    ...(primary.restoreSession ? { restoreSession: (session) => primary.restoreSession!(session) } : {}),
    ...(primary.canRecoverSession ? { canRecoverSession: (options) => primary.canRecoverSession!(options) } : {}),
    ...(primary.recoverSession ? { recoverSession: (options) => primary.recoverSession!(options) } : {}),
    ...(primary.cancelPendingConnection ? { cancelPendingConnection: () => primary.cancelPendingConnection!() } : {}),
    ...(primary.signMessage ? { signMessage: (request) => primary.signMessage!(request) } : {}),
    ...(primary.signTransaction ? { signTransaction: (request) => primary.signTransaction!(request) } : {}),
    ...(primary.submitTransaction ? { submitTransaction: (request) => primary.submitTransaction!(request) } : {})
  };
}

export function createFallbackWalletAdapter(primary: WalletAdapter, fallback: WalletAdapter): WalletAdapter {
  let active: WalletAdapter | undefined;
  const chooseAvailable = async (): Promise<WalletAdapter> => {
    if (await Promise.resolve(fallback.isAvailable?.()).catch(() => false)) return fallback;
    if (await Promise.resolve(primary.isAvailable?.()).catch(() => false)) return primary;
    return primary;
  };
  const chooseActive = async (): Promise<WalletAdapter> => active ?? chooseAvailable();

  return {
    ...(primary.adapterApiVersion ? { adapterApiVersion: primary.adapterApiVersion } : {}),
    metadata: primary.metadata,
    capabilities: {
      ...fallback.capabilities,
      ...primary.capabilities
    },
    detect: async () => {
      if (await Promise.resolve(fallback.detect?.()).catch(() => false)) return true;
      return Boolean(await Promise.resolve(primary.detect?.()).catch(() => false));
    },
    isAvailable: async () => {
      if (await Promise.resolve(fallback.isAvailable?.()).catch(() => false)) return true;
      return Boolean(await Promise.resolve(primary.isAvailable?.()).catch(() => false));
    },
    connect: async (options) => {
      active = await chooseAvailable();
      return active.connect(options);
    },
    disconnect: async () => {
      await active?.disconnect?.();
      active = undefined;
    },
    restoreSession: async (session) => {
      const adapter = await chooseAvailable();
      active = adapter;
      return adapter.restoreSession?.(session) ?? null;
    },
    canRecoverSession: async (options) => {
      const adapter = await chooseAvailable();
      return Boolean(await adapter.canRecoverSession?.(options));
    },
    recoverSession: async (options) => {
      active = await chooseAvailable();
      return active.recoverSession?.(options) ?? null;
    },
    cancelPendingConnection: async () => {
      await active?.cancelPendingConnection?.();
    },
    signMessage: async (request) => {
      const adapter = await chooseActive();
      if (!adapter.signMessage) throw new WalletKitError("UNSUPPORTED", `${primary.metadata.name} cannot sign messages.`);
      return adapter.signMessage(request);
    },
    signTransaction: async (request) => {
      const adapter = await chooseActive();
      if (!adapter.signTransaction) throw new WalletKitError("UNSUPPORTED", `${primary.metadata.name} cannot sign transactions.`);
      return adapter.signTransaction(request);
    },
    submitTransaction: async (request) => {
      const adapter = await chooseActive();
      if (!adapter.submitTransaction) throw new WalletKitError("UNSUPPORTED", `${primary.metadata.name} cannot submit transactions.`);
      return adapter.submitTransaction(request);
    }
  };
}
