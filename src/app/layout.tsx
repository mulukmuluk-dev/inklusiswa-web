import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  title: "PINTARA - Platform Belajar Digital Aksesibel",
  description: "Platform E-Learning Sekolah Inklusif Berbasis AI",
};

import { AccessibilityOverlaysWrapper } from "@/components/AccessibilityOverlaysWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${baloo2.variable} font-sans antialiased scroll-smooth`}>
      <body className="bg-[#FFF9EE] text-slate-800 font-sans min-h-screen">
        {children}
        <AccessibilityOverlaysWrapper />
      </body>
    </html>
  );
}
