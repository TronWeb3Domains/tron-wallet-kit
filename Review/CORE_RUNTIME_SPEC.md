# Spec: Hardening core runtime (session · autoReconnect · timeout · callback)

Mục tiêu: nâng `packages/core` của TRON Wallet Kit lên ngang mức "chín" của XRPL Wallet Kit về **vòng đời kết nối**, để kit chạy mượt, không treo, và **luôn lắng nghe đúng thứ ví trả về** (event injected + luồng quay về từ ví mobile/deeplink).

Tham chiếu chuẩn: `xrplWalletKit/packages/core` (`manager.ts`, `events.ts`, `errors.ts`, `storage.ts`, `networks.ts`). Spec này chỉ mô tả phần TRON còn thiếu/yếu — **không** đụng UI, không thêm business logic (XRPDomains/setPrimary…), giữ nguyên hard-rule của kit.

---

## 0. Tóm tắt gap (đã audit code hiện tại)

| Vùng | Hiện trạng TRON | Cần làm |
| --- | --- | --- |
| Timeout | Có field `ConnectOptions.timeoutMs` nhưng **không enforce ở đâu** | Thêm `withTimeout` + AbortController cho connect/disconnect/sign |
| Cancel/Abort | Không có `pendingAbortController`, không huỷ connect cũ khi đổi ví | Thêm abort + `cancelPendingConnection()` wiring |
| autoReconnect | Có, nhưng: chạy trùng được, không fallback khi adapter thiếu `restoreSession`, không validate session, không TTL | Dedup guard + fallback + validate + expiry |
| recoverSession (ví mobile quay về) | Adapter khai báo `recoverSession/canRecoverSession` nhưng manager **không bao giờ gọi** | Thêm `recoverPendingReturnSession()` + retry backoff |
| session_expired | Event có trong type nhưng **không bao giờ emit** | Emit khi session hỏng/hết hạn |
| disconnect timeout | `await adapter.disconnect()` trần → có thể treo | Bọc timeout 2000ms, emit `session_stale` nếu quá hạn |
| Error | `WalletKitError` thô, code rải rác dạng string literal | Thêm enum code + factory + `normalizeWalletError` |
| Session envelope | `readStoredSession` chỉ check `version===1`, tin JSON mù | Thêm `isValidStoredSession` + migration legacy |
| destroy/cleanup | Không có | Thêm `destroy()` |

Các phần **đã ổn, giữ nguyên**: `WalletEventEmitter`, callback `onUri/onAccountChanged/onNetworkChanged/onDisconnect` + `handleAdapterAccountChanged/NetworkChanged`, `createStoredSession`/`toJsonSafeValue` (lọc circular/bigint), `NetworkRegistry`, transaction in-memory.

---

## 1. Timeout + Abort (ưu tiên cao nhất)

### 1.1 Helper `withTimeout` (port từ XRPL `manager.ts`)
```ts
const DEFAULT_CONNECT_TIMEOUT_MS = 180_000;   // ví mobile/deeplink cần rộng — 3 phút
const DEFAULT_DISCONNECT_TIMEOUT_MS = 2_000;
const DEFAULT_SIGN_TIMEOUT_MS = 180_000;

private async withTimeout<T>(
  promise: Promise<T> | undefined,
  timeoutMs: number
): Promise<{ timedOut: boolean; value?: T }> {
  if (!promise) return { timedOut: false };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ timedOut: true }>((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
  });
  try {
    return await Promise.race([
      promise.then((value) => ({ timedOut: false, value })),
      timeout
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
```

### 1.2 AbortController trong `connect`
Thêm state: `private pendingAdapterId: string | null = null;` và `private pendingAbortController?: AbortController;`.

Luồng `connect(adapterId, options)` sửa thành:
1. `await this.cancelPendingConnection(adapterId);` — huỷ connect đang treo của ví khác.
2. Nếu `activeAdapterId && activeAdapterId !== adapterId` → `await this.disconnect();`.
3. `this.pendingAdapterId = adapterId; this.pendingAbortController = new AbortController();`
4. emit `connecting`.
5. `if (adapter.isAvailable && !(await adapter.isAvailable())) throw createWalletError.walletNotAvailable(adapter.metadata.name);`
6. Chạy connect có timeout:
   ```ts
   const signal = options.signal ?? this.pendingAbortController.signal;
   const timeoutMs = options.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
   const { timedOut, value: result } = await this.withTimeout(
     adapter.connect({ ...connectOptions, network, signal }),
     timeoutMs
   );
   if (timedOut) throw createWalletError.requestTimeout(`${adapter.metadata.name} connect timed out`);
   if (signal.aborted || this.pendingAdapterId !== adapterId) throw createWalletError.connectionRejected(adapter.metadata.name);
   ```
