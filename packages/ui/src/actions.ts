import { escapeHtml } from "./utils";

export function createActionContentHtml(icon: string, label: string, state?: "success" | "busy"): string {
  const stateAttr = state ? ` data-state="${state}"` : "";
  return `<span class="twk-action-icon"${stateAttr}>${icon}</span><span class="twk-action-label">${escapeHtml(label)}</span>`;
}
