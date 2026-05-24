import { Router } from "express";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import rateLimit from "express-rate-limit";

export const aiRouter = Router();

// ─── Inisialisasi Gemini ────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(env.geminiApiKey);

// ─── Validasi request body ──────────────────────────────────────────────────
const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string(),
      }),
    )
    .min(1, "Minimal ada 1 pesan"),
  subject: z.enum(["Matematika", "Bahasa Inggris"]),
  image: z
    .string()
    .refine(
      (val) =>
        val.startsWith("data:image/jpeg;base64,") ||
        val.startsWith("data:image/png;base64,") ||
        val.startsWith("data:image/webp;base64,"),
      "Format gambar tidak valid",
    )
    .optional(),
});

// ─── System Prompt AI Saka ──────────────────────────────────────────────────
const buildSystemPrompt = (subject: string) => `
Kamu adalah "AI Saka", asisten belajar cerdas dari Bimbel Saka yang khusus membantu siswa SD dan SMP di Purwokerto dan Purbalingga.

ATURAN PENTING (WAJIB DIIKUTI):
1. Kamu HANYA boleh membantu soal ${subject}. Jika ditanya hal lain, tolak dengan ramah.
2. JANGAN langsung memberi jawaban akhir. Ajarkan cara pengerjaannya step-by-step agar siswa mengerti.
3. Gunakan bahasa Indonesia yang ramah, santai, dan mudah dipahami anak SD–SMP.
4. Gunakan emoji secukupnya agar suasana lebih menyenangkan 😊.
5. Jika ada gambar soal, baca dan kerjakan soal yang ada di gambar tersebut.
6. Selalu akhiri jawaban dengan kalimat penyemangat singkat untuk siswa.
7. Format jawaban menggunakan markdown agar rapi (bold, list, dll).
8. Jika siswa mengirim soal yang tidak berkaitan dengan ${subject}, katakan dengan ramah bahwa kamu hanya bisa membantu mata pelajaran ${subject}.

Kamu adalah teman belajar yang sabar, tidak menghakimi, dan selalu semangat membantu!

GAYA MENJAWAB:
- Jawab SINGKAT, PADAT, JELAS. Saya ingin untuk langsung ke inti, tidak perlu basa-basi panjang. Bantu siswa untuk lebih paham dengan cepat dengan jawaban anda.
Karena siswa adalah jenjang SD dan SMP, gunakan bahasa yang sangat sederhana dan mudah dimengerti. Jangan menggunakan istilah teknis yang rumit. 
Gunakan contoh dan analogi yang dekat dengan kehidupan sehari-hari anak-anak untuk menjelaskan konsep yang sulit.
- Langsung ke inti, tidak perlu basa-basi panjang
- Tetap ramah dan gunakan 1-2 emoji saja
- Gunakan format sederhana: langkah bernomor jika perlu, tanpa header berlebihan

AI MATEMATIKA (WAJIB DIIKUTI) :
- Harus menggunakan bahasa yang simple. Jangan banyak banget kalimat yang bertele-tele.
- Untuk penulisan Function/rumus mohon dituliskan rapi dan diberi jarak supaya mudah dibaca.
- Perhatikan pada penulisan rumus, karakter sepeti akar dan lain sebagainya ditulis jelas dan serapi mungkin supaya jelas dibaca. 

`;

// ─── POST /api/ai/chat ──────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 100, // max 100 request per menit per IP
  message: {
    success: false,
    message: "Terlalu banyak pertanyaan, istirahat sebentar ya 😊",
  },
});

aiRouter.post("/chat", aiLimiter, async (req, res) => {
  try {
    // 1. Validasi body
    const parsed = chatSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Request tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { messages, subject, image } = parsed.data;

    // 2. Inisialisasi model dengan system prompt
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: buildSystemPrompt(subject),
    });

    // 3. Bangun history chat - max 10 pesan terakhir untuk hemat token
    const rawHistory = messages
      .slice(0, -1) // buang pesan terakhir (akan dikirim sebagai messageParts)
      .slice(-10) // ambil maksimal 10 pesan terakhir saja
      .map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

    // Gemini mengharuskan history selalu diawali role 'user'
    const firstUserIndex = rawHistory.findIndex((m) => m.role === "user");
    const history =
      firstUserIndex === -1 ? [] : rawHistory.slice(firstUserIndex);

    // 4. Ambil pesan terakhir dari user
    const lastMessage = messages[messages.length - 1];

    // 5. Mulai chat session dengan history
    const chat = model.startChat({ history });

    // 6. Siapkan parts (teks + gambar jika ada)
    let messageParts: any[] = [{ text: lastMessage.content }];

    if (image) {
      const base64Size = image.length * 0.75;
      if (base64Size > 3.5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Ukuran gambar terlalu besar, maksimal 2.5MB",
        });
      }

      // Validasi format base64
      if (!image.includes(",")) {
        return res.status(400).json({
          success: false,
          message: "Format gambar tidak valid",
        });
      }

      const base64Data = image.split(",")[1];
      const mimeTypePart = image.split(";")[0].split(":")[1];
      const mimeType = (
        ["image/jpeg", "image/png", "image/webp"].includes(mimeTypePart)
          ? mimeTypePart
          : "image/jpeg"
      ) as "image/jpeg" | "image/png" | "image/webp";

      console.log(
        "[AI] image mimeType:",
        mimeType,
        "base64 length:",
        base64Data?.length,
      );

      messageParts = [
        {
          text:
            lastMessage.content.trim() ||
            "Tolong baca dan kerjakan soal yang ada di gambar ini step-by-step.",
        },
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
      ];
    }

    // 7. Kirim ke Gemini
    const result = await chat.sendMessage(messageParts);
    const responseText = result.response.text();

    return res.json({
      success: true,
      data: {
        answer: responseText,
      },
    });
  } catch (err: any) {
    console.error("[AI Route Error]", err);

    // Handle rate limit Gemini (free tier)
    if (err?.status === 429 || err?.status === 503) {
      return res.status(429).json({
        success: false,
        message: "AI sedang sibuk, coba lagi dalam beberapa saat lagi 😊",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan, coba lagi nanti",
    });
  }
});