7. Build session (giữ `createSession` hiện có) → `setSession` → emit `connected`.
8. `finally { if (this.pendingAdapterId === adapterId) { this.pendingAdapterId = null; this.pendingAbortController = undefined; } }`

> Lưu ý: thêm `signal?: AbortSignal` vào `ConnectOptions`. Adapter TRON hiện chưa dùng signal cũng không sao (optional). Bridge/tương lai có thể check `signal.aborted`.

### 1.3 `cancelPendingConnection`
```ts
async cancelPendingConnection(exceptAdapterId?: string): Promise<void> {
  const pending = this.pendingAdapterId;
  if (!pending || pending === exceptAdapterId) return;
  this.pendingAbortController?.abort();
  this.pendingAbortController = undefined;
  this.pendingAdapterId = null;
  try { await this.adapters.get(pending)?.cancelPendingConnection?.(); }
  catch (error) { /* swallow, log qua events 'error' nếu muốn */ }
  this.events.emit("session_stale", { reason: "connection_cancelled" });
}
```
(TRON `session_stale` payload hiện là `{ session? }` — mở rộng thêm optional `reason?: string; attempts?: number` như XRPL, xem mục 4.)

### 1.4 `disconnect` có timeout
```ts
async disconnect(): Promise<void> {
  const adapterId = this.activeAdapterId ?? undefined;
  const adapter = this.getAdapter();
  try {
    await this.cancelPendingConnection();
    const { timedOut } = await this.withTimeout(adapter?.disconnect?.(), DEFAULT_DISCONNECT_TIMEOUT_MS);
    if (adapter?.disconnect && timedOut) {
      this.events.emit("session_stale", { reason: "disconnect_timeout" });
      await adapter.cancelPendingConnection?.();
    }
  } catch (error) {
    this.events.emit("error", { adapterId, error });
    await adapter?.cancelPendingConnection?.().catch(() => {});
  } finally {
    this.activeAdapterId = null;
    this.session = null;
    this.transactions.length = 0;
    await this.storage.removeItem(this.storageKey);
    this.events.emit("disconnected", { adapterId });
  }
}
```

---

## 2. Session envelope: validate + migrate + TTL

Sửa `readStoredSession` để **không tin JSON mù**:
```ts
export const WALLET_STORAGE_VERSION = 1;

private parseStoredSession(serialized: string): WalletSession | null {
  try {
    const parsed = JSON.parse(serialized) as Partial<StoredWalletSessionEnvelope> | WalletSession;
    // versioned
    if (parsed && typeof parsed === "object" && "version" in parsed && "session" in parsed) {
      if (parsed.version !== WALLET_STORAGE_VERSION) return null;
      return this.isValidStoredSession(parsed.session) ? (parsed.session as WalletSession) : null;
    }
    // legacy unversioned → migrate on read
    return this.isValidStoredSession(parsed) ? (parsed as WalletSession) : null;
  } catch { return null; }
}

private isValidStoredSession(value: unknown): value is WalletSession {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<WalletSession>;
  if (typeof s.adapterId !== "string") return false;
  if (typeof s.connectedAt !== "number") return false;
  if (!s.account || typeof (s.account as Partial<WalletAccount>).address !== "string") return false;
  if (typeof s.expiresAt === "number" && s.expiresAt <= Date.now()) return false; // TTL
  return true;
}
```
`readStoredSession` gọi `parseStoredSession`; nếu `null` → `removeItem` + trả `null` (autoReconnect sẽ emit `session_expired`, mục 3).

> TRON `WalletSession` có thêm `id/walletName/network/updatedAt` so với XRPL — `isValidStoredSession` chỉ cần check field tối thiểu như trên để không phá session hợp lệ; migration legacy chỉ cần các field tối thiểu, phần thiếu để `createSession` bù khi restore.

