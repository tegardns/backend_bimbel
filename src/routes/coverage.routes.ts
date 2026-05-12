import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { sendFonnteMessage } from "../lib/fonnte";
import { env } from "../config/env";

export const coverageRouter = Router();

const DISTRICTS_DATA = [
  { name: "Purbalingga", distance: 0.5 },
  { name: "Kalimanah", distance: 3.2 },
  { name: "Padamara", distance: 4.1 },
  { name: "Bojongsari", distance: 4.8 },
  { name: "Kutasari", distance: 4.9 },
  { name: "Mrebet", distance: 8.5 },
  { name: "Bukateja", distance: 10.2 },
  { name: "Kaligondang", distance: 7.4 },
  { name: "Kejobong", distance: 15.6 },
  { name: "Kemangkon", distance: 12.1 },
  { name: "Kertanegara", distance: 18.3 },
  { name: "Karanganyar", distance: 20.1 },
  { name: "Karangmoncol", distance: 24.5 },
  { name: "Karangreja", distance: 28.0 },
  { name: "Karangjambu", distance: 32.0 },
  { name: "Bobotsari", distance: 14.2 },
  { name: "Pengadegan", distance: 16.5 },
  { name: "Rembang", distance: 26.0 },
];

const requestSchema = z.object({
  waNumber: z.string().min(8),
  district: z.string().min(1),
  level: z.string().min(1),
});

coverageRouter.post("/check", async (req, res) => {
  try {
    const { district } = req.body;

    const found = DISTRICTS_DATA.find(
      (d) => d.name.toLowerCase() === district.toLowerCase(),
    );

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Wilayah tidak ditemukan",
      });
    }

    const available = found.distance <= 10;

    return res.json({
      success: true,
      available,
      distance: found.distance,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

coverageRouter.post("/request", async (req, res) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const found = DISTRICTS_DATA.find(
      (d) => d.name.toLowerCase() === data.district.toLowerCase(),
    );

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Wilayah tidak ditemukan",
      });
    }

    const available = found.distance <= 5;

    const { error } = await supabase.from("coverage_requests").insert([
      {
        wa_number: data.waNumber,
        district: found.name,
        distance_km: found.distance,
        level: data.level,
        available,
      },
    ]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan request",
        error: error.message,
      });
    }

    const waMessage = `📍 *Request Cek Ketersediaan Tutor*

Nomor WA: ${data.waNumber}
Wilayah: ${found.name}
Jarak: ${found.distance} KM
Jenjang: ${data.level}

Status:
${available ? "✅ TERSEDIA" : "❌ BELUM TERSEDIA"}
`;

    await sendFonnteMessage({
      target: env.fonnteAdminTargets,
      message: waMessage,
    });

    return res.json({
      success: true,
      available,
      message: "Request berhasil dikirim",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});
