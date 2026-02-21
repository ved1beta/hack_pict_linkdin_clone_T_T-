import React from "react";

export const HxLogo = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="hx-gradient" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
            <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet-500 */}
          </linearGradient>
        </defs>
        
        {/* Background shape - subtle glass effect */}
        <rect 
          x="2" y="2" width="36" height="36" rx="10" 
          className="fill-white/5 stroke-white/10" 
          strokeWidth="1"
        />
        
        {/* H Letter */}
        <path
          d="M10 12V28M10 20H18M18 12V28"
          stroke="url(#hx-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* x Letter - slightly overlapping/stylized */}
        <path
          d="M22 20L30 28M30 20L22 28"
          stroke="url(#hx-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
        />
      </svg>
    </div>
  );
};