---

## 3. autoReconnect hardening

### 3.1 Dedup guard (tránh chạy 2 lần khi React StrictMode/double-mount)
```ts
private autoReconnectPromise?: Promise<WalletSession | null>;

async autoReconnect(): Promise<WalletSession | null> {
  if (!this.config.autoReconnect) return null;
  if (this.autoReconnectPromise) return this.autoReconnectPromise;
  this.autoReconnectPromise = this.runAutoReconnect().finally(() => { this.autoReconnectPromise = undefined; });
  return this.autoReconnectPromise;
}
```

### 3.2 `runAutoReconnect` — có fallback + emit đúng
```ts
private async runAutoReconnect(): Promise<WalletSession | null> {
  const serialized = await this.storage.getItem(this.storageKey);
  if (!serialized) return this.recoverPendingReturnSession();   // xem mục 3.3

  const stored = this.parseStoredSession(serialized);
  if (!stored) {
    await this.storage.removeItem(this.storageKey);
    this.events.emit("session_expired", {});
    return null;
  }
  const adapter = this.adapters.get(stored.adapterId);
  if (!adapter) {
    await this.storage.removeItem(this.storageKey);
    this.events.emit("session_expired", { session: stored });
    return null;
  }
  try {
    // ưu tiên restoreSession của adapter
    if (adapter.restoreSession) {
      const restored = await adapter.restoreSession(stored);
      if (!restored) { this.events.emit("session_stale", { session: stored, reason: "restore_unavailable" }); return null; }
      const session = this.createSession(adapter, restored, stored.network, stored);
      await this.setSession(session);
      this.events.emit("session_restored", { session });
      this.events.emit("connected", { session });
      return session;
    }
    // fallback: adapter không có restoreSession → dựa isAvailable + tái dùng session cache
    if (adapter.isAvailable && !(await adapter.isAvailable())) {
      this.events.emit("session_stale", { session: stored, reason: "adapter_unavailable" });
      return null;
    }
    await this.setSession(stored);
    this.events.emit("session_restored", { session: stored, stale: true }); // stale=true: chưa được adapter xác thực lại
    this.events.emit("connected", { session: stored });
    return stored;
  } catch (error) {
    await this.storage.removeItem(this.storageKey);
    this.events.emit("session_expired", { session: stored });
    this.events.emit("error", { adapterId: stored.adapterId, error });
    return null;
  }
}
```

### 3.3 `recoverPendingReturnSession` — luồng quay về từ ví mobile/deeplink
Đây chính là phần **"lắng nghe được ví trả về"** khi user rời trang sang app ví rồi quay lại (không có stored session vì kết nối chưa hoàn tất). Adapter đã có `canRecoverSession/recoverSession` nhưng manager chưa gọi.

```ts
const RECOVER_SESSION_RETRY_DELAYS_MS = [0, 700, 1600, 3000];

private delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

private async recoverPendingReturnSession(): Promise<WalletSession | null> {
  const network = this.getNetwork();
  const candidates: WalletAdapter[] = [];
  for (const adapter of this.adapters.values()) {
    if (!adapter.recoverSession) continue;
    try {
      if (adapter.canRecoverSession && !(await adapter.canRecoverSession({ network, walletId: adapter.metadata.id }))) continue;
      candidates.push(adapter);
    } catch { /* skip */ }
  }
  if (!candidates.length) return null;

  const announced = new Set<string>();
  const delays = this.config.recoveryRetryDelaysMs ?? RECOVER_SESSION_RETRY_DELAYS_MS;
  for (const d of delays) {
    if (d > 0) await this.delay(d);
    for (const adapter of candidates) {
      try {
        if (!announced.has(adapter.metadata.id)) {
          announced.add(adapter.metadata.id);
          this.events.emit("connecting", { adapterId: adapter.metadata.id, recovering: true });
        }
        const recovered = await adapter.recoverSession?.({ network, walletId: adapter.metadata.id });
        if (!recovered) continue;
        const session = this.createSession(adapter, recovered, network);
        await this.setSession(session);
        this.events.emit("session_restored", { session });
        this.events.emit("connected", { session });
        return session;
      } catch { /* next */ }
    }
  }
  for (const adapter of candidates) {
    this.events.emit("session_stale", { reason: "recover_unavailable", attempts: delays.length });
    void adapter.cancelPendingConnection?.();
  }
  return null;
}
```

