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
    pancasila: "Pendidikan Pancasila",
    pkn: "Pendidikan Pancasila",
    "seni-budaya": "Seni dan Budaya",
    inggris: "Bahasa Inggris",
    ipas: "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
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
