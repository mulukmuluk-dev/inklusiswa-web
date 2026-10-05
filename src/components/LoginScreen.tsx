"use client";

import React, { useState, useEffect, useRef } from "react";
import { PintaraLogo } from "./PintaraLogo";
import { speakGlobal } from "@/lib/soundControl";
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
  const [lockoutTime, setLockoutTime] = useState(0);
  const failedAttempts = useRef(0);

  // Auto decrement lockout timer
  useEffect(() => {
    let timer: any;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Audio Companion
  const playInstructions = () => {
    if (role === "none") {
      speakGlobal("Pilih masuk sebagai Siswa atau Guru.");
    } else if (role === "siswa" && siswaStep === 1) {
      speakGlobal("Masukkan kode kelas dari gurumu.");
    } else if (role === "siswa" && siswaStep === 2) {
      speakGlobal("Masukkan empat angka PIN rahasiamu.");
    } else if (role === "siswa" && siswaStep === 3) {
      speakGlobal(`Halo ${studentProfile?.full_name}, apakah ini kamu?`);
    } else if (role === "guru") {
      speakGlobal("Silakan masuk menggunakan akun Google Anda.");
    }
  };

  // --- SISWA LOGIN LOGIC ---
  const handleRoomCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!roomCode.trim()) return;

    // We don't check room validity right now, just proceed to PIN.
    // Real check happens after PIN.
    setSiswaStep(2);
    setPinCode("");
    speakGlobal("Kode kelas diterima. Sekarang, masukkan PIN empat angkamu.");
  };

  const handlePinInput = (num: string) => {
    if (lockoutTime > 0) return;
    if (pinCode.length >= 4) return;
    
    speakGlobal(num); // Audio feedback for the number
    
    const newPin = pinCode + num;
    setPinCode(newPin);
    setErrorMsg("");

    if (newPin.length === 4) {
      verifySiswa(newPin);
    }
  };

  const handleDeletePin = () => {
    if (pinCode.length > 0) {
      setPinCode(pinCode.slice(0, -1));
    }
  };

  const verifySiswa = async (pin: string) => {
    try {
      // Find student in this room with this PIN (stored in accessibility_config)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "siswa")
        .eq("current_room_code", roomCode.toUpperCase())
        .limit(100);

      if (error) throw error;

      // Find the specific student matching the PIN
      const student = data.find((p) => p.accessibility_config?.pin_code === pin);

      if (student) {
        setStudentProfile(student);
        failedAttempts.current = 0;
        setSiswaStep(3);
        speakGlobal(`Halo ${student.full_name}, apakah ini kamu?`);
      } else {
        // Failed attempt
        failedAttempts.current += 1;
        if (failedAttempts.current >= 3) {
          setLockoutTime(30);
          setErrorMsg("Ups! Kamu salah mengetik 3 kali. Minta bantuan Gurumu atau tunggu 30 detik ya!");
          speakGlobal("Ups! Kamu salah mengetik 3 kali. Minta bantuan Gurumu atau tunggu sebentar ya!");
          setPinCode("");
          failedAttempts.current = 0; // reset after locking
        } else {
          setErrorMsg("PIN salah, coba lagi ya!");
          speakGlobal("PIN salah, coba lagi ya!");
          setPinCode("");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan sistem.");
    }
  };

  const confirmSiswaLogin = () => {
    onLoginSuccess(studentProfile);
  };

  // --- GURU LOGIN LOGIC ---
  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        }
      });
    } catch (err) {
      console.error("Error with Google Login:", err);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0D9488] bg-cover bg-center bg-no-repeat relative flex flex-col items-center justify-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "url('/images/blackboard_bg.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

      {/* Main Login Box */}
      <div className="relative z-10 bg-[#F0FDFA] rounded-[32px] shadow-[12px_12px_0px_0px_#0F172A] border-4 border-[#3C632A] p-8 md:p-12 w-full max-w-4xl flex flex-col items-center">
        
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
              } else {
                onBack();
              }
            }}
            className="w-12 h-12 bg-white rounded-full border-4 border-[#3C632A] flex items-center justify-center hover:bg-[#FFE296] transition-colors shadow-[4px_4px_0px_0px_#3C632A] focus:outline focus:outline-4 focus:outline-[#0066CC]"
            aria-label="Kembali"
          >
            <svg className="w-6 h-6 text-[#3C632A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex-1 flex justify-center">
             <div className="bg-[#FFBA48] border-4 border-[#3C632A] rounded-full px-6 py-2 shadow-[4px_4px_0px_0px_#3C632A]">
               <PintaraLogo size="sm" />
             </div>
          </div>
          
          <button 
            onClick={playInstructions}
            className="w-12 h-12 bg-[#73B14C] rounded-full border-4 border-[#3C632A] flex items-center justify-center hover:bg-[#FFBA48] transition-colors shadow-[4px_4px_0px_0px_#3C632A] group focus:outline focus:outline-4 focus:outline-[#0066CC]"
            title="Dengarkan Suara"
            aria-label="Pemandu Suara"
          >
            <svg className="w-6 h-6 text-white group-hover:text-[#3C632A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" /></svg>
          </button>
        </div>

        {/* VIEW 1: ROLE SELECTION */}
        {role === "none" && (
          <div className="w-full flex flex-col md:flex-row gap-8 justify-center animate-in fade-in zoom-in duration-300">
            {/* Card Siswa */}
            <button 
              onClick={() => setRole("siswa")}
              className="flex-1 bg-[#F59E0B] border-4 border-[#3C632A] rounded-[32px] p-8 md:p-12 shadow-[8px_8px_0px_0px_#3C632A] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#3C632A] transition-all flex flex-col items-center gap-6 group focus:outline focus:outline-4 focus:outline-white focus:outline-offset-8"
            >
              <div className="w-32 h-32 bg-white rounded-full border-4 border-[#3C632A] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-16 h-16 text-[#FF5685]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-4xl font-black text-[#3C632A]">SISWA</h2>
            </button>

            {/* Card Guru */}
            <button 
              onClick={() => setRole("guru")}
              className="flex-1 bg-white border-4 border-[#3C632A] rounded-[32px] p-8 md:p-12 shadow-[8px_8px_0px_0px_#3C632A] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#3C632A] transition-all flex flex-col items-center gap-6 group focus:outline focus:outline-4 focus:outline-white focus:outline-offset-8"
            >
              <div className="w-32 h-32 bg-[#0D9488] rounded-full border-4 border-[#3C632A] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-4xl font-black text-[#3C632A]">GURU</h2>
            </button>
          </div>
        )}

        {/* VIEW 2: GURU LOGIN */}
        {role === "guru" && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black text-[#3C632A] mb-4 text-center">Masuk Pengajar</h2>
            <p className="text-xl text-[#3C632A] font-bold mb-8 text-center">Akses kelas dan kelola progres muridmu.</p>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white border-4 border-[#3C632A] hover:bg-[#FFE296] text-[#3C632A] font-black rounded-full shadow-[6px_6px_0px_0px_#3C632A] transition-all text-xl flex items-center justify-center gap-4 focus:outline focus:outline-4 focus:outline-[#0066CC]"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>
        )}

        {/* VIEW 3: SISWA LOGIN */}
        {role === "siswa" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
            {siswaStep === 1 && (
              <form onSubmit={handleRoomCodeSubmit} className="w-full max-w-md flex flex-col items-center animate-in slide-in-from-right-8">
                <h2 className="text-3xl font-black text-[#3C632A] mb-8 text-center">Kode Kelas Kamu</h2>
                
                <input 
                  type="text" 
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Misal: SD4B"
                  className="w-full px-8 py-6 bg-white border-4 border-[#3C632A] rounded-[24px] text-center text-4xl font-black text-[#3C632A] uppercase placeholder-[#3C632A]/30 focus:outline-none focus:ring-4 focus:ring-[#73B14C] shadow-[8px_8px_0px_0px_#3C632A] mb-8"
                />
                
                <button type="submit" className="w-full py-5 bg-[#73B14C] border-4 border-[#3C632A] rounded-full text-white font-black text-2xl shadow-[6px_6px_0px_0px_#3C632A] hover:bg-[#3C632A] transition-colors focus:outline focus:outline-4 focus:outline-[#0066CC]">
                  Lanjut
                </button>
              </form>
            )}

            {siswaStep === 2 && (
              <div className="w-full max-w-lg flex flex-col items-center animate-in slide-in-from-right-8">
                <h2 className="text-3xl font-black text-[#3C632A] mb-4 text-center">PIN Rahasia</h2>
                <div className="flex gap-4 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-16 h-20 md:w-20 md:h-24 bg-white border-4 border-[#3C632A] rounded-2xl shadow-[6px_6px_0px_0px_#3C632A] flex items-center justify-center">
                      <span className="text-5xl font-black text-[#3C632A]">{pinCode[i] ? "★" : ""}</span>
                    </div>
                  ))}
                </div>

                {errorMsg && (
                  <div className="bg-[#FF5685] border-4 border-[#3C632A] px-6 py-3 rounded-full mb-6 animate-bounce">
                    <p className="text-white font-bold text-xl">{errorMsg}</p>
                  </div>
                )}

                {lockoutTime > 0 ? (
                  <div className="text-3xl font-black text-[#FF5685] animate-pulse">
                    Tunggu {lockoutTime} detik
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                      <button 
                        key={num}
                        onClick={() => handlePinInput(num)}
                        className="py-6 bg-white border-4 border-[#3C632A] rounded-2xl shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296] hover:-translate-y-1 transition-all text-4xl font-black text-[#3C632A] active:translate-y-2 active:shadow-none focus:outline focus:outline-4 focus:outline-[#0066CC]"
                      >
                        {num}
                      </button>
                    ))}
                    <div />
                    <button 
                      onClick={() => handlePinInput("0")}
                      className="py-6 bg-white border-4 border-[#3C632A] rounded-2xl shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FFE296] hover:-translate-y-1 transition-all text-4xl font-black text-[#3C632A] active:translate-y-2 active:shadow-none focus:outline focus:outline-4 focus:outline-[#0066CC]"
                    >
                      0
                    </button>
                    <button 
                      onClick={handleDeletePin}
                      className="py-6 bg-[#FF5685] border-4 border-[#3C632A] rounded-2xl shadow-[4px_4px_0px_0px_#3C632A] hover:bg-[#FF784E] hover:-translate-y-1 transition-all flex items-center justify-center active:translate-y-2 active:shadow-none focus:outline focus:outline-4 focus:outline-[#0066CC]"
                    >
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {siswaStep === 3 && studentProfile && (
              <div className="w-full flex flex-col items-center animate-in zoom-in duration-500">
                <h2 className="text-4xl font-black text-[#3C632A] mb-8 text-center">Halo, {studentProfile.full_name}!</h2>
                
                <div className="w-48 h-48 bg-white border-4 border-[#3C632A] rounded-full shadow-[8px_8px_0px_0px_#3C632A] mb-10 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${studentProfile.avatar_url || '/images/default_avatar.png'})`}}>
                  {/* Avatar Image displays here */}
                </div>

                <div className="flex gap-6 w-full max-w-md">
                  <button onClick={() => { setSiswaStep(2); setPinCode(""); }} className="flex-1 py-5 bg-white border-4 border-[#3C632A] rounded-full text-[#3C632A] font-black text-2xl shadow-[6px_6px_0px_0px_#3C632A] hover:bg-slate-100 transition-colors">
                    Bukan
                  </button>
                  <button onClick={confirmSiswaLogin} className="flex-1 py-5 bg-[#73B14C] border-4 border-[#3C632A] rounded-full text-white font-black text-2xl shadow-[6px_6px_0px_0px_#3C632A] hover:bg-[#3C632A] transition-colors">
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