Thêm vào `WalletManagerConfig`: `recoveryRetryDelaysMs?: number[];`.
Mở rộng `connecting` payload: `{ adapterId: string; recovering?: boolean }`.

> Gọi `autoReconnect()` là **explicit** (app tự gọi lúc mount), KHÔNG chạy trong constructor — giữ như XRPL và như hiện tại. Package `react`/`next` nên gọi `autoReconnect()` trong effect mount.

---

## 4. Event/callback hoàn thiện

### 4.1 Mở rộng payload cho khớp XRPL (không phá event cũ)
```ts
connecting: { adapterId: string; recovering?: boolean };
session_restored: { session: WalletSession; stale?: boolean };
session_stale: { session?: WalletSession; reason?: string; attempts?: number };
session_expired: { session?: WalletSession };
```

### 4.2 `session_expired` phải được emit
Hiện chưa emit ở đâu. Sau mục 3, nó được emit khi: parse fail, adapter biến mất, restore throw. Đảm bảo có test.

### 4.3 `destroy()` cho cleanup (SPA route change / unmount)
```ts
destroy(): void {
  void this.cancelPendingConnection();
  this.events.removeAllListeners();
}
```
Package `react`/`next` gọi `destroy()` khi provider unmount.

### 4.4 Giữ nguyên callback injected đã có
`handleAdapterAccountChanged/handleAdapterNetworkChanged` + wiring `onAccountChanged/onNetworkChanged/onDisconnect` trong `connect` đã đúng — **không sửa**. Chỉ đảm bảo `recoverSession`/`restoreSession` cũng nhận cùng bộ callback nếu adapter cần phát event sau khi restore (truyền `connectOptions` callback vào nếu chữ ký cho phép; nếu không, adapter tự re-subscribe khi restore).

---

## 5. Error normalization

Thêm vào `errors.ts` (giữ class `WalletKitError` hiện có, bổ sung):
```ts
export const WalletKitErrorCode = {
  WALLET_NOT_FOUND: "WALLET_NOT_FOUND",
  WALLET_NOT_AVAILABLE: "WALLET_UNAVAILABLE", // giữ literal cũ đang dùng để không phá call-site
  CONNECTION_FAILED: "CONNECTION_FAILED",
  CONNECTION_REJECTED: "USER_REJECTED",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  SIGN_FAILED: "SIGN_MESSAGE_FAILED",
  SIGN_REJECTED: "USER_REJECTED",
  UNSUPPORTED: "UNSUPPORTED",
  NOT_CONNECTED: "NO_SESSION",
  UNKNOWN: "UNKNOWN_ERROR"
} as const;

export const createWalletError = {
  walletNotAvailable: (name: string, cause?: unknown) =>
    new WalletKitError(WalletKitErrorCode.WALLET_NOT_AVAILABLE, `${name} provider is not available`, cause),
  connectionRejected: (name: string, cause?: unknown) =>
    new WalletKitError(WalletKitErrorCode.CONNECTION_REJECTED, `${name} connection was rejected`, cause),
  connectionFailed: (name: string, cause?: unknown) =>
    new WalletKitError(WalletKitErrorCode.CONNECTION_FAILED, `Failed to connect ${name}`, cause),
  requestTimeout: (message: string, cause?: unknown) =>
    new WalletKitError(WalletKitErrorCode.REQUEST_TIMEOUT, message, cause),
  notConnected: () => new WalletKitError(WalletKitErrorCode.NOT_CONNECTED, "No wallet is connected"),
  unknown: (cause?: unknown) => new WalletKitError(WalletKitErrorCode.UNKNOWN, String(cause), cause)
};

export function normalizeWalletError(error: unknown): WalletKitError {
  if (error instanceof WalletKitError) return error;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (/reject|denied|cancel|closed|4001/.test(msg)) return createWalletError.connectionRejected("Wallet", error);
  if (/timeout|timed out/.test(msg)) return createWalletError.requestTimeout(String(error), error);
  if (/not available|not installed|not found/.test(msg)) return createWalletError.walletNotAvailable("Wallet", error);
  return createWalletError.unknown(error);
}
```
Dùng `normalizeWalletError` ở catch của `connect/signMessage/signTransaction/submitTransaction` trước khi emit `rejected/error`. **Quan trọng**: giữ nguyên literal code đang tồn tại ở call-site để không vỡ hành vi/test hiện có — chỉ ánh xạ, không đổi bừa.

