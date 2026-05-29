import { Router } from "express";
import { supabase } from "../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";

export const logicTestRouter = Router();

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

type QuestionType = "pattern" | "number" | "logic" | "spatial";

interface DatabaseQuestion {
  id: number;
  level: string;
  type: string;
  difficulty: number;
  question: string;
  options: any;
  correct_answer: number;
  created_at?: string;
}

logicTestRouter.get("/questions", async (req, res) => {
  try {
    const { level } = req.query;

    if (!level) {
      return res.status(400).json({
        success: false,
        message: "Parameter 'level' wajib diisi",
      });
    }

    // 1. Ambil semua soal dari Supabase untuk level tersebut
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("level", level);

    if (error) {
      console.error("[Backend] Supabase Query Error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.json({
        success: true,
        message: "Tidak ada soal di database untuk level ini",
        data: [],
      });
    }

    // 2. Map data ke struktur camelCase yang dibaca frontend
    const mappedQuestions = data.map((item: DatabaseQuestion) => ({
      id: item.id,
      type: item.type as QuestionType,
      difficulty: item.difficulty as 1 | 2 | 3,
      question: item.question,
      options: Array.isArray(item.options) ? item.options : JSON.parse(item.options || "[]"),
      correctAnswer: item.correct_answer,
    }));

    // Helper untuk mengacak array (Fisher-Yates Shuffle)
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // 3. Kelompokkan soal berdasarkan tipe soalnya dan acak masing-masing kelompok
    const groups: Record<QuestionType, typeof mappedQuestions> = {
      pattern: shuffleArray(mappedQuestions.filter((q) => q.type === "pattern")),
      number: shuffleArray(mappedQuestions.filter((q) => q.type === "number")),
      logic: shuffleArray(mappedQuestions.filter((q) => q.type === "logic")),
      spatial: shuffleArray(mappedQuestions.filter((q) => q.type === "spatial")),
    };

    const selectedQuestions: typeof mappedQuestions = [];
    const targetPerType = 5; // Idealnya 5 soal per tipe untuk total 20 soal
    const leftovers: typeof mappedQuestions = [];

    // 4. Ambil maksimal 5 soal dari setiap tipe soal
    (Object.keys(groups) as QuestionType[]).forEach((type) => {
      const group = groups[type];
      const taken = group.slice(0, targetPerType);
      selectedQuestions.push(...taken);
      
      // Simpan sisa soal sebagai cadangan jika tipe lain kekurangan soal
      if (group.length > targetPerType) {
        leftovers.push(...group.slice(targetPerType));
      }
    });

    // 5. Jika total soal terpilih kurang dari 20 (karena ada tipe soal yang belum diisi sampai 5 di database)
    if (selectedQuestions.length < 20 && leftovers.length > 0) {
      const shuffledLeftovers = shuffleArray(leftovers);
      const needed = 20 - selectedQuestions.length;
      selectedQuestions.push(...shuffledLeftovers.slice(0, needed));
    }

    // 6. Acak kembali hasil akhir agar tipe soal tersebar acak selama kuis berjalan
    const finalQuestions = shuffleArray(selectedQuestions).slice(0, 20);

    return res.json({
      success: true,
      data: finalQuestions,
    });
  } catch (err: any) {
    console.error("[Backend] Error fetching questions:", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal server saat mengambil soal",
      error: err.message,
    });
  }
});

// Endpoint untuk analisis Saka AI menggunakan Gemini
logicTestRouter.post("/analyze", async (req, res) => {
  try {
    const { playerName, level, score, breakdown } = req.body;

    if (!playerName || !level || score === undefined || !breakdown) {
      return res.status(400).json({
        success: false,
        message: "Request body tidak lengkap",
      });
    }

    const levelNames: Record<string, string> = {
      SD_1_2: "Kelas 1-2 SD (Logic Scout)",
      SD_3_4: "Kelas 3-4 SD (Code Breaker)",
      SD_5_6: "Kelas 5-6 SD (Brain Explorer)",
      SMP_7_8: "Kelas 7-8 SMP (Logic Master)",
      SMP_8_9: "Kelas 8-9 SMP (Grandmaster)",
    };

    const levelName = levelNames[level] || level;

    // Inisialisasi model Gemini standar (cepat & stabil)
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
    });

    const prompt = `
Kamu adalah "AI Saka", asisten cerdas dari Bimbel Saka yang membantu siswa SD/SMP di Purwokerto dan Purbalingga. Tugasmu adalah memberikan analisis hasil tes logika kognitif yang sangat ramah anak, hangat, memotivasi, dan WAJIB sangat singkat, padat, serta langsung ke inti (hindari penjelasan bertele-tele).

Nama Siswa: ${playerName}
Level Tes: ${levelName}
Skor Siswa: ${score} dari 100
Rincian Jawaban per Tipe Soal (Benar / Total):
- Pola (pattern): ${breakdown.pattern?.correct || 0} dari ${breakdown.pattern?.total || 0}
- Hitungan / Angka (number): ${breakdown.number?.correct || 0} dari ${breakdown.number?.total || 0}
- Logika Kalimat (logic): ${breakdown.logic?.correct || 0} dari ${breakdown.logic?.total || 0}
- Spasial / Ruang (spatial): ${breakdown.spatial?.correct || 0} dari ${breakdown.spatial?.total || 0}

Tuliskan analisis kognitif tepat dalam 3 paragraf singkat dengan struktur berikut (jangan ada teks pengantar atau penutup di luar 3 paragraf ini):

Paragraf 1: Apresiasi & Kesimpulan. Sapa siswa dengan namanya dengan sangat ramah, berikan apresiasi hangat atas usahanya menyelesaikan tes, dan sebutkan skor kognitif yang diperoleh secara positif. Maksimal 3 kalimat pendek!

Paragraf 2: Kekuatan. Sebutkan tipe soal yang paling mereka kuasai (rasio benar tertinggi) secara singkat dan padat. Berikan 1 kalimat penjelas yang langsung ke inti mengapa kelebihan ini hebat. Hindari penjelasan yang panjang lebar!

Paragraf 3: Tantangan & Saran Belajar. Sebutkan tipe soal yang rasionya paling rendah sebagai area belajar baru yang menyenangkan. Berikan motivasi singkat serta 1 saran belajar praktis yang seru dan mudah dicoba di rumah (misal: bermain lego, teka-teki, atau berhitung santai) secara ringkas.

Aturan Gaya Bahasa & Format:
- Gunakan bahasa yang hangat, bersahabat untuk anak-anak, dan selipkan 1 emoji ceria per paragraf.
- Format tulisan penting menggunakan bold dengan penanda asteris ganda: **Kata Penting**.
- Jangan gunakan judul, subjudul, poin-poin (bullet points), atau format heading markdown (seperti # atau ##). Cukup 3 paragraf teks mengalir.
`;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    return res.json({
      success: true,
      data: {
        analysis: analysisText,
      },
    });
  } catch (err: any) {
    console.error("[Backend] Error analyzing quiz answers:", err);
    return res.status(500).json({
      success: false,
      message: "Gagal menganalisis jawaban menggunakan Gemini AI",
      error: err.message,
    });
  }
});
