import { env } from "../config/env";

type SendFonnteParams = {
  target: string;
  message: string;
};

export async function sendFonnteMessage({ target, message }: SendFonnteParams) {
  const body = new URLSearchParams({
    target,
    message,
  });

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: env.fonnteToken,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  console.log("FONNTE RESPONSE:", data);

  if (!response.ok || data.status === false) {
    throw new Error(data.reason || "Gagal kirim WA");
  }

  return data;
}
