export function formatExplorerUrl(template: string | undefined, value: string): string | undefined {
  return template?.replace("{hash}", value).replace("{address}", value);
}

export function normalizeTrxAmount(value: string | number | bigint): string {
  return typeof value === "bigint" ? value.toString() : String(value);
}
