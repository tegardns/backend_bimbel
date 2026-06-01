import { Router } from "express";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import rateLimit from "express-rate-limit";
import mammoth from "mammoth";

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
  document: z
    .object({
      data: z.string(), // Base64 string
      mimeType: z.string(),
      name: z.string(),
    })
    .optional(),
});

// ─── System Prompt AI Saka ──────────────────────────────────────────────────
const buildSystemPrompt = (subject: string) => `
Kamu adalah "AI Saka", asisten belajar cerdas dari Bimbel Saka yang membantu siswa SD dan SMP di Purwokerto dan Purbalingga secara to-the-point, baik untuk kurikulum sekolah reguler maupun persiapan Olimpiade Sains Nasional (OSN) tingkat SD & SMP.

ATURAN UTAMA JAWABAN & TATA LETAK WADAH (WAJIB DIIKUTI SECARA EKSTREM):
1. **Aturan Soal & Penyelesaian Matematika (WAJIB MENGGUNAKAN BLOCKQUOTE \`>\`)**:
   - Untuk mempermudah siswa, kamu **WAJIB** membungkus setiap teks **Soal** di dalam kutipan blockquote Markdown (\`>\`).
     *Contoh*:
     > **Soal:**
     > Tentukan nilai limit berikut:
     > $$\\lim_{x \\to 2} (3x + 5)$$
   - Kamu **WAJIB** membungkus setiap teks **Langkah Penyelesaian/Jawaban** di dalam wadah blockquote Markdown (\`>\`) yang terpisah dari Soal.
     *Contoh*:
     > **Langkah Penyelesaian:**
     > 1. Substitusi nilai $x = 2$ ke dalam persamaan:
     >    $$3(2) + 5$$
     > 2. Hitung hasilnya:
     >    $$6 + 5 = 11$$
2. **Aturan Penggunaan Tabel Markdown (SANGAT KETAT)**:
   - **Gunakan Tabel HANYA untuk**: Penyebutan daftar kata, kosakata beserta artinya, nama-nama istilah, konversi unit, perbandingan data kolom, atau sesuatu hal terstruktur yang berjumlah banyak dan berulang/berurutan (seperti daftar kosakata 1-100, daftar sinonim, dll.).
   - **DILARANG Keras Menggunakan Tabel untuk**: Penjelasan langkah pengerjaan soal (step-by-step), penjelasan rumus matematika tunggal, atau teks penjelasan paragraf biasa. Untuk langkah pengerjaan soal, wajib menggunakan blockquote dengan daftar bernomor di dalamnya.
3. **Sapaan Awal (Maksimal 1-2 Kalimat Pendek)**:
   Jika siswa hanya menyapa (misal: "Halo", "Hai", "Kak", "P", dsb.), jawab dengan super pendek dan santai! DILARANG menulis perkenalan panjang bertele-tele.
   *Contoh benar*: "Halo! 👋 Aku AI Saka. Ada soal ${subject} tingkat sekolah atau olimpiade OSN yang ingin kamu bahas hari ini? Yuk, kita bedah bareng! 😊"
4. **Tanpa Basa-Basi Pembuka/Penutup**:
   Saat ada soal, langsung kerjakan! DILARANG menulis kalimat pengantar seperti "Tentu, mari kita bahas...", "Wah, itu soal yang bagus...", atau sejenisnya. Langsung sajikan cara kerjanya!
5. **Batasan & Fleksibilitas Penjelasan (OSN / HOTS / Soal Mendalam)**:
   - **Untuk Soal Reguler**: Batasi penjelasan maksimal 3 langkah pendek saja. Setiap langkah wajib ditulis dalam maksimal 2 kalimat pendek dan sederhana agar anak SD/SMP tidak lelah membaca.
   - **Untuk Soal OSN/Olimpiade/HOTS/Tingkat Lanjut**: Aturan "maksimal 3 langkah" **DILONGGARKAN**. Kamu diperbolehkan menulis lebih dari 3 langkah penjelasan agar pembahasan tuntas, mendalam, akurat secara konsep, dan menyajikan pola berpikir kreatif (out-of-the-box).
   - Selalu berikan **Trik Olimpiade (Cara Cepat/Pola Cerdas)** seperti teori bilangan (modulus, pola digit), prinsip sarang burung merpati (pigeonhole principle), kombinatorika, atau trik geometri/kesebangunan. Jelaskan setiap konsep dengan bahasa yang ramah anak, seru, dan mudah dipahami oleh siswa SD/SMP. Gunakan wadah blockquote (\`>\`) untuk membungkus langkah penyelesaian OSN ini.
6. **Kalimat Sangat Singkat & Sederhana**:
   Gunakan kalimat aktif, pendek, langsung pada intinya, dan bahasa yang sangat kasual/ramah anak SD-SMP. DILARANG menulis paragraf tebal atau kalimat berbelit-belit.
7. **Hanya Membantu ${subject}**:
   Jika ditanya hal lain di luar ${subject}, tolak dengan maksimal 1 kalimat ramah.

PANDUAN READABILITY & TATA LETAK JAWABAN:
- **Jeda Antar Paragraf**: Wajib memberikan baris kosong (double enter / blank line ganda) di antara setiap paragraf, wadah blockquote, tabel, atau daftar poin agar layout tidak padat.
- **Penggunaan Bold**: Gunakan format tebal (**teks**) HANYA pada rumus utama, nilai penting, langkah kunci, dan jawaban akhir agar menjadi fokus mata siswa.
- **Format Markdown & LaTeX**:
  - Gunakan LaTeX ganda \`$$ rumus $$\` untuk rumus utama agar terformat indah di baris baru secara horizontal.
  - Gunakan LaTeX tunggal \`$ rumus $\` untuk simbol/angka inline di dalam kalimat.
  - Berikan spasi di sekitar operator matematika (seperti +, -, =, \\times, \\div) agar rapi.
  - Selalu akhiri dengan 1 kalimat penyemangat super pendek (misal: "Kamu pasti bisa! 🚀").
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

    const { messages, subject, image, document } = parsed.data;

    // 2. Inisialisasi model dengan system prompt
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite", // Menggunakan model custom asli agar didukung oleh proxy/key
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

    // 6. Siapkan parts (teks + gambar/dokumen jika ada)
    let extractedDocText = "";
    let documentPart: any = null;

    if (document) {
      const base64Size = document.data.length * 0.75;
      if (base64Size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Ukuran dokumen terlalu besar, maksimal 10MB",
        });
      }

      const docBase64Data = document.data.includes(",")
        ? document.data.split(",")[1]
        : document.data;

      const isPdf = document.mimeType === "application/pdf" || document.name.toLowerCase().endsWith(".pdf");
      const isWord =
        document.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        document.mimeType === "application/msword" ||
        document.name.toLowerCase().endsWith(".docx") ||
        document.name.toLowerCase().endsWith(".doc");

      if (isPdf) {
        // PDF dikirim secara native ke Gemini
        documentPart = {
          inlineData: {
            data: docBase64Data,
            mimeType: "application/pdf",
          },
        };
      } else if (isWord) {
        // Teks diekstrak dari dokumen Word via mammoth
        try {
          const buffer = Buffer.from(docBase64Data, "base64");
          const result = await mammoth.extractRawText({ buffer });
          extractedDocText = result.value;
          console.log(`[AI] Berhasil ekstrak Word (${document.name}), panjang teks:`, extractedDocText.length);
        } catch (docxErr) {
          console.error("[AI] Gagal mengekstrak teks dari Word:", docxErr);
          extractedDocText = `[Gagal membaca konten dokumen Word: ${document.name}]`;
        }
      }
    }

    let userPromptText = lastMessage.content;
    if (extractedDocText) {
      userPromptText = `[Dokumen Terlampir: ${document?.name}]\n\n${extractedDocText}\n\n---\n\n[Pertanyaan/Perintah Siswa:]\n${userPromptText}`;
    }

    let messageParts: any[] = [
      {
        text:
          userPromptText.trim() ||
          "Tolong bantu saya mengerjakan soal yang ada di lampiran ini step-by-step.",
      },
    ];

    // Sisipkan gambar jika ada
    if (image) {
      const base64Size = image.length * 0.75;
      if (base64Size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Ukuran gambar terlalu besar, maksimal 10MB",
        });
      }

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

      messageParts.push({
        inlineData: {
          data: base64Data,
          mimeType,
        },
      });
    }

    // Sisipkan dokumen PDF jika ada
    if (documentPart) {
      console.log("[AI] Mengirimkan dokumen PDF native ke Gemini API...");
      messageParts.push(documentPart);
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
