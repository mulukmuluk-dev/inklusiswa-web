import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";
import { getClassRoom, saveClassRoom } from "./kelasDatabase";

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  role: "siswa";
  jenjang?: string;
  current_room_code: string;
  avatar_url?: string;
  pin_code: string;
  accessibility_config: any;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "pintara_student_profiles";

/**
 * Mendapatkan daftar siswa yang tersimpan di localStorage (sebagai sinkronisasi/cadangan instan)
 */
export function getLocalStudents(): StudentProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading local students:", e);
    return [];
  }
}

/**
 * Menyimpan daftar siswa ke localStorage
 */
export function saveLocalStudents(students: StudentProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.error("Error saving local students:", e);
  }
}

/**
 * Mengubah objek konfigurasi aksesibilitas menjadi label teks yang ramah dan mudah dibaca
 */
export function getA11yPresetLabel(config: any): string {
  if (!config) return "Standar";
  const main = config.mainMode;
  const specific = config.specificMode;
  const motoric = config.motoricConfig?.subMode;

  if (main === "fisik_mata" || (specific === "lumpuh_total" && config.physicalControlMethod === "mata")) {
    return "Fisik - Lumpuh Total (Kontrol Mata)";
  }
  if (main === "fisik_suara" || (specific === "lumpuh_total" && config.physicalControlMethod === "suara")) {
    return "Fisik - Lumpuh Total (Kontrol Suara)";
  }
  if (main === "fisik_motorik" || specific === "kesulitan_tangan" || config.physicalControlMethod === "motorik") {
    if (motoric === "single_switch") return "Motorik Halus - Sakelar Tunggal (Auto-Scan)";
    if (motoric === "standar_besar") return "Motorik Halus - Sentuh Standar Adaptif";
    return "Motorik Halus - Presisi / Filter Tremor";
  }
  if (main === "sensorik_tunanetra" || specific === "tunanetra") {
    return "Sensorik - Tunanetra (Suara & TTS)";
  }
  if (main === "sensorik_tunarungu" || specific === "tunarungu") {
    return "Sensorik - Tunarungu (Bahasa Isyarat)";
  }
  if (main === "intelektual") {
    const intConfig = config.intellectualConfig;
    if (intConfig?.subMode === "piktogram_konkret") {
      return "Intelektual - Pemahaman Konkret & Piktogram";
    }
    return "Intelektual - Lamban Belajar (Bebas Waktu)";
  }
  if (main === "mental") {
    return "Mental (Ramah Sensori)";
  }
  return "Standar";
}

/**
 * Menghasilkan objek konfigurasi aksesibilitas berdasarkan preset dan sub-mode motorik/intelektual
 */
export function buildA11yConfig(
  preset: string,
  studentJenjang: string,
  pin: string,
  motoricSubMode?: string,
  intellectualSubMode?: string
): any {
  const a11yConfig: any = { pin_code: pin, jenjang: studentJenjang };
  if (preset === "fisik_mata") {
    a11yConfig.mainMode = "fisik_mata";
    a11yConfig.specificMode = "lumpuh_total";
    a11yConfig.physicalControlMethod = "mata";
  } else if (preset === "fisik_suara") {
    a11yConfig.mainMode = "fisik_suara";
    a11yConfig.specificMode = "lumpuh_total";
    a11yConfig.physicalControlMethod = "suara";
  } else if (
    preset === "fisik_motorik" ||
    preset === "fisik_motorik_tremor" ||
    preset === "fisik_motorik_switch" ||
    preset === "fisik_motorik_standar"
  ) {
    const subMode =
      preset === "fisik_motorik_switch"
        ? "single_switch"
        : preset === "fisik_motorik_standar"
        ? "standar_besar"
        : motoricSubMode || "tremor_filter";
    a11yConfig.mainMode = "fisik_motorik";
    a11yConfig.specificMode = "kesulitan_tangan";
    a11yConfig.physicalControlMethod = "motorik";
    a11yConfig.motoricConfig = {
      subMode: subMode,
      holdDurationMs: 450,
      scanIntervalMs: 2000,
      soundFeedback: true,
      palmRejection: true,
    };
  } else if (preset === "sensorik_tunanetra") {
    a11yConfig.mainMode = "sensorik_tunanetra";
    a11yConfig.specificMode = "tunanetra";
  } else if (preset === "sensorik_tunarungu") {
    a11yConfig.mainMode = "sensorik_tunarungu";
    a11yConfig.specificMode = "tunarungu";
    a11yConfig.physicalControlMethod = "isyarat";
  } else if (preset === "intelektual" || preset === "intelektual_slow" || preset === "intelektual_konkret") {
    const subMode =
      preset === "intelektual_konkret"
        ? "piktogram_konkret"
        : intellectualSubMode || "slow_learner";
    a11yConfig.mainMode = "intelektual";
    a11yConfig.intellectualConfig = {
      subMode: subMode,
      hideTimer: true,
      reduceOptions: subMode === "piktogram_konkret",
      secondChance: true,
      showHints: true,
      plainLanguage: true,
    };
  } else if (preset === "mental") {
    a11yConfig.mainMode = "mental";
    a11yConfig.mentalConfig = {
      calmTheme: true,
      focusMode: false,
      reduceSensory: true,
    };
  } else {
    a11yConfig.mainMode = preset || "standar";
  }
  return a11yConfig;
}

