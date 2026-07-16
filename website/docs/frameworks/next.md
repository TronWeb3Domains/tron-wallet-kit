# Next.js

TRON Wallet Kit works in Next.js, including the App Router. Wallet detection needs the browser, so
the provider and hooks are **client-side** — keep them behind a client boundary.

## App Router

Create a client providers component and mount it in your root layout.

```tsx
// app/providers.tsx
"use client";

import { getDefaultConfig, TronKitProvider } from "@tron-wallet-kit/react";
import type { ReactNode } from "react";

const config = getDefaultConfig({
  metadata: {
    name: "My TRON dApp",
    description: "Wallet connection for My TRON dApp",
    url: "https://my-tron-app.example",
    icons: ["https://my-tron-app.example/icon.png"],
  },
  network: "mainnet",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
});

export function Providers({ children }: { children: ReactNode }) {
  return <TronKitProvider config={config}>{children}</TronKitProvider>;
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Any component that uses the button or hooks must also be a client component:

```tsx
// app/components/connect.tsx
"use client";
import { TronConnectButton } from "@tron-wallet-kit/react";

export function Connect() {
  return <TronConnectButton />;
}
```

## Avoiding hydration issues

`TronConnectButton` and the hooks read wallet state that only exists in the browser, so their output
can differ between server and client on first paint. Two safe options:

- Keep them inside the `"use client"` provider tree (above) — the recommended path.
- Or render the connect UI only after mount if you see a hydration warning:

```tsx
"use client";
import { useEffect, useState } from "react";
import { TronConnectButton } from "@tron-wallet-kit/react";

export function Connect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <TronConnectButton />;
}
```

## Environment variable

Expose the WalletConnect project id with the `NEXT_PUBLIC_` prefix so it's available in the browser,
and set it in your deployment — never commit it.

```txt
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id
```

## Pages Router

The same applies: import the provider and components only on the client. If a component throws during
SSR, wrap it with a dynamic import:

```tsx
import dynamic from "next/dynamic";
const Connect = dynamic(() => import("../components/connect").then((m) => m.Connect), { ssr: false });
```
