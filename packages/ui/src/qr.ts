import QRCode from "qrcode";
import type { QrCodeOptions } from "./types";

/** Fallback QR colors used when no token/option color is provided (QR always renders dark-on-white). */
export const QR_FALLBACK_DARK = "#111827";
export const QR_FALLBACK_LIGHT = "#ffffff";

export async function createQrDataUrl(value: string, options: QrCodeOptions = {}): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: options.errorCorrectionLevel ?? "H",
    margin: options.margin ?? 2,
    width: options.width ?? 256,
    color: {
      dark: options.foreground ?? QR_FALLBACK_DARK,
      light: options.background ?? QR_FALLBACK_LIGHT
    }
  });
}

export type RenderWalletQrOptions = QrCodeOptions & {
  logo?: string;
  preferStyled?: boolean;
};

export type RenderWalletQrResult = {
  renderer: "styled" | "fallback";
  dataUrl?: string;
};

type QrCodeStylingInstance = {
  append(target: HTMLElement): void;
  getRawData(extension: "svg"): Promise<Blob | null>;
};

type QrCodeStylingConstructor = new (options: Record<string, unknown>) => QrCodeStylingInstance;

type StyledQrConfig = {
  width: number;
  margin: number;
  foreground: string;
  background: string;
  errorCorrectionLevel: NonNullable<QrCodeOptions["errorCorrectionLevel"]>;
  logo?: string;
  logoSize?: number;
  logoMargin?: number;
};

/** Single source of truth for the styled (dotted) QR look shared by every QR surface. */
function buildStyledQrOptions(value: string, config: StyledQrConfig): Record<string, unknown> {
  return {
    type: "svg",
    width: config.width,
    height: config.width,
    data: value,
    margin: config.margin,
    qrOptions: { errorCorrectionLevel: config.errorCorrectionLevel },
    dotsOptions: { type: "dots", roundSize: true, color: config.foreground },
    cornersSquareOptions: { type: "extra-rounded", color: config.foreground },
    cornersDotOptions: { type: "dot", color: config.foreground },
    backgroundOptions: { color: config.background },
    ...(config.logo
      ? {
          image: config.logo,
          imageOptions: {
            crossOrigin: "anonymous",
            hideBackgroundDots: true,
            imageSize: config.logoSize ?? 0.28,
            margin: config.logoMargin ?? 6
          }
        }
      : {})
  };
}

export async function renderWalletQr(target: HTMLElement, value: string, options: RenderWalletQrOptions = {}): Promise<RenderWalletQrResult> {
  target.replaceChildren();
  const width = options.width ?? 208;
  const colors = resolveQrColors(target, options);

  if (options.preferStyled !== false) {
    try {
      const QRCodeStyling = await loadQrCodeStyling();
      const styled = new QRCodeStyling(buildStyledQrOptions(value, {
        width,
        margin: options.margin ?? 0,
        foreground: colors.foreground,
        background: colors.background,
        errorCorrectionLevel: options.errorCorrectionLevel ?? "Q",
        ...(options.logo ? { logo: options.logo, logoSize: 0.28, logoMargin: 6 } : {})
      }));
      styled.append(target);
      target.dataset.twkQrRenderer = "styled";
      return { renderer: "styled" };
    } catch {
      target.replaceChildren();
    }
  }

  const dataUrl = await createQrDataUrl(value, {
    ...options,
    width,
    foreground: colors.foreground,
    background: colors.background,
    errorCorrectionLevel: options.errorCorrectionLevel ?? "H"
  });
  const image = target.ownerDocument.createElement("img");
  image.src = dataUrl;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  target.append(image);
  target.dataset.twkQrRenderer = "fallback";
  return { renderer: "fallback", dataUrl };
}

export async function createStyledQrDataUrl(value: string, options: RenderWalletQrOptions = {}): Promise<string> {
  const width = options.width ?? 264;
  const foreground = options.foreground ?? QR_FALLBACK_DARK;
  const background = options.background ?? "transparent";
  try {
    const QRCodeStyling = await loadQrCodeStyling();
    const styled = new QRCodeStyling(buildStyledQrOptions(value, {
      width,
      margin: options.margin ?? 0,
      foreground,
      background,
      errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
      ...(options.logo ? { logo: options.logo, logoSize: 0.26, logoMargin: 5 } : {})
    }));
    const raw = await styled.getRawData("svg");
    const svgText = raw && typeof raw.text === "function" ? await raw.text() : "";
    if (svgText.includes("<svg")) return `data:image/svg+xml,${encodeURIComponent(svgText)}`;
  } catch {
    // fall through to plain QR
  }
  return createQrDataUrl(value, {
    ...options,
    width,
    foreground: foreground === "transparent" ? QR_FALLBACK_DARK : foreground,
    background: background === "transparent" ? QR_FALLBACK_LIGHT : background,
    errorCorrectionLevel: options.errorCorrectionLevel ?? "H"
  });
}

async function loadQrCodeStyling(): Promise<QrCodeStylingConstructor> {
  const module = (await import("qr-code-styling")) as unknown as {
    default?: QrCodeStylingConstructor;
    QRCodeStyling?: QrCodeStylingConstructor;
  };
  const QRCodeStyling = module.default ?? module.QRCodeStyling;
  if (!QRCodeStyling) throw new Error("qr-code-styling did not expose a constructor.");
  return QRCodeStyling;
}

function resolveQrColors(target: HTMLElement, options: RenderWalletQrOptions): { foreground: string; background: string } {
  const view = target.ownerDocument.defaultView;
  const styles = view?.getComputedStyle(target);
  const tokenForeground = styles?.getPropertyValue("--twk-qr-foreground").trim();
  const tokenBackground = styles?.getPropertyValue("--twk-qr-background").trim();
  return {
    foreground: options.foreground ?? (tokenForeground || QR_FALLBACK_DARK),
    background: options.background ?? (tokenBackground || QR_FALLBACK_LIGHT)
  };
}