/**
 * Mengambil daftar seluruh siswa (atau berdasarkan kode kelas/room),
 * menggabungkan data dari Supabase dengan data lokal.
 */
export async function fetchStudents(roomCode?: string): Promise<StudentProfile[]> {
  const localList = getLocalStudents();
  let remoteList: StudentProfile[] = [];

  try {
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "siswa");

    if (roomCode && roomCode.trim()) {
      query = query.eq("current_room_code", roomCode.toUpperCase().trim());
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      remoteList = data.map((item) => ({
        id: item.id,
        email: item.email,
        full_name: item.full_name,
        role: "siswa",
        jenjang: item.jenjang || item.accessibility_config?.jenjang || "Kelas 4 SD",
        current_room_code: item.current_room_code || "-",
        avatar_url: item.avatar_url || "/images/default_avatar.png",
        pin_code: item.accessibility_config?.pin_code || "----",
        accessibility_config: item.accessibility_config || {},
        created_at: item.created_at,
      }));
    }
  } catch (err) {
    console.warn("Supabase fetchStudents warning, using local cache:", err);
  }

  // Gabungkan remote dan local (hindari duplikat id)
  const map = new Map<string, StudentProfile>();
  localList.forEach((s) => map.set(s.id, s));
  remoteList.forEach((s) => map.set(s.id, s));

  let merged = Array.from(map.values());
  if (roomCode && roomCode.trim()) {
    const cleanRoom = roomCode.toUpperCase().trim();
    merged = merged.filter((s) => s.current_room_code?.toUpperCase() === cleanRoom);
  }

  // Simpan hasil gabungan kembali ke local cache
  saveLocalStudents(Array.from(map.values()));
  return merged;
}

/**
 * Menambahkan satu siswa baru
 */
export async function addStudent(params: {
  name: string;
  jenjang: string;
  roomCode: string;
  preset: string;
  motoricSubMode?: string;
  intellectualSubMode?: string;
}): Promise<StudentProfile> {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const pseudoId = crypto.randomUUID();
  const email = `${pseudoId}@pintara.local`;
  const cleanRoomCode = params.roomCode.trim().toUpperCase();

  // Pastikan room kelas tersedia di database lokal jika belum ada
  if (!getClassRoom(cleanRoomCode)) {
    saveClassRoom({
      code: cleanRoomCode,
      className: `Kelas Inklusif ${cleanRoomCode}`,
      subject: "Umum",
      teacherName: "Guru Pengajar",
      announcements: [],
      messages: [],
      materials: [],
      quizzes: [],
      exams: [],
    });
  }

  const a11yConfig = buildA11yConfig(
    params.preset,
    params.jenjang,
    pin,
    params.motoricSubMode,
    params.intellectualSubMode
  );

  const student: StudentProfile = {
    id: pseudoId,
    email: email,
    full_name: params.name.trim(),
    role: "siswa",
    jenjang: params.jenjang,
    current_room_code: cleanRoomCode,
    avatar_url: "/images/default_avatar.png",
    pin_code: pin,
    accessibility_config: a11yConfig,
    created_at: new Date().toISOString(),
  };

  // 1. Simpan ke local storage
  const localList = getLocalStudents();
  const updatedList = [student, ...localList.filter((s) => s.id !== student.id)];
  saveLocalStudents(updatedList);

  // 2. Simpan ke Supabase profiles di background
  try {
    await supabase.from("profiles").upsert({
      id: pseudoId,
      email: email,
      full_name: student.full_name,
      role: "siswa",
      jenjang: student.jenjang,
      current_room_code: student.current_room_code,
      avatar_url: student.avatar_url,
      accessibility_config: a11yConfig,
    });
  } catch (err) {
    console.error("Gagal simpan siswa ke Supabase (tersimpan lokal):", err);
  }

  return student;
}

