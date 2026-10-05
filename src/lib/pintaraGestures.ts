import * as fp from "fingerpose";

/**
 * ALFABET SIBI / ASL LENGKAP (A-Z) & 50+ KOSAKATA PINTASAN
 */

const C = fp.FingerCurl.FullCurl;
const H = fp.FingerCurl.HalfCurl;
const N = fp.FingerCurl.NoCurl;

const createGesture = (name: string, curls: (number | undefined)[], directions?: (number[] | undefined)[]) => {
  const g = new fp.GestureDescription(name);
  const fingers = [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky];
  for (let i = 0; i < 5; i++) {
    if (curls[i] !== undefined) {
      g.addCurl(fingers[i], curls[i] as number, 1.0);
      if (curls[i] === C) g.addCurl(fingers[i], H, 0.9);
      if (curls[i] === H) g.addCurl(fingers[i], C, 0.9);
      if (curls[i] === N) g.addCurl(fingers[i], H, 0.5);
    }

    if (directions && directions[i] !== undefined) {
      const dirs = directions[i] as number[];
      for (const d of dirs) {
        g.addDirection(fingers[i], d, 1.0);
      }
    }
  }
  return g;
};

const VD = fp.FingerDirection.VerticalDown;
const VU = fp.FingerDirection.VerticalUp;
const HL = fp.FingerDirection.HorizontalLeft;
const HR = fp.FingerDirection.HorizontalRight;
const DUL = fp.FingerDirection.DiagonalUpLeft;
const DUR = fp.FingerDirection.DiagonalUpRight;
const DDL = fp.FingerDirection.DiagonalDownLeft;
const DDR = fp.FingerDirection.DiagonalDownRight;

