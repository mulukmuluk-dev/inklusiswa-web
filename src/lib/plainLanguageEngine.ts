/**
 * Mesin Penyederhana Bahasa Soal (Plain Language Engine)
 * Dirancang khusus untuk memfasilitasi siswa dengan disabilitas intelektual / Lamban Belajar (Slow Learner)
 * Mengurangi beban memori kerja (working memory load) dengan mengubah kalimat panjang berbelit
 * menjadi kalimat pendek, langsung ke inti pertanyaan, dan menggunakan kosakata ramah anak.
 */

// 1. Kamus Khusus Soal Kurikulum Utama (High-Impact Curated Questions)
const CURATED_QUESTIONS_MAP: Record<string, string> = {
  "Lembaga bentukan yang bertugas mempersiapkan kemerdekaan dan merumuskan dasar negara Indonesia adalah...":
    "Lembaga apa yang menyiapkan kemerdekaan dan dasar negara Indonesia?",
  "Ir. Soekarno menyampaikan pidato rumusan lima dasar negara yang dinamai 'Pancasila' pada tanggal...":
    "Kapan Ir. Soekarno menyampaikan pidato nama 'Pancasila'?",
  "Pancasila berfungsi sebagai pandangan hidup bangsa Indonesia, artinya Pancasila...":
    "Apa arti Pancasila sebagai pandangan hidup bangsa?",
  "Cara terbaik menyelesaikan perbedaan pendapat di kelas saat memilih ketua kelas adalah...":
    "Bagaimana cara terbaik menyelesaikan beda pendapat saat memilih ketua kelas?",
  "Sikap yang wajib kita tunjukkan ketika keputusan musyawarah telah disepakati bersama adalah...":
    "Apa sikap kita jika keputusan musyawarah sudah disepakati bersama?",
  "Tokoh bangsa yang mengusulkan lima dasar negara pada hari pertama sidang BPUPKI tanggal 29 Mei 1945 adalah...":
    "Siapa tokoh yang mengusulkan dasar negara pada tanggal 29 Mei 1945?",
  "Penerapan nilai sila pertama Pancasila dalam pergaulan antarteman yang berbeda keyakinan adalah...":
    "Bagaimana contoh sila pertama dengan teman yang berbeda agama?",
  "Contoh perilaku yang mencerminkan sila kedua 'Kemanusiaan yang Adil dan Beradab' di sekolah adalah...":
    "Apa contoh penerapan sila kedua di sekolah?",
  "Bentuk negara Indonesia sebagaimana tercantum dalam Pasal 1 ayat (1) UUD 1945 adalah...":
    "Apa bentuk negara Indonesia menurut UUD 1945?",
  "Pemimpin wilayah pemerintahan provinsi di Indonesia adalah seorang...":
    "Siapa pemimpin wilayah provinsi di Indonesia?",
  "Perbedaan wilayah kabupaten dan kota adalah kabupaten dipimpin oleh Bupati, sedangkan kota dipimpin oleh...":
    "Kabupaten dipimpin Bupati, sedangkan kota dipimpin oleh siapa?",
  "Lagu kebangsaan Negara Kesatuan Republik Indonesia yang diciptakan oleh W.R. Soepratman berjudul...":
    "Apa lagu kebangsaan yang diciptakan W.R. Soepratman?",
  "Bendera kebangsaan Negara Kesatuan Republik Indonesia dinamakan...":
    "Apa nama bendera kebangsaan Indonesia?",
  "Kota paling barat di Indonesia yang sering disebut sebagai titik nol kilometer adalah...":
    "Apa kota paling barat di Indonesia (titik nol kilometer)?",
  "Wujud rasa bangga dan cinta tanah air bagi seorang pelajar sekolah dasar antara lain adalah...":
    "Apa contoh cinta tanah air bagi siswa SD?",
  "Sikap yang dapat mengancam keutuhan dan persatuan Negara Kesatuan Republik Indonesia adalah...":
    "Sikap apa yang bisa merusak persatuan Indonesia?",
  "Batas laut wilayah kepulauan Indonesia secara hukum internasional diperjuangkan melalui Deklarasi...":
    "Deklarasi apa yang memperjuangkan batas laut wilayah Indonesia?",
  "Sikap yang tepat saat mendengarkan lagu kebangsaan Indonesia Raya dinyanyikan dalam upacara bendera adalah...":
    "Bagaimana sikap kita saat mendengar lagu Indonesia Raya di upacara?",
  "Rumah adat Gadang yang memiliki atap runcing seperti tanduk kerbau (gonjong) berasal dari suku Minangkabau di provinsi...":
    "Dari mana rumah adat Gadang (Minangkabau) berasal?",
  "Manfaat utama dari keberagaman budaya bagi sektor pariwisata Indonesia adalah...":
    "Apa manfaat beragamnya budaya untuk pariwisata Indonesia?",
  "Peribahasa 'Di mana bumi dipijak, di sana langit dijunjung' memiliki arti bahwa kita harus...":
    "Apa arti peribahasa 'Di mana bumi dipijak, di sana langit dijunjung'?"
};

