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

interface IpasGrade4GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IpasGrade4Game({ levelId, onLevelComplete, accessibilityMode }: IpasGrade4GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activePlantPart, setActivePlantPart] = useState<{ part: string; func: string }>({ part: "Daun", func: "Tempat terjadinya fotosintesis membuat makanan menggunakan klorofil dan cahaya matahari." });
  const [activeStateChange, setActiveStateChange] = useState<{ change: string; fromTo: string; sample: string }>({ change: "Mencair", fromTo: "Padat ke Cair", sample: "Es batu meleleh saat dipanaskan di suhu ruangan." });
  const [activeForce, setActiveForce] = useState<{ force: string; effect: string; sample: string }>({ force: "Gaya Otot", effect: "Dihasilkan oleh otot manusia", sample: "Mendorong meja atau menendang bola." });
  const [activeEnergyTrans, setActiveEnergyTrans] = useState<{ device: string; from: string; to: string }>({ device: "Setrika Listrik", from: "Energi Listrik", to: "Energi Panas" });
  const [activeLocalHistory, setActiveLocalHistory] = useState<{ relic: string; desc: string }>({ relic: "Prasasti & Candi", desc: "Peninggalan sejarah kerajaan masa lalu yang menyimpan tulisan dan kisah peradaban." });
  const [activeCulture, setActiveCulture] = useState<{ element: string; sample: string; desc: string }>({ element: "Rumah Adat", sample: "Joglo & Tongkonan", desc: "Rumah tradisional dengan arsitektur khas yang sarat filosofi leluhur." });
  const [activeEconomy, setActiveEconomy] = useState<{ term: string; role: string; sample: string }>({ term: "Produksi", role: "Menghasilkan barang/jasa", sample: "Petani menanam padi di sawah." });
  const [activeNorm, setActiveNorm] = useState<{ norm: string; sanction: string; sample: string }>({ norm: "Norma Kesopanan", sanction: "Teguran & rasa malu", sample: "Menyapa guru dan bertutur kata santun." });

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
    setActivePlantPart({ part: "Daun", func: "Tempat terjadinya fotosintesis membuat makanan menggunakan klorofil dan cahaya matahari." });
    setActiveStateChange({ change: "Mencair", fromTo: "Padat ke Cair", sample: "Es batu meleleh saat dipanaskan di suhu ruangan." });
    setActiveForce({ force: "Gaya Otot", effect: "Dihasilkan oleh otot manusia", sample: "Mendorong meja atau menendang bola." });
    setActiveEnergyTrans({ device: "Setrika Listrik", from: "Energi Listrik", to: "Energi Panas" });
    setActiveLocalHistory({ relic: "Prasasti & Candi", desc: "Peninggalan sejarah kerajaan masa lalu yang menyimpan tulisan dan kisah peradaban." });
    setActiveCulture({ element: "Rumah Adat", sample: "Joglo & Tongkonan", desc: "Rumah tradisional dengan arsitektur khas yang sarat filosofi leluhur." });
    setActiveEconomy({ term: "Produksi", role: "Menghasilkan barang/jasa", sample: "Petani menanam padi di sawah." });
    setActiveNorm({ norm: "Norma Kesopanan", sanction: "Teguran & rasa malu", sample: "Menyapa guru dan bertutur kata santun." });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade4IpasData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade4IpasData(levelId);
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
          speakGlobal(`Luar biasa! Kamu menyelesaikan semua 10 soal dan meraih ${stars} bintang!`);
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
            KELAS 4 SD • LEVEL {levelId} dari 8
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
                  Bagian Tubuh Tumbuhan:
                </span>
                <div className="grid grid-cols-5 gap-1.5 w-full text-xs">
                  {[
                    { part: "Akar", func: "Menyerap air & unsur hara dari tanah, menopang berdirinya tumbuhan." },
                    { part: "Batang", func: "Menyalurkan air & zat hara ke daun, menyokong cabang dan daun." },
                    { part: "Daun", func: "Tempat fotosintesis memasak makanan menggunakan klorofil dan cahaya." },
                    { part: "Bunga", func: "Alat perkembangbiakan generatif (ada putik & benang sari)." },
                    { part: "Biji", func: "Bakal tumbuhan baru dan penyimpan cadangan makanan." },
                  ].map((p) => (
                    <button
                      key={p.part}
                      type="button"
                      onClick={() => {
                        setActivePlantPart(p);
                        playPopSound();
                        speakGlobal(`Bagian ${p.part}: ${p.func}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePlantPart.part === p.part ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{p.part}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activePlantPart.part}: </strong>
                  <span>{activePlantPart.func}</span>
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Perubahan Wujud Benda:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full text-xs">
                  {[
                    { change: "Mencair", fromTo: "Padat -> Cair", sample: "Es batu meleleh saat dipanaskan." },
                    { change: "Membeku", fromTo: "Cair -> Padat", sample: "Air dimasukkan ke freezer jadi es." },
                    { change: "Menguap", fromTo: "Cair -> Gas", sample: "Air mendidih mengeluarkan uap air." },
                    { change: "Mengembun", fromTo: "Gas -> Cair", sample: "Titik air di luar gelas es dingin." },
                    { change: "Menyublim", fromTo: "Padat -> Gas", sample: "Kapur barus mengecil di lemari." },
                    { change: "Mengkristal", fromTo: "Gas -> Padat", sample: "Uap air di awan berubah jadi salju." },
                  ].map((c) => (
                    <button
                      key={c.change}
                      type="button"
                      onClick={() => {
                        setActiveStateChange(c);
                        playPopSound();
                        speakGlobal(`${c.change}: perubahan wujud ${c.fromTo}. Contoh: ${c.sample}`);
                      }}
                      className={`p-1.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeStateChange.change === c.change ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{c.change}</strong>
                      <span className="text-[9px] opacity-80 block">{c.fromTo}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeStateChange.change} ({activeStateChange.fromTo}): </strong>
                  <span>{activeStateChange.sample}</span>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Macam-Macam Gaya di Sekitar Kita:
                </span>
                <div className="grid grid-cols-5 gap-1.5 w-full text-xs">
                  {[
                    { force: "Gaya Otot", effect: "Tenaga otot tubuh", sample: "Mengangkat tas atau menendang bola." },
                    { force: "Gaya Gesek", effect: "Gesekan 2 permukaan", sample: "Rem sepeda menghentikan roda." },
                    { force: "Gaya Magnet", effect: "Tarikan kutub magnet", sample: "Magnet menarik paku besi." },
                    { force: "Gaya Pegas", effect: "Elastisitas benda pegas", sample: "Anak panah dilesatkan dari busur." },
                    { force: "Gaya Gravitasi", effect: "Tarikan ke pusat bumi", sample: "Buah kelapa jatuh ke tanah." },
                  ].map((g) => (
                    <button
                      key={g.force}
                      type="button"
                      onClick={() => {
                        setActiveForce(g);
                        playPopSound();
                        speakGlobal(`${g.force}: ${g.effect}. Contoh: ${g.sample}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeForce.force === g.force ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{g.force}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeForce.force}: </strong>
                  <span>{activeForce.effect} — Contoh: {activeForce.sample}</span>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Transformasi & Perubahan Bentuk Energi:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { device: "Setrika Listrik", from: "Energi Listrik", to: "Energi Panas" },
                    { device: "Kipas Angin", from: "Energi Listrik", to: "Energi Gerak" },
                    { device: "Lampu Bohlam", from: "Energi Listrik", to: "Energi Cahaya" },
                    { device: "Makanan Tubuh", from: "Energi Kimia", to: "Energi Gerak & Panas" },
                  ].map((dev) => (
                    <button
                      key={dev.device}
                      type="button"
                      onClick={() => {
                        setActiveEnergyTrans(dev);
                        playPopSound();
                        speakGlobal(`Pada ${dev.device}: ${dev.from} berubah menjadi ${dev.to}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeEnergyTrans.device === dev.device ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{dev.device}</strong>
                      <span className="text-[10px] opacity-80 block">{dev.to}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeEnergyTrans.device}: </strong>
                  <span>Mengubah {activeEnergyTrans.from} menjadi <strong>{activeEnergyTrans.to}</strong>.</span>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Cerita Daerah & Peninggalan Sejarah:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { relic: "Prasasti & Candi", desc: "Monumen batu bertuliskan sejarah kerajaan Nusantara kuno." },
                    { relic: "Benteng & Keraton", desc: "Bangunan pertahanan dan pusat pemerintahan tradisional masa lampau." },
                    { relic: "Bentang Alam Lokal", desc: "Gunung, danau, sungai yang memengaruhi legenda dan mata pencaharian warga." },
                  ].map((h) => (
                    <button
                      key={h.relic}
                      type="button"
                      onClick={() => {
                        setActiveLocalHistory(h);
                        playPopSound();
                        speakGlobal(`${h.relic}: ${h.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeLocalHistory.relic === h.relic ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{h.relic}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeLocalHistory.relic}: </strong>
                  <span>{activeLocalHistory.desc}</span>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Keragaman Budaya & Kearifan Nusantara:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { element: "Rumah Adat", sample: "Joglo & Gadang", desc: "Arsitektur tradisional sarat nilai luhur gotong royong." },
                    { element: "Tarian Adat", sample: "Tari Saman & Kecak", desc: "Gerak seni ritmis warisan budaya leluhur bangsa." },
                    { element: "Pakaian Adat", sample: "Kebaya & Ulos", desc: "Busana khas dalam upacara dan adat istiadat suku bangsa." },
                    { element: "Kearifan Lokal", sample: "Subak & Nyepi", desc: "Tradisi masyarakat dalam melestarikan lingkungan alam." },
                  ].map((cul) => (
                    <button
                      key={cul.element}
                      type="button"
                      onClick={() => {
                        setActiveCulture(cul);
                        playPopSound();
                        speakGlobal(`${cul.element}: ${cul.sample}. ${cul.desc}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCulture.element === cul.element ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{cul.element}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeCulture.element} ({activeCulture.sample}): </strong>
                  <span>{activeCulture.desc}</span>
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kegiatan Ekonomi & Kebutuhan Manusia:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { term: "Produksi", role: "Menghasilkan barang/jasa", sample: "Pabrik sepatu membuat alas kaki." },
                    { term: "Distribusi", role: "Menyalurkan barang", sample: "Kurir mengantar paket ke rumah." },
                    { term: "Konsumsi", role: "Menggunakan/menghabiskan", sample: "Membeli dan memakan nasi di kantin." },
                  ].map((e) => (
                    <button
                      key={e.term}
                      type="button"
                      onClick={() => {
                        setActiveEconomy(e);
                        playPopSound();
                        speakGlobal(`Kegiatan ${e.term}: ${e.role}. Contoh: ${e.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeEconomy.term === e.term ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{e.term}</strong>
                      <span className="text-[10px] opacity-80 block">{e.role}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Kebutuhan: </strong>Primer (Makan, Pakaian, Rumah) • Sekunder (Sepeda, Kulkas) • Tersier (Mobil Mewah, Perhiasan).
                </div>
              </div>
            )}

            {levelId === 8 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Macam-Macam Norma di Masyarakat:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { norm: "Norma Agama", sanction: "Dosa dari Tuhan", sample: "Beribadah tepat waktu dan bersedekah." },
                    { norm: "Kesusilaan", sanction: "Penyesalan hati nurani", sample: "Jujur dan tidak berbohong." },
                    { norm: "Kesopanan", sanction: "Teguran & dicemooh", sample: "Menghormati orang lebih tua." },
                    { norm: "Norma Hukum", sanction: "Hukuman denda/penjara", sample: "Mematuhi rambu lalu lintas." },
                  ].map((n) => (
                    <button
                      key={n.norm}
                      type="button"
                      onClick={() => {
                        setActiveNorm(n);
                        playPopSound();
                        speakGlobal(`${n.norm}. Sanksi: ${n.sanction}. Contoh: ${n.sample}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeNorm.norm === n.norm ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{n.norm}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeNorm.norm}: </strong>
                  <span>{activeNorm.sample} (Sanksi: {activeNorm.sanction}).</span>
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

function getGrade4IpasData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Bagian Tubuh Tumbuhan & Fungsinya",
        conceptText: "Tumbuhan memiliki akar (menyerap air & mineral), batang (menyalurkan nutrisi), daun (tempat fotosintesis dengan klorofil), bunga (alat perkembangbiakan), serta biji/buah (cadangan makanan). Fotosintesis membutuhkan cahaya matahari, air, dan karbon dioksida, menghasilkan glukosa dan oksigen.",
        questions: [
          {
            id: 1,
            question: "Bagian tumbuhan yang bertugas menyerap air dan mineral dari dalam tanah adalah...",
            options: ["Akar", "Batang", "Daun", "Bunga"],
            correctIndex: 0,
            explanation: "Akar berfungsi menyerap air dan unsur hara dari dalam tanah serta menopang tegaknya tumbuhan."
          },
          {
            id: 2,
            question: "Tempat utama terjadinya proses fotosintesis pada tumbuhan adalah pada bagian...",
            options: ["Daun", "Akar", "Biji", "Kulit kayu"],
            correctIndex: 0,
            explanation: "Daun mengandung klorofil (zat hijau daun) yang menangkap energi cahaya matahari untuk fotosintesis."
          },
          {
            id: 3,
            question: "Zat hijau daun yang berperan menangkap cahaya matahari saat fotosintesis disebut...",
            options: ["Klorofil", "Stomata", "Batang kayu", "Lentisel"],
            correctIndex: 0,
            explanation: "Klorofil adalah pigmen hijau pada daun yang menyerap sinar matahari untuk memasak makanan."
          },
          {
            id: 4,
            question: "Gas yang diserap tumbuhan dari udara saat melakukan fotosintesis adalah...",
            options: ["Karbon dioksida (CO2)", "Oksigen (O2)", "Nitrogen", "Helium"],
            correctIndex: 0,
            explanation: "Tumbuhan menyerap karbon dioksida dan melepaskan gas oksigen ke udara saat fotosintesis."
          },
          {
            id: 5,
            question: "Gas bersih dan segar yang dihasilkan dari proses fotosintesis tumbuhan adalah...",
            options: ["Oksigen (O2)", "Karbon monoksida", "Metana", "Argon"],
            correctIndex: 0,
            explanation: "Oksigen merupakan produk fotosintesis yang sangat dibutuhkan makhluk hidup untuk bernapas."
          },
          {
            id: 6,
            question: "Bagian tumbuhan yang berfungsi sebagai alat perkembangbiakan generatif adalah...",
            options: ["Bunga", "Akar serabut", "Ujung ranting", "Duri"],
            correctIndex: 0,
            explanation: "Bunga memiliki alat kelamin jantan (benang sari) dan betina (putik) untuk perkembangbiakan generatif."
          },
          {
            id: 7,
            question: "Bagian bunga yang berfungsi sebagai sel kelamin jantan pada tumbuhan adalah...",
            options: ["Benang sari", "Putik", "Mahkota bunga", "Kelopak bunga"],
            correctIndex: 0,
            explanation: "Benang sari menghasilkan serbuk sari yang merupakan sel kelamin jantan pada bunga."
          },
          {
            id: 8,
            question: "Bagian tumbuhan yang berfungsi mengangkut air dan makanan ke seluruh tubuh tumbuhan adalah...",
            options: ["Batang", "Biji", "Putik", "Bungkil"],
            correctIndex: 0,
            explanation: "Batang memiliki pembuluh xilem dan floem untuk mengalirkan air dan hasil fotosintesis ke seluruh bagian tumbuhan."
          },
          {
            id: 9,
            question: "Lubang-lubang kecil pada daun yang berfungsi sebagai tempat keluar masuknya udara pernapasan disebut...",
            options: ["Stomata", "Kloroplas", "Kambium", "Kaliptra"],
            correctIndex: 0,
            explanation: "Stomata adalah mulut daun yang mengatur pertukaran gas oksigen, karbon dioksida, dan uap air."
          },
          {
            id: 10,
            question: "Bagian tumbuhan yang melindungi biji serta sering dikonsumsi manusia dan hewan adalah...",
            options: ["Buah", "Akar tunggang", "Duri", "Kelopak"],
            correctIndex: 0,
            explanation: "Daging buah membungkus biji dan menyimpan cadangan nutrisi yang manis dan bermanfaat."
          }
        ]
      };

    case 2:
      return {
        title: "Wujud Zat & Perubahannya",
        conceptText: "Zat terdiri dari padat (bentuk & volume tetap), cair (bentuk sesuai wadah, volume tetap), dan gas (bentuk & volume mengisi wadah). Perubahan wujud: mencair (padat ke cair), membeku (cair ke padat), menguap (cair ke gas), mengembun (gas ke cair), menyublim (padat ke gas), dan mengkristal (gas ke padat).",
        questions: [
          {
            id: 1,
            question: "Perubahan wujud benda dari padat menjadi cair disebut...",
            options: ["Mencair", "Membeku", "Menguap", "Menyublim"],
            correctIndex: 0,
            explanation: "Mencair terjadi ketika benda padat dipanaskan hingga meleleh menjadi zat cair, seperti es mencair."
          },
          {
            id: 2,
            question: "Perubahan wujud air di dalam cetakan freezer menjadi es batu dinamakan...",
            options: ["Membeku", "Mengembun", "Mengkristal", "Menyublim"],
            correctIndex: 0,
            explanation: "Membeku adalah proses pelepasan kalor yang mengubah zat cair menjadi benda padat."
          },
          {
            id: 3,
            question: "Air di dalam panci yang terus dipanaskan hingga mendidih dan berkurang membuktikan proses...",
            options: ["Menguap", "Membeku", "Menyublim", "Mengembun"],
            correctIndex: 0,
            explanation: "Menguap adalah perubahan wujud dari zat cair menjadi gas karena menerima energi panas."
          },
          {
            id: 4,
            question: "Munculnya titik-titik air di dinding luar gelas berisi air es merupakan contoh...",
            options: ["Mengembun", "Mencair", "Menguap", "Menyublim"],
            correctIndex: 0,
            explanation: "Mengembun adalah perubahan wujud dari uap air (gas) menjadi butiran air (cair) saat terkena dingin."
          },
          {
            id: 5,
            question: "Kapur barus di dalam lemari yang lama-kelamaan mengecil dan habis mengalami proses...",
            options: ["Menyublim", "Mengembun", "Membeku", "Mencair"],
            correctIndex: 0,
            explanation: "Menyublim adalah perubahan wujud benda padat langsung menjadi gas tanpa mencair terlebih dahulu."
          },
          {
            id: 6,
            question: "Perubahan wujud dari gas langsung menjadi padat, seperti terbentuknya salju di awan disebut...",
            options: ["Mengkristal", "Mencair", "Menguap", "Mendidih"],
            correctIndex: 0,
            explanation: "Mengkristal atau deposisi adalah perubahan wujud dari gas langsung menjadi padat."
          },
          {
            id: 7,
            question: "Sifat utama benda cair adalah...",
            options: ["Bentuk mengikuti wadahnya tetapi volumenya tetap", "Bentuk dan volumenya selalu tetap", "Volume berubah-ubah memenuhi ruangan", "Tidak dapat dialirkan"],
            correctIndex: 0,
            explanation: "Benda cair memiliki volume yang tetap, tetapi bentuknya selalu menyesuaikan wadah yang ditempatinya."
          },
          {
            id: 8,
            question: "Benda yang bentuk dan volumenya selalu tetap walaupun dipindahkan ke tempat mana pun adalah...",
            options: ["Benda padat", "Benda cair", "Benda gas", "Benda plasma"],
            correctIndex: 0,
            explanation: "Benda padat seperti pensil atau buku memiliki ikatan partikel rapat sehingga bentuk dan volumenya tetap."
          },
          {
            id: 9,
            question: "Udara di dalam balon yang mengembang mengikuti bentuk balon membuktikan bahwa benda gas...",
            options: ["Bentuk dan volumenya berubah mengisi seluruh ruangan", "Bentuknya selalu kaku", "Tidak menekan ke segala arah", "Tidak memiliki massa"],
            correctIndex: 0,
            explanation: "Zat gas mengisi seluruh ruang wadahnya dan menekan ke segala arah secara merata."
          },
          {
            id: 10,
            question: "Mentega yang ditaruh di atas wajan panas akan meleleh. Peristiwa ini terjadi karena mentega...",
            options: ["Menyerap energi panas (kalor)", "Melepaskan energi dingin", "Kehilangan massa", "Mengalami pendinginan"],
            correctIndex: 0,
            explanation: "Mentega mencair karena menyerap panas dari wajan yang dipanaskan api kompor."
          }
        ]
      };

    case 3:
      return {
        title: "Gaya di Sekitar Kita",
        conceptText: "Gaya adalah tarikan atau dorongan yang dapat memengaruhi gerak, arah, dan bentuk benda. Macam gaya meliputi gaya otot (otot tubuh), gaya gesek (hambatan antara dua permukaan), gaya magnet (tarikan magnet), gaya pegas (elastisitas benda), dan gaya gravitasi (tarikan ke pusat bumi).",
        questions: [
          {
            id: 1,
            question: "Tarikan atau dorongan yang dapat menyebabkan benda bergerak atau berubah bentuk disebut...",
            options: ["Gaya", "Energi", "Daya", "Kecepatan"],
            correctIndex: 0,
            explanation: "Gaya didefinisikan sebagai tarikan atau dorongan yang diberikan pada suatu benda."
          },
          {
            id: 2,
            question: "Gaya yang digunakan atlet saat mengangkat barbel atau menendang bola adalah...",
            options: ["Gaya otot", "Gaya gravitasi", "Gaya magnet", "Gaya listrik"],
            correctIndex: 0,
            explanation: "Gaya otot dihasilkan oleh kerja kontraksi otot-otot tubuh manusia atau hewan."
          },
          {
            id: 3,
            question: "Gaya yang terjadi akibat sentuhan dua permukaan benda dan arahnya berlawanan dengan arah gerak adalah...",
            options: ["Gaya gesek", "Gaya pegas", "Gaya gravitasi", "Gaya magnet"],
            correctIndex: 0,
            explanation: "Gaya gesek muncul ketika dua permukaan saling bersentuhan dan menahan laju gerak benda."
          },
          {
            id: 4,
            question: "Buah mangga yang matang jatuh dari pohon ke tanah ditarik oleh gaya...",
            options: ["Gaya gravitasi bumi", "Gaya magnet", "Gaya pegas", "Gaya gesek"],
            correctIndex: 0,
            explanation: "Gravitasi bumi menarik semua benda bermassa menuju pusat bumi sehingga jatuh ke bawah."
          },
          {
            id: 5,
            question: "Gaya yang bekerja pada ketapel dan busur panah yang diregangkan adalah...",
            options: ["Gaya pegas", "Gaya gravitasi", "Gaya magnet", "Gaya dorong"],
            correctIndex: 0,
            explanation: "Gaya pegas timbul karena sifat elastis benda yang cenderung kembali ke bentuk aslinya saat ditarik."
          },
          {
            id: 6,
            question: "Kutub utara magnet didekatkan ke kutub utara magnet lainnya, maka kedua magnet akan...",
            options: ["Tolak-menolak", "Tarik-menarik", "Menempel erat", "Tidak bereaksi"],
            correctIndex: 0,
            explanation: "Dua kutub magnet yang senama (sama) akan tolak-menolak jika saling didekatkan."
          },
          {
            id: 7,
            question: "Benda di bawah ini yang dapat ditarik oleh gaya magnet adalah...",
            options: ["Paku besi", "Penggaris plastik", "Penghapus karet", "Kertas origami"],
            correctIndex: 0,
            explanation: "Paku besi terbuat dari bahan feromagnetik yang dapat ditarik kuat oleh magnet."
          },
          {
            id: 8,
            question: "Salah satu cara untuk memperkecil gaya gesek pada rantai sepeda adalah dengan memberi...",
            options: ["Pelumas atau oli", "Air garam", "Pasir kasar", "Karet ban"],
            correctIndex: 0,
            explanation: "Minyak pelumas atau oli membuat permukaan logam menjadi licin sehingga gaya gesek berkurang."
          },
          {
            id: 9,
            question: "Ketika kiper menangkap bola yang melesat kencang, gaya membuktikan pengaruhnya untuk...",
            options: ["Menghentikan gerak benda", "Mengubah bentuk benda", "Membuat benda terbang", "Mempercepat benda"],
            correctIndex: 0,
            explanation: "Kiper memberikan gaya penahan sehingga bola yang awalnya bergerak cepat menjadi diam berhenti."
          },
          {
            id: 10,
            question: "Membuat asbak atau vas bunga dari tanah liat membuktikan bahwa gaya dapat...",
            options: ["Mengubah bentuk benda", "Menghilangkan massa benda", "Mengubah wujud benda menjadi gas", "Meniadakan gravitasi"],
            correctIndex: 0,
            explanation: "Tekanan gaya tangan pada tanah liat atau plastisin dapat mengubah bentuk benda sesuai keinginan."
          }
        ]
      };

    case 4:
      return {
        title: "Transformasi Energi",
        conceptText: "Energi tidak dapat diciptakan atau dimusnahkan, tetapi dapat diubah (transformasi) dari satu bentuk ke bentuk lain. Bentuk energi meliputi energi listrik, panas, gerak, cahaya, kimia, dan bunyi. Contoh: setrika (listrik ke panas), kipas (listrik ke gerak), dan makanan (kimia ke gerak).",
        questions: [
          {
            id: 1,
            question: "Hukum kekekalan energi menyatakan bahwa energi tidak dapat...",
            options: ["Diciptakan atau dimusnahkan", "Diubah bentuknya", "Digunakan manusia", "Dihasilkan mesin"],
            correctIndex: 0,
            explanation: "Energi bersifat kekal: tidak dapat diciptakan atau dimusnahkan, hanya dapat berubah bentuk."
          },
          {
            id: 2,
            question: "Perubahan energi yang terjadi pada setrika listrik yang sedang digunakan adalah...",
            options: ["Energi listrik menjadi energi panas", "Energi panas menjadi listrik", "Energi listrik menjadi gerak", "Energi kimia menjadi panas"],
            correctIndex: 0,
            explanation: "Arus listrik dialirkan ke elemen pemanas setrika dan diubah menjadi energi panas untuk merapikan baju."
          },
          {
            id: 3,
            question: "Kipas angin dan blender memanfaatkan perubahan energi listrik menjadi...",
            options: ["Energi gerak", "Energi kimia", "Energi potensial", "Energi nuklir"],
            correctIndex: 0,
            explanation: "Motor listrik pada kipas angin dan blender memutar baling-baling, mengubah listrik menjadi gerak."
          },
          {
            id: 4,
            question: "Energi yang tersimpan di dalam makanan dan bahan bakar minyak tergolong energi...",
            options: ["Energi kimia", "Energi kinetik", "Energi bunyi", "Energi pegas"],
            correctIndex: 0,
            explanation: "Makanan dan bensin mengandung ikatan senyawa kimia yang melepaskan energi saat dicerna atau dibakar."
          },
          {
            id: 5,
            question: "Saat bermain gitar, petikan senar mengubah energi gerak menjadi...",
            options: ["Energi bunyi", "Energi kimia", "Energi panas", "Energi magnet"],
            correctIndex: 0,
            explanation: "Getaran senar yang dipetik menggetarkan udara di sekitarnya dan menghasilkan gelombang energi bunyi."
          },
          {
            id: 6,
            question: "Lampu senter yang dinyalakan menggunakan baterai mengalami perubahan energi...",
            options: ["Kimia -> Listrik -> Cahaya", "Listrik -> Kimia -> Gerak", "Panas -> Cahaya -> Kimia", "Gerak -> Listrik -> Bunyi"],
            correctIndex: 0,
            explanation: "Baterai menyimpan energi kimia, dialirkan sebagai arus listrik, lalu diubah bola lampu menjadi cahaya."
          },
          {
            id: 7,
            question: "Panel surya (solar cell) di atap rumah berfungsi mengubah energi...",
            options: ["Cahaya matahari menjadi listrik", "Panas menjadi angin", "Gerak menjadi kimia", "Listrik menjadi magnet"],
            correctIndex: 0,
            explanation: "Panel surya menyerap foton cahaya matahari dan mengonversinya menjadi arus listrik ramah lingkungan."
          },
          {
            id: 8,
            question: "Tubuh kita dapat berlari dan melompat setelah makan nasi. Ini membuktikan perubahan...",
            options: ["Energi kimia menjadi energi gerak", "Energi gerak menjadi listrik", "Energi bunyi menjadi kimia", "Energi cahaya menjadi kalor"],
            correctIndex: 0,
            explanation: "Zat gizi dari makanan (kimia) dibakar dalam metabolisme tubuh menjadi tenaga untuk bergerak."
          },
          {
            id: 9,
            question: "Pembangkit Listrik Tenaga Air (PLTA) memanfaatkan aliran air yang deras untuk menggerakkan...",
            options: ["Turbin dan generator", "Pemanas air", "Batu baterai", "Panel surya"],
            correctIndex: 0,
            explanation: "Energi kinetik aliran air memutar kincir turbin yang memicu generator listrik menghasilkan listrik."
          },
          {
            id: 10,
            question: "Televisi yang menyala di ruang tamu mengubah energi listrik menjadi energi...",
            options: ["Cahaya dan bunyi", "Gerak dan kimia", "Nuklir dan pegas", "Gravitasi dan kalor murni"],
            correctIndex: 0,
            explanation: "Televisi menampilkan gambar (energi cahaya) serta mengeluarkan suara program siaran (energi bunyi)."
          }
        ]
      };

    case 5:
      return {
        title: "Cerita tentang Daerahku",
        conceptText: "Setiap daerah memiliki sejarah, tokoh pahlawan lokal, peninggalan bersejarah (prasasti, candi, benteng, museum), serta bentang alam khas (pegunungan, pesisir, lembah). Kondisi alam daerah memengaruhi mata pencaharian, tradisi, dan kebiasaan masyarakatnya.",
        questions: [
          {
            id: 1,
            question: "Benda peninggalan masa lalu bertuliskan huruf kuno pada batu disebut...",
            options: ["Prasasti", "Fosil", "Relief", "Arca"],
            correctIndex: 0,
            explanation: "Prasasti adalah batu bertulis yang memuat piagam maklumat atau peristiwa penting kerajaan masa lampau."
          },
          {
            id: 2,
            question: "Tempat khusus yang menyimpan dan memamerkan benda-benda bersejarah suatu daerah adalah...",
            options: ["Museum", "Perpustakaan umum", "Kantor pos", "Pasar seni"],
            correctIndex: 0,
            explanation: "Museum bertugas mengumpulkan, merawat, dan memamerkan warisan sejarah dan budaya masyarakat."
          },
          {
            id: 3,
            question: "Masyarakat yang tinggal di daerah pesisir pantai sebagian besar bermata pencaharian sebagai...",
            options: ["Nelayan dan petani garam", "Petani sayur teh", "Penebang kayu hutan", "Penambang batu bara"],
            correctIndex: 0,
            explanation: "Kondisi pantai yang dekat dengan laut membuat warga memanfaatkan sumber daya laut sebagai nelayan."
          },
          {
            id: 4,
            question: "Masyarakat yang bertempat tinggal di dataran tinggi pegunungan umumnya bekerja sebagai...",
            options: ["Petani kebun sayur dan teh", "Nelayan tangkap ikan", "Pemandu kapal laut", "Pembuat garam"],
            correctIndex: 0,
            explanation: "Suhu dingin di dataran tinggi sangat cocok untuk perkebunan teh, kopi, kubis, dan buah stroberi."
          },
          {
            id: 5,
            question: "Bangunan benteng peninggalan masa kolonial di daerah pesisir dahulunya berfungsi sebagai...",
            options: ["Pusat pertahanan militer", "Tempat ibadah umum", "Pasar tradisional", "Sekolah dasar"],
            correctIndex: 0,
            explanation: "Benteng pertahanan dibangun untuk mengawasi pelabuhan dan membendung serangan musuh masa penjajahan."
          },
          {
            id: 6,
            question: "Cerita rakyat turun-temurun yang mengisahkan asal-usul suatu tempat dinamakan...",
            options: ["Legenda", "Fabel", "Mite", "Biografi ilmiah"],
            correctIndex: 0,
            explanation: "Legenda adalah cerita rakyat yang dihubungkan dengan sejarah terjadinya suatu tempat atau daerah."
          },
          {
            id: 7,
            question: "Sikap kita terhadap peninggalan bersejarah di daerah kita seharusnya...",
            options: ["Menjaga kebersihan dan kelestariannya", "Mencoret-coret dinding candi", "Mengambil batunya untuk hiasan", "Membiarkannya rusak terbengkalai"],
            correctIndex: 0,
            explanation: "Situs bersejarah harus dilindungi dan dirawat agar dapat terus dipelajari generasi mendatang."
          },
          {
            id: 8,
            question: "Tokoh lokal yang berjuang memimpin perlawanan rakyat melawan penjajah di daerahnya disebut...",
            options: ["Pahlawan daerah", "Saudagar lokal", "Bupati penjajah", "Pengembara"],
            correctIndex: 0,
            explanation: "Pahlawan daerah adalah pejuang yang gigih membela tanah air dan rakyat di wilayah tempat tinggalnya."
          },
          {
            id: 9,
            question: "Peninggalan sejarah kerajaan berupa bangunan suci berundak dari batu di pulau Jawa dan Bali adalah...",
            options: ["Candi", "Masjid agung", "Kubah modern", "Menara suar"],
            correctIndex: 0,
            explanation: "Candi seperti Borobudur dan Prambanan merupakan monumen batu megah peninggalan kerajaan Hindu-Buddha."
          },
          {
            id: 10,
            question: "Mengetahui sejarah berdirinya daerah tempat tinggal bermanfaat untuk...",
            options: ["Menumbuhkan rasa cinta tanah air dan bangga", "Merasa lebih hebat dari daerah lain", "Menjual benda sejarah ke luar negeri", "Melupakan masa lalu"],
            correctIndex: 0,
            explanation: "Belajar sejarah daerah membangun apresiasi, persatuan, dan rasa bangga akan identitas kampung halaman."
          }
        ]
      };

    case 6:
      return {
        title: "Keragaman Budaya & Kearifan Lokal",
        conceptText: "Indonesia kaya akan keragaman suku bangsa, rumah adat, tarian tradisional, pakaian adat, alat musik, dan kearifan lokal. Semboyan Bhinneka Tunggal Ika mengajarkan bahwa meskipun berbeda-beda, bangsa Indonesia tetap bersatu dan saling menghormati.",
        questions: [
          {
            id: 1,
            question: "Semboyan persatuan bangsa Indonesia yang bermakna 'berbeda-beda tetapi tetap satu jua' adalah...",
            options: ["Bhinneka Tunggal Ika", "Tut Wuri Handayani", "Ing Ngarso Sung Tulodo", "Pancasila Sakti"],
            correctIndex: 0,
            explanation: "Bhinneka Tunggal Ika tertulis di cengkeraman burung Garuda lambang negara kesatuan Republik Indonesia."
          },
          {
            id: 2,
            question: "Rumah adat Rumah Gadang dengan atap melengkung menyerupai tanduk kerbau berasal dari suku Minangkabau di provinsi...",
            options: ["Sumatera Barat", "Jawa Tengah", "Kalimantan Barat", "Papua"],
            correctIndex: 0,
            explanation: "Rumah Gadang adalah rumah tradisional ikonik masyarakat Minangkabau di Sumatera Barat."
          },
          {
            id: 3,
            question: "Rumah adat suku Toraja yang memiliki atap melengkung seperti perahu dinamakan...",
            options: ["Tongkonan", "Honai", "Joglo", "Baileo"],
            correctIndex: 0,
            explanation: "Tongkonan adalah rumah panggung adat suku Toraja di Sulawesi Selatan yang sangat megah."
          },
          {
            id: 4,
            question: "Rumah adat Honai yang berbentuk bulat dengan atap jerami berasal dari daerah...",
            options: ["Papua", "Aceh", "Bali", "DKI Jakarta"],
            correctIndex: 0,
            explanation: "Honai adalah rumah adat masyarakat pegunungan Papua yang dirancang hangat menghadapi hawa dingin."
          },
          {
            id: 5,
            question: "Alat musik tradisional Jawa dan Bali yang terdiri dari bonang, gong, dan saron dinamakan...",
            options: ["Gamelan", "Angklung", "Sasando", "Kolintang"],
            correctIndex: 0,
            explanation: "Gamelan merupakan ensambel instrumen perkusi tradisional yang dimainkan secara harmonis bersama."
          },
          {
            id: 6,
            question: "Alat musik tradisional berbahan bambu dari Jawa Barat yang dimainkan dengan cara digoyangkan adalah...",
            options: ["Angklung", "Saluang", "Tifa", "Kecapi"],
            correctIndex: 0,
            explanation: "Angklung menghasilkan nada indah saat digetarkan dan telah diakui UNESCO sebagai warisan budaya dunia."
          },
          {
            id: 7,
            question: "Tari Saman yang dilakukan secara serentak dan berlutut berasal dari daerah...",
            options: ["Aceh", "Sumatera Selatan", "Banten", "Maluku"],
            correctIndex: 0,
            explanation: "Tari Saman dari suku Gayo Aceh terkenal dengan kecepatan tepukan tangan dan kekompakan penarinya."
          },
          {
            id: 8,
            question: "Sistem irigasi persawahan tradisional Bali yang menjunjung nilai kearifan lokal dan gotong royong disebut...",
            options: ["Subak", "Pranata mangsa", "Sasi", "Nyepi"],
            correctIndex: 0,
            explanation: "Subak adalah organisasi pengairan sawah tradisional Bali yang berlandaskan filosofi Tri Hita Karana."
          },
          {
            id: 9,
            question: "Kain tradisional Indonesia yang dibuat dengan teknik canting malam dan motif khas tiap daerah adalah...",
            options: ["Batik", "Kain sutra polos", "Songket sintetis", "Kain flannel"],
            correctIndex: 0,
            explanation: "Batik adalah warisan budaya luhur Indonesia dengan beragam motif sakral dari berbagai daerah nusantara."
          },
          {
            id: 10,
            question: "Sikap yang tepat saat melihat teman menampilkan tarian adat yang berbeda dengan daerah asal kita adalah...",
            options: ["Menghargai dan bertepuk tangan kagum", "Menertawakan gerakannya", "Mengabaikan penampilannya", "Menyuruhnya berhenti"],
            correctIndex: 0,
            explanation: "Sikap toleransi dan menghargai keragaman budaya memperkuat persaudaraan antarsesama anak bangsa."
          }
        ]
      };

    case 7:
      return {
        title: "Kegiatan Ekonomi & Kebutuhan Manusia",
        conceptText: "Kebutuhan manusia dibagi menjadi primer (pokok/vital seperti pangan, sandang, papan), sekunder (pelengkap penunjang), dan tersier (kemewahan). Kegiatan ekonomi mencakup produksi (membuat barang/jasa), distribusi (menyalurkan barang), dan konsumsi (menggunakan barang/jasa). Uang digunakan sebagai alat tukar sah.",
        questions: [
          {
            id: 1,
            question: "Kebutuhan mendasar yang mutlak harus dipenuhi manusia agar dapat bertahan hidup disebut kebutuhan...",
            options: ["Primer", "Sekunder", "Tersier", "Kolektif"],
            correctIndex: 0,
            explanation: "Kebutuhan primer adalah kebutuhan pokok seperti makanan (pangan), pakaian (sandang), dan tempat tinggal (papan)."
          },
          {
            id: 2,
            question: "Contoh kebutuhan pokok (primer) bagi seorang siswa sekolah adalah...",
            options: ["Makanan bergizi dan seragam sekolah", "Smartphone model terbaru", "Perhiasan emas permata", "Mobil mewah"],
            correctIndex: 0,
            explanation: "Makanan sehat dan pakaian pelindung tubuh merupakan syarat utama keberlangsungan hidup."
          },
          {
            id: 3,
            question: "Kebutuhan yang dipenuhi setelah kebutuhan primer tercukupi untuk menambah kenyamanan hidup adalah kebutuhan...",
            options: ["Sekunder", "Primer", "Pokok mutlak", "Mendesak"],
            correctIndex: 0,
            explanation: "Kebutuhan sekunder seperti kipas angin, meja belajar, atau radio melengkapi kenyamanan setelah pangan terpenuhi."
          },
          {
            id: 4,
            question: "Membeli barang mewah seperti kapal pesiar atau berlian tergolong pemenuhan kebutuhan...",
            options: ["Tersier", "Primer", "Sekunder", "Sosial"],
            correctIndex: 0,
            explanation: "Kebutuhan tersier berkaitan dengan barang mewah yang bertujuan meningkatkan prestise atau status sosial."
          },
          {
            id: 5,
            question: "Kegiatan membuat, menghasilkan, atau menambah nilai guna suatu barang/jasa disebut...",
            options: ["Produksi", "Distribusi", "Konsumsi", "Investasi"],
            correctIndex: 0,
            explanation: "Produksi adalah aktivitas menghasilkan barang atau jasa, pelakunya dinamakan produsen."
          },
          {
            id: 6,
            question: "Seorang petani yang menanam padi di sawah hingga memanen gabah berperan sebagai...",
            options: ["Produsen", "Konsumen", "Distributor", "Kolektor"],
            correctIndex: 0,
            explanation: "Petani adalah produsen bahan pangan pokok karena menghasilkan padi untuk kebutuhan pangan."
          },
          {
            id: 7,
            question: "Kegiatan menyalurkan barang dagangan dari tangan pembuat ke tangan pembeli disebut...",
            options: ["Distribusi", "Produksi", "Konsumsi", "Ekstraksi"],
            correctIndex: 0,
            explanation: "Distribusi adalah kegiatan mengangkut dan menyalurkan barang dari produsen ke konsumen."
          },
          {
            id: 8,
            question: "Orang atau badan usaha yang bertugas mengantar dan menyalurkan barang dagangan dinamakan...",
            options: ["Distributor", "Produsen", "Konsumen", "Investor"],
            correctIndex: 0,
            explanation: "Distributor seperti pedagang grosir atau kurir logistik menyalurkan produk ke berbagai toko."
          },
          {
            id: 9,
            question: "Siswa yang membeli dan memakan roti di kantin sekolah sedang melakukan kegiatan...",
            options: ["Konsumsi", "Produksi", "Distribusi", "Barter"],
            correctIndex: 0,
            explanation: "Konsumsi adalah kegiatan memanfaatkan atau menghabiskan nilai guna suatu barang."
          },
          {
            id: 10,
            question: "Fungsi utama uang dalam kegiatan perekonomian modern adalah sebagai...",
            options: ["Alat tukar yang sah dan satuan hitung", "Pajangan dompet", "Bahan kerajinan kertas", "Hadiah undian"],
            correctIndex: 0,
            explanation: "Uang menggantikan sistem barter kuno sebagai alat tukar yang diakui sah dan mempermudah transaksi jual beli."
          }
        ]
      };

    case 8:
      return {
        title: "Norma & Adat Istiadat",
        conceptText: "Norma adalah pedoman aturan tingkah laku bermasyarakat yang disepakati demi ketertiban. Terdiri dari norma agama (wahyu Tuhan), kesusilaan (hati nurani), kesopanan (tata krama pergaulan), dan norma hukum (aturan negara yang tegas). Pelanggaran norma berujung sanksi demi menjaga kedamaian.",
        questions: [
          {
            id: 1,
            question: "Aturan atau kaidah yang disepakati untuk mengatur perilaku manusia dalam bermasyarakat disebut...",
            options: ["Norma", "Kebebasan mutlak", "Wasiat", "Opini"],
            correctIndex: 0,
            explanation: "Norma adalah aturan resmi maupun tidak tertulis yang membimbing perbuatan anggota masyarakat."
          },
          {
            id: 2,
            question: "Norma yang bersumber dari wahyu Tuhan Yang Maha Esa dan sanksinya berupa dosa adalah...",
            options: ["Norma agama", "Norma kesopanan", "Norma hukum", "Norma adat"],
            correctIndex: 0,
            explanation: "Norma agama berasal dari kitab suci petunjuk Tuhan dengan sanksi pertanggungjawaban di akhirat."
          },
          {
            id: 3,
            question: "Norma yang bersumber dari suara hati nurani manusia mengenai baik dan buruknya perbuatan adalah...",
            options: ["Norma kesusilaan", "Norma hukum", "Norma kesopanan", "Norma lalu lintas"],
            correctIndex: 0,
            explanation: "Norma kesusilaan membisikkan kebenaran batin; pelanggarannya menimbulkan rasa bersalah dan penyesalan."
          },
          {
            id: 4,
            question: "Menyapa orang yang lebih tua dengan santun dan mengetuk pintu sebelum masuk merupakan penerapan...",
            options: ["Norma kesopanan", "Norma hukum tertulis", "Norma undang-undang", "Sanksi pidana"],
            correctIndex: 0,
            explanation: "Norma kesopanan lahir dari tata krama dan adat pergaulan setempat agar tercipta rasa saling menghormati."
          },
          {
            id: 5,
            question: "Sanksi sosial yang didapat jika seseorang melanggar norma kesopanan umumnya berupa...",
            options: ["Teguran, cemoohan, atau dikucilkan", "Hukuman penjara", "Denda uang dari polisi", "Penyitaan harta"],
            correctIndex: 0,
            explanation: "Pelanggar norma kesopanan akan ditegur masyarakat atau merasa malu atas perilakunya."
          },
          {
            id: 6,
            question: "Norma yang dibuat oleh lembaga berwenang negara dan memiliki sifat tegas serta memaksa adalah...",
            options: ["Norma hukum", "Norma kesopanan", "Norma adat santai", "Norma pribadi"],
            correctIndex: 0,
            explanation: "Norma hukum disusun aparatur negara dan memiliki sanksi nyata seperti denda atau pidana kurungan."
          },
          {
            id: 7,
            question: "Pengendara sepeda motor yang memakai helm standar dan mematuhi lampu merah mematuhi...",
            options: ["Norma hukum", "Norma kesusilaan murni", "Norma adat pedalaman", "Norma bebas"],
            correctIndex: 0,
            explanation: "Tertib berlalu lintas merupakan kewajiban hukum demi keselamatan seluruh pengguna jalan."
          },
          {
            id: 8,
            question: "Tujuan utama diterapkannya norma-norma di lingkungan masyarakat adalah untuk...",
            options: ["Menciptakan ketertiban, keamanan, dan kedamaian", "Mengekang warga agar takut", "Membuat warga membayar denda", "Menguntungkan pihak tertentu"],
            correctIndex: 0,
            explanation: "Norma menjaga agar hubungan antarwarga berjalan adil, teratur, harmonis, dan terhindar dari konflik."
          },
          {
            id: 9,
            question: "Aturan atau kebiasaan turun-temurun yang masih dipegang teguh oleh masyarakat adat dinamakan...",
            options: ["Adat istiadat", "Undang-undang darurat", "Instruksi presiden", "Perjanjian dagang"],
            correctIndex: 0,
            explanation: "Adat istiadat adalah tata kelakuan leluhur yang diwariskan dari generasi ke generasi dalam komunitas."
          },
          {
            id: 10,
            question: "Jika di kelas ada teman yang kesulitan memahami materi pelajaran, sikap terpuji yang sesuai norma adalah...",
            options: ["Membantunya belajar dengan sabar", "Mengejek kekurangannya", "Menyuruhnya keluar kelas", "Mengabaikannya"],
            correctIndex: 0,
            explanation: "Tolong-menolong dan peduli sesama teman mencerminkan budi pekerti luhur dan norma kesusilaan."
          }
        ]
      };

    default:
      return {
        title: "Konsep Dasar IPAS",
        conceptText: "Ilmu Pengetahuan Alam dan Sosial (IPAS) membantu kita memahami keterhubungan antara alam semesta, makhluk hidup, dan dinamika sosial kemasyarakatan di sekitar kita.",
        questions: []
      };
  }
}