/**
 * Bulk add students (dari Import Excel)
 */
export async function bulkAddStudents(
  studentsData: Array<{
    name: string;
    jenjang?: string;
    roomCode?: string;
    preset?: string;
    motoricSubMode?: string;
    intellectualSubMode?: string;
  }>,
  defaultRoomCode: string,
  defaultJenjang: string = "Kelas 4 SD"
): Promise<StudentProfile[]> {
  const createdStudents: StudentProfile[] = [];

  for (const item of studentsData) {
    if (!item.name || !item.name.trim()) continue;
    const roomCode = (item.roomCode || defaultRoomCode).trim().toUpperCase();
    const jenjang = item.jenjang || defaultJenjang;
    const preset = item.preset || "fisik_motorik";

    const student = await addStudent({
      name: item.name.trim(),
      jenjang: jenjang,
      roomCode: roomCode,
      preset: preset,
      motoricSubMode: item.motoricSubMode,
      intellectualSubMode: item.intellectualSubMode,
    });
    createdStudents.push(student);
  }

  return createdStudents;
}

/**
 * Reset PIN siswa menjadi 4-digit acak baru
 */
export async function resetStudentPin(studentId: string): Promise<string> {
  const newPin = Math.floor(1000 + Math.random() * 9000).toString();
  const localList = getLocalStudents();
  const target = localList.find((s) => s.id === studentId);

  if (target) {
    target.pin_code = newPin;
    target.accessibility_config = {
      ...(target.accessibility_config || {}),
      pin_code: newPin,
    };
    saveLocalStudents([...localList]);
  }

  try {
    // Ambil profil dari Supabase untuk update aman
    const { data } = await supabase.from("profiles").select("accessibility_config").eq("id", studentId).single();
    const oldConfig = data?.accessibility_config || target?.accessibility_config || {};
    const updatedConfig = { ...oldConfig, pin_code: newPin };

    await supabase.from("profiles").update({ accessibility_config: updatedConfig }).eq("id", studentId);
  } catch (err) {
    console.error("Error resetting PIN in Supabase (updated locally):", err);
  }

  return newPin;
}

/**
 * Format teks siap kirim ke WhatsApp wali murid
 */
export function formatWhatsAppStudentAccess(student: StudentProfile): string {
  const pin = student.pin_code || student.accessibility_config?.pin_code || "----";
  const room = student.current_room_code || "-";
  const name = student.full_name || "Murid";
  return `Halo Bunda/Ayah ${name}, Akses PINTARA ${name}: Kode Kelas: ${room} | PIN: ${pin}`;
}

/**
 * Hapus siswa
 */
export async function deleteStudent(studentId: string): Promise<void> {
  const localList = getLocalStudents();
  const filtered = localList.filter((s) => s.id !== studentId);
  saveLocalStudents(filtered);

  try {
    await supabase.from("profiles").delete().eq("id", studentId);
  } catch (err) {
    console.error("Error deleting student in Supabase:", err);
  }
}

/**
 * Helper untuk memetakan teks kategori/mode dari file Excel ke identifier preset sistem
 */
export function mapExcelTextToPreset(text: string): { preset: string; motoricSubMode?: string } {
  if (!text) return { preset: "fisik_motorik", motoricSubMode: "tremor_filter" };
  const lower = text.toLowerCase().trim();

  if (lower.includes("mata") || lower.includes("eye") || lower.includes("lumpuh mata")) {
    return { preset: "fisik_mata" };
  }
  if (lower.includes("suara") || lower.includes("voice") || lower.includes("bicara")) {
    return { preset: "fisik_suara" };
  }
  if (lower.includes("sakelar") || lower.includes("switch") || lower.includes("single")) {
    return { preset: "fisik_motorik", motoricSubMode: "single_switch" };
  }
  if (lower.includes("besar") || lower.includes("standar besar") || lower.includes("adaptif")) {
    return { preset: "fisik_motorik", motoricSubMode: "standar_besar" };
  }
  if (lower.includes("motorik") || lower.includes("tremor") || lower.includes("tangan") || lower.includes("fisik")) {
    return { preset: "fisik_motorik", motoricSubMode: "tremor_filter" };
  }
  if (lower.includes("netra") || lower.includes("tunanetra") || lower.includes("blind")) {
    return { preset: "sensorik_tunanetra" };
  }
  if (lower.includes("rungu") || lower.includes("tunarungu") || lower.includes("isyarat") || lower.includes("deaf")) {
    return { preset: "sensorik_tunarungu" };
  }
  if (lower.includes("intelek") || lower.includes("kognitif") || lower.includes("down syndrome")) {
    return { preset: "intelektual" };
  }
  if (lower.includes("mental") || lower.includes("sensori") || lower.includes("autis") || lower.includes("adhd")) {
    return { preset: "mental" };
  }
  return { preset: "fisik_motorik", motoricSubMode: "tremor_filter" };
}

