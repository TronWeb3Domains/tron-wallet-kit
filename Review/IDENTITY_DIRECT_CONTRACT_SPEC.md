# Spec: Identity gọi thẳng smart contract (bỏ `trondomainjs`) — mainnet-only

Mục tiêu: bỏ hẳn phụ thuộc `trondomainjs`, resolve domain/avatar bằng **gọi trực tiếp contract TRX Domains** qua **tronWeb dùng chung với core** (không tạo instance riêng). Chỉ áp dụng **mainnet**; mạng khác thì bỏ qua identity (không lỗi).

Lý do: `trondomainjs` không có type (`@ts-expect-error`), là CommonJS, dính bug "TronWeb is not a constructor" — chính vì bug này team đã phải tự viết fallback gọi contract tay. Đường direct-contract **đã chạy thật** rồi; giờ biến nó thành đường **chính duy nhất**.

Giữ hard-rule: identity chỉ nằm ở **client layer**, core/adapter **không** đụng. Không set-primary/verify.

---

## 0. Nguyên tắc
- **1 tronWeb dùng chung**: identity và broadcast (bridge) dùng **cùng một** instance tronWeb do client giữ (lazy, tạo 1 lần). KHÔNG `new TronWeb()` riêng cho identity.
- **Mainnet-only**: chỉ resolve khi network là mainnet. Khác mainnet ⇒ trả `undefined` (bỏ qua), không ném lỗi.
- **Read-only**: chỉ gọi `.call()` view, không ký, không cần private key.
- Bỏ `trondomainjs` khỏi `dependencies`, xoá toàn bộ `loadTronDomainSdk`/`createCompatibleTronDomainSdk`/`TronDomainModule`… liên quan.

---

## 1. Contract + call thực tế

Contract mainnet (cố định):
```ts
const TRX_DOMAINS_MAINNET_CONTRACT = "TAtgoVq9xqv1C65hjFTerJQZFt4rbAPea6";
```

Reverse lookup (địa chỉ → domain mặc định), đúng pattern thực tế:
```ts
const contract = await tronWeb.contract().at(TRX_DOMAINS_MAINNET_CONTRACT);
const defaultDomain = await contract.reverseOf(address).call();
```
> `tronWeb.contract().at(addr)` tự nạp ABI on-chain nên **không cần khai ABI**. Cache lại `contract` (mục 4) để khỏi `.at()` lại mỗi lần.

Các call phụ (chỉ dùng khi cần):
- Không có default domain → liệt kê domain đang sở hữu:
  ```ts
  const balance = Number(String(await contract.balanceOf(address).call()));
  // for i in 0..balance: tokenId = tokenOfOwnerByIndex(address, i); domain = _tokenURIs(tokenId)
  ```
- Metadata (avatar/website):
  ```ts
  const tokenId = await contract.genTokenId(domain).call();
  const values = await contract.getMany(metadataKeys, tokenId).call(); // string[] theo thứ tự keys
  ```

Chuẩn hoá: `reverseOf`/`_tokenURIs` trả rỗng/`"0x"`/null ⇒ coi như không có domain (`undefined`).

---

## 2. tronWeb dùng chung (client)

Client giữ **một** provider tronWeb lazy, tái dùng cho cả identity lẫn bridge-broadcast:
```ts
let sharedTronWeb: TronWeb | undefined;
function getSharedTronWeb(manager: WalletManager): TronWeb {
  if (sharedTronWeb) return sharedTronWeb;
  const net = manager.getNetwork();
  const fullHost = net.fullHost ?? net.httpRpcUrl ?? net.rpcUrl; // mainnet: https://api.trongrid.io
  sharedTronWeb = new TronWeb({ fullHost });
  return sharedTronWeb;
}
```
- `TronWeb` import lazy (`await import("tronweb")`) như tiền lệ broadcast, tránh phình bundle.
- View call cần `owner_address`: set địa chỉ ví đang kết nối trước khi call:
  ```ts
  tronWeb.setAddress(account.address);
  ```
  (địa chỉ này chỉ để làm `from` cho view, không ký.)
- Nếu bridge đã có `tronWeb` injectable (`tronweb3Bridge.tronWeb`), **ưu tiên dùng chính nó** làm `sharedTronWeb` để đúng tinh thần "dùng chung với core".

---

## 3. Resolver (đường chính, thay `createTronDomainIdentityResolver`)

