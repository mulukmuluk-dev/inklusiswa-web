import React, { useId } from 'react';

interface PintaraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function PintaraLogo({ size = 'md', className = '' }: PintaraLogoProps) {
  const maskId = "textmask-" + useId().replace(/:/g, "");
  // Skala ukuran SVG logo berdasarkan size
  const sizeMap = {
    sm: 'w-24', // 96px
    md: 'w-56', // 224px (slightly larger)
    lg: 'w-64', // 256px
    xl: 'w-80', // 320px
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-block ${currentSize} ${className}`}>
      <svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto overflow-visible">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <text 
              x="50%" y="75" textAnchor="middle" fill="black" 
              className="font-sans font-black text-[85px] tracking-wide" 
              style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif" }}>
              PINTARA
            </text>
            <text 
              x="50%" y="105" textAnchor="middle" fill="black" 
              className="font-sans font-black text-[15px]" 
              style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif" }}>
              Platform Inklusif Teknologi Adaptif Rakyat Anak
            </text>
          </mask>
        </defs>
        
        {/* Main Text Stroke */}
        <text 
          x="50%" 
          y="75" 
          textAnchor="middle" 
          fill="none" 
          stroke="#9C4221" 
          strokeWidth="16" 
          strokeLinejoin="round" 
          className="font-sans font-black text-[85px] tracking-wide" 
          style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif" }}
          mask={`url(#${maskId})`}
        >
          PINTARA
        </text>
        
        {/* Subtitle Stroke */}
        <text 
          x="50%" 
          y="105" 
          textAnchor="middle" 
          fill="none" 
          stroke="#9C4221" 
          strokeWidth="5" 
          strokeLinejoin="round" 
          className="font-sans font-black text-[15px]" 
          style={{ fontFamily: "var(--font-baloo), 'Baloo 2', sans-serif" }}
          mask={`url(#${maskId})`}
        >
          Platform Inklusif Teknologi Adaptif Rakyat Anak
        </text>
      </svg>
    </div>
  );
}
