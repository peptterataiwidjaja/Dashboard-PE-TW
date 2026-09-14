import React from 'react';

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'stacked' | 'mark-only';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full'
}) => {
  // SVG Swooshes matching exactly the uploaded image
  const LogoSwooshes = ({ className: svgClass = "w-full h-auto" }: { className?: string }) => (
    <svg 
      viewBox="0 0 520 180" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={svgClass}
    >
      {/* Deep Navy Blue Curved Swoosh */}
      <path 
        d="M 18 18 C 108 92 212 144 324 138 C 388 134 446 102 498 44 C 452 94 384 150 312 153 C 204 156 104 104 18 18 Z" 
        fill="#1a3478" 
      />
      
      {/* Crimson Red Intersecting Curved Swoosh */}
      <path 
        d="M 180 58 C 230 102 292 136 352 148 C 392 156 422 154 444 147 C 416 157 372 158 328 148 C 270 134 218 102 180 58 Z" 
        fill="#d11f26" 
      />
    </svg>
  );

  if (variant === 'stacked') {
    // Exact layout as uploaded image (Swoosh on top, TERATAI WIDJAJA below)
    const containerWidth = {
      sm: 'w-28',
      md: 'w-36',
      lg: 'w-48',
      xl: 'w-64'
    }[size];

    return (
      <div className={`flex flex-col items-center justify-center ${containerWidth} ${className}`}>
        <LogoSwooshes className="w-full h-auto" />
        <span className="text-center font-extrabold tracking-wider text-[#1a3478] uppercase mt-1 leading-tight text-xs sm:text-sm md:text-base font-sans">
          TERATAI WIDJAJA
        </span>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            GARMENT MANUFACTURER
          </span>
        )}
      </div>
    );
  }

  // Full / Horizontal navbar layout
  const heightClasses = {
    sm: 'h-6 sm:h-8',
    md: 'h-7 sm:h-10 sm:h-11',
    lg: 'h-10 sm:h-14',
    xl: 'h-12 sm:h-16'
  }[size];

  return (
    <div className={`flex items-center space-x-2 sm:space-x-3 ${className}`}>
      {/* Swoosh Logo Graphic */}
      <div className={`${heightClasses} aspect-[520/180] flex items-center justify-center shrink-0`}>
        <LogoSwooshes />
      </div>

      {/* Corporate Identity Text */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <span className="text-xs sm:text-base font-black tracking-wider text-[#1a3478] uppercase font-sans whitespace-nowrap">
            TERATAI WIDJAJA
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
        </div>
        {showSubtitle && (
          <div className="hidden sm:flex items-center space-x-1 text-[10px] sm:text-[11px] leading-tight">
            <span className="font-semibold text-blue-700">Garment Manufacturer</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 hidden md:inline">Sewing Production & Quality</span>
          </div>
        )}
      </div>
    </div>
  );
};
