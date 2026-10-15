"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PintaraLogo } from "@/components/PintaraLogo";
import { speakGlobal } from "@/lib/soundControl";
import { getActiveSession, setActiveSession, UserSession } from "@/lib/authSession";
import { supabase } from "@/lib/supabaseClient";
import { LandingPage } from "@/components/LandingPage";
import { LoginScreen } from "@/components/LoginScreen";

export default function Page() {
  const router = useRouter();

  // 0. Auto Check Supabase OAuth Callback
  useEffect(() => {
    // Listen for OAuth callbacks from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Build user session from Google Data
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Siswa PINTARA";
        const email = session.user.email || "";

        const currentActive = getActiveSession();
        if (!currentActive) {
          const pendingRole = localStorage.getItem("pintara_pending_role") || "siswa";
          localStorage.removeItem("pintara_pending_role");

          const isGuru = pendingRole === "guru";
          const defaultConfig = isGuru
            ? { mainMode: "guru_normal", specificMode: null, physicalControlMethod: null }
            : { mainMode: "sensorik", specificMode: "tunanetra" };
          const newSession: UserSession = {
            id: session.user.id,
            name: name,
            emailOrNip: email,
            role: pendingRole as "siswa" | "guru",
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
            accessibilityConfig: defaultConfig,
          };

          setActiveSession(newSession);
          localStorage.setItem("pintara_a11y_config", JSON.stringify(defaultConfig));

          // Upsert profile for OAuth login
          try {
            await supabase.from("profiles").upsert(
              {
                id: session.user.id,
                email: email,
                full_name: name,
                role: pendingRole,
                nip_or_nuptk: null,
                accessibility_config: defaultConfig,
              },
              { onConflict: "id" }
            );
          } catch (e) {
            console.log("OAuth profile sync error:", e);
          }

          router.push("/dashboard");
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // State Layar Utama: 'loading' -> 'landing' -> 'welcome' -> 'auth'
  const [screenState, setScreenState] = useState<"loading" | "landing" | "welcome" | "auth">("landing");

  // State Text Animation Sync untuk Welcome Screen
  const [visibleWordIndex, setVisibleWordIndex] = useState(0);
  const [welcomeVoiceStarted, setWelcomeVoiceStarted] = useState(false);

  // 1. Loading Screen Cepat di Bawah 1 Detik (500ms) -> Ke Landing Page
  useEffect(() => {
    if (screenState === "loading") {
      const timer = setTimeout(() => {
        setScreenState("landing");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [screenState]);

  // Fungsi untuk memulai suara welcome setelah user gesture (klik/tap)
  const startWelcomeVoice = () => {
    if (welcomeVoiceStarted) return;
    setWelcomeVoiceStarted(true);

    const welcomeText =
      "Selamat datang di PINTARA, website pendidikan bagi penyandang disabilitas berbasis teknologi.";

    speakGlobal(welcomeText, () => {
      setTimeout(() => {
        setScreenState("auth");
      }, 2000);
    });
  };

  // 2. Welcome Screen: Animasi Teks Sinkron + Fallback Timer
  useEffect(() => {
    if (screenState === "welcome") {
      const interval = setInterval(() => {
        setVisibleWordIndex((prev) => {
          if (prev < 12) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 420);

      const fallbackTimer = setTimeout(() => {
        setScreenState("auth");
      }, 20000);

      return () => {
        clearInterval(interval);
        clearTimeout(fallbackTimer);
      };
    }
  }, [screenState]);

  // 3. Pastikan tidak ada suara/ucapan otomatis saat di layar login
  useEffect(() => {
    if (screenState === "auth") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [screenState]);

  // Render Layar 1: Loading Screen
  if (screenState === "loading") {
    return (
      <div className="min-h-screen bg-[#FFF9EE] relative overflow-hidden flex flex-col items-center justify-center p-4">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-amber-200/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-[28rem] h-[28rem] bg-orange-200/20 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl shadow-xl shadow-amber-900/5 border-2 border-amber-200/80 flex items-center justify-center p-3 mb-3 animate-in fade-in zoom-in duration-300">
            <PintaraLogo size="md" />
          </div>

          <div className="flex space-x-2 pt-3">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  // Render Layar 1.5: Welcome Screen (Optional Voice Experience)
  if (screenState === "welcome") {
    const welcomeWords = ["Selamat", "datang", "di", "PINTARA"];
    const subWords = ["Website", "pendidikan", "bagi", "penyandang", "disabilitas", "berbasis", "teknologi."];

    return (
      <div
        className="min-h-screen bg-[#FFF9EE] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center cursor-pointer"
        onClick={startWelcomeVoice}
      >
        <div className="absolute top-1/4 left-1/4 w-[32rem] h-[32rem] bg-amber-200/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-orange-200/20 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl flex flex-col items-center animate-in fade-in duration-500">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-xl shadow-amber-900/5 border-2 border-amber-200/80 flex items-center justify-center p-4 mb-6 transform hover:scale-105 transition-transform">
            <PintaraLogo size="xl" />
          </div>

          <h1 className="font-script text-4xl md:text-6xl lg:text-7xl font-bold text-amber-950 tracking-wide leading-tight mb-4">
            {welcomeWords.map((word, idx) => (
              <span
                key={idx}
                className={`inline-block mr-2 transition-all duration-300 ${
                  idx <= visibleWordIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="text-slate-600 text-base md:text-xl font-medium max-w-lg leading-relaxed">
            {subWords.map((word, idx) => (
              <span
                key={idx}
                className={`inline-block mr-1.5 transition-all duration-300 ${
                  idx + 4 <= visibleWordIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                {word}
              </span>
            ))}
          </p>

          {!welcomeVoiceStarted && (
            <div className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-amber-200/80 rounded-full shadow-sm animate-pulse">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-semibold text-slate-800">Ketuk layar untuk mengaktifkan suara</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              setScreenState("auth");
            }}
            className="mt-6 px-6 py-2.5 bg-white border-2 border-amber-200/80 text-slate-800 hover:text-amber-600 font-bold text-xs md:text-sm rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Masuk ke Login →</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Layar 2: Auth Screen (Login Siswa & Guru)
  if (screenState === "auth") {
    return (
      <LoginScreen
        onBack={() => setScreenState("landing")}
        onLoginSuccess={(userProfile) => {
          const config = userProfile.accessibility_config || { mainMode: "sensorik", specificMode: "tunanetra" };
          const session: UserSession = {
            id: userProfile.id,
            name: userProfile.full_name,
            emailOrNip: userProfile.email,
            role: userProfile.role,
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
            roomCode: userProfile.current_room_code,
            jenjang: userProfile.jenjang || userProfile.accessibility_config?.jenjang,
            accessibilityConfig: config,
          };
          setActiveSession(session);
          localStorage.setItem("pintara_a11y_config", JSON.stringify(config));
          if (config.mainMode === "fisik_motorik" || config.specificMode === "kesulitan_tangan" || config.physicalControlMethod === "motorik") {
            localStorage.setItem("pintara_motor_control_enabled", "true");
            localStorage.removeItem("pintara_eye_control_enabled");
            if (config.motoricConfig) {
              localStorage.setItem("pintara_motoric_config", JSON.stringify(config.motoricConfig));
            }
          } else {
            localStorage.removeItem("pintara_motor_control_enabled");
          }

          if (config.physicalControlMethod === "mata" || config.mainMode === "fisik_mata") {
            localStorage.setItem("pintara_eye_control_enabled", "true");
            localStorage.removeItem("pintara_motor_control_enabled");
          } else if (config.mainMode !== "fisik_motorik") {
            localStorage.removeItem("pintara_eye_control_enabled");
          }

          if (config.mainMode === "intelektual") {
            localStorage.setItem("pintara_intellectual_enabled", "true");
            if (config.intellectualConfig) {
              localStorage.setItem("pintara_intellectual_config", JSON.stringify(config.intellectualConfig));
            }
          } else {
            localStorage.removeItem("pintara_intellectual_enabled");
          }

          if (config.mainMode === "mental") {
            localStorage.setItem("pintara_mental_enabled", "true");
            if (config.mentalConfig) {
              localStorage.setItem("pintara_mental_config", JSON.stringify(config.mentalConfig));
            }
          } else {
            localStorage.removeItem("pintara_mental_enabled");
          }
          router.push("/dashboard");
        }}
      />
    );
  }

  // Render Layar Utama Default: Landing Page
  const handleStart = () => {
    const active = getActiveSession();
    if (active && active.isLoggedIn) {
      router.push("/dashboard");
    } else {
      setScreenState("auth");
    }
  };

  return <LandingPage onStart={handleStart} />;
}
