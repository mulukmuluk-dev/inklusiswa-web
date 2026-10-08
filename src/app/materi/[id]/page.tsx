"use client";

import React, { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameEngineStage } from "@/components/game/GameEngineStage";

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = resolvedParams.id;
  const kelasParam = searchParams.get("kelas") || "";

  const subjectTitles: Record<string, string> = {
    matematika: "Matematika",
    indonesia: "Bahasa Indonesia",
    inggris: "Bahasa Inggris",
    biologi: "Biologi",
    kimia: "Kimia",
    fisika: "Fisika",
    ekonomi: "Ekonomi",
    sosiologi: "Sosiologi",
    geografi: "Geografi",
    sejarah: "Sejarah",
    pkn: "Pendidikan Pancasila (PKN)",
    "cerdas-memilih": "Yuk, Cerdas Memilih!",
  };

  const baseTitle = subjectTitles[subjectId] || subjectId.toUpperCase();

  return (
    <GameEngineStage
      subjectId={subjectId}
      subjectTitle={baseTitle}
      kelasParam={kelasParam}
      onBackToCatalog={() => router.push("/dashboard")}
    />
  );
}
