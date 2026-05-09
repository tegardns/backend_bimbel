import { env } from "../config/env";

type SendFonnteParams = {
  target: string;
  message: string;
};

export async function sendFonnteMessage({ target, message }: SendFonnteParams) {
  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: env.fonnteToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target,
      message,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.status === false) {
    throw new Error(data?.reason || `Fonnte failed (${response.status})`);
  }

  return data;
}
