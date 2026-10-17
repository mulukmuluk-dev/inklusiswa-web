"use client";

import React, { useState, useEffect, useRef } from "react";
import { PintaraLogo } from "./PintaraLogo";
import { supabase } from "@/lib/supabaseClient";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [role, setRole] = useState<"none" | "siswa" | "guru">("none");
  
  // States for Siswa Login
  const [siswaStep, setSiswaStep] = useState<1 | 2 | 3>(1);
  const [roomCode, setRoomCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [guruErrorMsg, setGuruErrorMsg] = useState<string>("");
  const failedAttempts = useRef<number>(0);

  // Rate Limiting Protection (Max 5x salah, Kunci 2 Menit = 120s)
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_SECONDS = 120; // 2 menit

  // Inisialisasi status lockout dari localStorage saat komponen mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedLockout = localStorage.getItem("pintara_login_lockout_until");
      if (storedLockout) {
        const lockoutUntil = parseInt(storedLockout, 10);
        const now = Date.now();
        if (lockoutUntil > now) {
          const remainingSecs = Math.ceil((lockoutUntil - now) / 1000);
          setLockoutTime(remainingSecs);
          setErrorMsg("Akses terkunci selama 2 menit karena 5 kali salah memasukkan Kode/PIN.");
        } else {
          localStorage.removeItem("pintara_login_lockout_until");
          localStorage.setItem("pintara_login_failed_attempts", "0");
        }
      }
      const attempts = parseInt(localStorage.getItem("pintara_login_failed_attempts") || "0", 10);
      failedAttempts.current = attempts;
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Hitung mundur timer lockout otomatis per detik
  useEffect(() => {
    let timer: any;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("pintara_login_lockout_until");
            localStorage.setItem("pintara_login_failed_attempts", "0");
            failedAttempts.current = 0;
            setErrorMsg("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const recordFailedAttempt = (customMessage?: string) => {
    failedAttempts.current += 1;
    localStorage.setItem("pintara_login_failed_attempts", failedAttempts.current.toString());

    if (failedAttempts.current >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
      localStorage.setItem("pintara_login_lockout_until", lockoutUntil.toString());
      setLockoutTime(LOCKOUT_DURATION_SECONDS);
      setErrorMsg("Akun dikunci sementara selama 2 menit (5x salah). Minta bantuan Gurumu atau tunggu hingga selesai.");
      setPinCode("");
      failedAttempts.current = 0;
    } else {
      const remaining = MAX_FAILED_ATTEMPTS - failedAttempts.current;
      setErrorMsg(customMessage || `PIN salah! Sisa percobaan: ${remaining} kali.`);
      setPinCode("");
    }
  };

  // Format detik menjadi mm:ss
  const formatLockoutTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- SISWA LOGIN LOGIC ---
  const handleRoomCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;
    setErrorMsg("");
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) return;

    // Periksa apakah ada room/siswa dengan kode ini
    try {
      // Cek dari cache lokal terlebih dahulu
      const localStore = typeof window !== "undefined" ? localStorage.getItem("pintara_student_profiles") : null;
      let hasLocalStudent = false;
      if (localStore) {
        try {
          const list = JSON.parse(localStore);
          hasLocalStudent = Array.isArray(list) && list.some((s: any) => s.current_room_code?.toUpperCase() === cleanCode);
        } catch (e) {
          console.error(e);
        }
      }

      // Cek juga dari kelas database
      const kelasDbStore = typeof window !== "undefined" ? localStorage.getItem("pintara_kelas_db") : null;
      let hasClassRoom = cleanCode === "INKLU-1234";
      if (kelasDbStore) {
        try {
          const parsed = JSON.parse(kelasDbStore);
          if (parsed[cleanCode]) hasClassRoom = true;
        } catch (e) {
          console.error(e);
        }
      }

      // Jika belum ditemukan di lokal, cek Supabase
      if (!hasLocalStudent && !hasClassRoom) {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "siswa")
          .eq("current_room_code", cleanCode);

        if (error || (count !== null && count === 0)) {
          recordFailedAttempt("Kode Kelas tidak ditemukan. Pastikan kode kelas yang dimasukkan sudah benar!");
          return;
        }
      }

      setSiswaStep(2);
      setPinCode("");
    } catch (err) {
      console.error(err);
      // Fallback: biarkan lanjut ke verifikasi PIN
      setSiswaStep(2);
      setPinCode("");
    }
  };

  const handlePinInput = (num: string) => {
    if (lockoutTime > 0) return;
    if (pinCode.length >= 4) return;
    
    const newPin = pinCode + num;
    setPinCode(newPin);
    setErrorMsg("");

    if (newPin.length === 4) {
      verifySiswa(newPin);
    }
  };

  const handleDeletePin = () => {
    if (lockoutTime > 0) return;
    if (pinCode.length > 0) {
      setPinCode(pinCode.slice(0, -1));
    }
  };

  const verifySiswa = async (pin: string) => {
    if (lockoutTime > 0) return;

    try {
      const cleanRoom = roomCode.toUpperCase().trim();

      // 1. Cek dari Supabase
      let student = null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "siswa")
          .eq("current_room_code", cleanRoom)
          .limit(100);

        if (!error && Array.isArray(data)) {
          student = data.find((p) => p.accessibility_config?.pin_code === pin);
        }
      } catch (e) {
        console.warn("Supabase check failed, trying local store:", e);
      }

      // 2. Jika belum ketemu, cek local store cadangan
      if (!student && typeof window !== "undefined") {
        const rawLocal = localStorage.getItem("pintara_student_profiles");
        if (rawLocal) {
          try {
            const list = JSON.parse(rawLocal);
            if (Array.isArray(list)) {
              student = list.find(
                (s: any) =>
                  s.current_room_code?.toUpperCase() === cleanRoom &&
                  (s.pin_code === pin || s.accessibility_config?.pin_code === pin)
              );
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (student) {
        // Login berhasil! Reset percobaan gagal & lockout
        localStorage.removeItem("pintara_login_failed_attempts");
        localStorage.removeItem("pintara_login_lockout_until");
        failedAttempts.current = 0;
        setStudentProfile(student);
        setSiswaStep(3);
      } else {
        // Gagal login! Rekam percobaan salah
        recordFailedAttempt();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan sistem saat verifikasi.");
    }
  };

  const confirmSiswaLogin = () => {
    onLoginSuccess(studentProfile);
  };

  // --- GURU LOGIN LOGIC ---
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setGuruErrorMsg("");
      localStorage.setItem("pintara_pending_role", "guru");
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        setIsGoogleLoading(false);
        setGuruErrorMsg(error.message || "Gagal membuka login Google. Periksa konfigurasi OAuth.");
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setGuruErrorMsg(err?.message || "Terjadi kesalahan saat memulai login Google.");
      console.error("Error with Google Login:", err);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#FFF9EE] relative flex flex-col items-center justify-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "radial-gradient(#F5DCB0 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
    >
      {/* Main Login Box */}
      <div className={`relative z-10 bg-white rounded-[36px] shadow-xl shadow-amber-900/5 border-2 border-amber-200/80 p-8 md:p-12 w-full transition-all duration-300 flex flex-col items-center ${
        role === "none" ? "max-w-4xl" : "max-w-xl"
      }`}>
        
        {/* Header inside box */}
        <div className="w-full flex justify-between items-center mb-10">
          <button 
            onClick={() => {
              if (role === "siswa" && siswaStep > 1) {
                setSiswaStep((s) => (s - 1) as any);
                setPinCode("");
              } else if (role !== "none") {
                setRole("none");
                setRoomCode("");
                setPinCode("");
                setGuruErrorMsg("");
                setIsGoogleLoading(false);
              } else {
                onBack();
              }
            }}
            className="w-12 h-12 bg-white rounded-full border-2 border-amber-200 flex items-center justify-center hover:bg-amber-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
            aria-label="Kembali"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex-1 flex justify-center">
             <div className="bg-gradient-to-r from-[#FFC727] via-[#FFB800] to-[#FFA700] border-2 border-amber-300 rounded-full px-6 py-2 shadow-xs">
               <PintaraLogo size="sm" />
             </div>
          </div>
          
          {/* Invisible placeholder to balance flex-between */}
          <div className="w-12 h-12" />
        </div>

        {/* VIEW 1: ROLE SELECTION */}
        {role === "none" && (
          <div className="w-full flex flex-col md:flex-row gap-8 justify-center animate-in fade-in zoom-in duration-300">
            {/* Card Siswa */}
            <button 
              onClick={() => setRole("siswa")}
              className="flex-1 bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-2 border-amber-300 rounded-[32px] p-8 md:p-12 shadow-md shadow-amber-900/10 hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col items-center gap-6 group cursor-pointer"
            >
              <div className="w-28 h-28 bg-white/95 rounded-full border-2 border-amber-200/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <svg className="w-14 h-14 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">SISWA</h2>
            </button>

            {/* Card Guru */}
            <button 
              onClick={() => setRole("guru")}
              className="flex-1 bg-white hover:bg-amber-50/50 border-2 border-amber-200/80 rounded-[32px] p-8 md:p-12 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center gap-6 group cursor-pointer"
            >
              <div className="w-28 h-28 bg-amber-100/80 rounded-full border-2 border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <svg className="w-14 h-14 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">GURU</h2>
            </button>
          </div>
        )}

        {/* VIEW 2: GURU LOGIN */}
        {role === "guru" && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black text-slate-900 mb-3 text-center">Masuk Pengajar</h2>
            <p className="text-base text-slate-600 font-medium mb-6 text-center">Akses kelas dan kelola progres muridmu.</p>

            {guruErrorMsg && (
              <div className="w-full bg-rose-50 border-2 border-rose-200 px-6 py-3.5 rounded-2xl mb-6 text-center shadow-xs">
                <p className="text-rose-700 font-bold text-sm">{guruErrorMsg}</p>
              </div>
            )}
            
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className={`w-full py-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-800 font-black rounded-2xl shadow-xs hover:shadow-sm transition-all text-lg flex items-center justify-center gap-4 cursor-pointer ${
                isGoogleLoading ? "opacity-75 cursor-wait" : ""
              }`}
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Lanjutkan dengan Google</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* VIEW 3: SISWA LOGIN */}
        {role === "siswa" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
            {siswaStep === 1 && (
              <form onSubmit={handleRoomCodeSubmit} className="w-full max-w-md flex flex-col items-center animate-in slide-in-from-right-8">
                <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">Kode Kelas Kamu</h2>

                {errorMsg && (
                  <div className="w-full bg-rose-50 border-2 border-rose-200 px-6 py-3.5 rounded-2xl mb-6 text-center shadow-xs">
                    <p className="text-rose-700 font-bold text-sm md:text-base">{errorMsg}</p>
                  </div>
                )}

                {lockoutTime > 0 && (
                  <div className="w-full bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 mb-6 text-center animate-pulse shadow-xs">
                    <p className="text-rose-700 font-black text-lg">Akun Terkunci Sementara</p>
                    <p className="text-rose-600 font-bold text-sm mt-1">Terlalu banyak percobaan gagal (5x salah). Mohon tunggu:</p>
                    <div className="text-3xl font-black text-rose-700 font-mono mt-2 tracking-widest">{formatLockoutTimer(lockoutTime)}</div>
                  </div>
                )}
                
                <input 
                  type="text" 
                  required
                  disabled={lockoutTime > 0}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Misal: SD4B"
                  className={`w-full px-8 py-5 bg-amber-50/40 border-2 border-amber-200/80 rounded-2xl text-center text-3xl md:text-4xl font-black text-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 shadow-inner mb-6 ${lockoutTime > 0 ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
                />
                
                <button 
                  type="submit" 
                  disabled={lockoutTime > 0}
                  className={`w-full py-4.5 rounded-2xl text-slate-950 font-black text-xl shadow-md shadow-amber-900/10 hover:shadow-lg transition-all cursor-pointer ${lockoutTime > 0 ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60" : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600"}`}
                >
                  {lockoutTime > 0 ? `Terkunci (${formatLockoutTimer(lockoutTime)})` : "Lanjut"}
                </button>
              </form>
            )}

            {siswaStep === 2 && (
              <div className="w-full max-w-lg flex flex-col items-center animate-in slide-in-from-right-8">
                <h2 className="text-3xl font-black text-slate-900 mb-4 text-center">PIN Rahasia</h2>
                <div className="flex gap-4 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-16 h-20 md:w-20 md:h-24 bg-amber-50/50 border-2 border-amber-200 rounded-2xl shadow-xs flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-black text-slate-900">{pinCode[i] ? "•" : ""}</span>
                    </div>
                  ))}
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border-2 border-rose-200 px-6 py-3 rounded-full mb-6 text-center shadow-xs">
                    <p className="text-rose-700 font-bold text-sm md:text-base">{errorMsg}</p>
                  </div>
                )}

                {lockoutTime > 0 ? (
                  <div className="w-full bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center animate-pulse shadow-xs">
                    <p className="text-rose-700 font-black text-xl">Akses Terkunci 2 Menit</p>
                    <p className="text-rose-600 font-bold text-sm mt-1">5 kali salah PIN/Kode Kelas. Silakan tunggu hingga waktu selesai:</p>
                    <div className="text-4xl font-black text-rose-700 font-mono mt-3 tracking-widest">{formatLockoutTimer(lockoutTime)}</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                      <button 
                        key={num}
                        onClick={() => handlePinInput(num)}
                        className="py-5 md:py-6 bg-white border-2 border-amber-200/80 rounded-2xl shadow-xs hover:bg-amber-50 hover:-translate-y-0.5 transition-all text-3xl md:text-4xl font-black text-slate-900 active:translate-y-0.5 cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <div />
                    <button 
                      onClick={() => handlePinInput("0")}
                      className="py-5 md:py-6 bg-white border-2 border-amber-200/80 rounded-2xl shadow-xs hover:bg-amber-50 hover:-translate-y-0.5 transition-all text-3xl md:text-4xl font-black text-slate-900 active:translate-y-0.5 cursor-pointer"
                    >
                      0
                    </button>
                    <button 
                      onClick={handleDeletePin}
                      className="py-5 md:py-6 bg-rose-50 border-2 border-rose-200 rounded-2xl shadow-xs hover:bg-rose-100 hover:-translate-y-0.5 transition-all flex items-center justify-center active:translate-y-0.5 cursor-pointer"
                    >
                      <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {siswaStep === 3 && studentProfile && (
              <div className="w-full flex flex-col items-center animate-in zoom-in duration-500">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 text-center">Halo, {studentProfile.full_name}!</h2>
                
                <div className="w-40 h-40 bg-white border-4 border-amber-300 rounded-full shadow-lg mb-10 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${studentProfile.avatar_url || '/images/default_avatar.png'})`}}>
                  {/* Avatar Image displays here */}
                </div>

                <div className="flex gap-4 w-full max-w-md">
                  <button onClick={() => { setSiswaStep(2); setPinCode(""); }} className="flex-1 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-slate-700 font-black text-xl shadow-xs hover:bg-slate-200 transition-all cursor-pointer">
                    Bukan
                  </button>
                  <button onClick={confirmSiswaLogin} className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-2 border-amber-300 rounded-2xl text-slate-950 font-black text-xl shadow-md shadow-amber-900/10 hover:shadow-lg transition-all cursor-pointer">
                    Ya, Ini Aku!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
