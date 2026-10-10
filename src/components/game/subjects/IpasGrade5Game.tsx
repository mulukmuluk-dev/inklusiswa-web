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

interface IpasGrade5GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IpasGrade5Game({ levelId, onLevelComplete, accessibilityMode }: IpasGrade5GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeLightProp, setActiveLightProp] = useState<{ prop: string; sample: string }>({ prop: "Merambat Lurus", sample: "Berkas cahaya senter membentuk garis lurus di tempat gelap." });
  const [activeSoundProp, setActiveSoundProp] = useState<{ term: string; desc: string }>({ term: "Gema", desc: "Pantulan bunyi yang terdengar jelas setelah bunyi asli selesai di tebing/lembah." });
  const [activeSymbiosis, setActiveSymbiosis] = useState<{ type: string; example: string; note: string }>({ type: "Mutualisme", example: "Lebah dan Bunga", note: "Keduanya saling menguntungkan (lebah dapat nektar, bunga terbantu penyerbukan)." });
  const [activeCircuit, setActiveCircuit] = useState<{ name: string; feat: string }>({ name: "Rangkaian Paralel", feat: "Bercabang: jika satu lampu padam, lampu lain tetap menyala terang." });
  const [activeEarthLayer, setActiveEarthLayer] = useState<{ layer: string; role: string }>({ layer: "Atmosfer", role: "Lapisan udara penyelubung bumi penangkal radiasi sinar UV matahari." });
  const [activeHistoryKingdom, setActiveHistoryKingdom] = useState<{ kingdom: string; era: string; hero: string }>({ kingdom: "Kerajaan Majapahit", era: "Hindu-Buddha", hero: "Patih Gajah Mada (Sumpah Palapa)" });
  const [activeGeoFeature, setActiveGeoFeature] = useState<{ feature: string; detail: string }>({ feature: "Letak Geografis", detail: "Diapit 2 benua (Asia & Australia) dan 2 samudra (Hindia & Pasifik)." });
  const [activeResource, setActiveResource] = useState<{ res: string; type: string; benefit: string }>({ res: "Hutan & Air", type: "Dapat Diperbarui", benefit: "Dapat pulih kembali secara alami jika dikelola bijak." });

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
    setActiveLightProp({ prop: "Merambat Lurus", sample: "Berkas cahaya senter membentuk garis lurus di tempat gelap." });
    setActiveSoundProp({ term: "Gema", desc: "Pantulan bunyi yang terdengar jelas setelah bunyi asli selesai di tebing/lembah." });
    setActiveSymbiosis({ type: "Mutualisme", example: "Lebah dan Bunga", note: "Keduanya saling menguntungkan (lebah dapat nektar, bunga terbantu penyerbukan)." });
    setActiveCircuit({ name: "Rangkaian Paralel", feat: "Bercabang: jika satu lampu padam, lampu lain tetap menyala terang." });
    setActiveEarthLayer({ layer: "Atmosfer", role: "Lapisan udara penyelubung bumi penangkal radiasi sinar UV matahari." });
    setActiveHistoryKingdom({ kingdom: "Kerajaan Majapahit", era: "Hindu-Buddha", hero: "Patih Gajah Mada (Sumpah Palapa)" });
    setActiveGeoFeature({ feature: "Letak Geografis", detail: "Diapit 2 benua (Asia & Australia) dan 2 samudra (Hindia & Pasifik)." });
    setActiveResource({ res: "Hutan & Air", type: "Dapat Diperbarui", benefit: "Dapat pulih kembali secara alami jika dikelola bijak." });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade5IpasData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade5IpasData(levelId);
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
        speakGlobal("Belum tepat, coba teliti kembali.");
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
            KELAS 5 SD • LEVEL {levelId} dari 8
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
                  Sifat-Sifat Cahaya & Indra Penglihatan:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { prop: "Merambat Lurus", sample: "Cahaya senter lurus menembus celah gelap." },
                    { prop: "Menembus Bening", sample: "Cahaya menembus kaca jendela dan air jernih." },
                    { prop: "Dapat Dipantulkan", sample: "Bayangan wajah terlihat pada cermin datar." },
                    { prop: "Dapat Dibiaskan", sample: "Pensil tampak patah saat dicelupkan ke air." },
                  ].map((p) => (
                    <button
                      key={p.prop}
                      type="button"
                      onClick={() => {
                        setActiveLightProp(p);
                        playPopSound();
                        speakGlobal(`Sifat cahaya ${p.prop}. Contoh: ${p.sample}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeLightProp.prop === p.prop ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{p.prop}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeLightProp.prop}: </strong>
                  <span>{activeLightProp.sample} (Mata: kornea, pupil, lensa, retina).</span>
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Perambatan Bunyi & Pemantulan (Gaung vs Gema):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { term: "Gaung / Kerdam", desc: "Pantulan bunyi terdengar hampir bersamaan dengan bunyi asli, sehingga suara asli jadi tidak jelas (di gedung bioskop/aula)." },
                    { term: "Gema", desc: "Pantulan bunyi terdengar lengkap dan jelas beberapa saat setelah bunyi asli selesai (di tebing gunung atau lembah luas)." },
                    { term: "Medium Bunyi", desc: "Bunyi merambat melalui zat padat, cair, dan gas. Bunyi tidak dapat merambat di ruang hampa udara." },
                  ].map((s) => (
                    <button
                      key={s.term}
                      type="button"
                      onClick={() => {
                        setActiveSoundProp(s);
                        playPopSound();
                        speakGlobal(`${s.term}: ${s.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeSoundProp.term === s.term ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{s.term}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeSoundProp.term}: </strong>
                  <span>{activeSoundProp.desc}</span>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Hubungan Simbiosis Makhluk Hidup:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { type: "Mutualisme", example: "Lebah & Bunga", note: "Kedua pihak saling diuntungkan." },
                    { type: "Komensalisme", example: "Ikan Remora & Hiu", note: "Satu untung, satu tidak dirugikan/diuntungkan." },
                    { type: "Parasitisme", example: "Benalu & Pohon Inang", note: "Satu untung, satu pihak dirugikan nutrisinya." },
                  ].map((sym) => (
                    <button
                      key={sym.type}
                      type="button"
                      onClick={() => {
                        setActiveSymbiosis(sym);
                        playPopSound();
                        speakGlobal(`Simbiosis ${sym.type}. Contoh: ${sym.example}. ${sym.note}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeSymbiosis.type === sym.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{sym.type}</strong>
                      <span className="text-[10px] opacity-80 block">{sym.example}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeSymbiosis.type} ({activeSymbiosis.example}): </strong>
                  <span>{activeSymbiosis.note}</span>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kelistrikan & Rangkaian Listrik:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { name: "Rangkaian Seri", feat: "Satu jalur tanpa cabang: jika satu lampu padam, semua ikut padam." },
                    { name: "Rangkaian Paralel", feat: "Jalur bercabang: jika satu lampu padam, lampu cabang lain tetap menyala." },
                    { name: "Energi Bersih", feat: "PLTS (Surya) dan PLTB (Angin) menghasilkan listrik tanpa polusi emisi." },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setActiveCircuit(c);
                        playPopSound();
                        speakGlobal(`${c.name}: ${c.feat}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCircuit.name === c.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{c.name}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeCircuit.name}: </strong>
                  <span>{activeCircuit.feat}</span>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Lapisan Bumi & Daur Air:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { layer: "Litosfer", role: "Kerak padat batuan dan daratan tempat tinggal manusia." },
                    { layer: "Hidrosfer", role: "Lapisan perairan samudera, laut, danau, dan sungai." },
                    { layer: "Atmosfer", role: "Selubung gas udara yang menjaga suhu bumi tetap stabil." },
                    { layer: "Siklus Air", role: "Evaporasi -> Kondensasi (awan) -> Presipitasi (hujan) -> Infiltrasi." },
                  ].map((l) => (
                    <button
                      key={l.layer}
                      type="button"
                      onClick={() => {
                        setActiveEarthLayer(l);
                        playPopSound();
                        speakGlobal(`${l.layer}: ${l.role}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeEarthLayer.layer === l.layer ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{l.layer}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeEarthLayer.layer}: </strong>
                  <span>{activeEarthLayer.role}</span>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Sejarah Kerajaan Nusantara & Penjajahan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { kingdom: "Sriwijaya", era: "Maritim Buddha", hero: "Pusat belajar agama dan perdagangan Selat Malaka." },
                    { kingdom: "Majapahit", era: "Kejayaan Hindu-Buddha", hero: "Hayam Wuruk & Sumpah Palapa Patih Gajah Mada." },
                    { kingdom: "Demak & Mataram", era: "Kerajaan Islam", hero: "Raden Patah dan Sultan Agung Hanyokrokusumo." },
                  ].map((k) => (
                    <button
                      key={k.kingdom}
                      type="button"
                      onClick={() => {
                        setActiveHistoryKingdom(k);
                        playPopSound();
                        speakGlobal(`Kerajaan ${k.kingdom} era ${k.era}. ${k.hero}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeHistoryKingdom.kingdom === k.kingdom ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{k.kingdom}</strong>
                      <span className="text-[10px] opacity-80 block">{k.era}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeHistoryKingdom.kingdom}: </strong>
                  <span>{activeHistoryKingdom.hero} (Jalur rempah menarik kedatangan bangsa Eropa).</span>
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kondisi Geografis & Zona Waktu Indonesia:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { feature: "WIB (UTC+7)", detail: "Sumatera, Jawa, Kalbar, Kalteng (Zona Waktu Indonesia Barat)." },
                    { feature: "WITA (UTC+8)", detail: "Sulawesi, Bali, NTB, NTT, Kalsel, Kaltim, Kaltara." },
                    { feature: "WIT (UTC+9)", detail: "Kepulauan Maluku dan seluruh provinsi di Papua." },
                  ].map((g) => (
                    <button
                      key={g.feature}
                      type="button"
                      onClick={() => {
                        setActiveGeoFeature(g);
                        playPopSound();
                        speakGlobal(`Zona ${g.feature}: ${g.detail}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeGeoFeature.feature === g.feature ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{g.feature}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Astronomis: </strong>6°LU–11°LS dan 95°BT–141°BT (Iklim Tropis, 2 musim: Hujan & Kemarau).
                </div>
              </div>
            )}

            {levelId === 8 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Perekonomian & Sumber Daya Alam (SDA):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { res: "SDA Dapat Diperbarui", type: "Hutan, Air, Hewan, Tumbuhan", benefit: "Kekayaan alam yang terus beregenerasi jika tidak dieksploitasi berlebihan." },
                    { res: "SDA Tidak Dapat Diperbarui", type: "Minyak Bumi, Batubara, Emas", benefit: "Jumlahnya terbatas dan butuh jutaan tahun untuk terbentuk kembali." },
                  ].map((r) => (
                    <button
                      key={r.res}
                      type="button"
                      onClick={() => {
                        setActiveResource(r);
                        playPopSound();
                        speakGlobal(`${r.res}: ${r.type}. ${r.benefit}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeResource.res === r.res ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{r.res}</strong>
                      <span className="text-[10px] opacity-80 block">{r.type}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong className="text-[#3C632A]">{activeResource.res}: </strong>
                  <span>{activeResource.benefit} (Ekonomi Maritim & Agraris nusantara).</span>
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

function getGrade5IpasData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Cahaya & Penglihatan",
        conceptText: "Cahaya memiliki sifat merambat lurus, menembus benda bening, dapat dipantulkan (cermin datar, cekung, cembung), dan dapat dibiaskan (pembelokan di medium beda kerapatan). Mata menangkap cahaya melalui kornea, pupil, lensa mata, hingga bayangan jatuh di retina.",
        questions: [
          {
            id: 1,
            question: "Berkas sinar matahari yang masuk melewati celah genteng membentuk garis lurus membuktikan sifat cahaya...",
            options: ["Merambat lurus", "Dapat dibiaskan", "Tidak dapat dipantulkan", "Berubah wujud"],
            correctIndex: 0,
            explanation: "Cahaya selalu merambat dalam garis lurus dalam satu medium yang serba sama."
          },
          {
            id: 2,
            question: "Cahaya lampu senter dapat menembus kaca akuarium bening karena sifat cahaya yang...",
            options: ["Dapat menembus benda bening", "Merambat melingkar", "Dapat diserap total", "Membentuk bayang-bayang gelap"],
            correctIndex: 0,
            explanation: "Benda transparan (bening) meneruskan hampir seluruh berkas cahaya yang mengenainya."
          },
          {
            id: 3,
            question: "Pensil yang dimasukkan ke dalam gelas berisi air bening tampak patah karena cahaya mengalami...",
            options: ["Pembiasan (refraksi)", "Pemantulan baur", "Penyerapan kalor", "Penguapan"],
            correctIndex: 0,
            explanation: "Pembiasan terjadi karena cahaya merambat melalui dua medium yang berbeda kerapatannya (udara dan air)."
          },
          {
            id: 4,
            question: "Cermin yang digunakan pada kaca spion kendaraan agar menghasilkan bayangan tegak dan lebih kecil adalah...",
            options: ["Cermin cembung", "Cermin cekung", "Cermin datar", "Kaca jendela"],
            correctIndex: 0,
            explanation: "Cermin cembung menyebarkan cahaya dan memberikan bidang pandang yang luas pada spion kendaraan."
          },
          {
            id: 5,
            question: "Bagian mata yang berfungsi mengatur banyak sedikitnya cahaya yang masuk ke dalam bola mata adalah...",
            options: ["Pupil", "Kornea", "Retina", "Saraf optik"],
            correctIndex: 0,
            explanation: "Pupil akan mengecil saat cahaya terang dan membesar saat ruangan gelap dengan bantuan otot iris."
          },
          {
            id: 6,
            question: "Bagian mata yang memberi warna cokelat, hitam, atau biru pada bola mata manusia adalah...",
            options: ["Iris", "Sklera", "Lensa mata", "Bintik buta"],
            correctIndex: 0,
            explanation: "Iris memiliki pigmen melanin yang menentukan warna mata seseorang dan mengendalikan pupil."
          },
          {
            id: 7,
            question: "Lensa mata berfungsi untuk memfokuskan cahaya agar bayangan benda jatuh tepat pada bagian...",
            options: ["Retina", "Kornea", "Pupil", "Bulu mata"],
            correctIndex: 0,
            explanation: "Retina (selaput jala) berisi sel-sel fotoreseptor yang menangkap bayangan benda sebelum dikirim ke otak."
          },
          {
            id: 8,
            question: "Alat optik yang digunakan untuk melihat benda-benda renik mikroorganisme yang sangat kecil adalah...",
            options: ["Mikroskop", "Teleskop", "Periskop", "Kamera analog"],
            correctIndex: 0,
            explanation: "Mikroskop memanfaatkan kombinasi lensa cembung untuk memperbesar bayangan objek mikroskopis."
          },
          {
            id: 9,
            question: "Alat optik pada kapal selam yang digunakan untuk melihat keadaan di permukaan laut adalah...",
            options: ["Periskop", "Lup", "Teleskop bintang", "Kacamata renang"],
            correctIndex: 0,
            explanation: "Periskop menggunakan dua cermin datar dengan sudut 45 derajat untuk memantulkan pandangan luar."
          },
          {
            id: 10,
            question: "Terjadinya pelangi di langit setelah turun hujan merupakan peristiwa penguraian cahaya putih (dispersi) oleh...",
            options: ["Tetesan-tetesan air hujan di udara", "Awan mendung hitam", "Angin kencang", "Gas karbon dioksida"],
            correctIndex: 0,
            explanation: "Butiran air hujan bertindak seperti prisma alami yang membiaskan dan menguraikan cahaya matahari menjadi spektrum warna."
          }
        ]
      };

    case 2:
      return {
        title: "Bunyi & Pendengaran",
        conceptText: "Bunyi dihasilkan dari getaran benda dan merambat melalui medium zat padat, cair, dan gas (tidak dapat di ruang hampa). Pemantulan bunyi menghasilkan gaung (mengaburkan suara asli di aula) dan gema (terdengar jelas setelah bunyi asli di tebing). Indra pendengar adalah telinga.",
        questions: [
          {
            id: 1,
            question: "Semua getaran benda yang merambat melalui medium perantara dan dapat didengar telinga disebut...",
            options: ["Bunyi", "Cahaya", "Listrik", "Magnet"],
            correctIndex: 0,
            explanation: "Bunyi timbul dari benda yang bergetar lalu merambat sebagai gelombang mekanik ke telinga."
          },
          {
            id: 2,
            question: "Bunyi dapat merambat paling cepat melalui medium perantara zat...",
            options: ["Padat", "Cair", "Gas", "Ruang hampa udara"],
            correctIndex: 0,
            explanation: "Partikel zat padat tersusun sangat rapat sehingga perambatan getaran bunyi berlangsung paling cepat."
          },
          {
            id: 3,
            question: "Di luar angkasa, para astronot tidak dapat mendengar suara secara langsung karena di sana berupa...",
            options: ["Ruang hampa udara (vakum)", "Suhu yang terlalu dingin", "Ketiadaan sinar matahari", "Medan gravitasi nol"],
            correctIndex: 0,
            explanation: "Bunyi membutuhkan medium zat untuk merambat; di ruang hampa udara gelombang bunyi tidak dapat merambat."
          },
          {
            id: 4,
            question: "Pantulan bunyi yang terdengar hampir bersamaan dengan bunyi asli sehingga mengaburkan kejelasan suara dinamakan...",
            options: ["Gaung (kerdam)", "Gema", "Resonansi", "Infrasonik"],
            correctIndex: 0,
            explanation: "Gaung terjadi di ruangan sempit atau aula dinding keras karena jarak pantul yang terlalu dekat."
          },
          {
            id: 5,
            question: "Bunyi pantul yang terdengar jelas dan lengkap beberapa saat setelah bunyi asli selesai diucapkan di tebing adalah...",
            options: ["Gema", "Gaung", "Desibel", "Amplitudo"],
            correctIndex: 0,
            explanation: "Gema terjadi ketika bunyi mengenai dinding pemantul yang sangat jauh, seperti lembah atau tebing gunung."
          },
          {
            id: 6,
            question: "Dinding bioskop dan studio musik dilapisi bahan lunak seperti karpet dan busa spons dengan tujuan untuk...",
            options: ["Meredam dan mencegah gaung", "Membuat suara menjadi lebih cempreng", "Menahan hawa panas", "Menambah hiasan ruangan"],
            correctIndex: 0,
            explanation: "Benda lunak berpori menyerap gelombang bunyi sehingga tidak memantul liar menjadi gaung."
          },
          {
            id: 7,
            question: "Bagian telinga luar yang berfungsi menangkap dan mengumpulkan gelombang bunyi dari sekitar adalah...",
            options: ["Daun telinga", "Gendang telinga", "Rumah siput", "Saluran eustachius"],
            correctIndex: 0,
            explanation: "Bentuk daun telinga dirancang khusus untuk memusatkan gelombang bunyi masuk ke liang telinga."
          },
          {
            id: 8,
            question: "Selaput tipis di telinga yang bergetar saat gelombang bunyi mengenainya adalah...",
            options: ["Gendang telinga", "Koklea", "Tulang martil", "Saraf auditori"],
            correctIndex: 0,
            explanation: "Gendang telinga (membran timpani) bergetar meneruskan impuls ke tulang-tulang pendengaran."
          },
          {
            id: 9,
            question: "Bagian telinga dalam yang berbentuk menyerupai cangkang siput dan mengubah getaran menjadi sinyal saraf adalah...",
            options: ["Koklea (rumah siput)", "Saluran setengah lingkaran", "Daun telinga", "Tulang landasan"],
            correctIndex: 0,
            explanation: "Koklea memiliki cairan dan sel rambut halus yang mengirimkan rangsangan bunyi ke otak."
          },
          {
            id: 10,
            question: "Frekuensi bunyi yang dapat didengar secara normal oleh telinga manusia berkisar antara 20 Hz hingga 20.000 Hz, yaitu bunyi...",
            options: ["Audiosonik", "Infrasonik", "Ultrasonik", "Supersonik"],
            correctIndex: 0,
            explanation: "Bunyi audiosonik berada di batas ambang pendengaran normal manusia (20 Hz - 20.000 Hz)."
          }
        ]
      };

    case 3:
      return {
        title: "Ekosistem & Keseimbangan Lingkungan",
        conceptText: "Ekosistem adalah interaksi timbal balik antara makhluk hidup (biotik) dan lingkungannya (abiotik). Terdapat rantai makanan, jaring-jaring makanan, piramida ekologi, serta simbiosis (mutualisme, komensalisme, parasitisme). Aktivitas manusia seperti pembabatan hutan merusak keseimbangan alam.",
        questions: [
          {
            id: 1,
            question: "Interaksi timbal balik antara makhluk hidup dengan lingkungan abiotiknya dinamakan...",
            options: ["Ekosistem", "Habitat", "Populasi", "Komunitas"],
            correctIndex: 0,
            explanation: "Ekosistem mencakup semua komponen biotik (organisme) dan abiotik (tanah, air, udara, cahaya) yang saling memengaruhi."
          },
          {
            id: 2,
            question: "Makhluk hidup yang mampu membuat makanannya sendiri melalui fotosintesis dalam rantai makanan berperan sebagai...",
            options: ["Produsen", "Konsumen I", "Konsumen II", "Dekomposer"],
            correctIndex: 0,
            explanation: "Tumbuhan hijau adalah produsen karena memproduksi glukosa dari energi matahari."
          },
          {
            id: 3,
            question: "Hewan pemakan tumbuhan (herbivora) seperti belalang dan sapi dalam rantai makanan menempati tingkat...",
            options: ["Konsumen tingkat I", "Produsen puncak", "Pengurai", "Konsumen tersier"],
            correctIndex: 0,
            explanation: "Konsumen primer (tingkat I) memakan produsen secara langsung."
          },
          {
            id: 4,
            question: "Organisme seperti bakteri dan jamur yang menguraikan bangkai makhluk hidup menjadi zat hara tanah disebut...",
            options: ["Pengurai (dekomposer)", "Konsumen puncak", "Parasit murni", "Herbivora"],
            correctIndex: 0,
            explanation: "Dekomposer mendaur ulang sisa-sisa organik kembali ke dalam tanah untuk diserap produsen."
          },
          {
            id: 5,
            question: "Hubungan timbal balik antara dua makhluk hidup di mana kedua pihak sama-sama memperoleh keuntungan disebut simbiosis...",
            options: ["Mutualisme", "Komensalisme", "Parasitisme", "Netralisme"],
            correctIndex: 0,
            explanation: "Mutualisme menguntungkan kedua organisme, contohnya lebah madu dengan tanaman berbunga."
          },
          {
            id: 6,
            question: "Ikan remora yang berenang di dekat ikan hiu untuk mencari sisa makanan tanpa merugikan hiu merupakan contoh simbiosis...",
            options: ["Komensalisme", "Parasitisme", "Mutualisme", "Predasi"],
            correctIndex: 0,
            explanation: "Komensalisme menguntungkan satu pihak (ikan remora terlindung) sementara pihak lain (hiu) tidak dirugikan."
          },
          {
            id: 7,
            question: "Benalu yang hidup menempel pada pohon mangga dan menyerap air serta mineral dari inangnya adalah contoh simbiosis...",
            options: ["Parasitisme", "Mutualisme", "Komensalisme", "Saprofit"],
            correctIndex: 0,
            explanation: "Parasitisme menguntungkan parasit dan merugikan inang karena nutrisinya diserap hingga layu."
          },
          {
            id: 8,
            question: "Kumpulan dari beberapa rantai makanan yang saling terhubung dan tumpang tindih dalam suatu ekosistem disebut...",
            options: ["Jaring-jaring makanan", "Piramida makanan", "Daur biogeokimia", "Bioma"],
            correctIndex: 0,
            explanation: "Jaring-jaring makanan menggambarkan hubungan makan-memakan yang lebih kompleks di alam nyata."
          },
          {
            id: 9,
            question: "Jika populasi ular sawah diburu habis oleh manusia, maka dampak langsung yang terjadi pada ekosistem sawah adalah...",
            options: ["Populasi tikus meningkat drastis merusak padi", "Padi tumbuh semakin subur", "Populasi elang bertambah banyak", "Semua hama hilang"],
            correctIndex: 0,
            explanation: "Ular adalah pemangsa alami tikus; jika ular habis, tikus berkembang biak tanpa kendali dan merusak panen padi."
          },
          {
            id: 10,
            question: "Tindakan manusia yang dapat merusak keseimbangan ekosistem hutan hujan tropis adalah...",
            options: ["Penebangan liar (deforestasi)", "Reboisasi hutan gundul", "Pembuatan suaka margasatwa", "Penanaman pohon bakau"],
            correctIndex: 0,
            explanation: "Penebangan liar merusak habitat hewan, memicu tanah longsor, dan memusnahkan keanekaragaman hayati."
          }
        ]
      };

    case 4:
      return {
        title: "Magnet, Listrik, & Teknologi",
        conceptText: "Magnet memiliki dua kutub (utara & selatan). Kutub senama tolak-menolak, tidak senama tarik-menarik. Rangkaian listrik terbagi atas seri (sejalur) dan paralel (bercabang). Sumber energi listrik berasal dari PLTA, PLTU, dan teknologi ramah lingkungan seperti PLTS.",
        questions: [
          {
            id: 1,
            question: "Dua kutub magnet yang senama (misalnya kutub utara didekatkan kutub utara) akan saling...",
            options: ["Tolak-menolak", "Tarik-menarik", "Menempel kuat", "Tidak bergerak"],
            correctIndex: 0,
            explanation: "Hukum dasar magnet menyatakan kutub sejenis akan tolak-menolak, sedangkan kutub berlawanan akan tarik-menarik."
          },
          {
            id: 2,
            question: "Kekuatan gaya magnet terbesar terletak pada bagian...",
            options: ["Kedua ujung kutub magnet", "Bagian tengah magnet", "Bagian samping atas", "Sisi luar tipis"],
            correctIndex: 0,
            explanation: "Garis-garis medan magnet paling rapat berada di kedua ujung kutub utara dan selatan."
          },
          {
            id: 3,
            question: "Rangkaian listrik yang disusun secara berurutan dalam satu jalur tanpa cabang disebut rangkaian...",
            options: ["Seri", "Paralel", "Campuran bebas", "Terbuka"],
            correctIndex: 0,
            explanation: "Pada rangkaian seri, arus mengalir melalui satu jalur tunggal; jika satu lampu putus, semua lampu mati."
          },
          {
            id: 4,
            question: "Keuntungan utama dari penggunaan rangkaian listrik paralel di rumah tangga adalah...",
            options: ["Jika satu lampu padam, lampu di ruangan lain tetap menyala", "Kabel yang digunakan jauh lebih sedikit", "Baterai tidak pernah habis", "Arus listrik menjadi nol"],
            correctIndex: 0,
            explanation: "Rangkaian paralel memiliki cabang mandiri untuk setiap sakelar alat elektronik."
          },
          {
            id: 5,
            question: "Bahan yang sangat mudah menghantarkan arus listrik seperti tembaga dan besi disebut...",
            options: ["Konduktor listrik", "Isolator listrik", "Semikonduktor murni", "Kondensator"],
            correctIndex: 0,
            explanation: "Konduktor memiliki elektron bebas yang mempermudah aliran muatan listrik."
          },
          {
            id: 6,
            question: "Bahan seperti karet dan plastik pembungkus kabel yang tidak dapat menghantarkan listrik disebut...",
            options: ["Isolator listrik", "Konduktor listrik", "Generator", "Dinamo"],
            correctIndex: 0,
            explanation: "Isolator digunakan untuk membungkus kawat tembaga agar tidak menyengat manusia (mencegah sengatan listrik)."
          },
          {
            id: 7,
            question: "Pembangkit listrik yang memanfaatkan sinar matahari dengan panel surya fotovoltaik adalah...",
            options: ["PLTS (Pembangkit Listrik Tenaga Surya)", "PLTA", "PLTU", "PLTD"],
            correctIndex: 0,
            explanation: "PLTS ramah lingkungan karena memanfaatkan energi matahari yang berlimpah dan bersih."
          },
          {
            id: 8,
            question: "Pembangkit listrik yang menggunakan tenaga uap dari pembakaran batu bara dinamakan...",
            options: ["PLTU (Tenaga Uap)", "PLTB (Tenaga Bayu)", "PLTA (Tenaga Air)", "PLTP (Geotermal)"],
            correctIndex: 0,
            explanation: "PLTU memanaskan air menjadi uap bertekanan tinggi untuk menggerakkan turbin generator."
          },
          {
            id: 9,
            question: "Alat yang berfungsi memutus dan menghubungkan aliran arus listrik pada suatu rangkaian adalah...",
            options: ["Sakelar", "Sekring otomatis", "Bohlam lampu", "Voltmeter"],
            correctIndex: 0,
            explanation: "Sakelar ditekan untuk menutup sirkuit (aliran menyala) atau membuka sirkuit (aliran mati)."
          },
          {
            id: 10,
            question: "Contoh pemanfaatan teknologi magnet dalam dunia transportasi modern yang sangat cepat adalah...",
            options: ["Kereta Maglev (Magnetic Levitation)", "Pesawat baling-baling", "Kapal feri", "Sepeda motor listrik"],
            correctIndex: 0,
            explanation: "Kereta Maglev melayang di atas rel menggunakan gaya tolak magnet sehingga minim gesekan dan sangat kencang."
          }
        ]
      };

    case 5:
      return {
        title: "Struktur Bumi & Perubahannya",
        conceptText: "Bumi tersusun atas lapisan litosfer (kerak batuan), mantel, inti bumi, hidrosfer (lapisan air), dan atmosfer (lapisan udara pelindung). Siklus air mencakup evaporasi, kondensasi, presipitasi, dan infiltrasi. Pergerakan lempeng tektonik dapat memicu gempa bumi dan gunung meletus.",
        questions: [
          {
            id: 1,
            question: "Lapisan batuan padat terluar tempat tinggal manusia dan makhluk hidup di bumi disebut...",
            options: ["Kerak bumi (litosfer)", "Mantel bumi", "Inti luar", "Inti dalam"],
            correctIndex: 0,
            explanation: "Kerak bumi merupakan lapisan tipis paling luar tempat benua dan dasar samudera berada."
          },
          {
            id: 2,
            question: "Lapisan udara yang menyelubungi bumi dan melindungi kehidupan dari radiasi berbahaya matahari adalah...",
            options: ["Atmosfer", "Hidrosfer", "Litosfer", "Biosfer"],
            correctIndex: 0,
            explanation: "Atmosfer mengandung oksigen, nitrogen, serta lapisan ozon penyaring radiasi ultraviolet (UV)."
          },
          {
            id: 3,
            question: "Seluruh perairan di bumi yang meliputi laut, danau, sungai, dan air tanah dinamakan...",
            options: ["Hidrosfer", "Atmosfer", "Barisfer", "Kriosfer murni"],
            correctIndex: 0,
            explanation: "Hidrosfer mencakup sekitar 71% permukaan bumi yang tertutup oleh air."
          },
          {
            id: 4,
            question: "Tahapan siklus air di mana air laut menguap ke udara karena panas matahari disebut...",
            options: ["Evaporasi", "Kondensasi", "Presipitasi", "Infiltrasi"],
            correctIndex: 0,
            explanation: "Evaporasi adalah penguapan air permukaan bumi menjadi uap air di atmosfer."
          },
          {
            id: 5,
            question: "Uap air di atmosfer yang mendingin dan berubah menjadi butiran air pembentuk awan dinamakan proses...",
            options: ["Kondensasi", "Evaporasi", "Transpirasi", "Sublimasi"],
            correctIndex: 0,
            explanation: "Kondensasi (pengembunan) terjadi saat uap air naik ke ketinggian dingin membentuk awan."
          },
          {
            id: 6,
            question: "Peristiwa turunnya titik-titik air dari awan ke permukaan bumi yang sering kita sebut hujan adalah...",
            options: ["Presipitasi", "Evaporasi", "Infiltrasi", "Perkolasi"],
            correctIndex: 0,
            explanation: "Presipitasi adalah jatuhnya air (hujan, salju, atau hujan es) dari atmosfer ke bumi."
          },
          {
            id: 7,
            question: "Proses penyerapan sebagian air hujan ke dalam lapisan pori-pori tanah dinamakan...",
            options: ["Infiltrasi", "Evaporasi", "Kondensasi", "Abrasi"],
            correctIndex: 0,
            explanation: "Infiltrasi memasukkan cadangan air tawar ke dalam tanah yang diserap akar pohon."
          },
          {
            id: 8,
            question: "Getaran atau guncangan pada permukaan bumi yang disebabkan oleh pelepasan energi lempeng tektonik disebut...",
            options: ["Gempa bumi (seisme)", "Angin puting beliung", "Banjir bandang", "Erosi pantai"],
            correctIndex: 0,
            explanation: "Gempa bumi tektonik terjadi saat lempeng bumi saling bertubrukan atau bergesekan."
          },
          {
            id: 9,
            question: "Gelombang laut dahsyat yang menerjang daratan akibat gempa bumi berpusat di dasar laut dinamakan...",
            options: ["Tsunami", "Pasang surut", "Arus teluk", "Tornado"],
            correctIndex: 0,
            explanation: "Pergeseran vertikal lempeng dasar laut dapat memicu gelombang raksasa tsunami menuju pantai."
          },
          {
            id: 10,
            question: "Gunung berapi meletus mengeluarkan batuan cair pijar yang bersuhu sangat tinggi dari dalam perut bumi disebut...",
            options: ["Magma dan lava", "Abu gosok", "Minyak bumi", "Batubara cair"],
            correctIndex: 0,
            explanation: "Magma adalah batuan cair di dalam bumi; ketika keluar ke permukaan bumi disebut lava."
          }
        ]
      };

    case 6:
      return {
        title: "Warisan Budaya & Sejarah Nusantara",
        conceptText: "Sejarah Nusantara diwarnai masa kerajaan Hindu-Buddha (Kutai, Tarumanegara, Sriwijaya, Majapahit), disusul era kerajaan Islam (Samudera Pasai, Demak, Mataram). Kekayaan rempah-rempah menarik bangsa Eropa (Portugis, Spanyol, Belanda/VOC) yang kemudian menjajah Nusantara.",
        questions: [
          {
            id: 1,
            question: "Kerajaan maritim Buddha terbesar di Nusantara yang berpusat di Palembang dan menguasai Selat Malaka adalah...",
            options: ["Kerajaan Sriwijaya", "Kerajaan Tarumanegara", "Kerajaan Mataram Kuno", "Kerajaan Singasari"],
            correctIndex: 0,
            explanation: "Sriwijaya adalah kerajaan maritim berpengaruh yang menjadi pusat perdagangan dan studi agama Buddha internasional."
          },
          {
            id: 2,
            question: "Patih Kerajaan Majapahit yang terkenal dengan ikrar Sumpah Palapa untuk menyatukan Nusantara adalah...",
            options: ["Gajah Mada", "Kendedes", "Raden Wijaya", "Kertanegara"],
            correctIndex: 0,
            explanation: "Patih Gajah Mada bersumpah tidak akan menikmati istirahat mewah sebelum berhasil menyatukan pulau-pulau Nusantara."
          },
          {
            id: 3,
            question: "Masa kejayaan Kerajaan Majapahit tercapai pada masa pemerintahan raja...",
            options: ["Hayam Wuruk", "Raden Patah", "Sultan Hasanuddin", "Airlangga"],
            correctIndex: 0,
            explanation: "Raja Hayam Wuruk bersama Mahapatih Gajah Mada membawa Majapahit ke puncak keemasan peradabannya."
          },
          {
            id: 4,
            question: "Kerajaan Islam pertama yang berdiri di kepulauan Nusantara terletak di Aceh utara, yaitu...",
            options: ["Kerajaan Samudera Pasai", "Kerajaan Demak", "Kerajaan Banten", "Kerajaan Ternate"],
            correctIndex: 0,
            explanation: "Samudera Pasai berdiri pada abad ke-13 dengan raja pertamanya Sultan Malik As-Saleh."
          },
          {
            id: 5,
            question: "Kerajaan Islam pertama di Pulau Jawa yang dipimpin oleh Raden Patah adalah...",
            options: ["Kerajaan Demak", "Kerajaan Pajang", "Kerajaan Cirebon", "Kerajaan Mataram Islam"],
            correctIndex: 0,
            explanation: "Kerajaan Demak menjadi pusat penyebaran agama Islam di Jawa dengan dukungan Wali Songo."
          },
          {
            id: 6,
            question: "Komoditas asli kepulauan Maluku yang sangat diburu bangsa Eropa karena bernilai sangat mahal adalah...",
            options: ["Rempah-rempah (cengkih dan pala)", "Batu permata", "Beras ketan", "Kain katun"],
            correctIndex: 0,
            explanation: "Rempah-rempah digunakan bangsa Eropa sebagai pengawet makanan dan penghangat tubuh di musim dingin."
          },
          {
            id: 7,
            question: "Kongsi dagang Belanda yang didirikan tahun 1602 untuk memonopoli perdagangan rempah di Nusantara adalah...",
            options: ["VOC (Vereenigde Oostindische Compagnie)", "EIC Inggris", "Kompeni Portugis", "PBB"],
            correctIndex: 0,
            explanation: "VOC memonopoli perdagangan rempah-rempah dan memiliki hak istimewa (hak oktrooi) seperti mencetak mata uang sendiri."
          },
          {
            id: 8,
            question: "Sistem kerja paksa tanpa upah yang diterapkan penjajah Belanda untuk membangun Jalan Raya Pos Anyer-Panarukan disebut...",
            options: ["Kerja Rodi", "Romusha", "Tanam Paksa", "Sistem Sewa Tanah"],
            correctIndex: 0,
            explanation: "Kerja Rodi di bawah Gubernur Jenderal Daendels memaksa rakyat bekerja keras membuat jalan raya sepanjang 1.000 km."
          },
          {
            id: 9,
            question: "Kebijakan Gubernur Van den Bosch yang mewajibkan petani menanam tanaman ekspor seperti kopi dan tebu adalah...",
            options: ["Cultuurstelsel (Tanam Paksa)", "Politik Etis", "Monopoli garam", "Sistem Pajak Bumi"],
            correctIndex: 0,
            explanation: "Tanam paksa sangat menyengsarakan rakyat Indonesia karena merampas lahan dan tenaga tanpa imbalan layak."
          },
          {
            id: 10,
            question: "Sikap persatuan dan pantang menyerah para pejuang Nusantara dalam melawan penjajah patut kita...",
            options: ["Teladani dan lestarikan dalam kehidupan sehari-hari", "Lupakan karena sudah lama", "Tinggalkan demi kepentingan pribadi", "Jadikan bahan perdebatan"],
            correctIndex: 0,
            explanation: "Nilai perjuangan pahlawan mengajarkan kita rela berkorban, cinta tanah air, dan menjaga kerukunan bangsa."
          }
        ]
      };

    case 7:
      return {
        title: "Kondisi Geografis Indonesia",
        conceptText: "Indonesia terletak secara astronomis pada 6°LU–11°LS dan 95°BT–141°BT, beriklim tropis dengan 2 musim. Terletak di antara 2 benua (Asia & Australia) dan 2 samudra (Hindia & Pasifik). Terbagi dalam 3 zona waktu: WIB (UTC+7), WITA (UTC+8), dan WIT (UTC+9).",
        questions: [
          {
            id: 1,
            question: "Secara astronomis, letak wilayah kepulauan Indonesia berada di antara...",
            options: ["6° LU – 11° LS dan 95° BT – 141° BT", "10° LU – 20° LS dan 80° BT – 120° BT", "0° LU – 15° LS dan 100° BT – 130° BT", "5° LU – 5° LS dan 90° BT – 140° BT"],
            correctIndex: 0,
            explanation: "Letak astronomis ini menyebabkan Indonesia berada di wilayah khatulistiwa dengan iklim tropis sepanjang tahun."
          },
          {
            id: 2,
            question: "Indonesia diapit oleh dua benua besar di dunia, yaitu benua...",
            options: ["Asia dan Australia", "Asia dan Afrika", "Amerika dan Eropa", "Afrika dan Australia"],
            correctIndex: 0,
            explanation: "Letak di antara Benua Asia dan Benua Australia menjadikan Indonesia berada di persimpangan lalu lintas dunia."
          },
          {
            id: 3,
            question: "Dua samudra luas yang mengapit posisi geografis kepulauan Indonesia adalah Samudra...",
            options: ["Hindia dan Samudra Pasifik", "Atlantik dan Samudra Arktik", "Hindia dan Samudra Atlantik", "Pasifik dan Samudra Arktik"],
            correctIndex: 0,
            explanation: "Indonesia terletak strategis di antara Samudra Hindia di sebelah barat/selatan dan Samudra Pasifik di timur/utara."
          },
          {
            id: 4,
            question: "Karena dilintasi garis khatulistiwa, Indonesia memiliki iklim tropis dengan dua musim, yaitu musim...",
            options: ["Hujan dan musim kemarau", "Panas dan musim gugur", "Dingin dan musim semi", "Salju dan musim panas"],
            correctIndex: 0,
            explanation: "Iklim tropis mendapatkan penyinaran matahari sepanjang tahun dengan musim hujan dan kemarau."
          },
          {
            id: 5,
            question: "Pulau Sumatera, Jawa, Kalimantan Barat, dan Kalimantan Tengah termasuk dalam pembagian zona waktu...",
            options: ["WIB (Waktu Indonesia Barat)", "WITA (Waktu Indonesia Tengah)", "WIT (Waktu Indonesia Timur)", "GMT+0"],
            correctIndex: 0,
            explanation: "WIB memiliki selisih waktu 7 jam lebih cepat dari waktu Greenwich (UTC+7)."
          },
          {
            id: 6,
            question: "Provinsi Bali, Nusa Tenggara Barat, Nusa Tenggara Timur, dan Sulawesi tergolong dalam zona waktu...",
            options: ["WITA (Waktu Indonesia Tengah)", "WIB", "WIT", "UTC+6"],
            correctIndex: 0,
            explanation: "WITA memiliki selisih waktu 8 jam lebih cepat dari waktu patokan dunia (UTC+8)."
          },
          {
            id: 7,
            question: "Jika di kota Padang (WIB) menunjukkan pukul 07.00 pagi, maka di kota Jayapura (WIT) menunjukkan pukul...",
            options: ["09.00 pagi", "08.00 pagi", "06.00 pagi", "10.00 pagi"],
            correctIndex: 0,
            explanation: "WIT berselisih 2 jam lebih awal dibanding WIB (07.00 + 2 jam = 09.00)."
          },
          {
            id: 8,
            question: "Sebutan bagi Indonesia karena memiliki wilayah lautan yang sangat luas dengan ribuan pulau adalah negara...",
            options: ["Maritim dan kepulauan", "Agraris pedalaman", "Kontinental", "Gurun"],
            correctIndex: 0,
            explanation: "Dua pertiga wilayah Indonesia adalah perairan laut dengan lebih dari 17.000 pulau (negara maritim)."
          },
          {
            id: 9,
            question: "Sebutan bagi Indonesia karena sebagian besar masyarakatnya bekerja mengolah tanah pertanian adalah negara...",
            options: ["Agraris", "Maritim", "Industri berat", "Modern"],
            correctIndex: 0,
            explanation: "Tanah vulkanik yang subur membuat sektor agraris (pertanian & perkebunan) menjadi penopang pangan nasional."
          },
          {
            id: 10,
            question: "Garis khayal yang membagi bumi menjadi belahan bumi utara dan selatan serta melintasi kota Pontianak adalah garis...",
            options: ["Khatulistiwa (Ekuator)", "Bujur 0 derajat", "Balik utara", "Meridian"],
            correctIndex: 0,
            explanation: "Garis khatulistiwa tepat melintasi kota Pontianak di Kalimantan Barat pada 0 derajat lintang."
          }
        ]
      };

    case 8:
      return {
        title: "Perekonomian & Sumber Daya Alam",
        conceptText: "Sumber daya alam terbagi menjadi SDA dapat diperbarui (hutan, air, tanah, tumbuhan, hewan) dan SDA tidak dapat diperbarui (minyak bumi, batu bara, emas, tembaga). Aktivitas ekonomi memanfaatkan potensi alam melalui sektor agraris, maritim, pertambangan, dan industri secara bijak.",
        questions: [
          {
            id: 1,
            question: "Sumber daya alam yang tidak akan habis karena dapat diperbanyak atau pulih kembali secara alami tergolong SDA...",
            options: ["Dapat diperbarui", "Tidak dapat diperbarui", "Fosil terbatas", "Langka"],
            correctIndex: 0,
            explanation: "SDA dapat diperbarui seperti tumbuhan, hewan, air, dan angin memiliki siklus pembaharuan alami."
          },
          {
            id: 2,
            question: "Di bawah ini yang merupakan contoh sumber daya alam yang TIDAK dapat diperbarui adalah...",
            options: ["Minyak bumi dan batu bara", "Air dan sinar matahari", "Pohon jati dan padi", "Sapi perah dan ikan laut"],
            correctIndex: 0,
            explanation: "Minyak bumi dan batu bara berasal dari fosil jutaan tahun lalu dan jumlahnya di perut bumi sangat terbatas."
          },
          {
            id: 3,
            question: "Bahan tambang mineral logam mulia yang banyak dimanfaatkan sebagai perhiasan dan cadangan devisa negara adalah...",
            options: ["Emas dan perak", "Belerang", "Batu kapur", "Pasir kuarsa"],
            correctIndex: 0,
            explanation: "Emas dan perak adalah logam mulia bernilai tinggi yang ditambang di berbagai wilayah seperti Papua."
          },
          {
            id: 4,
            question: "Aktivitas ekonomi masyarakat di perairan laut seperti budidaya rumput laut, mutiara, dan tambak garam tergolong ekonomi...",
            options: ["Maritim (kelautan)", "Agraris pegunungan", "Kehutanan", "Otomotif"],
            correctIndex: 0,
            explanation: "Ekonomi maritim mencakup seluruh aktivitas pemanfaatan kekayaan laut dan transportasi pelayaran."
          },
          {
            id: 5,
            question: "Kegiatan membudidayakan tanaman pangan seperti padi, jagung, dan kedelai tergolong dalam bidang usaha...",
            options: ["Pertanian (agraris)", "Pertambangan", "Pariwisata murni", "Perbengkelan"],
            correctIndex: 0,
            explanation: "Sektor pertanian menghasilkan bahan makanan pokok bagi masyarakat sehari-hari."
          },
          {
            id: 6,
            question: "Usaha memelihara hewan ternak seperti sapi, kambing, dan ayam untuk diambil daging atau susunya dinamakan...",
            options: ["Peternakan", "Perkebunan", "Perikanan darat", "Perhutanan"],
            correctIndex: 0,
            explanation: "Peternakan menyediakan sumber protein hewani yang bergizi untuk konsumsi masyarakat."
          },
          {
            id: 7,
            question: "Sikap yang paling tepat dalam memanfaatkan sumber daya alam energi fosil yang tidak dapat diperbarui adalah...",
            options: ["Menggunakannya secara hemat dan bijak", "Menghabiskannya secepat mungkin", "Membuang bahan bakar tanpa guna", "Menolak energi alternatif"],
            correctIndex: 0,
            explanation: "Penghematan energi fosil dan beralih ke energi terbarukan memperpanjang ketersediaan energi bagi anak cucu."
          },
          {
            id: 8,
            question: "Kegiatan menanam kembali pohon di hutan-hutan yang telah gundul atau ditebang disebut...",
            options: ["Reboisasi", "Irigasi", "Erosi", "Transmigrasi"],
            correctIndex: 0,
            explanation: "Reboisasi memulihkan fungsi hutan sebagai penyerap air hujan dan pencegah bahaya banjir."
          },
          {
            id: 9,
            question: "Tindakan penangkapan ikan di laut yang sangat merusak terumbu karang dan habitat laut adalah menggunakan...",
            options: ["Pukat harimau dan bom ikan", "Pancing kail sederhana", "Jaring jala ramah lingkungan", "Bubu bambu tradisional"],
            correctIndex: 0,
            explanation: "Bom dan racun kimia menghancurkan ekosistem karang dan mematikan bibit-bibit ikan kecil."
          },
          {
            id: 10,
            question: "Tujuan utama pengelolaan sumber daya alam berwawasan lingkungan dan berkelanjutan adalah...",
            options: ["Menjaga kelestarian alam demi generasi masa depan", "Mengeksploitasi alam demi keuntungan sesaat", "Menjual seluruh hutan ke luar negeri", "Membiarkan alam rusak"],
            correctIndex: 0,
            explanation: "Pembangunan berkelanjutan menjamin kebutuhan generasi sekarang tanpa mengorbankan hak generasi masa depan."
          }
        ]
      };

    default:
      return {
        title: "Konsep Dasar IPAS",
        conceptText: "Ilmu Pengetahuan Alam dan Sosial (IPAS) mengeksplorasi fenomena sains, ekosistem bumi, dan perjalanan sejarah manusia.",
        questions: []
      };
  }
}
