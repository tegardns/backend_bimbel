import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase";
import { sendFonnteMessage } from "../lib/fonnte";
import { env } from "../config/env";
import { upload } from "../middlewares/upload";

export const tutorsRouter = Router();

const tutorSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(1, "Nomor HP wajib diisi"),
  education: z.string().min(1, "Pendidikan wajib diisi"),
  subject: z.string().min(1, "Mapel wajib diisi"),
  teachingLevel: z.string().min(1, "Level mengajar wajib diisi"),
  // experience: z.string().min(1, "Pengalaman wajib diisi"),
  experience: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Alamat wajib diisi"),
  referralSource: z.string().optional().or(z.literal("")),
  referralFriendName: z.string().optional().or(z.literal("")),
  referralOther: z.string().optional().or(z.literal("")),
});

type UploadedTutorFiles = {
  cvFile?: Express.Multer.File[];
  transcriptFile?: Express.Multer.File[];
};

tutorsRouter.post(
  "/",
  upload.fields([
    { name: "cvFile", maxCount: 1 },
    { name: "transcriptFile", maxCount: 1 },
  ]),
  async (req, res) => {
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
      const files = req.files as UploadedTutorFiles | undefined;

      const cvFile = files?.cvFile?.[0];
      const transcriptFile = files?.transcriptFile?.[0];

      if (!cvFile) {
        return res.status(400).json({
          success: false,
          message: "File CV wajib diupload",
        });
      }

      if (!transcriptFile) {
        return res.status(400).json({
          success: false,
          message: "File transkrip nilai wajib diupload",
        });
      }

      if (cvFile.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "CV harus berformat PDF",
        });
      }

      if (transcriptFile.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Transkrip nilai harus berformat PDF",
        });
      }

      if (cvFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Ukuran CV maksimal 5MB",
        });
      }

      if (transcriptFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Ukuran transkrip maksimal 5MB",
        });
      }

      const safeName = data.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const uniqueId = randomUUID();

      const cvFileName = `${safeName || "tutor"}-${uniqueId}.pdf`;
      const transcriptFileName = `${safeName || "tutor"}-${uniqueId}-transcript.pdf`;

      const { error: cvUploadError } = await supabase.storage
        .from("cv_tutor")
        .upload(cvFileName, cvFile.buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (cvUploadError) {
        return res.status(500).json({
          success: false,
          message: "Gagal upload CV",
          error: cvUploadError.message,
        });
      }

      const { error: transcriptUploadError } = await supabase.storage
        .from("transkrip_nilai")
        .upload(transcriptFileName, transcriptFile.buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (transcriptUploadError) {
        return res.status(500).json({
          success: false,
          message: "Gagal upload transkrip nilai",
          error: transcriptUploadError.message,
        });
      }

      const { data: cvPublic } = supabase.storage
        .from("cv_tutor")
        .getPublicUrl(cvFileName);

      const { data: transcriptPublic } = supabase.storage
        .from("transkrip_nilai")
        .getPublicUrl(transcriptFileName);

      const cvUrl = cvPublic.publicUrl;
      const transcriptUrl = transcriptPublic.publicUrl;

      const { error: dbError } = await supabase
        .from("tutor_applications")
        .insert([
          {
            name: data.name,
            email: data.email,
            phone: data.phone,
            education: data.education,
            subject: data.subject,
            teaching_level: data.teachingLevel,
            experience: data.experience,
            address: data.address,
            cv_file_url: cvUrl,
            transcript_file_url: transcriptUrl,
            referral_source: data.referralSource || null,
            referral_friend_name: data.referralFriendName || null,
            referral_other: data.referralOther || null,
            status: "pending",
          },
        ]);

      if (dbError) {
        return res.status(500).json({
          success: false,
          message: "Gagal menyimpan data tutor",
          error: dbError.message,
        });
      }

      const waMessage = `👨‍🏫 *Pendaftaran Tutor Baru*

Nama: ${data.name}
Email: ${data.email}
No HP: ${data.phone}
Pendidikan: ${data.education}
Mapel: ${data.subject}
Level Mengajar: ${data.teachingLevel}
Alamat: ${data.address}
Pengalaman: ${data.experience || "-"}
Sumber Info: ${data.referralSource || "-"}
Nama Teman: ${data.referralFriendName || "-"}
Keterangan Lain: ${data.referralOther || "-"}

📄 CV:
Klik untuk lihat file
${cvUrl}

📑 Transkrip Nilai:
Klik untuk lihat file
${transcriptUrl}
`;

      void sendFonnteMessage({
        target: env.fonnteAdminTargets,
        message: waMessage,
      }).catch((err) => {
        console.error("Gagal kirim WA admin (tutors):", err);
      });

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
  },
);

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