// --- ALFABET SIBI / ASL (A-Z) ---
export const AlphabetGestures = [
  // A: Jempol bebas (di samping), jari lain mengepal ke bawah
  createGesture("A", [N, C, C, C, C], [[VU, HL, HR, DUL, DUR], undefined, undefined, undefined, undefined]),
  createGesture("B", [C, N, N, N, N], [undefined, [VU, DUL, DUR], [VU, DUL, DUR], [VU, DUL, DUR], [VU, DUL, DUR]]),
  createGesture("C", [H, H, H, H, H], [[VU, DUL, DUR], undefined, undefined, undefined, undefined]),
  createGesture("D", [H, N, H, H, H], [undefined, [VU, DUL, DUR], undefined, undefined, undefined]),
  
  // E: Jempol di bawah jari lain (menunjuk ke samping/bawah), semua jari melengkung (kepalan rapat FullCurl atau HalfCurl)
  createGesture("E", [C, C, C, C, C], [[VD, DDL, DDR, HL, HR], undefined, undefined, undefined, undefined]),
  createGesture("E", [H, H, H, H, H], [[VD, DDL, DDR, HL, HR], undefined, undefined, undefined, undefined]),
  
  createGesture("F", [H, H, N, N, N], [undefined, undefined, [VU, DUL, DUR], [VU, DUL, DUR], [VU, DUL, DUR]]),
  createGesture("G", [N, N, C, C, C], [[VU, DUL, DUR, HL, HR], [HL, HR, DDL, DDR], undefined, undefined, undefined]),
  createGesture("H", [C, N, N, C, C], [undefined, [HL, HR, DDL, DDR], [HL, HR, DDL, DDR], undefined, undefined]),
  
  // I: Kelingking terbuka lurus ke atas
  createGesture("I", [C, C, C, C, N], [undefined, undefined, undefined, undefined, [VU, DUL, DUR]]),
  // J: Kelingking terbuka tapi miring
  createGesture("J", [C, C, C, C, N], [undefined, undefined, undefined, undefined, [HL, HR, DDL, DDR, DUL, DUR]]),
  
  createGesture("K", [N, N, N, C, C], [[VU, DUL, DUR, HL, HR], [VU, DUL, DUR], [VU, DUL, DUR, HL, HR], undefined, undefined]),
  createGesture("L", [N, N, C, C, C], [[HL, HR, DUL, DUR], [VU, DUL, DUR], undefined, undefined, undefined]),
  createGesture("L", [N, N, H, H, H], [[HL, HR, DUL, DUR], [VU, DUL, DUR], undefined, undefined, undefined]),
  
  // M: Jempol di bawah 3 jari (Telunjuk, Tengah, Manis)
  createGesture("M", [C, H, H, H, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("M", [H, H, H, H, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("M", [N, H, H, H, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("M", [N, H, H, H, H], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("M", [N, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("M", [C, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  
  // N: Jempol di bawah 2 jari (Telunjuk, Tengah)
  createGesture("N", [C, H, H, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("N", [H, H, H, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("N", [N, H, H, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("N", [N, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("N", [C, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),

  // O: Membentuk lingkaran ke samping/depan. Jempol ke atas/serong atas.
  createGesture("O", [H, H, H, H, H], [[VU, DUL, DUR], undefined, undefined, undefined, undefined]),
  createGesture("O", [N, H, H, H, H], [[VU, DUL, DUR], undefined, undefined, undefined, undefined]),

  // P: Telunjuk ke samping, Tengah ke bawah.
  createGesture("P", [H, N, N, C, C], [undefined, [HL, HR, DDL, DDR], [VD, DDL, DDR, HL, HR], undefined, undefined]),
  createGesture("P", [N, N, H, C, C], [undefined, [HL, HR, DDL, DDR], [VD, DDL, DDR, HL, HR], undefined, undefined]),
  
  // Q: Telunjuk & Jempol ke bawah.
  createGesture("Q", [N, N, C, C, C], [[VD, DDL, DDR], [VD, DDL, DDR], undefined, undefined, undefined]),
  createGesture("Q", [H, H, C, C, C], [[VD, DDL, DDR], [VD, DDL, DDR], undefined, undefined, undefined]),
  
  createGesture("R", [C, N, N, C, C], [undefined, [VU, DUL, DUR], [VU, DUL, DUR], undefined, undefined]),
  
  // S: Jempol di depan semua jari (Semua mengepal rapat)
  createGesture("S", [C, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("S", [H, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("S", [N, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  
  // T: Jempol di bawah 1 jari (Telunjuk sedikit menonjol / HalfCurl)
  createGesture("T", [C, H, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("T", [H, H, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("T", [N, H, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("T", [N, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  createGesture("T", [C, C, C, C, C], [undefined, undefined, undefined, undefined, undefined]),
  
  createGesture("U", [C, N, N, C, C], [undefined, [VU, DUL, DUR], [VU, DUL, DUR], undefined, undefined]),
  createGesture("V", [C, N, N, C, C], [undefined, [VU, DUL, DUR], [VU, DUL, DUR], undefined, undefined]),
  createGesture("W", [C, N, N, N, C], [undefined, [VU, DUL, DUR], [VU, DUL, DUR], [VU, DUL, DUR], undefined]),
  
  // X: Telunjuk bengkok (HalfCurl) menunjuk ke atas/depan
  createGesture("X", [C, H, C, C, C], [undefined, [VU, HL, HR, DUL, DUR], undefined, undefined, undefined]),
  
  createGesture("Y", [N, C, C, C, N]),
  
  // Z: Telunjuk lurus menunjuk ke atas/depan
  createGesture("Z", [C, N, C, C, C], [undefined, [VU, HL, HR, DUL, DUR], undefined, undefined, undefined])
];

// --- KOSAKATA UMUM & PELAJARAN (Prototipe 1 Tangan) ---
export const WordGestures = [
  // Kosakata umum dihapus sesuai permintaan agar tidak konflik/spamming
];

// Kumpulan Semua Model Gestur PINTARA
export const allPINTARAGestures = [
  ...WordGestures,
  ...AlphabetGestures,
];