/**
 * Parsing file Excel / CSV yang diunggah oleh guru
 */
export async function parseExcelStudentFile(
  file: File,
  defaultRoomCode: string
): Promise<Array<{ name: string; jenjang: string; roomCode: string; preset: string; motoricSubMode?: string }>> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const result: Array<{ name: string; jenjang: string; roomCode: string; preset: string; motoricSubMode?: string }> = [];

  for (const row of rawRows) {
    // Temukan key nama murid
    const nameKey = Object.keys(row).find((k) =>
      /nama|murid|siswa|student/i.test(k)
    );
    const rawName = nameKey ? String(row[nameKey]).trim() : "";
    if (!rawName) continue;

    // Temukan key jenjang
    const jenjangKey = Object.keys(row).find((k) =>
      /jenjang|kelas|grade/i.test(k)
    );
    let rawJenjang = jenjangKey ? String(row[jenjangKey]).trim() : "Kelas 4 SD";
    if (rawJenjang && !rawJenjang.toLowerCase().includes("sd") && !rawJenjang.toLowerCase().includes("kelas")) {
      rawJenjang = `Kelas ${rawJenjang} SD`;
    }

    // Temukan key room / kode kelas
    const roomKey = Object.keys(row).find((k) =>
      /kode|room|ruang/i.test(k)
    );
    const rawRoom = roomKey && String(row[roomKey]).trim() ? String(row[roomKey]).trim().toUpperCase() : defaultRoomCode;

    // Temukan key mode / preset aksesibilitas
    const modeKey = Object.keys(row).find((k) =>
      /mode|preset|akses|kebutuhan|kategori|disabilitas/i.test(k)
    );
    const rawMode = modeKey ? String(row[modeKey]).trim() : "Motorik Halus";

    // Temukan key sub-mode jika ada
    const subModeKey = Object.keys(row).find((k) =>
      /sub|metode/i.test(k)
    );
    const rawSubMode = subModeKey ? String(row[subModeKey]).trim() : "";

    const { preset, motoricSubMode } = mapExcelTextToPreset(rawMode + " " + rawSubMode);

    result.push({
      name: rawName,
      jenjang: rawJenjang || "Kelas 4 SD",
      roomCode: rawRoom,
      preset: preset,
      motoricSubMode: motoricSubMode,
    });
  }

  return result;
}

/**
 * Menghasilkan dan mendownload template Excel pendaftaran siswa (.xlsx)
 */
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      "Nama Siswa": "Budi Santoso",
      "Kelas / Jenjang": "Kelas 4 SD",
      "Kode Kelas": "SD4B",
      "Mode Aksesibilitas": "Motorik Halus (Filter Tremor)",
    },
    {
      "Nama Siswa": "Siti Nurhaliza",
      "Kelas / Jenjang": "Kelas 4 SD",
      "Kode Kelas": "SD4B",
      "Mode Aksesibilitas": "Tunanetra",
    },
    {
      "Nama Siswa": "Kevin Alamsyah",
      "Kelas / Jenjang": "Kelas 4 SD",
      "Kode Kelas": "SD4B",
      "Mode Aksesibilitas": "Lumpuh Total (Kontrol Mata)",
    },
    {
      "Nama Siswa": "Alya Pratama",
      "Kelas / Jenjang": "Kelas 4 SD",
      "Kode Kelas": "SD4B",
      "Mode Aksesibilitas": "Tunarungu",
    },
    {
      "Nama Siswa": "Doni Kusuma",
      "Kelas / Jenjang": "Kelas 4 SD",
      "Kode Kelas": "SD4B",
      "Mode Aksesibilitas": "Intelektual",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  // Lebar kolom rapi
  ws["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 34 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daftar Calon Siswa");
  XLSX.writeFile(wb, "Template_Pendaftaran_Siswa_PINTARA.xlsx");
}

