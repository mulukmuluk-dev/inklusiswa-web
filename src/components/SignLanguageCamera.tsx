"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";
import { signGestures } from "@/lib/gestures";

// Setup titik koneksi kerangka tangan
const FINGER_JOINTS: { [key: string]: number[] } = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

interface SignLanguageCameraProps {
  onClose?: () => void;
}

export function SignLanguageCamera({ onClose }: SignLanguageCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signLanguageMode, setSignLanguageMode] = useState<"BISINDO" | "SIBI">("BISINDO");
  const [detectedText, setDetectedText] = useState<string>("");
  const [gestureSequence, setGestureSequence] = useState<string[]>([]);
  const GE = useRef(new fp.GestureEstimator(signGestures));

  const requestRef = useRef<number | null>(null);

  // 1. Inisialisasi Model HandPose TensorFlow.js
  useEffect(() => {
    let isMounted = true;
    
    const initModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await handpose.load();
        
        if (isMounted) {
          setModel(loadedModel);
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.error("Gagal memuat model tangan:", err);
        if (isMounted) {
          setErrorMsg("Gagal memuat AI Pengenalan Tangan.");
          setIsModelLoading(false);
        }
      }
    };

    initModel();

    return () => {
      isMounted = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // 2. Deteksi Loop Frame-by-Frame
  const detectHands = async () => {
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

      // Sesuaikan ukuran canvas dengan rasio video
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const hands = await model.estimateHands(video);
        
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, videoWidth, videoHeight);
          
          // Gambar setiap tangan yang terdeteksi
          hands.forEach((hand) => {
            if (hand.landmarks) {
              const landmarks = hand.landmarks;

              // Gambar Garis Sambungan (Tulang)
              Object.keys(FINGER_JOINTS).forEach((finger) => {
                const joints = FINGER_JOINTS[finger];
                for (let k = 0; k < joints.length - 1; k++) {
                  const firstJointIndex = joints[k];
                  const secondJointIndex = joints[k + 1];

                  const pt1 = landmarks[firstJointIndex];
                  const pt2 = landmarks[secondJointIndex];

                  if (pt1 && pt2) {
                    ctx.beginPath();
                    ctx.moveTo(pt1[0], pt1[1]);
                    ctx.lineTo(pt2[0], pt2[1]);
                    ctx.strokeStyle = "#00BFFF";
                    ctx.lineWidth = 4;
                    ctx.stroke();
                  }
                }
              });

              // Gambar Titik (Sendi)
              landmarks.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
                ctx.fillStyle = "#FF0000";
                ctx.fill();
              });
              
              // Prediksi Gesture
              const est = GE.current.estimate(landmarks as any, 8.5); // score lebih tinggi agar lebih akurat
              if (est && est.gestures && est.gestures.length > 0) {
                // Cari gesture dengan confidence tertinggi
                const result = est.gestures.reduce((p, c) => {
                  return (p.score > c.score) ? p : c;
                });
                
                // Konversi urutan kata
                if (result.name && result.score > 8.5) {
                  setGestureSequence((prev) => {
                    const last = prev[prev.length - 1];
                    if (last !== result.name) {
                      const newSeq = [...prev, result.name];
                      if (newSeq.length > 3) newSeq.shift();
                      
                      // Pattern Matching Khusus untuk Demostrasi
                      if (newSeq.join(" ") === "Saya Biologi") {
                        setDetectedText("Saya mau belajar Biologi");
                      } else if (newSeq.join(" ") === "Saya Matematika") {
                        setDetectedText("Saya mau belajar Matematika");
                      } else {
                        setDetectedText(result.name);
                      }
                      
                      return newSeq;
                    }
                    return prev;
                  });
                }
              }
            }
          });
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
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isModelLoading, cameraReady, model]);

  const handleUserMedia = () => {
    setCameraReady(true);
  };

  const handleUserMediaError = () => {
    setErrorMsg("Akses kamera ditolak atau tidak ditemukan kamera.");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#006E9C]/10 flex items-center justify-center text-[#006E9C]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Mode Tunarungu (Input Isyarat)</h2>
              <p className="text-xs text-slate-500 font-medium">Lakukan isyarat tangan di depan kamera</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
              title="Tutup Kamera"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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
                  mirrored={true} // Mirrored agar gerakan tangan terasa alami bagi pengguna
                  onUserMedia={handleUserMedia}
                  onUserMediaError={handleUserMediaError}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Canvas transparan untuk menggambar garis (skeleton) */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]"
                />

                {(!cameraReady || isModelLoading) && (
                  <div className="absolute inset-0 bg-slate-900/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <div className="w-10 h-10 border-4 border-t-[#00BFFF] border-r-[#00BFFF] border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                    <span className="font-bold tracking-wider">
                      {!cameraReady ? "Menghidupkan Kamera..." : "Memuat AI Bahasa Isyarat (MediaPipe)..."}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kolom Sidebar Kontrol & Output */}
          <div className="flex flex-col space-y-4">
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
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Terjemahan Langsung</h3>
                <div className="bg-white border border-slate-200 rounded-xl min-h-[100px] p-3 text-sm font-semibold text-slate-700">
                  {detectedText ? (
                    <span className="text-slate-900 text-lg font-bold">{detectedText}</span>
                  ) : (
                    <span className="animate-pulse text-slate-300">Menunggu gerakan isyarat...</span>
                  )}
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Kirim sebagai Teks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
