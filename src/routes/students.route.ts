import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { sendFonnteMessage } from "../lib/fonnte";
import { env } from "../config/env";

export const studentsRouter = Router();

const studentSchema = z.object({
  studentName: z.string().min(1),
  parentName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1),
  grade: z.string().min(1),
  program: z.string().min(1),
  method: z.string().min(1),
  subjects: z.string().min(1),
  notes: z.string().optional().or(z.literal("")),
  referralSource: z.string().optional().or(z.literal("")),
  referralFriendName: z.string().optional().or(z.literal("")),
  referralOther: z.string().optional().or(z.literal("")),
});

studentsRouter.post("/", async (req, res) => {
  try {
    const parsed = studentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const { error } = await supabase.from("students").insert([
      {
        student_name: data.studentName,
        parent_name: data.parentName,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        grade: data.grade,
        program: data.program,
        method: data.method,
        subjects: data.subjects,
        notes: data.notes || null,
        referral_source: data.referralSource || null,
        referral_friend_name: data.referralFriendName || null,
        referral_other: data.referralOther || null,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("STUDENT INSERT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan data siswa",
        error: error.message,
      });
    }

    const waMessage = `📩 *Pendaftaran Siswa Baru*

Nama Siswa: ${data.studentName}
Nama Wali: ${data.parentName}
No HP: ${data.phone}
Email: ${data.email || "-"}
Alamat: ${data.address}
Kelas: ${data.grade}
Program: ${data.program}
Metode: ${data.method}
Mapel: ${data.subjects}
Catatan: ${data.notes || "-"}

Sumber Info: ${data.referralSource || "-"}
Nama Teman: ${data.referralFriendName || "-"}
Keterangan Lain: ${data.referralOther || "-"}
`;

    // RESPONSE DULU
    res.status(201).json({
      success: true,
      message: "Pendaftaran siswa berhasil disimpan",
    });

    // BACKGROUND WA
    setImmediate(() => {
      sendFonnteMessage({
        target: env.fonnteAdminTargets,
        message: waMessage,
      });
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

studentsRouter.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("STUDENT GET ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data siswa",
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

studentsRouter.get("/test-wa", async (_req, res) => {
  try {
    const result = await sendFonnteMessage({
      target: env.fonnteAdminTargets,
      message: "🔥 TEST WA BERHASIL DARI BIMBEL",
    });

    return res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
});
