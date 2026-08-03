import React from 'react';

interface TanzilLogoProps {
  size?: number;
  iconMode?: boolean; // If true, renders with the dark rounded-square background like a PWA icon
  className?: string;
}

export const TanzilLogo: React.FC<TanzilLogoProps> = ({ size = 200, iconMode = false, className = '' }) => {
  return (
    <div className={`flex items-center justify-center shrink-0 select-none ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold Gradient for Metallic Look */}
          <linearGradient id="tanzil-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E1" />
            <stop offset="20%" stopColor="#FFE082" />
            <stop offset="40%" stopColor="#FFD54F" />
            <stop offset="60%" stopColor="#FFC107" />
            <stop offset="80%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>

          {/* Slightly Darker Gold for Shadows/Contours */}
          <linearGradient id="tanzil-gold-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD54F" />
            <stop offset="50%" stopColor="#FF9800" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>

          {/* Green Gradient for Inner Circle */}
          <radialGradient id="tanzil-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B6B3A" />
            <stop offset="50%" stopColor="#064E2C" />
            <stop offset="100%" stopColor="#022B18" />
          </radialGradient>

          {/* Dark Background Gradient for Icon Mode */}
          <linearGradient id="tanzil-bg-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#031E11" />
            <stop offset="100%" stopColor="#010A06" />
          </linearGradient>

          {/* Shadow filters for 3D depth */}
          <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
          </filter>
          
          <filter id="inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
          </filter>

          {/* Paths for text curvature */}
          {/* Top text path - clockwise arc */}
          <path id="textPathTop" d="M 52,200 A 148,148 0 0,1 348,200" fill="none" />
          {/* Bottom text path - clockwise arc at bottom (starts right, goes left to be right-side-up) */}
          <path id="textPathBottom" d="M 310,210 A 110,110 0 0,1 90,210" fill="none" />
        </defs>

        {/* 1. Background Rounded Square for App Icon Mode */}
        {iconMode && (
          <rect
            x="5"
            y="5"
            width="390"
            height="390"
            rx="85"
            fill="url(#tanzil-bg-dark)"
            stroke="url(#tanzil-gold)"
            strokeWidth="3"
            filter="url(#logo-shadow)"
          />
        )}

        {/* 2. Main Outer Circle of the Emblem */}
        <g filter="url(#logo-shadow)">
          <circle cx="200" cy="200" r="175" fill="url(#tanzil-green)" stroke="url(#tanzil-gold)" strokeWidth="4" />
          
          {/* Outer dotted/beaded boundary */}
          <circle cx="200" cy="200" r="167" stroke="url(#tanzil-gold)" strokeWidth="1.5" strokeDasharray="3,4" opacity="0.9" />
          
          {/* Inner solid border of text band */}
          <circle cx="200" cy="200" r="130" stroke="url(#tanzil-gold)" strokeWidth="2.5" />
          
          {/* Deep inner green area */}
          <circle cx="200" cy="200" r="128" fill="url(#tanzil-green)" />
        </g>

        {/* 3. Gold text band container path (semi-circle gold background behind the top text) */}
        <path 
          d="M 45,200 A 155,155 0 0,1 355,200 L 328,200 A 128,128 0 0,0 72,200 Z" 
          fill="url(#tanzil-gold)" 
          opacity="0.95"
          filter="url(#inner-shadow)"
        />

        {/* 4. Text Path - Curved Top Text: "Tanzil Microcredit Management Software" */}
        <text fontStyle="normal" fontWeight="900" fontSize="14.5" letterSpacing="0.4px" fill="#14321A">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            Tanzil Microcredit Management Software
          </textPath>
        </text>

        {/* 5. Center Illustration: Shaking Hands and Plant */}
        <g filter="url(#inner-shadow)">
          
          {/* 5A. Handshake Vector Illustration */}
          {/* Left arm/cuff coming from bottom-left */}
          <path
            d="M 115,260 L 140,240 C 145,235 155,238 162,243 C 170,249 175,258 180,265 L 155,285 C 145,290 130,285 120,275 Z"
            fill="url(#tanzil-gold-dark)"
            opacity="0.8"
          />
          <path
            d="M 120,263 L 142,244 C 146,241 152,243 156,246 C 162,251 166,258 170,264 L 152,280 C 145,284 133,280 125,272 Z"
            fill="url(#tanzil-gold)"
          />

          {/* Right arm/cuff coming from bottom-right */}
          <path
            d="M 285,260 L 260,240 C 255,235 245,238 238,243 C 230,249 225,258 220,265 L 245,285 C 255,290 270,285 280,275 Z"
            fill="url(#tanzil-gold-dark)"
            opacity="0.8"
          />
          <path
            d="M 280,263 L 258,244 C 254,241 248,243 244,246 C 238,251 234,258 230,244 L 248,280 C 255,284 267,280 275,272 Z"
            fill="url(#tanzil-gold)"
          />

          {/* Left hand details */}
          <path
            d="M 152,250 C 160,238 175,232 190,242 C 195,246 195,250 190,255 C 185,260 178,265 172,270"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 152,250 C 160,238 175,232 190,242 C 195,246 195,250 190,255 C 185,260 178,265 172,270"
            stroke="url(#tanzil-gold)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right hand details and fingers wrapping around left hand */}
          {/* Finger 1 */}
          <path d="M 205,232 C 210,235 212,242 208,247 L 185,270" stroke="url(#tanzil-gold-dark)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 205,232 C 210,235 212,242 208,247 L 185,270" stroke="url(#tanzil-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Finger 2 */}
          <path d="M 213,239 C 218,242 220,249 216,254 L 193,277" stroke="url(#tanzil-gold-dark)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 213,239 C 218,242 220,249 216,254 L 193,277" stroke="url(#tanzil-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Finger 3 */}
          <path d="M 220,247 C 225,250 227,257 223,262 L 201,284" stroke="url(#tanzil-gold-dark)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 220,247 C 225,250 227,257 223,262 L 201,284" stroke="url(#tanzil-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Finger 4 */}
          <path d="M 227,255 C 232,258 234,265 230,270 L 210,290" stroke="url(#tanzil-gold-dark)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 227,255 C 232,258 234,265 230,270 L 210,290" stroke="url(#tanzil-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Clasped palms union highlight */}
          <circle cx="200" cy="254" r="16" fill="url(#tanzil-gold)" opacity="0.15" />

          {/* 5B. Plant growing from the handshake */}
          {/* Plant Stem */}
          <path
            d="M 200,245 L 200,165"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 200,245 L 200,165"
            stroke="url(#tanzil-gold)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Leaf 1: Top-Center */}
          <path
            d="M 200,165 C 192,150 192,125 200,110 C 208,125 208,150 200,165 Z"
            fill="url(#tanzil-gold)"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="1.5"
          />
          <path d="M 200,160 L 200,120" stroke="url(#tanzil-gold-dark)" strokeWidth="1" />

          {/* Leaf 2: Middle-Left */}
          <path
            d="M 200,185 C 178,178 152,170 148,145 C 168,148 188,168 200,185 Z"
            fill="url(#tanzil-gold)"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="1.5"
          />
          <path d="M 197,182 L 165,158" stroke="url(#tanzil-gold-dark)" strokeWidth="1" />

          {/* Leaf 3: Middle-Right */}
          <path
            d="M 200,185 C 222,178 248,170 252,145 C 232,148 212,168 200,185 Z"
            fill="url(#tanzil-gold)"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="1.5"
          />
          <path d="M 203,182 L 235,158" stroke="url(#tanzil-gold-dark)" strokeWidth="1" />

          {/* Leaf 4: Bottom-Left */}
          <path
            d="M 200,210 C 172,210 155,190 155,172 C 175,182 192,200 200,210 Z"
            fill="url(#tanzil-gold)"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="1.5"
          />
          <path d="M 197,208 L 170,188" stroke="url(#tanzil-gold-dark)" strokeWidth="1" />

          {/* Leaf 5: Bottom-Right */}
          <path
            d="M 200,210 C 228,210 245,190 245,172 C 225,182 208,200 200,210 Z"
            fill="url(#tanzil-gold)"
            stroke="url(#tanzil-gold-dark)"
            strokeWidth="1.5"
          />
          <path d="M 203,208 L 230,188" stroke="url(#tanzil-gold-dark)" strokeWidth="1" />
        </g>

        {/* 6. Bottom design: "EST. 2026" */}
        <text fontStyle="normal" fontWeight="900" fontSize="16" letterSpacing="1.5px" fill="url(#tanzil-gold)">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            ★ EST. 2026 ★
          </textPath>
        </text>

        {/* Small bottom decorative branch */}
        <g filter="url(#inner-shadow)" opacity="0.9">
          <circle cx="200" cy="328" r="3" fill="url(#tanzil-gold)" />
          <path d="M 197,328 C 190,326 182,330 180,334 C 185,334 193,332 197,328 Z" fill="url(#tanzil-gold)" />
          <path d="M 203,328 C 210,326 218,330 220,334 C 215,334 207,332 203,328 Z" fill="url(#tanzil-gold)" />
        </g>

        {/* Decorative corner highlights inside App Icon mode */}
        {iconMode && (
          <>
            <polygon points="35,35 45,35 35,45" fill="url(#tanzil-gold)" opacity="0.3" />
            <polygon points="365,35 355,35 365,45" fill="url(#tanzil-gold)" opacity="0.3" />
            <polygon points="35,365 45,365 35,355" fill="url(#tanzil-gold)" opacity="0.3" />
            <polygon points="365,365 355,365 365,355" fill="url(#tanzil-gold)" opacity="0.3" />
            <g transform="translate(320, 345) scale(0.6)">
              <polygon points="20,10 23,17 30,20 23,23 20,30 17,23 10,20 17,17" fill="url(#tanzil-gold)" opacity="0.25" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
};
