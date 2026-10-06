"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as handpose from "@tensorflow-models/handpose";
import * as knnClassifier from "@tensorflow-models/knn-classifier";

// Setup titik koneksi kerangka tangan untuk digambar di layar
const FINGER_JOINTS: { [key: string]: number[] } = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

const GESTURE_CLASSES = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", 
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"
];

interface SignLanguageCameraProps {
  onClose?: () => void;
}

export function SignLanguageCamera({ onClose }: SignLanguageCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [classifier] = useState(() => knnClassifier.create());
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signLanguageMode, setSignLanguageMode] = useState<"BISINDO" | "SIBI">("BISINDO");
  
  const [detectedText, setDetectedText] = useState<string>("");
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(false);
  const [trainingLabel, setTrainingLabel] = useState<string | null>(null);
  const [trainingCounts, setTrainingCounts] = useState<{[key: string]: number}>({});
  const [isTrained, setIsTrained] = useState<boolean>(false);

  // Buffer untuk temporal smoothing
  const resultBuffer = useRef<string[]>([]);
  const MAX_BUFFER = 15; // Harus konsisten menebak hasil yang sama selama 15 frame (sekitar 0.5 detik)

  const requestRef = useRef<number | null>(null);

  // Load Model & Dataset
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await handpose.load();
        
        // Coba load dataset KNN dari Local Storage jika ada
        const datasetStr = localStorage.getItem("knn_dataset_v1");
        let hasDataset = false;
        if (datasetStr) {
          try {
            const datasetObj = JSON.parse(datasetStr);
            const numFeatures = 63; // 21 koordinat * (x,y,z)
            
            Object.keys(datasetObj).forEach((key) => {
              const dataArray = datasetObj[key];
              const tensor = tf.tensor2d(dataArray, [dataArray.length / numFeatures, numFeatures]);
              classifier.setClassifierDataset({ ...classifier.getClassifierDataset(), [key]: tensor });
            });
            hasDataset = true;
            // Update hitungan training
            const counts = classifier.getClassExampleCount();
            setTrainingCounts(counts);
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
        console.error("Gagal memuat model:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat AI Pengenalan Tangan.");
          setIsModelLoading(false);
        }
      }
    };
    initModel();
    return () => {
      isMounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [classifier]);

  // Normalisasi Koordinat Tangan agar deteksi akurat walau tangan bergeser
  const normalizeLandmarks = (landmarks: [number, number, number][]) => {
    const wrist = landmarks[0];
    return landmarks.map(point => [
      point[0] - wrist[0],
      point[1] - wrist[1],
      point[2] - wrist[2]
    ]).flat();
  };

  const saveDatasetToLocalStorage = () => {
    const dataset = classifier.getClassifierDataset();
    const datasetObj: {[key: string]: number[]} = {};
    Object.keys(dataset).forEach((key) => {
      const data = dataset[key].dataSync();
      datasetObj[key] = Array.from(data);
    });
    localStorage.setItem("knn_dataset_v1", JSON.stringify(datasetObj));
    alert("Dataset berhasil disimpan!");
    setIsTrained(true);
  };

  const clearDataset = () => {
    classifier.clearAllClasses();
    localStorage.removeItem("knn_dataset_v1");
    setTrainingCounts({});
    setIsTrained(false);
  };

  const trainGesture = (label: string) => {
    setTrainingLabel(label);
    // Berhenti merekam otomatis setelah 15 detik
    setTimeout(() => {
      setTrainingLabel(null);
      setTrainingCounts(classifier.getClassExampleCount());
    }, 15000);
  };

  // Loop Deteksi
  const detectHands = async () => {
    if (webcamRef.current?.video?.readyState === 4 && model && canvasRef.current) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      video.width = videoWidth;
      video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const hands = await model.estimateHands(video);
        const ctx = canvasRef.current.getContext("2d");
        
        if (ctx) {
          ctx.clearRect(0, 0, videoWidth, videoHeight);
          
          if (hands.length > 0 && hands[0].landmarks) {
            const landmarks = hands[0].landmarks as [number, number, number][];
            
            // 1. Gambar Skeleton
            Object.keys(FINGER_JOINTS).forEach((finger) => {
              const joints = FINGER_JOINTS[finger];
              for (let k = 0; k < joints.length - 1; k++) {
                const pt1 = landmarks[joints[k]];
                const pt2 = landmarks[joints[k + 1]];
                if (pt1 && pt2) {
                  ctx.beginPath();
                  ctx.moveTo(pt1[0], pt1[1]);
                  ctx.lineTo(pt2[0], pt2[1]);
                  ctx.strokeStyle = trainingLabel ? "#10B981" : "#00BFFF";
                  ctx.lineWidth = 4;
                  ctx.stroke();
                }
              }
            });
            landmarks.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
              ctx.fillStyle = trainingLabel ? "#047857" : "#FF0000";
              ctx.fill();
            });

            // 2. Normalisasi & Konversi Tensor
            const normalized = normalizeLandmarks(landmarks);
            const tensor = tf.tensor1d(normalized);

            // 3. Training / Rekam Data
            if (trainingLabel) {
              classifier.addExample(tensor, trainingLabel);
            } 
            // 4. Prediksi KNN (Hanya jika model sudah ada data)
            else if (classifier.getNumClasses() > 0) {
              const result = await classifier.predictClass(tensor);
              
              if (result.confidences[result.label] > 0.8) {
                // Temporal Smoothing (Buffer mayoritas frame)
                resultBuffer.current.push(result.label);
                if (resultBuffer.current.length > MAX_BUFFER) {
                  resultBuffer.current.shift(); // Hapus yang paling lama
                }
                
                // Cek apakah mayoritas frame di buffer adalah isyarat yang sama
                const counts = resultBuffer.current.reduce((acc, curr) => {
                  acc[curr] = (acc[curr] || 0) + 1;
                  return acc;
                }, {} as {[key: string]: number});
                
                const topLabel = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                
                // Jika setidaknya 70% dari frame terakhir sepakat
                if (counts[topLabel] >= MAX_BUFFER * 0.7) {
                  setDetectedText(topLabel);
                }
              }
            }
            tensor.dispose(); // Wajib bersihkan memori GPU
          } else {
            // Jika tangan tidak terdeteksi, kurangi buffer perlahan agar teks tidak langsung hilang berkedip
            if (resultBuffer.current.length > 0) {
              resultBuffer.current.shift();
            }
          }
        }
      } catch (err) {
        console.error("Kesalahan deteksi:", err);
      }
    }
    requestRef.current = requestAnimationFrame(detectHands);
  };

  useEffect(() => {
    if (!isModelLoading && cameraReady && model) {
      requestRef.current = requestAnimationFrame(detectHands);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isModelLoading, cameraReady, model, trainingLabel]); // Rerun effect if training state changes to keep loop clean

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto py-8">
      <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 my-auto">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#006E9C]/10 flex items-center justify-center text-[#006E9C]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                Mode Tunarungu <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">AI Vision V2</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Lakukan isyarat tangan di depan kamera</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTrainingMode(!isTrainingMode)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                isTrainingMode ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              ⚙️ {isTrainingMode ? "Tutup Mode Pelatihan" : "Mode Pelatihan AI"}
            </button>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Konten Utama */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Kolom Video */}
          <div className="md:col-span-3 bg-black rounded-2xl overflow-hidden relative shadow-inner aspect-video flex items-center justify-center">
            {errorMsg ? (
              <div className="text-red-400 font-bold text-sm text-center p-6 bg-red-950/40 rounded-xl border border-red-900/50">
                {errorMsg}
              </div>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={true} 
                  onUserMedia={() => setCameraReady(true)}
                  onUserMediaError={() => setErrorMsg("Akses kamera ditolak.")}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity ${trainingLabel ? 'opacity-70' : 'opacity-100'}`}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]"
                />

                {trainingLabel && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-emerald-500/90 text-white px-6 py-3 rounded-full font-bold animate-pulse border-4 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                      Merekam: {trainingLabel} ... (Gerakkan sedikit)
                    </div>
                  </div>
                )}

                {(!cameraReady || isModelLoading) && (
                  <div className="absolute inset-0 bg-slate-900/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <div className="w-10 h-10 border-4 border-t-[#00BFFF] border-r-[#00BFFF] border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                    <span className="font-bold tracking-wider">
                      {!cameraReady ? "Menghidupkan Kamera..." : "Memuat AI Core (TensorFlow.js)..."}
                    </span>
                  </div>
                )}
                
                {(!isTrained && !isTrainingMode && cameraReady && !isModelLoading) && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 text-white px-4 py-2 rounded-full font-bold text-sm text-center w-max">
                    ⚠️ Model belum dilatih! Klik "Mode Pelatihan AI".
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kolom Sidebar */}
          <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {!isTrainingMode ? (
              // TAMPILAN NORMAL (INFERENCE)
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Model Isyarat</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setSignLanguageMode("BISINDO")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      signLanguageMode === "BISINDO" 
                        ? "bg-[#006E9C] text-white shadow-md shadow-[#006E9C]/20" 
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    BISINDO
                  </button>
                  <button
                    onClick={() => setSignLanguageMode("SIBI")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      signLanguageMode === "SIBI" 
                        ? "bg-[#006E9C] text-white shadow-md shadow-[#006E9C]/20" 
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    SIBI
                  </button>
                </div>

                <div className="mt-auto">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Terjemahan ML</h3>
                  <div className="bg-white border border-slate-200 rounded-xl min-h-[120px] p-4 text-sm font-semibold flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                    {/* Efek Loading ala Wicara */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                      <div className={`h-full bg-emerald-400 transition-all duration-300 ${detectedText ? 'w-full' : 'w-0'}`}></div>
                    </div>
                    
                    {detectedText ? (
                      <div className="flex flex-col items-center animate-in slide-in-from-bottom-2">
                        <span className="text-slate-900 text-2xl font-black text-center">{detectedText}</span>
                        <span className="text-emerald-500 text-xs font-bold mt-2 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                          ✓ Validasi Stabil
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin"></div>
                        <span className="text-slate-400 text-xs">Mendeteksi dari {Object.keys(trainingCounts).length} isyarat...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // TAMPILAN PELATIHAN (TRAINING)
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm flex-1 flex flex-col">
                <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider mb-3">Rekam Dataset</h3>
                <p className="text-xs text-amber-600 mb-4 font-medium leading-relaxed">
                  Tekan tombol di bawah lalu peragakan isyarat di depan kamera (goyangkan tangan sedikit) selama 15 detik untuk melatih AI.
                </p>
                
                <div className="flex flex-col gap-2 flex-1">
                  {GESTURE_CLASSES.map(gesture => (
                    <button
                      key={gesture}
                      disabled={!!trainingLabel}
                      onClick={() => trainGesture(gesture)}
                      className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-400 disabled:opacity-50 transition-colors"
                    >
                      <span className="font-bold text-sm text-slate-700">{gesture}</span>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500">
                        {trainingCounts[gesture] || 0} sampel
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200 flex flex-col gap-2">
                  <button 
                    onClick={saveDatasetToLocalStorage}
                    className="w-full py-2 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 shadow-sm"
                  >
                    💾 Simpan Dataset
                  </button>
                  <button 
                    onClick={clearDataset}
                    className="w-full py-2 bg-red-100 text-red-600 font-bold rounded-lg text-sm hover:bg-red-200"
                  >
                    🗑️ Reset Semua Data
                  </button>
                </div>
              </div>
            )}

            {!isTrainingMode && (
              <button className="w-full py-3.5 bg-[#006E9C] hover:bg-[#005A80] text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
                <span>Kirim sebagai Teks</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
