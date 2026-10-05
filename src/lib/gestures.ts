import * as fp from "fingerpose";

// 1. Isyarat "Biologi" (B - Huruf SIBI)
// 4 jari lurus rapat ke atas, jempol dilipat ke dalam
export const BiologyGesture = new fp.GestureDescription("Biologi");
BiologyGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
BiologyGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.9);
BiologyGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
BiologyGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
BiologyGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
BiologyGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);

// 2. Isyarat "Matematika" (M - Huruf SIBI)
// 3 jari (telunjuk, tengah, manis) ditekuk ke bawah menutupi jempol, kelingking terlipat
export const MathGesture = new fp.GestureDescription("Matematika");
MathGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
MathGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
MathGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
MathGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
MathGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

// 3. Isyarat "Saya" (Menunjuk ke diri sendiri - Jempol ditekan / Telunjuk ditekuk)
export const SayaGesture = new fp.GestureDescription("Saya");
SayaGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
SayaGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
SayaGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownLeft, 0.9);
SayaGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownRight, 0.9);

// 4. Jempol Ke Atas (Bagus / Lanjut)
export const ThumbsUpGesture = new fp.GestureDescription("Lanjut");
ThumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
ThumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
ThumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
ThumbsUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
ThumbsUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
ThumbsUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

// 5. Isyarat "Kembali" (Telunjuk menunjuk ke kiri)
export const KembaliGesture = new fp.GestureDescription("Kembali");
KembaliGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
KembaliGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 1.0);
KembaliGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.9);
KembaliGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
KembaliGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
KembaliGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
KembaliGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

// 6. Isyarat "Baca/Belajar" (Dua telapak tangan terbuka ke atas seperti pegang buku)
export const BacaGesture = new fp.GestureDescription("Baca");
[fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky].forEach(finger => {
  BacaGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
  BacaGesture.addDirection(finger, fp.FingerDirection.VerticalUp, 0.9);
  BacaGesture.addDirection(finger, fp.FingerDirection.DiagonalUpLeft, 0.9);
  BacaGesture.addDirection(finger, fp.FingerDirection.DiagonalUpRight, 0.9);
});

// Kumpulan model gestur
export const signGestures = [
  BiologyGesture,
  MathGesture,
  SayaGesture,
  ThumbsUpGesture,
  KembaliGesture,
  BacaGesture,
];
