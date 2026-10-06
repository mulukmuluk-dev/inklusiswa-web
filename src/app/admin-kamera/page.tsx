import React from "react";
import { SignLanguageCamera } from "@/components/SignLanguageCamera";

export default function AdminKameraPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <SignLanguageCamera />
      </div>
    </div>
  );
}
