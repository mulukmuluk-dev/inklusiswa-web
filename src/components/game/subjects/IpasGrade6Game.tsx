"use client";

import React, { useState, useEffect, useRef } from "react";
import { speakGlobal } from "@/lib/soundControl";
import { playPopSound, playSuccessFanfare, playClueChime } from "@/lib/audioSynthesizer";

interface QuestionItem {
  id: number;
  question: string;
  visualHelper?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LevelConceptData {
  title: string;
  conceptText: string;
  questions: QuestionItem[];
}

interface IpasGrade6GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IpasGrade6Game({ levelId, onLevelComplete, accessibilityMode }: IpasGrade6GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeJoint, setActiveJoint] = useState<{ joint: string; dir: string; sample: string }>({ joint: "Sendi Engsel", dir: "Gerak 1 arah (seperti pintu)", sample: "Siku tangan dan lutut kaki." });
  const [activeOrgan, setActiveOrgan] = useState<{ organ: string; system: string; duty: string }>({ organ: "Alveolus", system: "Pernapasan", duty: "Tempat pertukaran gas oksigen (O2) dan karbon dioksida (CO2)." });
  const [activeBreed, setActiveBreed] = useState<{ type: string; sample: string; desc: string }>({ type: "Vivipar", sample: "Sapi, Kucing, Lumba-lumba", desc: "Berkembang biak dengan melahirkan anak setelah mengandung embrio." });
  const [activePlanet, setActivePlanet] = useState<{ name: string; feat: string }>({ name: "Yupiter", feat: "Planet terbesar dalam tata surya dengan bintik merah raksasa." });
  const [activeHistoricalEvent, setActiveHistoricalEvent] = useState<{ event: string; date: string; impact: string }>({ event: "Proklamasi Kemerdekaan", date: "17 Agustus 1945", impact: "Pernyataan resmi bangsa Indonesia merdeka dari penjajahan." });
  const [activeAseanCountry, setActiveAseanCountry] = useState<{ country: string; capital: string; landmark: string }>({ country: "Indonesia", capital: "Jakarta / IKN", landmark: "Monumen Nasional & Candi Borobudur" });
  const [activeCoopArea, setActiveCoopArea] = useState<{ field: string; sample: string; note: string }>({ field: "Ekonomi ASEAN", sample: "MEA (Masyarakat Ekonomi ASEAN)", note: "Mempermudah arus perdagangan barang & jasa antarnegara anggota." });
  const [activeEcoIssue, setActiveEcoIssue] = useState<{ issue: string; cause: string; solution: string }>({ issue: "Pemanasan Global", cause: "Gas rumah kaca (emisi CO2)", solution: "Reboisasi dan beralih ke energi surya/angin." });

