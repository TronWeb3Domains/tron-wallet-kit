import { formatWalletError } from "@tron-wallet-kit/core";

export function ledgerConnectErrorMessage(error: unknown, supportsHid: boolean): string {
  if (!supportsHid) return "Ledger requires a desktop browser with WebHID support. Use Chrome or Edge on HTTPS or localhost.";
  const formatted = formatWalletError(error, { includeDetails: true, maxDetailLength: 240 });
  const detail = formatted.details ?? formatted.message;
  if (/dynamically imported module|importing a module script failed|failed to fetch|failed to resolve module|cannot find module/i.test(detail)) {
    return "Ledger could not be loaded. Refresh the page and try again.";
  }
  if (/0x6700|0x6d00|0x6e00|incorrect length|cla_not_supported|ins_not_supported/i.test(detail)) {
    return `Open the TRON app on your unlocked Ledger, then try again. ${detail}`;
  }
  if (/unable to open|failed to open|already open|busy|claim|access denied/i.test(detail)) {
    return `The browser could not open your Ledger. Close Ledger Live and other wallet tabs, reconnect the device, then try again. ${detail}`;
  }
  if (/0x6985|0x5501|locked/i.test(detail)) {
    return `Unlock your Ledger and approve the request on the device. ${detail}`;
  }
  if (formatted.code === "USER_REJECTED") {
    return "Device selection or confirmation was cancelled. Try again and approve the request.";
  }
  if (formatted.code === "REQUEST_TIMEOUT") {
    return "Ledger did not respond in time. Keep the TRON app open and approve the address request on the device, then try again.";
  }
  return detail;
}
