export async function copyToClipboard(text: string, documentRef: Document = globalThis.document): Promise<boolean> {
  const view = documentRef.defaultView;
  try {
    await view?.navigator.clipboard?.writeText?.(text);
    if (view?.navigator.clipboard?.writeText) return true;
  } catch {
    // Fall through to the legacy textarea copy path.
  }

  const body = documentRef.body;
  if (!body || typeof documentRef.execCommand !== "function") return false;
  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.insetInlineStart = "-9999px";
  textarea.style.top = "0";
  body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  try {
    return documentRef.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