  // Phase 2 states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  const shuffleQuestions = (data: LevelConceptData): QuestionItem[] => {
    return data.questions.map((q) => {
      const correctText = q.options[q.correctIndex];
      const newOpts = [...q.options];
      for (let i = newOpts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOpts[i], newOpts[j]] = [newOpts[j], newOpts[i]];
      }
      return {
        ...q,
        options: newOpts,
        correctIndex: newOpts.indexOf(correctText),
      };
    });
  };

  useEffect(() => {
    setPhase("materi");
    setActiveJoint({ joint: "Sendi Engsel", dir: "Gerak 1 arah (seperti pintu)", sample: "Siku tangan dan lutut kaki." });
    setActiveOrgan({ organ: "Alveolus", system: "Pernapasan", duty: "Tempat pertukaran gas oksigen (O2) dan karbon dioksida (CO2)." });
    setActiveBreed({ type: "Vivipar", sample: "Sapi, Kucing, Lumba-lumba", desc: "Berkembang biak dengan melahirkan anak setelah mengandung embrio." });
    setActivePlanet({ name: "Yupiter", feat: "Planet terbesar dalam tata surya dengan bintik merah raksasa." });
    setActiveHistoricalEvent({ event: "Proklamasi Kemerdekaan", date: "17 Agustus 1945", impact: "Pernyataan resmi bangsa Indonesia merdeka dari penjajahan." });
    setActiveAseanCountry({ country: "Indonesia", capital: "Jakarta / IKN", landmark: "Monumen Nasional & Candi Borobudur" });
    setActiveCoopArea({ field: "Ekonomi ASEAN", sample: "MEA (Masyarakat Ekonomi ASEAN)", note: "Mempermudah arus perdagangan barang & jasa antarnegara anggota." });
    setActiveEcoIssue({ issue: "Pemanasan Global", cause: "Gas rumah kaca (emisi CO2)", solution: "Reboisasi dan beralih ke energi surya/angin." });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade6IpasData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade6IpasData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Pertanyaan nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
    }
  }, [currentQuestionIndex, phase, isCompleted, currentQ]);

  const handleStartGameChallenge = () => {
    playPopSound();
    setPhase("game");
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    isProcessingRef.current = false;
    setQuestionsList(shuffleQuestions(levelData));
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (isProcessingRef.current || isAnswerChecked || isCompleted) return;
    isProcessingRef.current = true;
    playPopSound();
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQ.correctIndex;
    setIsAnswerChecked(true);

    if (isCorrect) {
      playSuccessFanfare();
      const updatedScore = Math.min(score + 1, levelData.questions.length);
      setScore(updatedScore);
      speakGlobal("Hebat! Jawabanmu benar sekali! " + currentQ.explanation);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < levelData.questions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedOption(null);
          setIsAnswerChecked(false);
          setWrongAttempts(0);
          setShowClue(false);
          isProcessingRef.current = false;
        } else {
          setIsCompleted(true);
          isProcessingRef.current = false;
          const finalScore = updatedScore;
          const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : 1;
          speakGlobal(`Luar biasa! Kamu menyelesaikan seluruh 10 soal dan meraih ${stars} bintang!`);
        }
      }, 1400);
    } else {
      const attempts = wrongAttempts + 1;
      setWrongAttempts(attempts);
      if (attempts >= 2) {
        setShowClue(true);
        playClueChime();
        speakGlobal("Petunjuk: " + currentQ.explanation);
      } else {
        speakGlobal("Belum tepat, coba periksa kembali.");
      }
      setTimeout(() => {
        setSelectedOption(null);
        setIsAnswerChecked(false);
        isProcessingRef.current = false;
      }, 1300);
    }
  };

  const handleFinishLevel = () => {
    const stars = score >= 9 ? 3 : score >= 7 ? 2 : 1;
    onLevelComplete(levelId, stars);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[560px] p-4 md:p-8 bg-[#FFE296] rounded-[32px] border-4 border-[#3C632A] text-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden">
      
      {/* Header Info Level */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            KELAS 6 SD • LEVEL {levelId} dari 8
          </span>
          <h2 className="text-lg md:text-xl font-black text-[#3C632A] drop-shadow-sm">
            {levelData.title}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {phase === "game" && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                setPhase("materi");
                speakGlobal(levelData.conceptText);
              }}
              className="px-3.5 py-2 bg-[#FFDF59] text-[#3C632A] font-black text-xs rounded-xl border-2 border-[#3C632A] shadow-sm hover:scale-105 transition-all cursor-pointer"
            >
              Pelajari Materi
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (phase === "materi") {
                speakGlobal(levelData.conceptText);
              } else if (!isCompleted && currentQ) {
                speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
              }
            }}
            className="px-4 py-2 bg-[#C3631D] hover:bg-[#B25615] text-[#FFDF59] font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A] shadow-[3px_3px_0px_0px_#3C632A] transition-all flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            <span>Dengar Suara</span>
          </button>
        </div>
      </div>

      {/* ================= FASE 1: LABORATORIUM KONSEP MATERI ================= */}
      {phase === "materi" ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between p-6 bg-white/80 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-2 text-center animate-in fade-in duration-300">
          <div className="space-y-4">
            <span className="px-4 py-1.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm rounded-xl border-2 border-[#3C632A] uppercase tracking-wider">
              FASE 1: LABORATORIUM KONSEP MATERI
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Visualizer Lab */}
          <div className="w-full bg-[#FFDF59] border-4 border-[#3C632A] rounded-[24px] p-4 flex flex-col items-center justify-center min-h-[160px] shadow-[4px_4px_0px_0px_#3C632A]">
            {levelId === 1 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Macam-Macam Sendi pada Sistem Gerak:
                </span>
                <div className="grid grid-cols-5 gap-1 w-full text-xs">
                  {[
                    { joint: "Sendi Engsel", dir: "1 Arah", sample: "Siku & lutut kaki" },
                    { joint: "Sendi Peluru", dir: "Segala Arah", sample: "Bahu & tulang panggul" },
                    { joint: "Sendi Putar", dir: "Gerak Berputar", sample: "Tulang leher & tengkorak" },
                    { joint: "Sendi Pelana", dir: "2 Arah", sample: "Pangkal ibu jari tangan" },
                    { joint: "Sendi Geser", dir: "Pergeseran datar", sample: "Pergelangan tangan/kaki" },
                  ].map((j) => (
                    <button
                      key={j.joint}
                      type="button"
                      onClick={() => {
                        setActiveJoint(j);
                        playPopSound();
                        speakGlobal(`${j.joint}: arah gerak ${j.dir}. Contoh: ${j.sample}`);
                      }}
                      className={`p-1.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeJoint.joint === j.joint ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{j.joint}</strong>
                      <span className="text-[9px] opacity-80 block">{j.dir}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeJoint.joint}: </strong>
                  <span>Gerak {activeJoint.dir} — Contoh pada tubuh: <strong>{activeJoint.sample}</strong>.</span>
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Sistem Organ Vital Tubuh Manusia:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { organ: "Alveolus", system: "Pernapasan", duty: "Pertukaran gas O2 & CO2 di paru-paru." },
                    { organ: "Lambung", system: "Pencernaan", duty: "Mencerna makanan secara kimiawi dengan enzim pepsin & asam lambung." },
                    { organ: "Jantung", system: "Peredaran Darah", duty: "Memompa darah kaya oksigen ke seluruh bagian tubuh." },
                    { organ: "Otak", system: "Saraf Pusat", duty: "Pusat kendali kesadaran, memori, dan gerak tubuh." },
                  ].map((o) => (
                    <button
                      key={o.organ}
                      type="button"
                      onClick={() => {
                        setActiveOrgan(o);
                        playPopSound();
                        speakGlobal(`Organ ${o.organ} pada sistem ${o.system}. Tugas: ${o.duty}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeOrgan.organ === o.organ ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{o.organ}</strong>
                      <span className="text-[9px] opacity-80 block">{o.system}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeOrgan.organ} (Sistem {activeOrgan.system}): </strong>
                  <span>{activeOrgan.duty}</span>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Perkembangbiakan Hewan (Ovipar, Vivipar, Ovovivipar):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { type: "Ovipar", sample: "Ayam, Burung, Katak", desc: "Bertelur di luar tubuh induk tanpa daun telinga/kelenjar susu." },
                    { type: "Vivipar", sample: "Sapi, Kucing, Paus", desc: "Melahirkan anak, memiliki daun telinga dan menyusui." },
                    { type: "Ovovivipar", sample: "Ular Boa, Kadal, Hiu", desc: "Bertelur dan menetas di dalam tubuh induk sebelum dilahirkan." },
                  ].map((b) => (
                    <button
                      key={b.type}
                      type="button"
                      onClick={() => {
                        setActiveBreed(b);
                        playPopSound();
                        speakGlobal(`${b.type}: ${b.desc}. Contoh: ${b.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeBreed.type === b.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{b.type}</strong>
                      <span className="text-[10px] opacity-80 block">{b.sample}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Tumbuhan: </strong>Generatif (biji dari penyerbukan) vs Vegetatif (tunas, umbi, cangkok, stek).
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Planet dalam Tata Surya & Gerak Bumi:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { name: "Merkurius", feat: "Planet terdekat dengan matahari, tanpa atmosfer tebal." },
                    { name: "Venus", feat: "Planet terpanas karena efek rumah kaca ekstrem, bintang fajar." },
                    { name: "Bumi", feat: "Satu-satunya planet berpenghuni dengan air dan oksigen berlimpah." },
                    { name: "Mars", feat: "Planet merah dengan tanah kaya oksida besi dan gunung Olympus." },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setActivePlanet(p);
                        playPopSound();
                        speakGlobal(`Planet ${p.name}: ${p.feat}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePlanet.name === p.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{p.name}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activePlanet.name}: </strong>
                  <span>{activePlanet.feat} (Rotasi: siang-malam; Revolusi: musim).</span>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Peristiwa Kunci Perjuangan Kemerdekaan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { event: "Sumpah Pemuda", date: "28 Oktober 1928", impact: "Ikrar satu tanah air, satu bangsa, dan satu bahasa persatuan." },
                    { event: "Rengasdengklok", date: "16 Agustus 1945", impact: "Pemuda mendesak Soekarno-Hatta segera memproklamasikan kemerdekaan." },
                    { event: "Proklamasi RI", date: "17 Agustus 1945", impact: "Pembacaan teks Proklamasi di Jl. Pegangsaan Timur 56 Jakarta." },
                  ].map((ev) => (
                    <button
                      key={ev.event}
                      type="button"
                      onClick={() => {
                        setActiveHistoricalEvent(ev);
                        playPopSound();
                        speakGlobal(`Peristiwa ${ev.event} tanggal ${ev.date}. ${ev.impact}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeHistoricalEvent.event === ev.event ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{ev.event}</strong>
                      <span className="text-[10px] opacity-80 block">{ev.date}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeHistoricalEvent.event} ({activeHistoricalEvent.date}): </strong>
                  <span>{activeHistoricalEvent.impact}</span>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Negara-Negara Anggota ASEAN & Karakteristiknya:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { country: "Malaysia", capital: "Kuala Lumpur", landmark: "Menara Kembar Petronas" },
                    { country: "Singapura", capital: "Singapura", landmark: "Patung Merlion & pelabuhan transit tersibuk" },
                    { country: "Thailand", capital: "Bangkok", landmark: "Negeri Gajah Putih yang tak pernah dijajah bangsa Eropa" },
                    { country: "Filipina", capital: "Manila", landmark: "Negara kepulauan dengan lumbung padi IRRI" },
                  ].map((c) => (
                    <button
                      key={c.country}
                      type="button"
                      onClick={() => {
                        setActiveAseanCountry(c);
                        playPopSound();
                        speakGlobal(`Negara ${c.country}, ibu kota ${c.capital}. Ikon: ${c.landmark}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeAseanCountry.country === c.country ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{c.country}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeAseanCountry.country}: </strong>
                  <span>Ibu kota {activeAseanCountry.capital} — {activeAseanCountry.landmark}.</span>
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kerja Sama Antarnegara & Globalisasi:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { field: "Ekonomi", sample: "MEA & Ekspor Impor", note: "Bebas tarif bea cukai tertentu di kawasan ASEAN." },
                    { field: "Sosial Budaya", sample: "SEA Games & Festival Film", note: "Mempererat persahabatan pemuda lintas negara." },
                    { field: "Politik Keamanan", sample: "ZOPFAN & Perjanjian Bebas Nuklir", note: "Menjaga kawasan Asia Tenggara tetap damai netral." },
                  ].map((co) => (
                    <button
                      key={co.field}
                      type="button"
                      onClick={() => {
                        setActiveCoopArea(co);
                        playPopSound();
                        speakGlobal(`Bidang ${co.field}: ${co.sample}. ${co.note}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCoopArea.field === co.field ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{co.field}</strong>
                      <span className="text-[10px] opacity-80 block">{co.sample}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeCoopArea.field}: </strong>
                  <span>{activeCoopArea.sample} — {activeCoopArea.note}</span>
                </div>
              </div>
            )}

            {levelId === 8 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Isu Lingkungan Global & Energi Terbarukan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { issue: "Pemanasan Global", cause: "Gas CO2 pabrik & kendaraan", solution: "Menanam sejuta pohon dan konservasi energi." },
                    { issue: "Krisis Energi Fosil", cause: "Batubara & minyak bumi menipis", solution: "Beralih ke pembangkit listrik tenaga surya & angin." },
                    { issue: "Sampah Plastik", cause: "Plastik sekali pakai tak terurai", solution: "Terapkan prinsip 3R: Reduce, Reuse, Recycle." },
                  ].map((iss) => (
                    <button
                      key={iss.issue}
                      type="button"
                      onClick={() => {
                        setActiveEcoIssue(iss);
                        playPopSound();
                        speakGlobal(`Isu ${iss.issue}. Penyebab: ${iss.cause}. Solusi: ${iss.solution}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeEcoIssue.issue === iss.issue ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{iss.issue}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeEcoIssue.issue}: </strong>
                  <span>Pemicu: {activeEcoIssue.cause} | Solusi: <strong>{activeEcoIssue.solution}</strong>.</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartGameChallenge}
            className="w-full py-5 bg-[#7FD13B] hover:bg-[#6EB832] active:scale-95 text-white border-4 border-[#3C632A] font-black text-2xl sm:text-3xl rounded-[28px] shadow-[4px_4px_0px_0px_#3C632A] transition-all cursor-pointer relative z-20 mt-4"
          >
            Aku Sudah Paham, Mulai Game
          </button>
        </div>
      ) : isCompleted ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center p-8 bg-white/90 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-4 text-center animate-in zoom-in-95 duration-300">
          <span className="text-6xl mb-2">🏆</span>
          <h3 className="text-3xl font-black text-[#3C632A] mb-2">
            Misi Selesai!
          </h3>
          <p className="text-lg font-bold text-[#3C632A]/90 mb-4">
            Kamu berhasil menyelesaikan seluruh {levelData.questions.length} soal pada Level {levelId}!
          </p>

          <div className="flex items-center gap-2 text-4xl mb-6">
            <span className={score >= 1 ? "opacity-100" : "opacity-30"}>⭐</span>
            <span className={score >= 7 ? "opacity-100" : "opacity-30"}>⭐</span>
            <span className={score >= 9 ? "opacity-100" : "opacity-30"}>⭐</span>
          </div>

          <div className="bg-[#FFDF59] border-2 border-[#3C632A] px-6 py-3 rounded-2xl font-black text-xl text-[#3C632A] mb-6">
            Skor Akhir: {Math.min(score, levelData.questions.length)} dari {levelData.questions.length} Soal Benar
          </div>

          <button
            type="button"
            onClick={handleFinishLevel}
            className="px-8 py-4 bg-[#7FD13B] hover:bg-[#6EB832] text-white font-black text-xl rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Lanjut & Simpan Bintang
          </button>
        </div>
      ) : (
        /* ================= FASE 2: TANTANGAN 10 SOAL BERURUTAN ================= */
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between my-2">
          
          {/* PROGRESS BAR 10 SOAL */}
          <div className="w-full bg-white/90 border-4 border-[#3C632A] rounded-2xl p-3 shadow-[4px_4px_0px_0px_#3C632A] mb-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs md:text-sm font-black text-[#3C632A]">
              <span>Tantangan Game: Soal {currentQuestionIndex + 1} dari {levelData.questions.length}</span>
              <span className="bg-[#FFDF59] px-3 py-1 rounded-xl border border-[#3C632A]">
                Skor: {score}
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full border-2 border-[#3C632A] overflow-hidden">
              <div
                className="h-full bg-[#7FD13B] transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / levelData.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* PERTANYAAN SOAL */}
          <div className="w-full bg-[#C3631D] text-[#FFDF59] border-4 border-[#3C632A] p-6 md:p-8 rounded-3xl text-center shadow-[6px_6px_0px_0px_#3C632A] mb-6">
            <p className="text-2xl md:text-3xl font-black leading-snug">
              {currentQ.question}
            </p>
            {currentQ.visualHelper && (
              <div className="mt-3 text-2xl font-black text-white bg-black/20 py-2 px-4 rounded-xl inline-block">
                {currentQ.visualHelper}
              </div>
            )}
            {showClue && (
              <div className="mt-3 p-2 bg-[#FFDF59] border-2 border-[#3C632A] rounded-xl text-xs font-bold text-[#3C632A] animate-in fade-in">
                💡 Petunjuk: {currentQ.explanation}
              </div>
            )}
          </div>

          {/* PILIHAN JAWABAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
            {currentQ.options.map((optText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentQ.correctIndex;

              let btnClass = "bg-[#FFDF59] hover:bg-[#FFE296] text-[#3C632A]";
              if (isSelected && isAnswerChecked) {
                btnClass = isCorrectOpt
                  ? "bg-[#7FD13B] text-white ring-4 ring-white animate-bounce"
                  : "bg-rose-500 text-white animate-shake";
              } else if (showClue && isCorrectOpt) {
                btnClass = "bg-[#7FD13B] text-white ring-8 ring-[#7FD13B]/60 animate-pulse scale-105";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswerChecked}
                  className={`p-5 rounded-2xl border-4 border-[#3C632A] font-black text-xl md:text-2xl transition-all shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 cursor-pointer text-center ${btnClass}`}
                >
                  {optText}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getGrade6IpasData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Sistem Gerak Manusia",
        conceptText: "Sistem gerak manusia terdiri atas tulang (rangka penopang), sendi (penghubung antartulang), dan otot (alat gerak aktif). Jenis sendi: sendi engsel (siku/lutut), peluru (bahu/panggul), putar (leher), pelana (ibu jari), dan geser (pergelangan). Menjaga postur dan gizi kalsium penting untuk kesehatan tulang.",
        questions: [
          {
            id: 1,
            question: "Alat gerak aktif pada tubuh manusia yang dapat berkontraksi dan berelaksasi adalah...",
            options: ["Otot", "Tulang", "Sendi", "Kulit"],
            correctIndex: 0,
            explanation: "Otot adalah alat gerak aktif karena mampu menggerakkan tulang melalui kontraksi dan relaksasi."
          },
          {
            id: 2,
            question: "Sendi yang memungkinkan terjadinya gerakan ke satu arah seperti engsel pada pintu adalah...",
            options: ["Sendi engsel", "Sendi peluru", "Sendi putar", "Sendi pelana"],
            correctIndex: 0,
            explanation: "Sendi engsel terdapat pada siku tangan dan lutut kaki yang bergerak menekuk satu arah."
          },
          {
            id: 3,
            question: "Sendi yang memungkinkan gerakan ke segala arah dan menghubungkan tulang lengan atas dengan gelang bahu adalah...",
            options: ["Sendi peluru", "Sendi engsel", "Sendi geser", "Sendi kaku"],
            correctIndex: 0,
            explanation: "Sendi peluru memiliki ujung berbentuk bonggol bulat yang masuk ke mangkok sendi sehingga dapat berputar bebas."
          },
          {
            id: 4,
            question: "Sendi yang terdapat di antara tulang atlas dan tengkorak leher yang memungkinkan kepala menoleh ke kiri dan kanan adalah...",
            options: ["Sendi putar", "Sendi engsel", "Sendi peluru", "Sendi mati"],
            correctIndex: 0,
            explanation: "Sendi putar memungkinkan gerakan rotasi atau memutar pada poros tulang leher."
          },
          {
            id: 5,
            question: "Sendi yang memungkinkan gerakan dua arah dan terdapat di pangkal ibu jari tangan adalah...",
            options: ["Sendi pelana", "Sendi engsel", "Sendi peluru", "Sendi kaku"],
            correctIndex: 0,
            explanation: "Sendi pelana berbentuk seperti pelana kuda dan memungkinkan gerakan ibu jari ke depan-belakang serta samping."
          },
          {
            id: 6,
            question: "Jenis otot yang bekerja secara tidak sadar (otonom) dan menyusun dinding lambung serta usus adalah...",
            options: ["Otot polos", "Otot lurik (rangka)", "Otot serat melintang", "Otot bisep"],
            correctIndex: 0,
            explanation: "Otot polos bekerja di luar kesadaran kita untuk menggerakkan organ-organ dalam tubuh."
          },
          {
            id: 7,
            question: "Kelainan tulang belakang yang membengkok ke arah samping kiri atau kanan dinamakan...",
            options: ["Skoliosis", "Lordosis", "Kifosis", "Osteoporosis"],
            correctIndex: 0,
            explanation: "Skoliosis sering terjadi akibat kebiasaan posisi duduk miring ke satu sisi secara terus-menerus."
          },
          {
            id: 8,
            question: "Kelainan tulang di mana tulang belakang bagian punggung membengkok ke belakang sehingga tampak bungkuk disebut...",
            options: ["Kifosis", "Lordosis", "Skoliosis", "Rakitis"],
            correctIndex: 0,
            explanation: "Kifosis membuat tubuh tampak bungkuk akibat postur duduk terlalu membungkuk ke depan."
          },
          {
            id: 9,
            question: "Kondisi penurunan kepadatan tulang yang rapuh dan mudah patah pada usia lanjut disebut...",
            options: ["Osteoporosis", "Keseleo", "Patah tertutup", "Rematik"],
            correctIndex: 0,
            explanation: "Osteoporosis terjadi karena tubuh kekurangan asupan kalsium dan vitamin D sehingga tulang keropos."
          },
          {
            id: 10,
            question: "Mineral penting yang sangat dibutuhkan tubuh untuk pertumbuhan dan kepadatan tulang serta gigi adalah...",
            options: ["Kalsium dan fosfor", "Natrium murni", "Zat besi murni", "Yodium"],
            correctIndex: 0,
            explanation: "Kalsium yang terdapat pada susu, keju, dan ikan teri sangat krusial memperkuat matriks tulang."
          }
        ]
      };

    case 2:
      return {
        title: "Sistem Organ Tubuh Manusia",
        conceptText: "Sistem organ vital meliputi pernapasan (hidung, trakea, bronkus, alveolus), pencernaan (mulut, kerongkongan, lambung, usus halus, usus besar), dan peredaran darah (jantung, pembuluh darah arteri & vena). Masa pubertas ditandai perubahan fisik primer dan sekunder menuju kematangan reproduksi.",
        questions: [
          {
            id: 1,
            question: "Gelembung-gelembung halus di dalam paru-paru tempat pertukaran oksigen dan karbon dioksida disebut...",
            options: ["Alveolus", "Bronkus", "Trakea", "Pleura"],
            correctIndex: 0,
            explanation: "Alveolus dikelilingi kapiler darah tipis untuk melepas CO2 dan mengikat O2 ke sel darah merah."
          },
          {
            id: 2,
            question: "Saluran yang menghubungkan rongga mulut dengan lambung pada sistem pencernaan adalah...",
            options: ["Kerongkongan (esofagus)", "Tenggorokan (trakea)", "Usus halus", "Pankreas"],
            correctIndex: 0,
            explanation: "Kerongkongan menyalurkan makanan ke lambung dengan gerak meremas peristaltik."
          },
          {
            id: 3,
            question: "Organ pencernaan tempat penyerapan sari-sari makanan ke dalam aliran darah adalah...",
            options: ["Usus halus", "Lambung", "Usus besar", "Anus"],
            correctIndex: 0,
            explanation: "Usus halus (khususnya ileum) memiliki vili jonjot usus yang menyerap nutrisi ke seluruh tubuh."
          },
          {
            id: 4,
            question: "Organ yang berfungsi memompa darah kaya oksigen ke seluruh bagian tubuh manusia adalah...",
            options: ["Jantung", "Paru-paru", "Hati", "Ginjal"],
            correctIndex: 0,
            explanation: "Jantung memiliki 4 ruang (2 serambi dan 2 bilik) yang berdenyut memompa sirkulasi darah."
          },
          {
            id: 5,
            question: "Pembuluh darah yang mengalirkan darah keluar dari jantung menuju seluruh tubuh bertekanan tinggi adalah...",
            options: ["Pembuluh nadi (arteri)", "Pembuluh balik (vena)", "Kapiler limfa", "Katup aorta"],
            correctIndex: 0,
            explanation: "Arteri berdinding tebal dan elastis untuk menahan semprotan denyut pompa bilik jantung."
          },
          {
            id: 6,
            question: "Sel darah yang bertugas mengangkut gas oksigen dari paru-paru ke seluruh jaringan tubuh adalah...",
            options: ["Sel darah merah (eritrosit)", "Sel darah putih (leukosit)", "Keping darah (trombosit)", "Plasma darah"],
            correctIndex: 0,
            explanation: "Eritrosit mengandung hemoglobin yang mengikat oksigen dan memberi warna merah pada darah."
          },
          {
            id: 7,
            question: "Keping darah (trombosit) memiliki peran sangat penting di dalam tubuh untuk proses...",
            options: ["Pembekuan darah saat luka", "Membunuh kuman penyakit", "Mengedarkan hormon", "Menyerap glukosa"],
            correctIndex: 0,
            explanation: "Trombosit menutup luka dengan benang-benang fibrin agar perdarahan berhenti."
          },
          {
            id: 8,
            question: "Organ ekskresi yang bertugas menyaring sisa metabolisme dan racun dari darah membentuk urin adalah...",
            options: ["Ginjal", "Empedu", "Lambung", "Jantung"],
            correctIndex: 0,
            explanation: "Sepasang ginjal menyaring darah melalui nefron dan membuang cairan limbah sebagai air seni (urin)."
          },
          {
            id: 9,
            question: "Ciri perkembangan fisik sekunder yang terjadi pada anak laki-laki saat memasuki masa pubertas adalah...",
            options: ["Tumbuh jakun dan suara menjadi berat/membesar", "Pinggul melebar", "Kulit semakin halus", "Mengalami menstruasi"],
            correctIndex: 0,
            explanation: "Hormon testosteron memicu pembesaran laring (jakun) dan pendalaman suara pada anak laki-laki."
          },
          {
            id: 10,
            question: "Sikap yang paling benar dalam menjaga kesehatan dan kebersihan diri pada masa pubertas adalah...",
            options: ["Mandi teratur, mengganti pakaian bersih, dan menjaga pergaulan positif", "Malas berolahraga", "Malu bertanya kepada orang tua", "Sering begadang"],
            correctIndex: 0,
            explanation: "Kebersihan tubuh dan komunikasi terbuka dengan orang tua sangat penting menjaga kesehatan reproduksi."
          }
        ]
      };

    case 3:
      return {
        title: "Perkembangbiakan Makhluk Hidup",
        conceptText: "Tumbuhan berkembang biak secara generatif (penyerbukan serbuk sari & kepala putik) dan vegetatif alami (spora, tunas, umbi, rhizoma, geragih) maupun buatan (cangkok, stek). Hewan berkembang biak secara ovipar (bertelur), vivipar (melahirkan), dan ovovivipar (bertelur-melahirkan).",
        questions: [
          {
            id: 1,
            question: "Perkembangbiakan generatif pada tumbuhan berbunga terjadi melalui proses...",
            options: ["Penyerbukan dan pembuahan", "Mencangkok batang", "Stek daun", "Kultur jaringan"],
            correctIndex: 0,
            explanation: "Penyerbukan adalah bertemunya serbuk sari ke kepala putik yang berlanjut pembuahan menghasilkan biji."
          },
          {
            id: 2,
            question: "Tumbuhan cocor bebek berkembang biak secara vegetatif alami menggunakan...",
            options: ["Tunas adventif daun", "Umbi akar", "Geragih", "Spora"],
            correctIndex: 0,
            explanation: "Cocor bebek membentuk kuncup tunas baru di tepi lekukan daunnya yang dapat tumbuh menjadi tanaman baru."
          },
          {
            id: 3,
            question: "Kunyit, jahe, dan lengkuas berkembang biak menggunakan batang yang tumbuh mendatar di dalam tanah yang disebut...",
            options: ["Rhizoma (akar tinggal)", "Umbi batang", "Stolon", "Spora"],
            correctIndex: 0,
            explanation: "Rhizoma adalah modifikasi batang beruas-ruas di bawah tanah yang menghasilkan tunas tanaman baru."
          },
          {
            id: 4,
            question: "Perkembangbiakan vegetatif buatan dengan cara mengupas kulit batang berkayu lalu dibungkus tanah humus disebut...",
            options: ["Mencangkok", "Menyetek", "Merunduk", "Menyambung"],
            correctIndex: 0,
            explanation: "Mencangkok merangsang tumbuhnya akar baru pada cabang pohon sehingga cepat berbuah serupa induknya."
          },
          {
            id: 5,
            question: "Hewan yang berkembang biak dengan cara bertelur dinamakan hewan...",
            options: ["Ovipar", "Vivipar", "Ovovivipar", "Mamalia"],
            correctIndex: 0,
            explanation: "Ovipar berasal dari kata ovum (telur), contohnya ayam, bebek, burung merpati, dan katak."
          },
          {
            id: 6,
            question: "Hewan yang berkembang biak dengan cara melahirkan anak dinamakan hewan...",
            options: ["Vivipar", "Ovipar", "Ovovivipar", "Invertebrata"],
            correctIndex: 0,
            explanation: "Vivipar mengandung embrio di dalam rahim dan menyusui anaknya, contohnya sapi, kucing, kambing, dan paus."
          },
          {
            id: 7,
            question: "Hewan di mana embrio berkembang di dalam telur yang menetas di dalam tubuh induk lalu dilahirkan keluar adalah...",
            options: ["Ovovivipar", "Ovipar murni", "Vivipar murni", "Hermaprodit"],
            correctIndex: 0,
            explanation: "Contoh hewan ovovivipar adalah ular boa, ikan hiu martil, ikan pari, dan beberapa jenis kadal."
          },
          {
            id: 8,
            question: "Paus dan lumba-lumba berkembang biak dengan cara melahirkan (vivipar) karena mereka tergolong kelompok hewan...",
            options: ["Mamalia laut", "Pisces (ikan)", "Reptilia", "Amfibi"],
            correctIndex: 0,
            explanation: "Paus dan lumba-lumba bernapas dengan paru-paru, melahirkan anak, dan menyusui anaknya di laut."
          },
          {
            id: 9,
            question: "Perkembangbiakan lumut dan tumbuhan paku terjadi tanpa biji melainkan menggunakan butiran halus yang disebut...",
            options: ["Spora", "Tunas kelapa", "Biji monokotil", "Umbi lapis"],
            correctIndex: 0,
            explanation: "Kotak spora (sporangium) pada tumbuhan paku pecah menyebarkan spora untuk berkembang biak."
          },
          {
            id: 10,
            question: "Tujuan utama setiap makhluk hidup melakukan perkembangbiakan adalah untuk...",
            options: ["Melestarikan keturunan agar tidak punah", "Memperluas tempat tinggal", "Menambah musuh alami", "Mengubah sifat fisik total"],
            correctIndex: 0,
            explanation: "Reproduksi menjamin kelangsungan spesies makhluk hidup dari satu generasi ke generasi berikutnya."
          }
        ]
      };

    case 4:
      return {
        title: "Tata Surya & Alam Semesta",
        conceptText: "Tata surya berpusat pada Matahari, dikelilingi 8 planet: Merkurius, Venus, Bumi, Mars, Yupiter, Saturnus, Uranus, Neptunus. Rotasi bumi (berputar pada porosnya) menyebabkan siang-malam & perbedaan waktu. Revolusi bumi (mengelilingi matahari) menyebabkan pergantian musim & gerak semu tahunan.",
        questions: [
          {
            id: 1,
            question: "Pusat tata surya yang memancarkan energinya sendiri dan dikelilingi oleh planet-planet adalah...",
            options: ["Matahari", "Bumi", "Bintang Kejora", "Bulan"],
            correctIndex: 0,
            explanation: "Matahari adalah bintang induk raksasa bermassa terbesar yang gravitasinya mengikat planet mengorbit."
          },
          {
            id: 2,
            question: "Planet terdekat dengan Matahari dalam sistem tata surya kita adalah...",
            options: ["Merkurius", "Venus", "Mars", "Yupiter"],
            correctIndex: 0,
            explanation: "Merkurius berada paling dekat dengan Matahari dengan jarak sekitar 58 juta kilometer."
          },
          {
            id: 3,
            question: "Planet yang dijuluki 'Bintang Fajar' atau 'Bintang Kejora' karena tampak paling berkilau di langit adalah...",
            options: ["Venus", "Merkurius", "Mars", "Saturnus"],
            correctIndex: 0,
            explanation: "Venus memiliki atmosfer tebal gas karbon dioksida yang memantulkan sinar matahari dengan sangat terang."
          },
          {
            id: 4,
            question: "Planet terbesar dalam tata surya kita yang memiliki massa lebih dari gabungan seluruh planet lainnya adalah...",
            options: ["Yupiter", "Saturnus", "Neptunus", "Uranus"],
            correctIndex: 0,
            explanation: "Yupiter adalah planet raksasa gas dengan diameter sekitar 11 kali diameter bumi."
          },
          {
            id: 5,
            question: "Planet yang terkenal dengan keindahan cincin raksasa melingkar berbahan es dan batu adalah...",
            options: ["Saturnus", "Mars", "Bumi", "Venus"],
            correctIndex: 0,
            explanation: "Cincin spektakuler Saturnus tersusun atas miliaran partikel pecahan es dan debu kosmik."
          },
          {
            id: 6,
            question: "Gerakan Bumi berputar pada porosnya sendiri dinamakan...",
            options: ["Rotasi bumi", "Revolusi bumi", "Presesi", "Evolusi"],
            correctIndex: 0,
            explanation: "Rotasi bumi membutuhkan waktu sekitar 24 jam (1 hari) berputar dari barat ke timur."
          },
          {
            id: 7,
            question: "Salah satu peristiwa alam yang disebabkan secara langsung oleh gerakan rotasi bumi adalah...",
            options: ["Terjadinya pergantian siang dan malam", "Pergantian musim semi dan gugur", "Perubahan rasi bintang tahunan", "Tahun kabisat"],
            correctIndex: 0,
            explanation: "Belahan bumi yang menghadap matahari mengalami siang, sedangkan belahan yang membelakangi mengalami malam."
          },
          {
            id: 8,
            question: "Gerakan Bumi beredar mengelilingi Matahari pada bidang orbitnya dinamakan...",
            options: ["Revolusi bumi", "Rotasi bumi", "Gravitasi bebas", "Mutasi"],
            correctIndex: 0,
            explanation: "Bumi memerlukan waktu 365 1/4 hari (1 tahun) untuk satu putaran penuh revolusi mengelilingi matahari."
          },
          {
            id: 9,
            question: "Peristiwa revolusi bumi bersama kemiringan poros bumi menyebabkan terjadinya...",
            options: ["Pergantian musim di berbagai belahan bumi", "Siang dan malam", "Gerak semu harian matahari", "Pasang surut air laut"],
            correctIndex: 0,
            explanation: "Revolusi bumi menciptakan perbedaan intensitas sinar matahari yang memicu siklus pergantian 4 musim."
          },
          {
            id: 10,
            question: "Peristiwa alam di mana posisi Bulan berada tepat di antara Matahari dan Bumi pada satu garis lurus disebut...",
            options: ["Gerhana matahari", "Gerhana bulan", "Bulan sabit", "Aurora"],
            correctIndex: 0,
            explanation: "Saat Bulan menutupi piringan Matahari, bayangan Bulan jatuh ke permukaan Bumi menyebabkan gerhana matahari."
          }
        ]
      };

    case 5:
      return {
        title: "Sejarah Perjuangan Bangsa",
        conceptText: "Kebangkitan nasional dimulai berdirinya Budi Utomo (1908) dan Sumpah Pemuda (1928). Detik-detik Proklamasi 17 Agustus 1945 didahului peristiwa Rengasdengklok. Tokoh proklamator Ir. Soekarno dan Drs. Moh. Hatta memimpin kemerdekaan, yang dilanjutkan perjuangan mempertahankan kedaulatan RI.",
        questions: [
          {
            id: 1,
            question: "Organisasi pergerakan modern pertama di Indonesia yang didirikan pada tanggal 20 Mei 1908 adalah...",
            options: ["Budi Utomo", "Sarekat Islam", "Indische Partij", "Perhimpunan Indonesia"],
            correctIndex: 0,
            explanation: "Kelahiran Budi Utomo oleh Dr. Soetomo dan dr. Wahidin diperingati sebagai Hari Kebangkitan Nasional."
          },
          {
            id: 2,
            question: "Kongres Pemuda II pada tanggal 28 Oktober 1928 melahirkan ikrar bersejarah yang dikenal dengan...",
            options: ["Sumpah Pemuda", "Piagam Jakarta", "Maklumat Pemerintah", "Deklarasi Juanda"],
            correctIndex: 0,
            explanation: "Sumpah Pemuda mengikrarkan satu tumpah darah, satu bangsa, dan satu bahasa persatuan Indonesia."
          },
          {
            id: 3,
            question: "Lagu kebangsaan Indonesia Raya pertama kali diperdengarkan dengan gesekan biola oleh penciptanya, yaitu...",
            options: ["Wage Rudolf Soepratman", "Ismail Marzuki", "Kusbini", "C. Simanjuntak"],
            correctIndex: 0,
            explanation: "W.R. Soepratman memperdengarkan instrumental Indonesia Raya pada Kongres Pemuda II tahun 1928."
          },
          {
            id: 4,
            question: "Peristiwa pengamanan Soekarno dan Hatta oleh para pemuda ke luar kota menjelang Proklamasi dinamakan peristiwa...",
            options: ["Rengasdengklok", "Bandung Lautan Api", "Ambarawa", "Surabaya 10 November"],
            correctIndex: 0,
            explanation: "Golongan muda membawa Soekarno-Hatta ke Rengasdengklok agar terbebas dari pengaruh tekanan militer Jepang."
          },
          {
            id: 5,
            question: "Naskah teks Proklamasi Kemerdekaan Indonesia diketik rapi dengan mesin tik oleh tokoh pejuang...",
            options: ["Sayuti Melik", "Sukarni", "B.M. Diah", "Chaeroel Saleh"],
            correctIndex: 0,
            explanation: "Sayuti Melik mengetik naskah proklamasi yang disusun oleh Soekarno, Hatta, dan Ahmad Soebardjo."
          },
          {
            id: 6,
            question: "Bendera Pusaka Merah Putih yang dikibarkan saat Proklamasi 17 Agustus 1945 dijahit langsung oleh tangan...",
            options: ["Ibu Fatmawati", "Ibu Kartini", "Dewi Sartika", "Cut Nyak Dien"],
            correctIndex: 0,
            explanation: "Ibu Fatmawati, istri Bung Karno, menjahit kain merah dan putih yang menjadi Sang Saka Merah Putih."
          },
          {
            id: 7,
            question: "Teks Proklamasi Kemerdekaan Indonesia dibacakan pada hari Jumat, 17 Agustus 1945 di kediaman Bung Karno yang beralamat di...",
            options: ["Jalan Pegangsaan Timur No. 56 Jakarta", "Jalan Medan Merdeka Barat", "Istana Bogor", "Jalan Imam Bonjol No. 1"],
            correctIndex: 0,
            explanation: "Pembacaan proklamasi berlangsung khidmat di halaman rumah Bung Karno Jl. Pegangsaan Timur 56."
          },
          {
            id: 8,
            question: "Tokoh pejuang yang membakar semangat arek-arek Surabaya lewat siaran radio dalam pertempuran 10 November 1945 adalah...",
            options: ["Bung Tomo (Sutomo)", "Jenderal Soedirman", "Kolonel Isdiman", "I Gusti Ngurah Rai"],
            correctIndex: 0,
            explanation: "Pekik takbir Bung Tomo mengobarkan keberanian pemuda Surabaya melawan pasukan Sekutu Inggris."
          },
          {
            id: 9,
            question: "Panglima Besar Tentara Keamanan Rakyat yang memimpin perang gerilya melawan agresi Belanda meski dalam kondisi sakit adalah...",
            options: ["Jenderal Soedirman", "Jenderal Ahmad Yani", "Gatot Soebroto", "Urip Sumoharjo"],
            correctIndex: 0,
            explanation: "Jenderal Soedirman ditandu menembus hutan memimpin pasukan gerilya demi mempertahankan kemerdekaan."
          },
          {
            id: 10,
            question: "Sikap generasi penerus bangsa dalam mengisi kemerdekaan yang telah diperjuangkan para pahlawan adalah...",
            options: ["Belajar giat, berprestasi, dan menjaga persatuan bangsa", "Menghabiskan waktu bermain game tanpa batas", "Menimbulkan permusuhan antarsuku", "Mengabaikan upacara bendera"],
            correctIndex: 0,
            explanation: "Mengisi kemerdekaan diwujudkan dengan tekun belajar, menguasai ilmu pengetahuan, dan mencintai tanah air."
          }
        ]
      };

    case 6:
      return {
        title: "Geografi Regional & Global (ASEAN)",
        conceptText: "Asia Tenggara dihuni 10 negara anggota ASEAN (Indonesia, Malaysia, Singapura, Thailand, Filipina, Brunei, Vietnam, Laos, Myanmar, Kamboja). Bentang alam ikonik meliputi Sungai Mekong dan Selat Malaka. Dunia terbagi atas benua-benua: Asia, Afrika, Amerika, Eropa, Australia, dan Antartika.",
        questions: [
          {
            id: 1,
            question: "Organisasi perhimpunan kerja sama bangsa-bangsa di kawasan Asia Tenggara dinamakan...",
            options: ["ASEAN", "Uni Eropa", "APEC", "NATO"],
            correctIndex: 0,
            explanation: "ASEAN (Association of Southeast Asian Nations) didirikan pada tanggal 8 Agustus 1967 di Bangkok."
          },
          {
            id: 2,
            question: "Satu-satunya negara di kawasan Asia Tenggara yang tidak pernah dijajah oleh bangsa Barat Eropa adalah...",
            options: ["Thailand", "Singapura", "Filipina", "Myanmar"],
            correctIndex: 0,
            explanation: "Thailand (Muangthai) mempertahankan kedaulatannya sebagai negara merdeka dan dijuluki Tanah Bebas."
          },
          {
            id: 3,
            question: "Satu-satunya negara anggota ASEAN yang wilayah daratannya terkurung daratan tanpa memiliki garis pantai laut adalah...",
            options: ["Laos", "Kamboja", "Vietnam", "Brunei Darussalam"],
            correctIndex: 0,
            explanation: "Laos dikelilingi daratan negara tetangga (landlocked country) dan dilintasi aliran Sungai Mekong."
          },
          {
            id: 4,
            question: "Negara anggota ASEAN yang paling kecil wilayahnya tetapi memiliki perekonomian paling maju dan pelabuhan transit tersibuk adalah...",
            options: ["Singapura", "Brunei Darussalam", "Timor Leste", "Kamboja"],
            correctIndex: 0,
            explanation: "Singapura memanfaatkan letak geografis strategis di Selat Malaka menjadi pusat perdagangan dan keuangan global."
          },
          {
            id: 5,
            question: "Negara kerajaan di pulau Kalimantan yang kaya akan cadangan minyak bumi dan gas alam dengan pendapatan per kapita tinggi adalah...",
            options: ["Brunei Darussalam", "Malaysia Timur", "Filipina", "Papua Nugini"],
            correctIndex: 0,
            explanation: "Brunei Darussalam makmur berkat kekayaan tambang minyak bumi di lepas pantainya."
          },
          {
            id: 6,
            question: "Sungai terpanjang di Asia Tenggara yang mengalir melintasi Myanmar, Laos, Thailand, Kamboja, hingga Vietnam adalah...",
            options: ["Sungai Mekong", "Sungai Chao Phraya", "Sungai Kapuas", "Sungai Irrawaddy"],
            correctIndex: 0,
            explanation: "Sungai Mekong merupakan urat nadi perairan, pertanian padi, dan perikanan masyarakat Indochina."
          },
          {
            id: 7,
            question: "Benua terluas dan memiliki populasi penduduk terbanyak di planet Bumi adalah benua...",
            options: ["Asia", "Afrika", "Amerika", "Eropa"],
            correctIndex: 0,
            explanation: "Benua Asia mencakup hampir 30% total luas daratan bumi dan dihuni lebih dari separuh penduduk dunia."
          },
          {
            id: 8,
            question: "Benua yang dijuluki 'Benua Hitam' dan dilintasi oleh sungai terpanjang di dunia, yaitu Sungai Nil, adalah benua...",
            options: ["Afrika", "Amerika", "Australia", "Antartika"],
            correctIndex: 0,
            explanation: "Benua Afrika memiliki keanekaragaman satwa liar padang sabana dan bentang alam Gurun Sahara."
          },
          {
            id: 9,
            question: "Benua terkecil di dunia yang seluruh wilayahnya merupakan satu negara federasi adalah benua...",
            options: ["Australia", "Eropa", "Antartika", "Asia"],
            correctIndex: 0,
            explanation: "Benua Australia dihuni satwa berkantung khas seperti kangguru dan koala dengan ibu kota Canberra."
          },
          {
            id: 10,
            question: "Benua di kutub selatan yang seluruh permukaannya diselimuti lapisan es tebal dan tidak berpenduduk tetap adalah benua...",
            options: ["Antartika", "Arktik", "Eurasia", "Atlantis"],
            correctIndex: 0,
            explanation: "Antartika merupakan benua terdingin dan paling berangin di bumi, hanya dihuni ilmuwan peneliti dan penguin."
          }
        ]
      };

    case 7:
      return {
        title: "Kerja Sama Antarnegara & Globalisasi",
        conceptText: "Indonesia berperan aktif dalam ASEAN (KTT, ZOPFAN, MEA) dan forum internasional PBB. Globalisasi membawa kemudahan arus informasi, teknologi, dan perdagangan lintas benua. Kita harus menyaring dampak negatif dengan memperkuat kepribadian bangsa dan cinta produk dalam negeri.",
        questions: [
          {
            id: 1,
            question: "Tokoh diplomat delegasi Indonesia yang ikut menandatangani Deklarasi Bangkok pendirian ASEAN tahun 1967 adalah...",
            options: ["Adam Malik", "Ali Alatas", "Mochtar Kusumaatmadja", "Soebandrio"],
            correctIndex: 0,
            explanation: "Menteri Luar Negeri Adam Malik adalah salah satu dari lima tokoh pendiri (Founding Fathers) ASEAN."
          },
          {
            id: 2,
            question: "Bentuk kerja sama ekonomi negara-negara Asia Tenggara dalam pasar tunggal perdagangan bebas antaranggota dinamakan...",
            options: ["MEA (Masyarakat Ekonomi ASEAN)", "APEC", "OPEC", "G20"],
            correctIndex: 0,
            explanation: "MEA membebaskan hambatan tarif perdagangan barang, jasa, investasi, dan tenaga kerja terampil di ASEAN."
          },
          {
            id: 3,
            question: "Pesta olahraga antarbangsa di kawasan Asia Tenggara yang diadakan setiap dua tahun sekali adalah...",
            options: ["SEA Games", "Asian Games", "Olimpiade", "Piala Thomas"],
            correctIndex: 0,
            explanation: "South East Asian Games (SEA Games) mempererat persaudaraan dan solidaritas atlet muda negara-negara ASEAN."
          },
          {
            id: 4,
            question: "Prinsip politik luar negeri yang dianut oleh bangsa Indonesia dalam pergaulan antarbangsa di dunia adalah politik...",
            options: ["Bebas aktif", "Blok barat", "Isolasi tertutup", "Kolonialisme"],
            correctIndex: 0,
            explanation: "Bebas artinya tidak memihak blok kekuatan mana pun; aktif artinya aktif memperjuangkan perdamaian dunia."
          },
          {
            id: 5,
            question: "Proses mendunia di mana batas-batas wilayah antaranegara seolah memudar akibat kemajuan teknologi dan komunikasi disebut...",
            options: ["Globalisasi", "Modernisasi kuno", "Kolonisasi", "Urbanisasi"],
            correctIndex: 0,
            explanation: "Globalisasi memungkinkan pertukaran informasi, barang, dan budaya berlangsung cepat lintas benua."
          },
          {
            id: 6,
            question: "Dampak positif perkembangan globalisasi di bidang pendidikan dan ilmu pengetahuan bagi pelajar adalah...",
            options: ["Kemudahan mengakses sumber belajar dan perpustakaan digital dunia", "Menghabiskan waktu bermain media sosial", "Meniru budaya yang tidak sopan", "Malas membaca buku cetak"],
            correctIndex: 0,
            explanation: "Internet memudahkan siswa mencari referensi materi ilmiah berkualitas dari berbagai belahan bumi."
          },
          {
            id: 7,
            question: "Sikap konsumtif membeli barang-barang impor secara berlebihan tanpa melihat kebutuhan merupakan dampak negatif globalisasi di bidang...",
            options: ["Gaya hidup dan ekonomi", "Politik kedaulatan", "Sains teknologi", "Pertahanan militer"],
            correctIndex: 0,
            explanation: "Konsumerisme mendorong pemborosan uang demi gengsi membeli produk luar negeri."
          },
          {
            id: 8,
            question: "Cara terbaik generasi muda Indonesia dalam menyikapi masuknya budaya asing di era globalisasi adalah...",
            options: ["Menyaring (filter) budaya asing sesuai nilai-nilai luhur Pancasila", "Menerima semua budaya asing tanpa seleksi", "Menolak semua teknologi modern", "Malu menggunakan bahasa daerah"],
            correctIndex: 0,
            explanation: "Nilai Pancasila menjadi benteng moral agar kita mengambil sisi positif teknologi tanpa kehilangan jati diri bangsa."
          },
          {
            id: 9,
            question: "Mencintai dan bangga menggunakan produk-produk buatan dalam negeri bermanfaat untuk...",
            options: ["Mendukung kemajuan industri lokal dan UMKM bangsa", "Menghabiskan devisa negara", "Menurunkan kualitas produk lokal", "Membuat barang impor lebih murah"],
            correctIndex: 0,
            explanation: "Membeli produk karya anak bangsa membuka lapangan kerja dan memajukan perekonomian nasional."
          },
          {
            id: 10,
            question: "Organisasi perdamaian internasional terbesar di dunia tempat berkumpulnya hampir seluruh negara merdeka adalah...",
            options: ["PBB (Perserikatan Bangsa-Bangsa)", "NATO", "Palang Merah", "Interpol"],
            correctIndex: 0,
            explanation: "PBB (United Nations) bertugas menjaga perdamaian, keamanan internasional, dan hak asasi manusia."
          }
        ]
      };

    case 8:
      return {
        title: "Kelestarian Lingkungan & Isu Global",
        conceptText: "Pemanasan global (global warming) akibat efek rumah kaca emisi gas karbon memicu perubahan iklim ekstrem. Pencemaran sampah plastik dan krisis energi fosil menuntut penerapan prinsip 3R (Reduce, Reuse, Recycle), konservasi alam, serta transisi ke energi terbarukan (surya, angin, air, biomassa).",
        questions: [
          {
            id: 1,
            question: "Fenomena peningkatan suhu rata-rata atmosfer, laut, dan daratan bumi akibat efek gas rumah kaca dinamakan...",
            options: ["Pemanasan global (global warming)", "Hujan asam murni", "El Nino lokal", "Pasang purnama"],
            correctIndex: 0,
            explanation: "Penumpukan gas CO2 memerangkap panas matahari di atmosfer sehingga suhu global terus meningkat."
          },
          {
            id: 2,
            question: "Salah satu dampak nyata pemanasan global terhadap kondisi wilayah kutub bumi adalah...",
            options: ["Mencairnya lapisan es kutub dan kenaikan permukaan air laut", "Kutub menjadi semakin membeku", "Menurunnya ketinggian air laut", "Munculnya hutan lebat di kutub"],
            correctIndex: 0,
            explanation: "Es kutub yang mencair menaikkan volume air laut sehingga mengancam pulau-pulau kecil dan kota pesisir."
          },
          {
            id: 3,
            question: "Gas buang utama dari asap kendaraan bermotor dan cerobong pabrik yang menjadi pemicu utama efek rumah kaca adalah...",
            options: ["Karbon dioksida (CO2)", "Oksigen murni (O2)", "Uap air murni", "Gas helium"],
            correctIndex: 0,
            explanation: "Gas karbon dioksida bertindak seperti selimut kaca yang menahan pantulan radiasi panas di atmosfer bumi."
          },
          {
            id: 4,
            question: "Prinsip pengelolaan sampah dengan cara mengurangi pemakaian barang sekali pakai sejak awal disebut...",
            options: ["Reduce (mengurangi)", "Reuse (menggunakan kembali)", "Recycle (mendaur ulang)", "Replace"],
            correctIndex: 0,
            explanation: "Reduce adalah langkah pencegahan paling efektif, misalnya membawa kantong belanja kain sendiri saat berbelanja."
          },
          {
            id: 5,
            question: "Memanfaatkan kembali botol kaca bekas sirup sebagai wadah air minum di rumah merupakan contoh penerapan prinsip...",
            options: ["Reuse (menggunakan kembali)", "Recycle (daur ulang)", "Reduce (mengurangi)", "Reboisasi"],
            correctIndex: 0,
            explanation: "Reuse menggunakan kembali barang yang masih layak tanpa harus meleburnya terlebih dahulu."
          },
          {
            id: 6,
            question: "Mengolah sampah plastik atau kertas bekas menjadi barang kerajinan baru yang bernilai ekonomis merupakan contoh...",
            options: ["Recycle (mendaur ulang)", "Reduce", "Reuse", "Reboisasi"],
            correctIndex: 0,
            explanation: "Recycle melibatkan proses peleburan atau pengolahan ulang sampah menjadi bahan mentah produk baru."
          },
          {
            id: 7,
            question: "Sumber energi alternatif ramah lingkungan yang tidak menghasilkan emisi polusi udara dan tidak pernah habis adalah...",
            options: ["Energi matahari, angin, dan air", "Minyak bumi dan solar", "Batu bara mentah", "Gas elpiji tabung"],
            correctIndex: 0,
            explanation: "Energi terbarukan seperti surya, bayu (angin), dan hidro (air) bersifat bersih dan melimpah di alam."
          },
          {
            id: 8,
            question: "Energi alternatif yang dihasilkan dari pengolahan kotoran hewan ternak atau sisa sampah organik dapur dinamakan...",
            options: ["Biogas", "Bensin", "Batu bara muda", "Kerosin"],
            correctIndex: 0,
            explanation: "Fermentasi kotoran sapi atau sampah organik menghasilkan gas metana alami (biogas) yang dapat digunakan memasak."
          },
          {
            id: 9,
            question: "Hujan dengan derajat keasaman tinggi yang dapat merusak bangunan candi dan mematikan biota danau akibat polusi asap pabrik belerang disebut...",
            options: ["Hujan asam", "Hujan es", "Hujan zenit", "Hujan orografis"],
            correctIndex: 0,
            explanation: "Senyawa sulfur oksida dan nitrogen oksida di udara larut dalam air hujan membentuk asam nitrat dan sulfat yang korosif."
          },
          {
            id: 10,
            question: "Peran sederhana yang dapat dilakukan siswa setiap hari di sekolah untuk menjaga kelestarian bumi adalah...",
            options: ["Mematikan lampu dan kipas saat kelas kosong serta membuang sampah terpilah", "Membiarkan keran air wastafel mengalir terus", "Menggunakan plastik sekali pakai berlebihan", "Menyalakan AC saat jendela terbuka"],
            correctIndex: 0,
            explanation: "Hemat listrik, hemat air bersih, dan memilah sampah merupakan aksi nyata menyelamatkan bumi dari krisis iklim."
          }
        ]
      };

    default:
      return {
        title: "Konsep Dasar IPAS",
        conceptText: "Ilmu Pengetahuan Alam dan Sosial (IPAS) membentuk karakter saintifik, kepedulian lingkungan, dan wawasan kebangsaan yang utuh.",
        questions: []
      };
  }
}
