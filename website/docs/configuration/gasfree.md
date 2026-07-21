# GasFree

GasFree is an optional TRON-native account panel mode for receiving and displaying USDT in a
deterministic GasFree address. Phase 1 is display-only: it derives or fetches the GasFree address,
shows copy/QR actions, and shows the USDT balance when a provider API or resolver is configured.

The account panel does not render a send form. Gasless sending is reserved for a later headless
primitive so your dApp can own the transfer UI.

## What The Kit Does

- Shows a `general` -> `gasfree` state inside the connected account panel.
- Reads the GasFree address from the official provider API when `apiBaseUrl` is configured.
- Falls back to local address derivation with `@gasfree/gasfree-sdk` when no provider API is present.
- Reads USDT balance from the provider account endpoint or an app-provided resolver.
- Keeps API authentication outside the browser bundle.

## Provider API

The official provider API uses:

- mainnet base: `https://open.gasfree.io/tron`
- account info: `GET /api/v1/address/{accountAddress}`

The account endpoint receives the connected EOA address, not the GasFree address. Its response includes
the derived GasFree address, account state, nonce, and token asset data.

Provider requests may require signed headers. Do not put an API secret in frontend code. For browser
apps, use a same-origin backend proxy such as `/api/gasfree`, sign requests on the server, and point
the kit at that proxy.

```ts
import { getDefaultConfig } from "@tron-wallet-kit/react";

export const config = getDefaultConfig({
  metadata: { name: "My TRON dApp" },
  network: "mainnet",
  gasFree: {
    enabled: true,
    apiBaseUrl: "/api/gasfree",
    token: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
  }
});
```

Your proxy should forward:

```txt
GET /api/gasfree/api/v1/address/{accountAddress}
```

to:

```txt
GET https://open.gasfree.io/tron/api/v1/address/{accountAddress}
```

and add the provider-required `Timestamp` and `Authorization` headers on the server.

## Header Callback

If your environment can safely provide headers without exposing secrets, use `apiHeaders`.

```ts
gasFree: {
  enabled: true,
  apiBaseUrl: "https://open.gasfree.io/tron",
  apiHeaders: async ({ method, path, timestamp }) => {
    const response = await fetch("/api/gasfree/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, path, timestamp })
    });

    return response.json();
  }
}
```

The signer endpoint should return headers such as:

```json
{
  "Timestamp": "1731912286",
  "Authorization": "ApiKey YOUR_KEY:SIGNATURE"
}
```

## Local QA Fallback

For local playgrounds without provider credentials, the client package exposes an opt-in TRC-20
balance resolver. This is useful for reading the on-chain USDT balance of the GasFree address, but it
does not replace the provider API for nonce, submit eligibility, or Phase 2 gasless transfers.

```ts
import { createTrc20GasFreeBalanceResolver } from "@tron-wallet-kit/client";

gasFree: {
  enabled: true,
  balanceResolver: createTrc20GasFreeBalanceResolver({
    fullHost: "https://api.trongrid.io"
  })
}
```

`react-basic` uses `VITE_GASFREE_API_BASE_URL` when present. If it is not set, it falls back to this
resolver so local balance QA still works.

## React Hook

```tsx
import { useGasFree } from "@tron-wallet-kit/react";

function GasFreeStatus() {
  const gasFree = useGasFree();

  if (!gasFree.configured) return null;

  return (
    <div>
      <button onClick={() => gasFree.setMode("gasfree")}>Open GasFree</button>
      <span>{gasFree.address ?? "Loading address"}</span>
      <span>{gasFree.balance ? `${gasFree.balance.formatted} ${gasFree.balance.symbol}` : "Loading balance"}</span>
    </div>
  );
}
```

## Vanilla Client

```ts
const address = await kit.gasFree.getAddress();
const balance = await kit.gasFree.getBalance();

kit.gasFree.setMode("gasfree");
await kit.gasFree.refresh();
```

GasFree is mainnet-first. On unsupported networks, the runtime resolves to disabled without throwing.

## Phase Boundary

Phase 1:

- address display;
- copy address;
- address QR;
- USDT balance;
- account panel general/gasfree mode switch.

Phase 2:

- typed-data signing capability;
- provider list and fee selection;
- nonce/deadline/max fee preparation;
- `kit.gasFree.transfer()` as a headless primitive;
- submit and poll through the provider API.
