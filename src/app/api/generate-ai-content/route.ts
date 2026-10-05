import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, title, flashcardCount = 6, quizCount = 3 } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Teks dokumen tidak boleh kosong" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    const prompt = `Anda adalah Pakar Kurikulum AI Pendidikan untuk platform pembelajaran PINTARA.
Tugas Anda adalah membaca materi pembelajaran berikut (Judul/Topik: "${title || "Dokumen Materi"}") dan menyaring 100% substansi ilmu murni tanpa memasukkan sampah meta-data, nama dosen, atau header dokumen.

Teks Dokumen / Berkas:
"""
${text.slice(0, 12000)}
"""

ATURAN KETAT (STRICT MANDATORY RULES):
1. DILARANG KERAS memasukkan nama dosen, nama guru, nama penyusun (seperti "RINA KUSUMANINGRUM"), gelar akademik ("S.E., M.Si.", "Ph.D.", "M.Pd.", dll), nama universitas/fakultas, nomor halaman, frasa "Presentasi Kelompok", atau judul bab menjadi pertanyaan atau jawaban flashcard!
2. DILARANG KERAS membuat pertanyaan meta atau pertanyaan permukaan seperti:
   - ❌ "Apa fokus pembahasan utama dari..."
   - ❌ "Apakah yang dimaksud dengan [Nama Dosen/Judul Bab]..."
   - ❌ "Dokumen ini membahas tentang..."
   - ❌ "Siapa penyusun materi..."
3. SETIAP FLASHCARD WAJIB BERISI PERTANYAAN KONSEP ILMIAH SUBSTANTIF YANG SPESIFIK & AKURAT.
4. RINGKAS & PADAT (CONCISE RULE):
   - Depan (front): Pertanyaan 1 kalimat tajam, maksimal 15 kata.
   - Belakang (back): Jawaban HARUS RINGKAS, PADAT, dan DIRECT TO THE POINT (maksimal 20-25 kata / 1-2 kalimat pendek). DILARANG MEMBUAT PARAGRAF PANJANG BERTELE-TELE agar muat 100% rapi di dalam kartu flashcard.
5. Jika teks materi terpotong atau sangat singkat, gunakan pengetahuan akademis Anda yang mendalam tentang topik "${title}" untuk membuat flashcards dan kuis yang berkualitas tinggi.
6. Hasilkan TEPAT ${flashcardCount} kartu Flashcards dan TEPAT ${quizCount} soal Latihan Pilihan Ganda. JANGAN KURANG DARI JUMLAH YANG DIMINTA. Jika materi terlalu pendek, gunakan pengetahuan umum Anda tentang topik "${title}" untuk melengkapi hingga jumlah yang diminta terpenuhi.
7. PENTING: Jawaban benar (answerIndex) WAJIB DIACAK secara merata di antara 0, 1, 2, dan 3. DILARANG menempatkan semua jawaban benar di posisi yang sama (misalnya semua di B/index 1). Pastikan distribusi jawaban benar tersebar merata.

Format keluaran HARUS berupa JSON murni dengan skema berikut:
{
  "cleanTitle": "Judul resmi topik materi (contoh: Bank dan Lembaga Keuangan Bukan Bank)",
  "summary": "Ringkasan materi dalam 2-3 kalimat padat dan informatif",
  "cleanContent": "Rangkuman lengkap materi yang terstruktur rapi dengan poin-poin utama",
  "flashcards": [
    {
      "front": "Pertanyaan konsep spesifik?",
      "back": "Penjelasan jawaban yang akurat dan jelas."
    }
  ],
  "quizQuestions": [
    {
      "question": "Pertanyaan pilihan ganda?",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "answerIndex": 0,
      "explanation": "Penjelasan singkat kunci jawaban"
    }
  ]
}`;

    const candidateModels = [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "allam-2-7b"
    ];

    let responseData: any = null;
    let lastError: string = "";

    for (const model of candidateModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "Anda adalah AI pemroses dokumen pembelajaran yang selalu mengembalikan JSON valid tanpa teks pengantar." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 8000,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            const cleanJsonStr = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
            responseData = JSON.parse(cleanJsonStr);
            break;
          }
        } else {
          lastError = await res.text();
          console.warn(`Groq model ${model} failed:`, lastError);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Error attempting Groq model ${model}:`, err);
      }
    }

    if (!responseData) {
      console.error("All Groq models failed. Last error:", lastError);
      return NextResponse.json({ error: "Gagal memproses AI dari Groq", details: lastError }, { status: 500 });
    }

    // Post-processing filter to strictly discard any residual junk or meta flashcards
    if (responseData && Array.isArray(responseData.flashcards)) {
      const junkKeywords = [
        "disusun oleh", "rina kusumaningrum", "dosen", "guru", "fakultas", "universitas",
        "nim", "nip", "fokus pembahasan utama", "apakah yang dimaksud dengan \"8.",
        "apakah yang dimaksud dengan 8.", "dokumen ini membahas", "halaman 1", "halaman 2",
        "slide 1", "presentasi kelompok", "tugas kelompok"
      ];

      responseData.flashcards = responseData.flashcards.filter((fc: any) => {
        if (!fc.front || !fc.back) return false;
        const frontLower = fc.front.toLowerCase();
        const backLower = fc.back.toLowerCase();
        return !junkKeywords.some(kw => frontLower.includes(kw) || backLower.includes(kw));
      });
    }

    // Post-processing: Shuffle quiz answer positions so they're not all in the same slot
    if (responseData && Array.isArray(responseData.quizQuestions)) {
      responseData.quizQuestions = responseData.quizQuestions.map((q: any) => {
        if (!q.options || q.options.length !== 4) return q;
        const correctAnswer = q.options[q.answerIndex ?? 0];
        // Fisher-Yates shuffle
        const shuffled = [...q.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const newAnswerIndex = shuffled.indexOf(correctAnswer);
        return { ...q, options: shuffled, answerIndex: newAnswerIndex };
      });
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error("Groq API Route Exception:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal" }, { status: 500 });
  }
}