/**
 * Menghasilkan Dokumen Rekap Akun Kelas yang siap cetak / PDF (Hemat Kertas, Grid ID Card)
 */
export function printClassAccountSummary(students: StudentProfile[], roomCode: string): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=900,height=800");
  if (!printWindow) {
    alert("Pop-up diblokir browser. Harap izinkan pop-up untuk mencetak rekap kartu akun siswa.");
    return;
  }

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cardsHtml = students
    .map(
      (s) => `
    <div class="card">
      <div class="card-header">
        <span class="card-brand">PINTARA</span>
        <span class="card-badge">KARTU AKSES SISWA</span>
      </div>
      <div class="card-body">
        <div class="student-name">${s.full_name}</div>
        <div class="student-meta">${s.jenjang || "SD Inklusif"} • Mode: <strong>${getA11yPresetLabel(s.accessibility_config)}</strong></div>
        
        <div class="credential-box">
          <div class="cred-item">
            <span class="cred-label">KODE KELAS</span>
            <span class="cred-value code">${s.current_room_code || roomCode}</span>
          </div>
          <div class="cred-item pin-box">
            <span class="cred-label">PIN RAHASIA</span>
            <span class="cred-value pin">${s.pin_code || s.accessibility_config?.pin_code || "----"}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span>Login: pintara.local → Masukkan Kode & PIN</span>
        </div>
      </div>
      <div class="cut-guide">Garis Potong</div>
    </div>
  `
    )
    .join("");

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Rekap Akun Siswa - Kelas ${roomCode}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 16px;
          background-color: #f8fafc;
          color: #0f172a;
        }
        .no-print-bar {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .btn-print {
          background-color: #15803d;
          color: white;
          font-weight: 800;
          font-size: 15px;
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-print:hover {
          background-color: #166534;
        }
        .btn-close {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          font-size: 14px;
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          cursor: pointer;
        }
        .doc-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .doc-header h1 {
          font-size: 20px;
          margin: 0 0 4px 0;
          color: #166534;
          font-weight: 900;
          letter-spacing: -0.5px;
        }
        .doc-header p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          font-weight: 600;
        }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .card {
          border: 2px dashed #94a3b8;
          border-radius: 14px;
          background: #ffffff;
          padding: 12px 14px;
          position: relative;
          page-break-inside: avoid;
          display: flex;
          flex-col;
          flex-direction: column;
          justify-content: space-between;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .card-brand {
          font-weight: 900;
          font-size: 15px;
          color: #15803d;
          letter-spacing: 0.5px;
        }
        .card-badge {
          background: #dcfce7;
          color: #166534;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .student-name {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .student-meta {
          font-size: 11px;
          color: #475569;
          margin-bottom: 8px;
        }
        .credential-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px 10px;
          margin-bottom: 8px;
        }
        .cred-item {
          display: flex;
          flex-direction: column;
        }
        .cred-label {
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cred-value {
          font-size: 14px;
          font-weight: 900;
        }
        .cred-value.code {
          color: #0f172a;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .cred-value.pin {
          color: #dc2626;
          font-family: monospace;
          font-size: 18px;
          letter-spacing: 3px;
        }
        .card-footer {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
          text-align: center;
        }
        .cut-guide {
          position: absolute;
          bottom: 2px;
          right: 8px;
          font-size: 8px;
          color: #94a3b8;
          font-weight: 600;
        }
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .no-print-bar {
            display: none !important;
          }
          .card {
            border-color: #cbd5e1;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div>
          <strong style="font-size: 16px; color: #1e293b;">Rekap Akun Siswa (Kelas: ${roomCode})</strong>
          <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
            Total: <strong>${students.length} Siswa</strong> • Format Kartu Grid (Hemat Kertas A4)
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-print" onclick="window.print()">Cetak / Simpan PDF</button>
          <button class="btn-close" onclick="window.close()">Tutup</button>
        </div>
      </div>

      <div class="doc-header">
        <h1>REKAP KARTU LOGIN SISWA - PINTARA</h1>
        <p>Kode Ruang Kelas: <strong>${roomCode}</strong> • Dicetak pada: ${currentDate}</p>
      </div>

      <div class="grid-container">
        ${cardsHtml}
      </div>

      <script>
        // Otomatis membuka dialog print browser setelah halaman termuat
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}