```ts
export function createTronDomainIdentityResolver(
  opts: { manager: WalletManager; contractAddress?: string; metadataKeys?: string[]; timeoutMs?: number } 
): TronIdentityResolver {
  const contractAddress = opts.contractAddress ?? TRX_DOMAINS_MAINNET_CONTRACT;
  const metadataKeys = opts.metadataKeys ?? ["avatar", "website"];
  const timeoutMs = opts.timeoutMs ?? 8000;
  let contractPromise: Promise<any> | undefined;

  return async (account, context) => {
    // mainnet-only guard
    if (context.network.networkType !== "MAINNET") return undefined;

    const run = (async () => {
      const tronWeb = getSharedTronWeb(opts.manager);
      tronWeb.setAddress(account.address);
      contractPromise ??= tronWeb.contract().at(contractAddress);
      const contract = await contractPromise;

      let domain = normalizeDomain(await contract.reverseOf(account.address).call());
      if (!domain) domain = await firstOwnedDomain(contract, account.address); // optional fallback
      if (!domain) return undefined;

      const identity: TronIdentity = { domain, displayName: domain };
      if (metadataKeys.length) {
        try {
          const tokenId = await contract.genTokenId(domain).call();
          const values = (await contract.getMany(metadataKeys, tokenId).call()) as unknown[];
          const meta = Object.fromEntries(
            metadataKeys.map((k, i) => [k, typeof values[i] === "string" ? (values[i] as string).trim() : ""])
                        .filter(([, v]) => v)
          );
          identity.metadata = meta;
          if (meta.avatar) identity.avatar = meta.avatar;
          if (meta.website) identity.website = meta.website;
        } catch { /* metadata optional, bỏ qua nếu lỗi */ }
      }
      return identity;
    })();

    // timeout để không treo UI khi RPC chậm
    return await Promise.race([
      run,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), timeoutMs))
    ]);
  };
}
```
`normalizeDomain`: chỉ `trim`, loại `""`/`"0x"`/`null`/`undefined` → `undefined`. **GIỮ NGUYÊN hậu tố (TLD) contract trả về — KHÔNG ép `.trx`, KHÔNG tự thêm/đổi TLD.** TRX Domains đa TLD: `.trx`, `.sun`, `.usdd`, … nên phải dùng đúng chuỗi `reverseOf`/`_tokenURIs` trả ra (vd `alice.sun`, `bob.usdd`). Nếu contract trả tên không có dấu chấm thì để nguyên (không đoán TLD) — verify dạng thật khi QA.

`firstOwnedDomain` (optional): `balanceOf` → loop `tokenOfOwnerByIndex` + `_tokenURIs`, lấy domain đầu tiên. Có thể bỏ ở v1 nếu chỉ cần default domain.

---

## 4. Cache
Giữ cache in-memory sẵn có: key `"${network.id}:${address}"`, TTL `config.identity.cacheTtlMs ?? 10*60_000`. Thêm: cache `contractPromise` (đã có trong resolver) để khỏi `.at()` lại. Cân nhắc clear cache khi `networkChanged` (dù mainnet-only, đổi mạng thì domain cũ vô nghĩa).

---

## 5. Config rút gọn (bỏ testnet/defaultNetwork)
```ts
export type WalletClientIdentityConfig = {
  enabled?: boolean;
  resolver?: TronIdentityResolver;      // app tự override nếu muốn
  contractAddress?: string;             // default = mainnet const
  metadataKeys?: string[];              // default ["avatar","website"]
  failSilently?: boolean;               // default true
  cacheTtlMs?: number;                  // default 10 phút
  resolverTimeoutMs?: number;           // MỚI, default 8000
};
```
Xoá `TronDomainSdkConfig`/`trondomain`/`testnet`/`mainnet`/`defaultNetwork` và `CONFIGURATION_ERROR` liên quan. `refreshIdentity()` giữ nguyên luồng: cache-hit → return; else resolve → `manager.setSession(...account.domain/displayName/avatar...)` → emit `accountChanged` (UI tự cập nhật). `failSilently` mặc định nuốt lỗi → fallback địa chỉ rút gọn.

---

## 6. Việc phải làm (route-map)
1. `client/package.json`: gỡ `trondomainjs` khỏi `dependencies`.
2. `client/src/index.ts`: xoá `loadTronDomainSdk`/`createCompatibleTronDomainSdk`/`TronDomainModule`/`DEFAULT_TRON_DOMAIN_CONFIG`/`TronDomainSdkConfig`; thêm `getSharedTronWeb` + resolver mới (mục 3); rút gọn `WalletClientIdentityConfig` (mục 5).
3. Dùng **chung** tronWeb với bridge broadcast (nếu bridge có `tronWeb` inject thì tái dùng, tránh 2 instance).
4. `react`: giữ debounce `refreshIdentity` (260ms) — không đổi.
5. Test (mục 7).
6. Windows-side: `pnpm -r typecheck && pnpm test && pnpm build:browser`.

---

## 7. Test (mock tronWeb, không cần mạng thật)
- Inject mock qua biến test sẵn có (`__tronWalletKitTronDomainSdkForTest` → đổi thành mock tronWeb/contract): `contract.reverseOf().call()` trả `"alice.trx"` → account được enrich `domain/displayName`.
- **Đa TLD**: mock trả `"bob.sun"` và `"carol.usdd"` → `domain`/`displayName` giữ **nguyên hậu tố** (không bị ép về `.trx`); `genTokenId` được gọi với đúng chuỗi đầy đủ (`"bob.sun"`).
- reverseOf rỗng → resolver trả `undefined` (không domain), account giữ địa chỉ.
- metadata: `getMany(["avatar","website"], id)` trả `["https://.../a.png",""]` → `avatar` set, `website` không.
- **mainnet-only**: `context.network.networkType !== "MAINNET"` (vd Nile) → trả `undefined`, **không** gọi contract, **không** ném lỗi.
- timeout: mock reverseOf treo > `resolverTimeoutMs` → resolver trả `undefined` (không đơ).
- Giữ test cũ xanh; cập nhật test đang mock SDK cũ sang mock tronWeb.

---

## 8. Ràng buộc
- Chỉ ở client; core/adapter không đụng identity.
- Không tạo tronWeb riêng cho identity — dùng chung instance với core/broadcast.
- Mainnet-only: mạng khác bỏ qua êm, không lỗi.
- `failSilently` mặc định true — lỗi resolve không được phá connect/UI.
- Không hardcode private key; view call chỉ set `owner_address` = địa chỉ ví đang kết nối.
