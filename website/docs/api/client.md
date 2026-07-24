# Client API

`@tron-wallet-kit/client` is the framework-agnostic entrypoint. `createWalletKit(config)` returns a
`WalletKit` that owns the modal, account panel, session, and transaction helpers.

For a generated list of public exports across every package, see
[Generated exports](/docs/api/generated).

```ts
import { createWalletKit } from "@tron-wallet-kit/client";

const kit = createWalletKit({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`],
  },
  network: "mainnet",
  walletConnectProjectId: process.env.WC_PROJECT_ID,
  ui: { themeName: "tron", toast: true },
  connectButton: { target: document.querySelector("#connect")! },
});
```

The React package's `getDefaultConfig` produces the same config shape with sensible defaults. You
can hand its result to `createWalletKit` too.

## App metadata

`metadata` is the preferred way to identify your dApp:

```ts
createWalletKit({
  metadata: {
    name: "TRX Domains",
    description: "Connect a TRON wallet to manage .trx names.",
    url: "https://trxdomains.xyz",
    icons: ["https://trxdomains.xyz/icon.png"],
  },
});
```

Legacy aliases `appName`, `appDescription`, `appUrl`, and `appIcons` still work. New integrations
should prefer `metadata`.

## Modal and session

```ts
kit.openModal();
kit.closeModal();
await kit.disconnect();

const session = kit.getSession();          // current session or null
await kit.refreshBalance();
await kit.refreshAccount();
await kit.refreshIdentity();
```

## Manager state and events

```ts
kit.manager.getSession();
kit.manager.getAccount();
kit.manager.getNetwork();
kit.manager.getWallets();

const off = kit.manager.on("connected", ({ session }) => {
  console.log(session.account.address);
});
kit.manager.on("disconnected", () => {});
off();
```

## Signing and transactions

```ts
await kit.signMessage("Hello TRON");
await kit.signTransaction(tx);
await kit.sendTransaction(tx);
await kit.sendRawTransaction(tx);
await kit.signAndSendTransaction(tx);
```

High-level helpers build, sign, and broadcast:

```ts
await kit.transferTrx({ to: "T...", amountSun: 1_000_000n });
await kit.transferTrc20({ contractAddress: "T...", to: "T...", amount: 25_000_000n });
await kit.transferTrc10({ tokenId: "1002000", to: "T...", amount: 100n });
await kit.triggerSmartContract({
  contractAddress: "T...",
  functionSelector: "vote(uint256)",
  parameters: [/* ... */],
});
await kit.freezeBalance({ amountSun: 1_000_000n, resource: "ENERGY" });
await kit.voteWitness({ votes: [{ witnessAddress: "T...", voteCount: 3 }] });
await kit.withdrawReward({ description: "Claim voting rewards" });
```

`triggerSmartContract` also accepts `function` as a compatibility alias, but new code should use
`functionSelector` to match the kit API and TRON transaction builder naming.

See [Transactions](/docs/transactions/overview) for the full list and error handling.

## Transaction preview

`transactionPreview` runs before `signAndSendTransaction`, `transferTrx`, `transferTrc20`, and
`triggerSmartContract` ask the wallet to sign. The kit creates a default human-readable preview,
shows the built-in confirmation UI in browser builds, and passes the preview through your resolver
or confirmer when provided.

```ts
const kit = createWalletKit({
  metadata: { name: "My dApp" },
  transactionPreview: {
    resolver: async (request, context) => {
      console.log(context.defaultPreview.summary);
    },
    confirm: async (preview) => {
      return preview.summary.includes("TRX");
    }
  },
  ui: {
    transactionPreview: {
      enabled: true,
      confirmLabel: "Sign",
      cancelLabel: "Cancel"
    }
  }
});
```

Return `false` from `confirm`, or throw from `resolver`, to cancel before the wallet prompt opens.

## Building transactions manually

```ts
const tx = await kit.transactionBuilder.sendTrx("T...", 1_000_000n);
const signed = await kit.signTransaction(tx);
await kit.sendRawTransaction(signed.transaction);

const tronWeb = await kit.getTronWeb(); // shared TronWeb instance for advanced reads
```

## Identity

```ts
const kit = createWalletKit({ metadata: { name: "My dApp" }, identity: { enabled: true } });
const identity = await kit.refreshIdentity();
```

Identity is optional and stays outside core. Provide `identity.resolver` to use an app-specific cache
or API while keeping the UI contract the same. See [Identity](/docs/configuration/identity).

## GasFree

```ts
const kit = createWalletKit({
  metadata: { name: "My dApp" },
  network: "mainnet",
  gasFree: {
    enabled: true,
    apiBaseUrl: "/api/gasfree",
  },
});

const gasFreeAddress = await kit.gasFree.getAddress();
const gasFreeBalance = await kit.gasFree.getBalance();
kit.gasFree.setMode("gasfree");
```

GasFree Phase 1 is display-only: derive address, show it in the account panel, and show USDT balance
from your provider API or resolver. Browser apps should use a same-origin proxy for signed provider
API requests; never ship a GasFree API secret in frontend code. The account panel does not include a send form. See
[GasFree](/docs/configuration/gasfree).

## Cleanup

```ts
kit.destroy(); // removes button, modal, listeners
```
