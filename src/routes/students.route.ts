import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import axios from "axios"; // Pastikan sudah npm install axios

export const studentsRouter = Router();

// 1. Schema Tetap Sama
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

// 2. Infer type untuk TypeScript
type StudentData = z.infer<typeof studentSchema>;

// 3. Fungsi Forwarding WA (Tanpa merusak flow utama)
const sendWaNotification = async (data: StudentData) => {
  try {
    const message = `... isi pesan lo ...`;

    await axios.post(
      "https://api.fonnte.com/send",
      {
        // Mengambil nomor WA dari Environment Variable
        target: process.env.ADMIN_WA_NUMBER,
        message: message,
        countryCode: "62",
      },
      {
        headers: {
          // Mengambil token dari Environment Variable
          Authorization: process.env.FONNTE_TOKEN || "",
        },
      },
    );
  } catch (err: any) {
    console.error("WA Forwarding Failed:", err.response?.data || err.message);
  }
};

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

    // Simpan ke Supabase (Fitur Asli)
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
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan data siswa",
        error: error.message,
      });
    }

    // --- TAMBAHAN FITUR: Forward ke WA ---
    // Dipanggil tanpa 'await' supaya respons ke user tetap kencang (non-blocking)
    sendWaNotification(data);

    return res.status(201).json({
      success: true,
      message: "Pendaftaran siswa berhasil disimpan",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

// 4. Fitur GET Tetap Utuh
studentsRouter.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
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
