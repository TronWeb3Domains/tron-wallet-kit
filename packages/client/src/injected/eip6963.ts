type Eip6963ProviderDetail = {
  info?: {
    name?: string;
    rdns?: string;
  };
  provider?: unknown;
};

const REQUEST_EVENTS = ["eip6963:requestProvider", "TIP6963:requestProvider"] as const;
const ANNOUNCE_EVENTS = ["eip6963:announceProvider", "TIP6963:announceProvider"] as const;
const DEFAULT_DISCOVERY_WINDOW_MS = 80;

let discovery: Promise<ReadonlyMap<string, Eip6963ProviderDetail>> | undefined;
let announcedProviders = new Map<string, Eip6963ProviderDetail>();

export async function hasAnnouncedWalletRdns(rdns: readonly string[] = [], timeoutMs = DEFAULT_DISCOVERY_WINDOW_MS): Promise<boolean> {
  if (rdns.length === 0) return false;
  const normalized = new Set(rdns.map(normalizeRdns));
  for (const key of normalized) {
    if (announcedProviders.has(key)) return true;
  }
  const providers = await discoverWalletProviders(timeoutMs);
  for (const key of normalized) {
    if (providers.has(key)) return true;
  }
  return false;
}

export function resetWalletProviderDiscoveryForTests(): void {
  discovery = undefined;
  announcedProviders = new Map();
}

function discoverWalletProviders(timeoutMs: number): Promise<ReadonlyMap<string, Eip6963ProviderDetail>> {
  if (discovery) return discovery;
  const target = getEventTarget();
  if (!target) return Promise.resolve(announcedProviders);
  discovery = new Promise((resolve) => {
    const listeners: Array<{ eventName: string; listener: EventListener }> = [];
    const cleanup = () => {
      for (const { eventName, listener } of listeners) target.removeEventListener(eventName, listener);
      listeners.length = 0;
    };
    const finish = () => {
      cleanup();
      resolve(new Map(announcedProviders));
    };
    const onAnnounce = (event: Event) => {
      const detail = readEventDetail(event);
      const rdns = normalizeRdns(detail?.info?.rdns);
      if (!rdns || !detail) return;
      announcedProviders.set(rdns, detail);
    };
    for (const eventName of ANNOUNCE_EVENTS) {
      target.addEventListener(eventName, onAnnounce);
      listeners.push({ eventName, listener: onAnnounce });
    }
    for (const eventName of REQUEST_EVENTS) {
      target.dispatchEvent(createEvent(eventName));
    }
    setTimeout(finish, timeoutMs);
  });
  return discovery;
}

function getEventTarget(): (EventTarget & { dispatchEvent(event: Event): boolean }) | undefined {
  const candidate = globalThis as unknown as Partial<EventTarget> & { dispatchEvent?: unknown };
  if (
    typeof candidate.addEventListener === "function" &&
    typeof candidate.removeEventListener === "function" &&
    typeof candidate.dispatchEvent === "function"
  ) {
    return candidate as EventTarget & { dispatchEvent(event: Event): boolean };
  }
  return undefined;
}

function createEvent(eventName: string): Event {
  if (typeof Event === "function") return new Event(eventName);
  return { type: eventName } as Event;
}

function readEventDetail(event: Event): Eip6963ProviderDetail | undefined {
  const detail = (event as Event & { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return undefined;
  return detail as Eip6963ProviderDetail;
}

function normalizeRdns(rdns: unknown): string {
  return typeof rdns === "string" ? rdns.trim().toLowerCase() : "";
}
