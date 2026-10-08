"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PintaraLogo } from "@/components/PintaraLogo";
import { SoundToggleButton } from "@/components/SoundToggleButton";
import { speakGlobal, isTtsMuted } from "@/lib/soundControl";
import { getActiveSession, setActiveSession, UserSession } from "@/lib/authSession";
import { supabase } from "@/lib/supabaseClient";
import { LandingPage } from "@/components/LandingPage";
import { LoginScreen } from "@/components/LoginScreen";

// Ambient Glow Background Wrapper (Defined at top-level to prevent input remounting)
const AmbientBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-6">
    <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-100/60 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-cyan-100/50 rounded-full blur-[140px] pointer-events-none" />
    
    <div className="relative z-10 w-full flex justify-center">
      {children}
    </div>
  </div>
);

export default function Page() {
  const router = useRouter();

  // 0. Auto Check Existing Logged In Session & Supabase OAuth Callback
  useEffect(() => {
    // Check local session first for fast load
    const active = getActiveSession();
    if (active && active.isLoggedIn) {
      // Jika siswa belum ada konfigurasi aksesibilitas, paksa masuk ke wizard
      if (active.role === "siswa" && !localStorage.getItem("pintara_a11y_config")) {
        setScreenState("wizard");
        setWizardStep(1);
      } else {
        router.push("/dashboard");
      }
    }

    // Listen for OAuth callbacks from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Build user session from Google Data
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Siswa PINTARA";
        const email = session.user.email || "";
        
        // Cek apakah sudah ada session lokal, jika belum berarti dari OAuth baru
        const currentActive = getActiveSession();
        if (!currentActive) {
          const pendingRole = localStorage.getItem("pintara_pending_role") || "siswa";
          localStorage.removeItem("pintara_pending_role");
          
          const newSession: UserSession = {
            id: session.user.id,
            name: name,
            emailOrNip: email,
            role: pendingRole as "siswa" | "guru",
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
          };
          
          setActiveSession(newSession);

          // Upsert profile for OAuth login just in case trigger fails
          try {
            await supabase.from("profiles").upsert({
              id: session.user.id,
              email: email,
              full_name: name,
              role: pendingRole,
              nip_or_nuptk: null,
            }, { onConflict: "id" });
          } catch (e) {
            console.log("OAuth profile sync error:", e);
          }
          
          // Redirect to Wizard if no config exists
          if (!localStorage.getItem("pintara_a11y_config")) {
             setScreenState("wizard");
             setWizardStep(1);
          } else {
             router.push("/dashboard");
          }
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // State Layar Utama: 'loading' -> 'landing' -> 'welcome' -> 'auth' -> 'wizard'
  const [screenState, setScreenState] = useState<"loading" | "landing" | "welcome" | "auth" | "wizard">("loading");

  // State Text Animation Sync untuk Welcome Screen
  const [visibleWordIndex, setVisibleWordIndex] = useState(0);

  // State Role & Auth: 'siswa' vs 'guru'
  const [roleTab, setRoleTab] = useState<"siswa" | "guru">("siswa");
  const [isLoginView, setIsLoginView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  // State Wizard Disabilitas & Animasi Slide (Khusus Siswa)
  const [wizardStep, setWizardStep] = useState(1);
  const [stepAnimClass, setStepAnimClass] = useState("");

  const [mainMode, setMainMode] = useState<string | null>(null);
  const [specificMode, setSpecificMode] = useState<string | null>(null);
  const [physicalControlMethod, setPhysicalControlMethod] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // 1. Loading Screen Cepat di Bawah 1 Detik (500ms) -> Ke Landing Page
  useEffect(() => {
    if (screenState === "loading") {
      const timer = setTimeout(() => {
        setScreenState("landing");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [screenState]);

  // State: apakah suara welcome sudah diaktifkan oleh user gesture (klik)
  const [welcomeVoiceStarted, setWelcomeVoiceStarted] = useState(false);

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

  // 3. Auth Screen Instruction Speech
  useEffect(() => {
    if (screenState === "auth") {
      const authInstruction =
        "Silakan login pada website PINTARA terlebih dahulu. Isi nama, email, dan password atau login melalui Google.";

      speakGlobal(authInstruction);
    }
  }, [screenState]);

  // Listener Aksesibilitas Suara Langsung ke React State
  useEffect(() => {
    const handleVoiceEvent = (e: any) => {
      if (e.detail?.mainMode) setMainMode(e.detail.mainMode);
      if (e.detail?.specificMode) setSpecificMode(e.detail.specificMode);
      if (e.detail?.physicalControlMethod) setPhysicalControlMethod(e.detail.physicalControlMethod);
      if (e.detail?.screenState) setScreenState(e.detail.screenState);
      if (e.detail?.action === "next") handleWizardNext();
      if (e.detail?.action === "back") handleWizardBack();
    };

    window.addEventListener("pintara_voice_action", handleVoiceEvent);
    return () => window.removeEventListener("pintara_voice_action", handleVoiceEvent);
  });

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

  // Handle Form Submit pada Auth (Siswa vs Guru) - TERSIMPAN KE SUPABASE DATABASE
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawEmail = formData.email.trim();
    const password = formData.password.trim() || "DefaultPass123!";
    const name = formData.name.trim() || (roleTab === "guru" ? "Guru Pengajar" : "Siswa PINTARA");
    const validEmail = rawEmail.includes("@") ? rawEmail : `${rawEmail.toLowerCase()}@pintara.com`;

    // Sinkronisasi Langsung Ke Supabase Auth & Database Table public.profiles
    let supabaseUserId: string | null = null;
    try {
      if (isLoginView) {
        // LOGIN Via Supabase
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: validEmail,
          password: password,
        });
        if (loginData?.user) {
          supabaseUserId = loginData.user.id;
        }
        if (loginError) {
          console.log("Login error (will try signUp as fallback):", loginError.message);
          // Fallback: try signUp if login fails (user mungkin belum pernah register di Supabase)
          const { data: fallbackData } = await supabase.auth.signUp({
            email: validEmail,
            password: password,
            options: {
              data: { full_name: name, role: roleTab },
            },
          });
          if (fallbackData?.user) supabaseUserId = fallbackData.user.id;
        }
      } else {
        // DAFTAR (REGISTER) Via Supabase Auth & Profiles Table
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: validEmail,
          password: password,
          options: {
            data: {
              full_name: name,
              role: roleTab,
              nip_or_nuptk: roleTab === "guru" ? rawEmail : null,
            },
          },
        });

        if (signUpError) {
          console.log("SignUp error (user might exist, trying login):", signUpError.message);
          // If user already exists, try login instead
          const { data: loginFallback } = await supabase.auth.signInWithPassword({
            email: validEmail,
            password: password,
          });
          if (loginFallback?.user) supabaseUserId = loginFallback.user.id;
        } else if (data?.user) {
          supabaseUserId = data.user.id;
        }
      }
    } catch (err) {
      console.log("Supabase Auth Sync Info:", err);
    }

    let finalUserId = supabaseUserId;
    if (!finalUserId) {
      finalUserId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // Always upsert profile to Supabase profiles table (regardless of auth outcome)
    try {
      await supabase.from("profiles").upsert({
        id: finalUserId,
        email: validEmail,
        full_name: name,
        role: roleTab,
        nip_or_nuptk: roleTab === "guru" ? rawEmail : null,
      }, { onConflict: supabaseUserId ? "id" : "email" });
    } catch (profileErr) {
      console.log("Profile upsert info:", profileErr);
    }

    if (roleTab === "guru") {
      const guruSession: UserSession = {
        id: finalUserId,
        name: name,
        emailOrNip: rawEmail,
        role: "guru",
        isLoggedIn: true,
        createdAt: new Date().toISOString(),
      };
      setActiveSession(guruSession);
      router.push("/dashboard");
    } else {
      if (isLoginView) {
        const siswaSession: UserSession = {
          id: finalUserId,
          name: name,
          emailOrNip: rawEmail,
          role: "siswa",
          isLoggedIn: true,
          createdAt: new Date().toISOString(),
        };
        setActiveSession(siswaSession);
        router.push("/dashboard");
      } else {
        setScreenState("wizard");
        setWizardStep(1);
      }
    }
  };

  const getTotalSteps = () => {
    if (mainMode === "intelektual" || mainMode === "mental") return 1;
    if (mainMode === "fisik" && specificMode === "lumpuh_total") return 3;
    if (mainMode === "sensorik" && specificMode === "tunarungu") return 3;
    if (mainMode === "sensorik" || mainMode === "fisik") return 2;
    return 2;
  };

  const handleWizardNext = () => {
    if (isFinished) {
      saveConfiguration();
      return;
    }

    setStepAnimClass("animate-slide-right");

    if (wizardStep === 1) {
      if (mainMode === "intelektual" || mainMode === "mental") {
        saveConfiguration();
      } else {
        setWizardStep(2);
      }
    } else if (wizardStep === 2) {
      if (mainMode === "fisik" && specificMode === "lumpuh_total") {
        setWizardStep(3);
      } else if (mainMode === "sensorik" && specificMode === "tunarungu") {
        setWizardStep(3);
      } else {
        saveConfiguration();
      }
    } else if (wizardStep === 3) {
      saveConfiguration();
    }
  };

  const saveConfiguration = async (overrideMain?: string | null, overrideSpec?: string | null, overridePhys?: string | null) => {
    const config = {
      mainMode: overrideMain !== undefined ? overrideMain : mainMode,
      specificMode: overrideSpec !== undefined ? overrideSpec : specificMode,
      physicalControlMethod: overridePhys !== undefined ? overridePhys : physicalControlMethod,
    };
    localStorage.setItem("pintara_a11y_config", JSON.stringify(config));

    const rawEmail = formData.email.trim();
    const name = formData.name.trim() || "Siswa PINTARA";
    const validEmail = rawEmail.includes("@") ? rawEmail : `${rawEmail.toLowerCase()}@pintara.com`;

    // Sync to Supabase profiles
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from("profiles").upsert({
          id: userData.user.id,
          email: validEmail,
          full_name: name,
          role: "siswa",
          accessibility_config: config,
        });
      }
    } catch (e) {
      console.log("Supabase config sync info:", e);
    }

    // Simpan Sesi Siswa Aktif dengan mempertahankan data login (jika ada)
    const currentSession = getActiveSession();
    const finalName = currentSession?.name && currentSession.name !== "Siswa PINTARA" ? currentSession.name : name;
    const finalEmail = currentSession?.emailOrNip && currentSession.emailOrNip !== "-" ? currentSession.emailOrNip : rawEmail || "-";

    const siswaSession: UserSession = {
      id: currentSession?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      name: finalName,
      emailOrNip: finalEmail,
      role: "siswa",
      isLoggedIn: true,
      createdAt: currentSession?.createdAt || new Date().toISOString(),
      accessibilityConfig: config,
    };
    setActiveSession(siswaSession);

    setIsFinished(true);
    router.push("/dashboard");
  };

  const handleWizardBack = () => {
    setStepAnimClass("animate-slide-left");

    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    } else {
      setScreenState("auth");
    }
  };

  useEffect(() => {
    if (screenState === "wizard" && wizardStep === 1) {
      const modeInstruction =
        "Silakan pilih opsi aksesibilitas yang sesuai dengan kebutuhan Anda. Terdapat mode sensorik, mode intelektual, mode fisik atau motorik, mode mental. Silakan pilih salah satu.";

      speakGlobal(modeInstruction);
    }
  }, [screenState, wizardStep]);

  const getWizardHeading = () => {
    if (wizardStep === 1) {
      return {
        title: "Halo! Silakan pilih mode aksesibilitasmu",
        subtitle: "Pilih sesuai dengan kebutuhan Anda.",
      };
    }
    if (wizardStep === 2) {
      if (mainMode === "sensorik") {
        return {
          title: "Pilih Mode Sensorik Spesifik",
          subtitle: "Pilih opsi yang paling sesuai dengan kondisi sensorik Anda.",
        };
      }
      if (mainMode === "fisik") {
        return {
          title: "Pilih Mode Fisik Spesifik",
          subtitle: "Pilih tingkat kebutuhan aksesibilitas motorik Anda.",
        };
      }
    }
    if (wizardStep === 3) {
      return {
        title: "Ingin belajar menggunakan apa?",
        subtitle: "Sistem akan mengaktifkan opsi pengoperasian pilihan Anda.",
      };
    }
    return { title: "", subtitle: "" };
  };

  // Render Layar 1: Loading Screen
  if (screenState === "loading") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col items-center justify-center p-4">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-100/50 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-[28rem] h-[28rem] bg-blue-100/40 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center p-3 mb-3 animate-in fade-in zoom-in duration-300">
            <PintaraLogo size="md" />
          </div>

          <div className="flex space-x-1.5 pt-3">
            <span className="w-2 h-2 bg-[#0066CC] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-[#0F9DB6] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-[#41E2C9] rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  // Render Layar 1.2: Landing Page
  if (screenState === "landing") {
    return <LandingPage onStart={() => setScreenState("auth")} />;
  }

  // Render Layar 1.5: Welcome Screen
  if (screenState === "welcome") {
    const welcomeWords = ["Selamat", "datang", "di", "PINTARA"];
    const subWords = ["Website", "pendidikan", "bagi", "penyandang", "disabilitas", "berbasis", "teknologi."];

    return (
      <div
        className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center cursor-pointer"
        onClick={startWelcomeVoice}
      >
        <div className="absolute top-1/4 left-1/4 w-[32rem] h-[32rem] bg-teal-100/50 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-cyan-100/60 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl flex flex-col items-center animate-in fade-in duration-500">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl shadow-2xl shadow-teal-500/10 border border-slate-100 flex items-center justify-center p-4 mb-6 transform hover:scale-105 transition-transform">
            <PintaraLogo size="xl" />
          </div>

          <h1 className="font-script text-4xl md:text-6xl lg:text-7xl font-bold text-[#0066CC] tracking-wide leading-tight mb-4">
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

          {/* Hint: Tap untuk aktifkan suara (hilang setelah diklik) */}
          {!welcomeVoiceStarted && (
            <div className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-[#0066CC]/20 rounded-full shadow-sm animate-pulse">
              <svg className="w-5 h-5 text-[#0066CC]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-semibold text-[#0066CC]">Ketuk layar untuk mengaktifkan suara</span>
            </div>
          )}

          {/* Tombol ke Login (muncul setelah suara aktif atau langsung) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              setScreenState("auth");
            }}
            className="mt-6 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-[#0066CC] font-semibold text-xs md:text-sm rounded-full shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Masuk ke Login →</span>
          </button>
        </div>
      </div>
    );
  }



  // Render Layar 2: Auth Screen (NEW DESIGN WITH LOGINSCREEN.TSX)
  if (screenState === "auth") {
    return (
      <LoginScreen 
        onBack={() => setScreenState("landing")}
        onLoginSuccess={(userProfile) => {
          // Buat session
          const session: UserSession = {
            id: userProfile.id,
            name: userProfile.full_name,
            emailOrNip: userProfile.email,
            role: userProfile.role,
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
            accessibilityConfig: userProfile.accessibility_config
          };
          setActiveSession(session);
          
          if (userProfile.role === "siswa" && !userProfile.accessibility_config) {
             setScreenState("wizard");
             setWizardStep(1);
          } else {
             router.push("/dashboard");
          }
        }}
      />
    );
  }

  // Render Layar 3: Wizard Disabilitas Multi-step (Khusus Siswa)
  const heading = getWizardHeading();
  const totalSteps = getTotalSteps();
  const progressPercent = Math.min(100, Math.round((wizardStep / totalSteps) * 100));

  return (
    <AmbientBackground>
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Header Wizard Navigasi & Progress Bar */}
        <div className="w-full flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2.5">
            <PintaraLogo size="sm" />
          </div>

          <div className="flex-1 max-w-xs md:max-w-md mx-6">
            <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5 relative">
              <div
                className="h-full bg-[#0066CC] rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 px-3.5 py-1 rounded-full text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-300">
            Langkah {wizardStep} dari {totalSteps}
          </div>
        </div>

        {/* Card Utama Wizard */}
        <div
          onAnimationEnd={() => setStepAnimClass("")}
          className={`bg-white rounded-[2.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-200/80 p-8 md:p-12 w-full transition-all ${stepAnimClass}`}
        >
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {heading.title}
            </h2>
            <p className="text-slate-600 mt-2 text-sm font-normal">
              {heading.subtitle}
            </p>
          </div>

          {/* Opsi LANGKAH 1 */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "sensorik", title: "Mode Sensorik" },
                { id: "fisik", title: "Mode Fisik / Motorik" },
                { id: "intelektual", title: "Mode Intelektual" },
                { id: "mental", title: "Mode Mental" },
              ].map((opt) => {
                const isSelected = mainMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    data-voice-command={opt.title.toLowerCase()}
                    onClick={() => setMainMode(opt.id)}
                    className={`p-5 rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#0066CC] bg-[#E6F7F5] shadow-sm"
                        : "border-2 border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <h3 className={`font-bold text-sm md:text-base ${isSelected ? "text-[#0066CC]" : "text-slate-800"}`}>
                      {opt.title}
                    </h3>
                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center transition-transform scale-105">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Opsi LANGKAH 2: Sub-Kategori */}
          {wizardStep === 2 && mainMode === "sensorik" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "tunanetra", title: "Tunanetra" },
                { id: "tunarungu", title: "Tunarungu / Tunawicara" },
                { id: "deafblind", title: "Tunanetra + Tunarungu" },
              ].map((opt) => {
                const isSelected = specificMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    data-voice-command={opt.title.toLowerCase()}
                    onClick={() => setSpecificMode(opt.id)}
                    className={`p-5 rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#0066CC] bg-[#E6F7F5] shadow-sm"
                        : "border-2 border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <h3 className={`font-bold text-sm md:text-base ${isSelected ? "text-[#0066CC]" : "text-slate-800"}`}>
                      {opt.title}
                    </h3>
                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center transition-transform scale-105">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {wizardStep === 2 && mainMode === "fisik" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "kesulitan_tangan", title: "Kesulitan Tangan & Jari" },
                { id: "lumpuh_total", title: "Lumpuh Total" },
              ].map((opt) => {
                const isSelected = specificMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    data-voice-command={opt.title.toLowerCase()}
                    onClick={() => setSpecificMode(opt.id)}
                    className={`p-5 rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#0066CC] bg-[#E6F7F5] shadow-sm"
                        : "border-2 border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <h3 className={`font-bold text-sm md:text-base ${isSelected ? "text-[#0066CC]" : "text-slate-800"}`}>
                      {opt.title}
                    </h3>
                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center transition-transform scale-105">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Opsi LANGKAH 3: Metode Kontrol Fisik / Tambahan */}
          {wizardStep === 3 && mainMode === "fisik" && specificMode === "lumpuh_total" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "mata", title: "Mata (Eye Tracking)" },
                { id: "suara", title: "Suara (Full Voice Control)" },
              ].map((opt) => {
                const isSelected = physicalControlMethod === opt.id;
                return (
                  <div
                    key={opt.id}
                    data-voice-command={opt.title.toLowerCase()}
                    onClick={() => setPhysicalControlMethod(opt.id)}
                    className={`p-5 rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#0066CC] bg-[#E6F7F5] shadow-sm"
                        : "border-2 border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <h3 className={`font-bold text-sm md:text-base ${isSelected ? "text-[#0066CC]" : "text-slate-800"}`}>
                      {opt.title}
                    </h3>
                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center transition-transform scale-105">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Opsi LANGKAH 3: Tunarungu */}
          {wizardStep === 3 && mainMode === "sensorik" && specificMode === "tunarungu" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "standar", title: "Visual & Klik Biasa" },
                { id: "isyarat", title: "Navigasi Kamera Isyarat (SIBI)" },
              ].map((opt) => {
                const isSelected = physicalControlMethod === opt.id;
                return (
                  <div
                    key={opt.id}
                    data-voice-command={opt.title.toLowerCase()}
                    onClick={() => setPhysicalControlMethod(opt.id)}
                    className={`p-5 rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#0066CC] bg-[#E6F7F5] shadow-sm"
                        : "border-2 border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <h3 className={`font-bold text-sm md:text-base ${isSelected ? "text-[#0066CC]" : "text-slate-800"}`}>
                      {opt.title}
                    </h3>
                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center transition-transform scale-105">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="w-full flex items-center justify-between mt-6">
          {wizardStep > 1 ? (
            <button
              onClick={handleWizardBack}
              className="px-5 py-2.5 text-slate-700 hover:text-slate-800 font-semibold text-xs rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              ← Kembali
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleWizardNext}
            disabled={
              (wizardStep === 1 && !mainMode) ||
              (wizardStep === 2 && !specificMode) ||
              (wizardStep === 3 && !physicalControlMethod)
            }
            className="px-6 py-2.5 bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-40 text-white font-semibold rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-[#0066CC]/20 transition-all text-xs flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Lanjut</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating Fixed Bottom-Right Sound Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <SoundToggleButton />
      </div>
    </AmbientBackground>
  );
}
