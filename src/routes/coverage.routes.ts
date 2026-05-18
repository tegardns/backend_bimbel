import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { sendFonnteMessage } from "../lib/fonnte";
import { env } from "../config/env";
import {
  evaluateCoverage,
  getDistrictsByCity,
  normalizeWaNumber,
  type CoverageCity,
  type CoverageLevel,
} from "../config/coverage";

export const coverageRouter = Router();

const citySchema = z.enum(["Purbalingga", "Purwokerto"]);
const levelSchema = z.enum(["Calistung", "SD", "SMP", "SMA"]);

const districtsQuerySchema = z.object({
  city: citySchema,
});

const checkSchema = z.object({
  city: citySchema,
  district: z.string().min(1, "Kecamatan wajib diisi"),
  level: levelSchema,
});

const requestSchema = z.object({
  city: citySchema,
  district: z.string().min(1, "Kecamatan wajib diisi"),
  level: levelSchema,
  waNumber: z.string().min(5, "Nomor WA wajib diisi"),
});

coverageRouter.get("/districts", (req, res) => {
  const parsed = districtsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const city = parsed.data.city as CoverageCity;

  return res.json({
    success: true,
    data: getDistrictsByCity(city).map((district) => ({
      ...district,
      available: district.distanceKm <= env.coverageRadiusKm,
    })),
  });
});

coverageRouter.post("/check", (req, res) => {
  const parsed = checkSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { city, district, level } = parsed.data;

  const result = evaluateCoverage({
    city,
    district,
    level: level as CoverageLevel,
    radiusKm: env.coverageRadiusKm,
  });

  return res.json({
    success: true,
    data: result,
  });
});

coverageRouter.post("/request", async (req, res) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const city = parsed.data.city as CoverageCity;
    const waNumber = normalizeWaNumber(parsed.data.waNumber);

    const result = evaluateCoverage({
      city,
      district: parsed.data.district,
      level: parsed.data.level as CoverageLevel,
      radiusKm: env.coverageRadiusKm,
    });

    if (!waNumber) {
      return res.status(400).json({
        success: false,
        message: "Nomor WA tidak valid",
      });
    }

    if (!result.available) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: result,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("coverage_requests")
      .insert([
        {
          city: result.city,
          wa_number: waNumber,
          district: result.district,
          distance_km: result.distanceKm,
          level: result.level,
          available: result.available,
          notification_sent: false,
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan request coverage",
        error: insertError.message,
      });
    }

    const waMessage = `📍 *Request Cek Ketersediaan Tutor*

Kota: ${result.city}
Wilayah: ${result.district}
Jarak: ${result.distanceKm} KM
Jenjang: ${result.level}
No WA: ${waNumber}

Status: ${result.message}
`;

    const waSent = await sendFonnteMessage({
      target: env.fonnteAdminTargets,
      message: waMessage,
    });

    await supabase
      .from("coverage_requests")
      .update({
        notification_sent: waSent,
      })
      .eq("id", inserted.id);

    return res.json({
      success: true,
      message: waSent
        ? "Request berhasil dikirim"
        : "Request tersimpan, tapi notifikasi admin gagal dikirim",
      data: {
        id: inserted.id,
        notificationSent: waSent,
      },
    });
  } catch (err) {
    console.error("COVERAGE REQUEST ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});