// 2. Daftar Penggantian Kosakata Formal/Birokratis -> Bahasa Sehari-hari
const VOCABULARY_REPLACEMENTS: [RegExp, string][] = [
  [/\bsebagaimana tercantum dalam\b/gi, "menurut"],
  [/\bsebagaimana mestinya\b/gi, "dengan benar"],
  [/\bsebagaimana\b/gi, "seperti"],
  [/\btercantum\b/gi, "tertulis"],
  [/\bberlandaskan\b/gi, "berdasarkan"],
  [/\bmencerminkan\b/gi, "menunjukkan"],
  [/\bmengimplementasikan\b/gi, "melakukan"],
  [/\bmemperoleh\b/gi, "mendapat"],
  [/\bmerupakan\b/gi, "adalah"],
  [/\bmusyawarah mufakat\b/gi, "musyawarah (setuju bersama)"],
  [/\bmufakat\b/gi, "setuju bersama"],
  [/\bmenanggulangi\b/gi, "mengatasi"],
  [/\bmenyelesaikan perbedaan pendapat\b/gi, "mengatasi beda pendapat"],
  [/\bperbedaan pendapat\b/gi, "beda pendapat"],
  [/\bberfungsi sebagai\b/gi, "berguna sebagai"],
  [/\bberfungsi untuk\b/gi, "berguna untuk"],
  [/\bbertujuan untuk\b/gi, "tujuannya untuk"],
  [/\bdiwajibkan untuk\b/gi, "harus"],
  [/\bwajib kita tunjukkan\b/gi, "harus kita lakukan"],
  [/\bantarwarga\b/gi, "antar warga"],
  [/\bantarteman\b/gi, "antar teman"],
  [/\btersebut di atas\b/gi, "itu"],
  [/\bberikut ini yang bukan merupakan\b/gi, "yang BUKAN adalah"],
  [/\bberikut ini yang merupakan\b/gi, "yang benar adalah"],
  [/\bmanakah di antara pilihan berikut yang\b/gi, "manakah yang"],
  [/\bperhatikan pernyataan berikut\b/gi, "perhatikan ini"],
  [/\bberkewajiban untuk\b/gi, "harus"],
  [/\bmemiliki arti bahwa kita harus\b/gi, "artinya kita harus"],
  [/\bmemiliki arti bahwa\b/gi, "artinya"]
];

/**
 * Menyederhanakan kalimat pertanyaan menjadi versi bahasa ramah kognitif
 */
export function simplifyQuestionText(originalText: string): string {
  if (!originalText || typeof originalText !== "string") return originalText;
  const trimmed = originalText.trim();

  // 1. Cek kamus kurikulum langsung
  if (CURATED_QUESTIONS_MAP[trimmed]) {
    return CURATED_QUESTIONS_MAP[trimmed];
  }

  let text = trimmed;

  // 2. Ganti kosakata sulit
  for (const [pattern, repl] of VOCABULARY_REPLACEMENTS) {
    text = text.replace(pattern, repl);
  }

  // 3. Pola asal daerah: "Alat musik ... berasal dari daerah..." -> "Dari mana alat musik ... berasal?"
  const originMatch = text.match(/^(.+?)\s+berasal dari\s*(?:daerah|wilayah|provinsi|suku|negara)?\s*(?:\.{2,3})?$/i);
  if (originMatch) {
    const subject = originMatch[1].trim();
    return `Dari mana ${subject.toLowerCase()} berasal?`;
  }

  // 4. Pola predikat pasif di akhir: "... adalah..." atau "... disebut..."
  const trailingAdalahMatch = text.match(/^(.+?)\s+(?:adalah|merupakan|dinamakan|disebut)\s*(?:\.{2,3})?$/i);
  if (trailingAdalahMatch) {
    const subject = trailingAdalahMatch[1].trim();
    if (/\b(?:tokoh|pemimpin|presiden|menteri|pahlawan|penemu|pencipta|raja|sultan|guru|siswa|orang)\b/i.test(subject)) {
      text = `Siapa ${subject.toLowerCase()}?`;
    } else if (/\b(?:alat|benda|organ|hewan|tumbuhan|bunga|lambang|simbol|contoh|bentuk|nama|judul|perilaku|sikap)\b/i.test(subject)) {
      text = `Apa ${subject.toLowerCase()}?`;
    } else if (/\b(?:daerah|kota|negara|tempat|lokasi|provinsi|wilayah|arah)\b/i.test(subject)) {
      text = `Di mana ${subject.toLowerCase()}?`;
    } else if (/\b(?:tanggal|waktu|hari|tahun|kapan|saat)\b/i.test(subject)) {
      text = `Kapan ${subject.toLowerCase()}?`;
    } else if (/\b(?:cara|langkah|metode|tindakan)\b/i.test(subject)) {
      text = `Bagaimana ${subject.toLowerCase()}?`;
    } else {
      text = `Apa yang dimaksud ${subject.toLowerCase()}?`;
    }
  }

  // Pastikan huruf pertama kapital
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}
