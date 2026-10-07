"use client"; // Diperbarui untuk keperluan sistem navigasi AI
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as handpose from "@tensorflow-models/handpose";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { getActiveSession } from "@/lib/authSession";
import { usePathname } from "next/navigation";

const FINGER_JOINTS: { [key: string]: number[] } = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

const SIBI_DICTIONARY = [
  "biologi", "matematika", "belajar", "dashboard", 
  "tugas", "profil", "kelas", "lanjut", "kembali", "tutup", "saya", "halo"
];

export function SignControlOverlay() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [detectedText, setDetectedText] = useState<string>("");
  const detectedTextRef = useRef<string>("");
  
  const [classifier] = useState(() => knnClassifier.create());
  const [isTrained, setIsTrained] = useState<boolean>(false);
  
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  // Pakai logika voice control untuk mengeksekusi aksi
  const { processCommand } = useVoiceControl(false);
  const requestRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdBufferRef = useRef<{name: string, frames: number}>({ name: "", frames: 0 });
  const lastDetectTimeRef = useRef<number>(0);
  const cooldownRef = useRef<number>(0);
  
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Cek apakah mode isyarat aktif
  useEffect(() => {
    const session = getActiveSession();
    if (session && (session.accessibilityConfig?.physicalControlMethod === "isyarat" || session.accessibilityConfig?.mainMode === "sensorik_tunarungu")) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [pathname]);

  // Load Model
  useEffect(() => {
    if (!shouldShow) return;

    let isMounted = true;
    const initModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await handpose.load();
        
        // Load dataset KNN dari Local Storage
        const datasetStr = localStorage.getItem("knn_dataset_v1");
        let hasDataset = false;
        if (datasetStr) {
          try {
            const datasetObj = JSON.parse(datasetStr);
            Object.keys(datasetObj).forEach((key) => {
              const dataArray = datasetObj[key];
              const tensor = tf.tensor2d(dataArray, [dataArray.length / 63, 63]);
              classifier.setClassifierDataset({ ...classifier.getClassifierDataset(), [key]: tensor });
            });
            hasDataset = true;
          } catch (e) {
            console.error("Gagal meload dataset dari localstorage", e);
          }
        }

        if (isMounted) {
          setModel(loadedModel);
          setIsTrained(hasDataset);
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.error("Gagal memuat model tangan:", err);
      }
    };
    initModel();

    return () => {
      isMounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [shouldShow, classifier]);

  const normalizeLandmarks = (landmarks: [number, number, number][]) => {
    const wrist = landmarks[0];
    return landmarks.map(point => [
      point[0] - wrist[0],
      point[1] - wrist[1],
      point[2] - wrist[2]
    ]).flat();
  };

  // Detection Loop
  const detectHands = async () => {
    const now = performance.now();
    // Throttle deteksi (15 FPS / setiap ~65ms) agar tidak membebani browser (ngadat)
    if (now - lastDetectTimeRef.current >= 65) {
      lastDetectTimeRef.current = now;

      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4 &&
        model &&
        canvasRef.current
      ) {
        const video = webcamRef.current.video;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        try {
          const hands = await model.estimateHands(video);
          const ctx = canvasRef.current.getContext("2d");
          
          if (ctx) {
            ctx.clearRect(0, 0, videoWidth, videoHeight);
            
            if (hands.length > 0 && hands[0].landmarks) {
              const hand = hands[0];
              const landmarks = hand.landmarks as [number, number, number][];

              Object.keys(FINGER_JOINTS).forEach((finger) => {
                const joints = FINGER_JOINTS[finger];
                for (let k = 0; k < joints.length - 1; k++) {
                  const pt1 = landmarks[joints[k]];
                  const pt2 = landmarks[joints[k + 1]];
                  if (pt1 && pt2) {
                    ctx.beginPath();
                    ctx.moveTo(pt1[0], pt1[1]);
                    ctx.lineTo(pt2[0], pt2[1]);
                    ctx.strokeStyle = "#00BFFF";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                  }
                }
              });

              landmarks.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
                ctx.fillStyle = "#FF0000";
                ctx.fill();
              });

              // Gesture Prediction with KNN
              let est: any = null;
              if (isTrained && classifier.getNumClasses() > 0) {
                const normalized = normalizeLandmarks(landmarks);
                const tensor = tf.tensor1d(normalized);
                const pred = await classifier.predictClass(tensor);
                
                est = { 
                  gestures: Object.keys(pred.confidences).map(key => ({ 
                    name: key, 
                    score: pred.confidences[key] * 10 
                  })).filter(g => g.score > 0) 
                };
                tensor.dispose();
              }

              if (est && est.gestures && est.gestures.length > 0) {
                  // --- CONTEXT-AWARE FILTERING ---
                  const currText = detectedTextRef.current;
                  const baseText = currText.startsWith("Mengeksekusi:") ? "" : currText;
                  const words = baseText.toLowerCase().trim().split(" ");
                  const currentWordPrefix = words[words.length - 1] || "";
                  
                  // Urutkan berdasarkan skor tertinggi
                  const sortedGestures = est.gestures.sort((a, b) => b.score - a.score);
                  let bestResult: any = sortedGestures[0];
                  
                  // Jika user sedang mengeja (sudah ada minimal 1 huruf terketik), 
                  // kita filter isyarat huruf agar HANYA huruf yang valid dengan kamus yang diterima.
                  let validGestures = sortedGestures;
                  if (currentWordPrefix.length > 0) {
                    validGestures = sortedGestures.filter(g => {
                      if (g.name.length > 1) return true; // Isyarat utuh (halo, belajar) selalu lolos
                      const potentialWord = currentWordPrefix + g.name.toLowerCase();
                      return SIBI_DICTIONARY.some(w => w.startsWith(potentialWord));
                    });
                  }
                  
                  if (validGestures.length > 0) {
                    bestResult = validGestures[0];
                  } else {
                    bestResult = null; // Tidak ada satupun isyarat yang masuk akal, hiraukan frame ini!
                  }
                  
                  const result = bestResult;

                  if (cooldownRef.current > 0) {
                    cooldownRef.current--;
                  } else if (result && result.name && result.score >= 7.5) {
                    // Anti-Jitter: Karena FPS diturunkan, cukup tahan 6 frame (~0.4 detik)
                    if (holdBufferRef.current.name === result.name) {
                      holdBufferRef.current.frames++;
                      
                      if (holdBufferRef.current.frames === 6) {
                        cooldownRef.current = 15; // Beri jeda 1 detik (15 frame) agar tidak double-trigger
                        // COMMIT GESTURE
                        setDetectedText((curr) => {
                          const baseText = curr.startsWith("Mengeksekusi:") ? "" : curr;
                          const isWord = result.name.length > 1; // Jika somehow ada yang ngasih input kata utuh
                          // Tambahkan spasi jika inputan berupa kata utuh (bukan huruf)
                          const appendStr = isWord ? ` ${result.name} ` : result.name;
                          const newText = (baseText + appendStr).replace(/\s+/g, " ").trimStart();
                          detectedTextRef.current = newText; // UPDATE REF
                            
                            // --- AUTO PREDICT SIBI ---
                            const words = newText.toLowerCase().trim().split(" ");
                            const currentWord = words[words.length - 1];
                            
                            // Cari apakah kata yang sedang dieja cocok dengan dictionary
                            if (currentWord && currentWord.length >= 3 && !isWord) {
                              const match = SIBI_DICTIONARY.find(w => w.startsWith(currentWord));
                              // Eksekusi otomatis jika sudah dieja lebih dari atau sama dengan setengah kata
                              if (match && currentWord.length >= Math.ceil(match.length / 2)) {
                                words[words.length - 1] = match;
                                const predictedText = words.join(" ");
                                
                                detectedTextRef.current = ""; // Reset ref
                                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                setDetectedText(`Mengeksekusi: ${predictedText}`);
                                processCommand(predictedText);
                                setTimeout(() => setDetectedText(""), 2500);
                                return predictedText;
                              }
                            }
                            // --------------------------

                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            
                            const pendingWord = newText.toLowerCase().trim();
                            const isStandaloneShortcut = ["saya"].includes(pendingWord);
                            const waitTime = (pendingWord.length < 3 && !isStandaloneShortcut) ? 7000 : 3000;

                            timeoutRef.current = setTimeout(() => {
                              if (pendingWord.length < 3 && !isStandaloneShortcut) {
                                // Batal eksekusi, cukup kosongkan teks setelah menunggu 7 detik
                                detectedTextRef.current = ""; // Update ref
                                setDetectedText("");
                              } else {
                                detectedTextRef.current = ""; // Update ref
                                setDetectedText(`Mengeksekusi: ${pendingWord}`);
                                processCommand(pendingWord);
                                setTimeout(() => setDetectedText(""), 2000);
                              }
                            }, waitTime);
                            
                            return newText;
                          });
                      }
                    } else {
                      // Reset buffer jika isyarat berubah
                      holdBufferRef.current = { name: result.name, frames: 1 };
                    }
                  } else {
                    holdBufferRef.current = { name: "", frames: 0 };
                  }
                } else {
                  holdBufferRef.current = { name: "", frames: 0 };
                }
              } else {
                holdBufferRef.current = { name: "", frames: 0 };
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    } // Tutup blok throttle

    requestRef.current = requestAnimationFrame(detectHands);
  };

  useEffect(() => {
    if (!isModelLoading && model) {
      requestRef.current = requestAnimationFrame(detectHands);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isModelLoading, model, isTrained]);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
      {isExpanded ? (
        <div className="bg-white/95 text-slate-900 p-3.5 rounded-[20px] shadow-2xl shadow-[#006E9C]/15 border border-slate-200 w-64 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006E9C]">
                Kamera Isyarat
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
          
          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video border border-slate-200/60 mb-3 shadow-inner">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover z-10"
              style={{ transform: "scaleX(-1)" }}
            />
            {isModelLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-2">
                <svg className="w-5 h-5 text-[#006E9C] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[10px] font-bold text-[#006E9C]">Menyiapkan AI...</span>
              </div>
            )}
            
            {(!isTrained && !isModelLoading) && (
              <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center space-y-1 p-2 text-center backdrop-blur-[2px]">
                <span className="text-xl">⚠️</span>
                <span className="text-[8px] font-bold text-white leading-tight">AI Belum Dilatih</span>
                <a href="/admin-kamera" target="_blank" className="mt-1 px-3 py-1 bg-amber-500 text-white rounded-full text-[8px] font-bold hover:bg-amber-600 transition-colors">Buka Admin</a>
              </div>
            )}
          </div>

          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200 h-[65px] flex flex-col justify-center shadow-sm relative overflow-hidden">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Terjemahan ML:</span>
            <span className="text-[#006E9C] font-black text-sm truncate">
              {detectedText || "Menunggu isyarat..."}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-3 px-5 py-3.5 bg-white text-slate-700 rounded-full text-xs font-extrabold shadow-xl shadow-[#006E9C]/10 border border-slate-200 hover:scale-105 hover:border-[#006E9C]/30 hover:text-[#006E9C] transition-all duration-300"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Buka Kamera Isyarat</span>
        </button>
      )}
    </div>
  );
}
