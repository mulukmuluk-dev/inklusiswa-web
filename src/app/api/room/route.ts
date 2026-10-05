import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Global server-side room store (persists across requests during server runtime)
const globalServerRoomStore: Record<string, any> = {};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Kode room wajib diisi" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    // 1. Check global server room store first
    if (globalServerRoomStore[cleanCode]) {
      return NextResponse.json({ success: true, room: globalServerRoomStore[cleanCode] });
    }

    // 2. Query class_rooms from Supabase
    const { data: dbRoom, error: roomErr } = await supabase
      .from("class_rooms")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (roomErr) {
      console.warn("Supabase GET room error:", roomErr);
    }

    if (!dbRoom) {
      return NextResponse.json({ success: false, message: "Room tidak ditemukan di Supabase" }, { status: 404 });
    }

    // 3. Query learning_materials from Supabase
    const { data: mats, error: matErr } = await supabase
      .from("learning_materials")
      .select("*")
      .eq("room_code", cleanCode);

    if (matErr) {
      console.warn("Supabase GET materials error:", matErr);
    }

    const constructedRoom = {
      code: dbRoom.code,
      className: dbRoom.class_name || "Kelas Inklusif",
      subject: dbRoom.subject || "Umum",
      teacherName: dbRoom.teacher_name || "Pengajar",
      announcements: [],
      messages: [],
      materials: (mats || []).map((m: any, idx: number) => ({
        id: m.id || `mat-db-${idx}`,
        title: m.title,
        summary: m.summary || `Modul materi terlampir: ${m.title}`,
        content: m.content || `Dokumen Modul Materi: "${m.title}"`,
        flashcards: Array.isArray(m.flashcards) ? m.flashcards : [],
      })),
      quizzes: [],
      exams: [],
    };

    // Cache in global store
    globalServerRoomStore[cleanCode] = constructedRoom;

    return NextResponse.json({ success: true, room: constructedRoom });
  } catch (error: any) {
    console.error("API GET Room Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { room } = await req.json();

    if (!room || !room.code) {
      return NextResponse.json({ error: "Data room tidak valid" }, { status: 400 });
    }

    const cleanCode = room.code.toUpperCase().trim();

    // 1. Save into global server room store
    globalServerRoomStore[cleanCode] = room;

    // 2. Try upserting to Supabase PostgreSQL DB
    try {
      await supabase.from("class_rooms").upsert(
        {
          code: cleanCode,
          class_name: room.className || "Kelas Inklusif",
          subject: room.subject || "Umum",
          teacher_name: room.teacherName || "Pengajar",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "code" }
      );

      if (room.materials && Array.isArray(room.materials) && room.materials.length > 0) {
        const matRows = room.materials.map((m: any) => ({
          room_code: cleanCode,
          title: m.title,
          summary: m.summary,
          content: m.content,
          flashcards: m.flashcards || [],
        }));
        await supabase.from("learning_materials").upsert(matRows);
      }
    } catch (e) {
      console.warn("Supabase upsert warning:", e);
    }

    return NextResponse.json({ success: true, message: `Room ${cleanCode} berhasil disinkronisasi!` });
  } catch (error: any) {
    console.error("API POST Room Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