---

## 6. Bổ sung type

`ConnectOptions`: `signal?: AbortSignal;` (đã có `timeoutMs`).
`WalletManagerConfig`: `recoveryRetryDelaysMs?: number[];`.
Mở rộng payload event mục 4.1.
Không đổi contract adapter (đã có đủ `restoreSession/recoverSession/canRecoverSession/cancelPendingConnection`).

---

## 7. Test (thêm vào `test/`)

Dùng mock adapter (không cần ví thật), Node test runner như hiện có:
1. **timeout connect**: adapter.connect không resolve → sau `timeoutMs` throw `REQUEST_TIMEOUT`, `pendingAdapterId` reset.
2. **cancel khi đổi ví**: đang connect A, gọi connect B → A bị abort, emit `session_stale{reason:"connection_cancelled"}`.
3. **disconnect timeout**: adapter.disconnect treo → sau 2s emit `session_stale{reason:"disconnect_timeout"}`, state vẫn được clear ở finally.
4. **autoReconnect dedup**: gọi `autoReconnect()` 2 lần song song → `runAutoReconnect` chạy đúng 1 lần (spy).
5. **autoReconnect fallback**: adapter không có `restoreSession` nhưng `isAvailable()===true` → emit `session_restored{stale:true}` + `connected`.
6. **session validate/expiry**: stored có `expiresAt` quá khứ → `parseStoredSession`→null → `session_expired`.
7. **legacy migration**: stored dạng unversioned hợp lệ → restore được.
8. **recoverPendingReturnSession**: không có stored, adapter `canRecoverSession→true`, `recoverSession` trả session ở lần retry thứ 2 → emit `connecting{recovering:true}` rồi `connected`; nếu hết retry → `session_stale{reason:"recover_unavailable"}`.
9. **destroy**: sau destroy, listener không còn được gọi.
10. **normalizeWalletError**: các message reject/timeout/not-available map đúng code.

Giữ 100% test cũ xanh (`manager.test.ts`, `capabilities.test.ts`).

---

## 8. Lộ trình cho coder

1. `errors.ts`: enum code + factory + `normalizeWalletError` (giữ literal cũ).
2. `types.ts`: `ConnectOptions.signal`, `WalletManagerConfig.recoveryRetryDelaysMs`, mở rộng payload event.
3. `manager.ts`:
   - `withTimeout` + abort state + `cancelPendingConnection`.
   - `connect` bọc timeout + abort.
   - `disconnect` bọc timeout.
   - `parseStoredSession/isValidStoredSession` + `readStoredSession` dùng nó.
   - `autoReconnect` dedup + `runAutoReconnect` fallback + `recoverPendingReturnSession`.
   - emit `session_expired`, `connecting{recovering}`, `session_restored{stale}`.
   - `destroy()`.
   - catch dùng `normalizeWalletError`.
4. `react`/`next`: gọi `autoReconnect()` khi mount, `destroy()` khi unmount (nếu chưa).
5. Test mục 7.
6. Chạy Windows-side: `pnpm -r typecheck && pnpm test && pnpm build` (sandbox không typecheck được trên mount OneDrive).

---

## 9. Ràng buộc (không được phá)

- Không thêm business/app API vào core/adapter.
- Không hardcode WalletConnect projectId.
- Không đổi bừa error-code literal đang được test/call-site dùng — chỉ chuẩn hoá qua factory.
- `createStoredSession`/`toJsonSafeValue` (lọc circular/bigint) giữ nguyên — mọi session ghi ra storage phải đi qua nó.
- `autoReconnect` vẫn explicit (app gọi), không auto-run trong constructor.
- Timeout mặc định connect/sign phải **đủ rộng** cho ví mobile (QR/deeplink) — 180s, không rút ngắn kiểu 30s.
