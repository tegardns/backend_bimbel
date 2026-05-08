import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";

export const tutorsRouter = Router();

const tutorSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(1, "Nomor HP wajib diisi"),
  education: z.string().min(1, "Pendidikan wajib diisi"),
  subject: z.string().min(1, "Mapel wajib diisi"),
  teachingLevel: z.string().min(1, "Level mengajar wajib diisi"),
  experience: z.string().min(1, "Pengalaman wajib diisi"),
  motivation: z.string().min(1, "Motivasi wajib diisi"),
  referralSource: z.string().optional().or(z.literal("")),
  referralFriendName: z.string().optional().or(z.literal("")),
  referralOther: z.string().optional().or(z.literal("")),
});

tutorsRouter.post("/", async (req, res) => {
  try {
    const parsed = tutorSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const { error } = await supabase.from("tutor_applications").insert([
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        education: data.education,
        subject: data.subject,
        teaching_level: data.teachingLevel,
        experience: data.experience,
        motivation: data.motivation,
        referral_source: data.referralSource || null,
        referral_friend_name: data.referralFriendName || null,
        referral_other: data.referralOther || null,
        status: "pending",
      },
    ]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan data tutor",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Pendaftaran tutor berhasil disimpan",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

tutorsRouter.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("tutor_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data tutor",
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});
