"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Audio Earcon Synth (Web Audio API)
export function playEarcon(type: "success" | "error" | "wake") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "success") {
      // Nada D5 -> A5 (Perintah Berhasil)
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880.0, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "error") {
      // Nada lembut error (Perintah Gagal)
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(200, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "wake") {
      // Chime lembut selamat datang
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.error("Earcon play error:", e);
  }
}

// Map Fonetik & Alias Konteks Aplikasi
const PHONETIC_ALIASES: Record<string, string> = {
  "inklusi siswa": "pintara",
  "inklusi sewa": "pintara",
  "inklu siswa": "pintara",
  "inklu sewa": "pintara",
  "model sensorik": "mode sensorik",
  "model sensor": "mode sensorik",
  "model fisik": "mode fisik",
  "model intelektual": "mode intelektual",
  "model mental": "mode mental",
  "model": "mode",
  "hafis": "hafiz",
  "hafez": "hafiz",
  "habis": "hafiz",
  "tuna netra": "tunanetra",
  "tuna rungu": "tunarungu",
  "tuna wicara": "tunawicara",
  "mode sensor": "mode sensorik",
  "sensor": "mode sensorik",
  "motorik": "mode fisik",
};

export function useVoiceControl(enabled: boolean = false) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Modul suara siap.");

  const recognitionRef = useRef<any>(null);
  const isEnabledRef = useRef(enabled);
  isEnabledRef.current = enabled;

  const isSpeakingRef = useRef(false);

  // Text-to-Speech (TTS)
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    const { getActiveSession } = require("@/lib/authSession");
    const { isFullVoiceEnabled } = require("@/lib/accessibility");
    
    const isLoginPage = window.location.pathname === "/";
    const session = getActiveSession();
    const voiceEnabled = isLoginPage || (session?.isLoggedIn && isFullVoiceEnabled(session));
    
    // Check if TTS is globally muted or voice control is not enabled
    if (!voiceEnabled || localStorage.getItem("pintara_tts_muted") === "true") {
      window.speechSynthesis.cancel();
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Normalisasi & Kamus Fonetik Context Domain
  const normalizeText = (text: string): string => {
    let clean = text
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ");

    Object.entries(PHONETIC_ALIASES).forEach(([wrong, right]) => {
      if (clean.includes(wrong)) {
        clean = clean.replace(new RegExp(wrong, "g"), right);
      }
    });

    clean = clean.replace(/\b(tolong|dong|mohon|coba|silakan)\b/g, "").trim();

    return clean;
  };

  // Helper untuk mengisi Input Form secara otomatis
  const setInputValue = (inputElement: HTMLInputElement, value: string) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputElement, value);
    } else {
      inputElement.value = value;
    }
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Parser Perintah Utama
  const processCommand = useCallback(
    (rawTranscript: string) => {
      // Mencegah mikrofon memproses suara milik TTS sendiri!
      if (isSpeakingRef.current) return;

      const clean = normalizeText(rawTranscript);
      if (!clean) return;

      setTranscript(rawTranscript);
      console.log("[VoiceControl] Transkrip Asli:", rawTranscript, "-> Clean:", clean);

      // 1. Emergency Stop / Hentikan Suara & Nyalakan Suara Toggle
      if (
        clean.includes("nyalakan suara") ||
        clean.includes("hidupkan suara") ||
        clean.includes("buka suara") ||
        clean.includes("bunyikan suara")
      ) {
        localStorage.removeItem("pintara_tts_muted");
        window.dispatchEvent(new CustomEvent("pintara_tts_mute_change", { detail: { muted: false } }));
        playEarcon("success");
        setLastExecuted("Nyalakan Suara");
        setStatusMessage("Suara dinyalakan.");
        speak("Suara telah diaktifkan kembali.");
        return;
      }

      if (
        clean.includes("berhentikan suara") ||
        clean.includes("matikan suara") ||
        clean.includes("stop") ||
        clean.includes("berhenti") ||
        clean.includes("diam") ||
        clean.includes("hening")
      ) {
        localStorage.setItem("pintara_tts_muted", "true");
        window.dispatchEvent(new CustomEvent("pintara_tts_mute_change", { detail: { muted: true } }));
        window.speechSynthesis.cancel();
        playEarcon("success");
        setLastExecuted("Berhentikan Suara");
        setStatusMessage("Suara dihentikan.");
        return;
      }

      // 2. Perintah Bantuan
      if (
        clean.includes("bantuan") ||
        clean.includes("apa saja perintahnya") ||
        clean.includes("menu perintah")
      ) {
        playEarcon("success");
        setLastExecuted("Bantuan");
        speak(
          "Perintah suara aktif. Kamu bisa bilang: 'mode sensorik', 'isi nama dengan hafiz', 'masuk', 'buka biologi', 'kembali', atau 'baca'."
        );
        return;
      }

      // 3. Perintah Form Filling
      if (clean.includes("nama")) {
        const nameMatch = clean.match(/(?:isi\s+)?nama(?:\s+dengan|\s+adalah|\s+saya)?\s+(.+)/i);
        if (nameMatch && nameMatch[1]) {
          const nameValue = nameMatch[1].trim();
          const nameInput = document.querySelector(
            "input[placeholder*='Nama' i], input[name='name'], input[type='text']"
          ) as HTMLInputElement | null;

          if (nameInput) {
            setInputValue(nameInput, nameValue);
            playEarcon("success");
            setLastExecuted(`Isi Nama: ${nameValue}`);
            speak(`Nama berhasil diisi dengan ${nameValue}`);
            return;
          }
        }
      }

      if (clean.includes("email") || rawTranscript.toLowerCase().includes("@") || rawTranscript.toLowerCase().includes("gmail")) {
        const emailMatch = rawTranscript.match(/(?:isi\s+)?email(?:\s+dengan|\s+adalah)?\s+(.+)/i) || [null, rawTranscript];
        if (emailMatch && emailMatch[1]) {
          let rawPhrase = emailMatch[1].trim();

          // 1. Konversi fonetik kata "titik" & "dot" ke "." dan "at" ke "@"
          let emailValue = rawPhrase
            .toLowerCase()
            .replace(/\s*(?:titik|dot|dats)\s*/gi, ".")
            .replace(/\s*(?:at|et)\s*/gi, "@")
            .replace(/\s*(?:gmail|jamail)\s*(?:com|dot\s*com|titik\s*com)?/gi, "gmail.com");

          // Hapus spasi di sekitar @ dan .
          emailValue = emailValue.replace(/\s*@\s*/g, "@").replace(/\s*\.\s*/g, ".");

          // 2. Jika pengucapan memiliki spasi seperti "hafiz almuluk @ gmail.com"
          if (emailValue.includes("@")) {
            const parts = emailValue.split("@");
            let userPart = parts[0].trim();
            let domainPart = parts[1].trim();

            if (!userPart.includes(".")) {
              const words = userPart.split(/\s+/).filter((w) => w.length > 0 && !["isi", "email", "dengan", "adalah"].includes(w));
              if (words.length > 1) {
                userPart = words.join(".");
              } else {
                userPart = words.join("");
              }
            } else {
              userPart = userPart.replace(/\s+/g, "");
            }

            if (!domainPart.includes(".")) {
              domainPart = domainPart.replace(/gmail$/, "gmail.com");
              if (!domainPart.includes(".")) domainPart += ".com";
            }
            emailValue = `${userPart}@${domainPart}`;
          } else {
            let userPart = emailValue.replace(/\s+/g, " ");
            if (!userPart.includes(".")) {
              const words = userPart.split(/\s+/).filter((w) => w.length > 0 && !["isi", "email", "dengan", "adalah"].includes(w));
              if (words.length > 1) {
                userPart = words.join(".");
              } else {
                userPart = words.join("");
              }
            } else {
              userPart = userPart.replace(/\s+/g, "");
            }
            emailValue = `${userPart}@gmail.com`;
          }

          const emailInput = document.querySelector(
            "input[type='email'], input[placeholder*='Email' i]"
          ) as HTMLInputElement | null;

          if (emailInput) {
            setInputValue(emailInput, emailValue);
            playEarcon("success");
            setLastExecuted(`Isi Email: ${emailValue}`);
            speak(`Email berhasil diisi dengan ${emailValue}`);
            return;
          }
        }
      }

      if (clean.includes("password") || clean.includes("kata sandi")) {
        const passMatch = clean.match(/(?:isi\s+)?(?:password|kata sandi)(?:\s+dengan|\s+adalah)?\s+(.+)/i);
        if (passMatch && passMatch[1]) {
          const passValue = passMatch[1].trim();
          const passInput = document.querySelector(
            "input[type='password']"
          ) as HTMLInputElement | null;

          if (passInput) {
            setInputValue(passInput, passValue);
            playEarcon("success");
            setLastExecuted("Isi Password");
            speak("Password berhasil diisi.");
            return;
          }
        }
      }

      // 4A. Sub-Mode Spesifik (Step 2 - Prioritas Tinggi)
      if (clean.includes("deafblind") || clean.includes("tunanetra tunarungu")) {
        playEarcon("success");
        setLastExecuted("Pilih Sub-mode Deafblind");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { specificMode: "deafblind" } }));
        speak("Sub-mode Tunanetra dan Tunarungu dipilih.");
        return;
      }

      if (clean.includes("tunarungu") || clean.includes("tunawicara")) {
        playEarcon("success");
        setLastExecuted("Pilih Sub-mode Tunarungu");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { specificMode: "tunarungu" } }));
        speak("Sub-mode Tunarungu dan Tunawicara dipilih.");
        return;
      }

      if (clean.includes("tunanetra") || clean.includes("tuna netra")) {
        playEarcon("success");
        setLastExecuted("Pilih Sub-mode Tunanetra");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { specificMode: "tunanetra" } }));
        speak("Sub-mode Tunanetra dipilih.");
        return;
      }

      if (clean.includes("lumpuh total") || clean.includes("lumpuh")) {
        playEarcon("success");
        setLastExecuted("Pilih Sub-mode Lumpuh Total");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { specificMode: "lumpuh_total" } }));
        speak("Sub-mode Lumpuh Total dipilih.");
        return;
      }

      if (clean.includes("kesulitan tangan") || clean.includes("tangan")) {
        playEarcon("success");
        setLastExecuted("Pilih Sub-mode Kesulitan Tangan");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { specificMode: "kesulitan_tangan" } }));
        speak("Sub-mode Kesulitan Tangan dan Jari dipilih.");
        return;
      }

      // 4B. Opsi Pengoperasian (Step 3)
      if (clean.includes("eye tracking") || clean.includes("mata")) {
        playEarcon("success");
        setLastExecuted("Pilih Pengoperasian Mata");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { physicalControlMethod: "mata" } }));
        speak("Pengoperasian Mata dipilih.");
        return;
      }

      if (clean.includes("voice control") || clean.includes("suara")) {
        playEarcon("success");
        setLastExecuted("Pilih Pengoperasian Suara");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { physicalControlMethod: "suara" } }));
        speak("Pengoperasian Suara dipilih.");
        return;
      }

      // 4C. Mode Utama (Step 1)
      if (clean.includes("mode sensorik") || clean.includes("sensorik")) {
        playEarcon("success");
        setLastExecuted("Pilih Mode Sensorik");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { mainMode: "sensorik" } }));
        speak("Mode Sensorik dipilih.");
        return;
      }

      if (clean.includes("mode fisik") || clean.includes("fisik") || clean.includes("motorik")) {
        playEarcon("success");
        setLastExecuted("Pilih Mode Fisik");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { mainMode: "fisik" } }));
        speak("Mode Fisik dipilih.");
        return;
      }

      if (clean.includes("mode intelektual") || clean.includes("intelektual")) {
        playEarcon("success");
        setLastExecuted("Pilih Mode Intelektual");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { mainMode: "intelektual" } }));
        speak("Mode Intelektual dipilih.");
        return;
      }

      if (clean.includes("mode mental") || clean.includes("mental")) {
        playEarcon("success");
        setLastExecuted("Pilih Mode Mental");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { mainMode: "mental" } }));
        speak("Mode Mental dipilih.");
        return;
      }

      if (clean.includes("lanjut") || clean.includes("berikutnya") || clean.includes("selanjutnya")) {
        playEarcon("success");
        setLastExecuted("Klik Lanjut");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { action: "next" } }));
        speak("Melanjutkan langkah berikutnya.");
        return;
      }

      if (clean.includes("masuk") || clean.includes("login") || clean.includes("daftar")) {
        playEarcon("success");
        setLastExecuted("Submit Form");
        window.dispatchEvent(new CustomEvent("pintara_voice_action", { detail: { screenState: "wizard" } }));
        const submitBtn = document.querySelector("button[type='submit']") as HTMLElement | null;
        if (submitBtn) submitBtn.click();
        speak("Mengirim data.");
        return;
      }

      // 5. Perintah Navigasi Mata Pelajaran
      const mapelList: Record<string, string> = {
        matematika: "matematika",
        indonesia: "indonesia",
        inggris: "inggris",
        biologi: "biologi",
        kimia: "kimia",
        fisika: "fisika",
        ekonomi: "ekonomi",
        sosiologi: "sosiologi",
        geografi: "geografi",
        sejarah: "sejarah",
        pkn: "pkn",
        "cerdas memilih": "cerdas-memilih",
      };

      for (const [keyName, routeId] of Object.entries(mapelList)) {
        if (clean.includes(keyName)) {
          playEarcon("success");
          setLastExecuted(`Buka ${keyName}`);
          speak(`Membuka materi ${keyName}`, () => {
            router.push(`/materi/${routeId}`);
          });
          return;
        }
      }

      // 6. Perintah Screen Reader ("baca")
      if (clean.includes("baca") || clean.includes("bacakan")) {
        playEarcon("success");
        setLastExecuted("Baca Halaman");
        const mainTitle = (document.querySelector("h1, h2") as HTMLElement)?.innerText || "";
        const articleText = Array.from(document.querySelectorAll("p, article"))
          .map((el) => (el as HTMLElement).innerText)
          .filter((t) => t.length > 5)
          .join(". ");

        const textToRead = `${mainTitle}. ${articleText}` || "Tidak ada konten teks yang dibaca.";
        speak(textToRead);
        return;
      }

      // 7. Perintah Navigasi Kembali / Dashboard
      if (clean.includes("kembali") || clean.includes("mundur")) {
        playEarcon("success");
        setLastExecuted("Kembali");
        speak("Kembali ke halaman sebelumnya.", () => router.back());
        return;
      }

      if (clean.includes("dashboard") || clean.includes("beranda") || clean.includes("halaman utama")) {
        playEarcon("success");
        setLastExecuted("Navigasi Beranda");
        speak("Membuka halaman beranda.", () => router.push("/dashboard"));
        return;
      }

      // X. Intercept Akses Guru (Tolak untuk Siswa)
      if (clean.includes("akses guru") || clean.includes("buka akses guru")) {
        const rawSession = localStorage.getItem("pintara_active_session");
        const session = rawSession ? JSON.parse(rawSession) : null;
        
        if (!session || session.role !== "guru") {
          playEarcon("success");
          setLastExecuted("Akses Guru Ditolak");
          speak("Anda tidak memiliki akses ini, silakan kembali belajar.");
          return;
        }
      }

      // 8. Dynamic Button Click Fallback
      const allButtons = Array.from(document.querySelectorAll("button, a, [role='button']"));
      for (const btn of allButtons) {
        const voiceAttr = btn.getAttribute("data-voice-command") || "";
        const ariaLabel = btn.getAttribute("aria-label") || "";
        const textContent = (btn as HTMLElement).innerText || "";
        const candidate = normalizeText(`${voiceAttr} ${ariaLabel} ${textContent}`);

        if (candidate && candidate.length > 2 && (clean.includes(candidate) || candidate.includes(clean))) {
          playEarcon("success");
          setLastExecuted(`Klik ${textContent || candidate}`);
          speak(`Menekan ${textContent || candidate}`, () => {
            (btn as HTMLElement).focus();
            (btn as HTMLElement).click();
          });
          return;
        }
      }

      // 9. Perintah Tidak Dikenali (Hanya update status tanpa bunyi berisik)
      setLastExecuted(null);
      setStatusMessage(`Mendengarkan: "${rawTranscript}"`);
    },
    [router, speak]
  );

  // Inisialisasi Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatusMessage("Browser Anda tidak mendukung Web Speech API.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "id-ID";

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage("Mikrofon aktif.");
    };

    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current) return; // ABAIKAN UCAPAN SAAT TTS BERBICARA!
      const lastResultIndex = event.results.length - 1;
      const rawText = event.results[lastResultIndex][0].transcript;
      processCommand(rawText);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setStatusMessage("Mendengarkan...");
      } else if (event.error === "not-allowed") {
        setStatusMessage("Izin mikrofon ditolak.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isEnabledRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    if (enabled) {
      try {
        recognition.start();
        playEarcon("wake");
      } catch (e) {}
    }

    return () => {
      isEnabledRef.current = false;
      try {
        recognition.stop();
      } catch (e) {}
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [enabled, processCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      isEnabledRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      speak("Kontrol suara dinonaktifkan.");
    } else {
      isEnabledRef.current = true;
      try {
        recognitionRef.current.start();
        playEarcon("wake");
        speak("Kontrol suara diaktifkan.");
      } catch (e) {}
    }
  };

  return {
    isListening,
    transcript,
    lastExecuted,
    isSpeaking,
    isSupported,
    statusMessage,
    toggleListening,
    speak,
    processCommand,
  };
}
