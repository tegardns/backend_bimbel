import { env } from "../config/env";

type SendFonnteParams = {
  target: string;
  message: string;
};

function normalizeTargets(target: string) {
  return target
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(",");
}

export async function sendFonnteMessage({ target, message }: SendFonnteParams) {
  const normalizedTarget = normalizeTargets(target);

  console.log("Mengirim WA ke:", normalizedTarget);

  const body = new URLSearchParams({
    target: normalizedTarget,
    message,
    countryCode: "0",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: env.fonnteToken,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
      signal: controller.signal,
    });

    const text = await response.text();
    console.log("FONNTE RAW RESPONSE:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Response Fonnte bukan JSON valid: ${text}`);
    }

    if (!response.ok || data.status === false) {
      throw new Error(data.reason || "Gagal kirim WA");
    }

    return data;
  } catch (err) {
    console.error("FONNTE ERROR:", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
