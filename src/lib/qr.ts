import QRCode from "qrcode";

/**
 * Generate Data URL string for QR Code (Data URI image/png)
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
      color: {
        dark: "#0F141F",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code data URL:", err);
    return "";
  }
}

/**
 * Generate SVG string for QR Code
 */
export async function generateQrSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#0F141F",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code SVG:", err);
    return "";
  }
}
