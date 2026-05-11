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
  try {
    const normalizedTarget = normalizeTargets(target);

    console.log("Mengirim WA ke:", normalizedTarget);

    const body = new URLSearchParams({
      target: normalizedTarget,
      message,
      countryCode: "0",
    });

    const controller = new AbortController();

    // timeout diperkecil supaya Vercel gak nge-hang
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: env.fonnteToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();

    console.log("FONNTE RESPONSE:", text);

    // jangan throw error lagi
    return true;
  } catch (err) {
    console.error("FONNTE ERROR:", err);

    // IMPORTANT:
    // jangan throw
    return false;
  }
}
