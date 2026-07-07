export function shortenAddress(value: string): string {
  return value.length <= 16 ? value : `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
