import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";

export const quickRegistrationRouter = Router();

const schema = z.object({
  city: z.string().min(1),
  district: z.string().min(1),

  level: z.enum(["Calistung", "SD", "SMP"]),

  studentName: z.string().min(1),
  studentAddress: z.string().min(1),

  classOrAge: z.string().min(1),

  subject: z.string().optional().nullable(),
});

quickRegistrationRouter.post("/", async (req, res) => {
  try {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const { error } = await supabase
      .from("quick_student_registrations")
      .insert([
        {
          city: data.city,
          district: data.district,

          level: data.level,

          student_name: data.studentName,
          student_address: data.studentAddress,

          class_or_age: data.classOrAge,

          subject: data.subject || null,
        },
      ]);

    if (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan data",
      });
    }

    return res.json({
      success: true,
      message: "Pendaftaran berhasil disimpan",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});
