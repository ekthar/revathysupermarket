"use client";

import { motion } from "framer-motion";

/**
 * Stage 4 — Storefront Pan (4.2–5.6s)
 * 
 * Parallax SVG illustration of a Kerala storefront with 3 layers:
 * - Sky (slowest, blurred)
 * - Shop (medium speed)
 * - Foreground produce (fastest)
 * 
 * Layers slide in opposite directions at different speeds for depth.
 * Depth-of-field blur on far layer. GPU-composited transforms only.
 */
export function StageStorefront() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] to-[#0d1b2a] flex items-center justify-center overflow-hidden"
    >
      {/* Layer 1: Sky — slowest, blurred (far depth) */}
      <motion.div
        initial={{ x: "5%" }}
        animate={{ x: "-5%" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        className="absolute inset-0"
        style={{ filter: "blur(2px)", willChange: "transform" }}
      >
        {/* Gradient sky with stars */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]" />
        {/* Stars */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() }}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{ top: `${10 + Math.random() * 30}%`, left: `${10 + Math.random() * 80}%` }}
          />
        ))}
        {/* Moon */}
        <div className="absolute top-[15%] right-[20%] w-12 h-12 rounded-full bg-yellow-100/80 shadow-[0_0_20px_rgba(255,255,200,0.3)]" />
      </motion.div>

      {/* Layer 2: Shop building — medium speed */}
      <motion.div
        initial={{ x: "-3%" }}
        animate={{ x: "3%" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-[65%]"
        style={{ willChange: "transform" }}
      >
        {/* Shop structure */}
        <svg viewBox="0 0 400 260" className="absolute bottom-0 w-full h-full" preserveAspectRatio="xMidYMax meet">
          {/* Shop body */}
          <rect x="80" y="60" width="240" height="200" fill="#8B4513" rx="4" />
          {/* Roof */}
          <polygon points="60,60 340,60 360,30 40,30" fill="#D2691E" />
          {/* Roof trim */}
          <rect x="60" y="55" width="280" height="8" fill="#A0522D" rx="2" />
          {/* Door */}
          <rect x="165" y="140" width="70" height="120" fill="#4A2C17" rx="4" />
          <circle cx="225" cy="200" r="3" fill="#FFD700" />
          {/* Windows */}
          <rect x="100" y="90" width="50" height="40" fill="#87CEEB" rx="2" opacity="0.8" />
          <rect x="250" y="90" width="50" height="40" fill="#87CEEB" rx="2" opacity="0.8" />
          {/* Window warm light */}
          <rect x="102" y="92" width="46" height="36" fill="#FFF3CD" rx="1" opacity="0.6" />
          <rect x="252" y="92" width="46" height="36" fill="#FFF3CD" rx="1" opacity="0.6" />
          {/* Sign */}
          <rect x="130" y="70" width="140" height="24" fill="#2D5016" rx="4" />
          <text x="200" y="87" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            MSM SUPERMARKET
          </text>
          {/* Awning stripes */}
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={85 + i * 33} y="55" width="16" height="12" fill={i % 2 ? "#FF6B35" : "#FFF"} opacity="0.9" />
          ))}
        </svg>
      </motion.div>

      {/* Layer 3: Foreground produce — fastest, sharpest */}
      <motion.div
        initial={{ x: "-8%" }}
        animate={{ x: "8%" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-[30%]"
        style={{ willChange: "transform" }}
      >
        <svg viewBox="0 0 400 120" className="absolute bottom-0 w-full" preserveAspectRatio="xMidYMax meet">
          {/* Ground */}
          <rect x="0" y="80" width="400" height="40" fill="#2D5016" opacity="0.8" />
          {/* Produce baskets */}
          <ellipse cx="80" cy="85" rx="30" ry="15" fill="#8B4513" />
          <circle cx="70" cy="75" r="8" fill="#FF4500" /> {/* Tomato */}
          <circle cx="85" cy="72" r="7" fill="#FF6347" /> {/* Tomato */}
          <circle cx="75" cy="68" r="6" fill="#FF4500" />
          
          <ellipse cx="320" cy="85" rx="30" ry="15" fill="#8B4513" />
          <circle cx="310" cy="75" r="9" fill="#32CD32" /> {/* Lime */}
          <circle cx="325" cy="72" r="8" fill="#228B22" /> {/* Avocado */}
          <circle cx="330" cy="78" r="6" fill="#90EE90" />

          {/* Banana bunch */}
          <path d="M180,75 Q190,60 200,75 Q195,65 185,75 Z" fill="#FFD700" />
          <path d="M185,73 Q195,58 205,73 Q200,63 190,73 Z" fill="#FFEC8B" />

          {/* Coconuts */}
          <circle cx="250" cy="82" r="10" fill="#8B4513" />
          <circle cx="265" cy="80" r="9" fill="#6B3510" />
        </svg>
      </motion.div>

      {/* Warm glow from shop */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-[30%] left-[40%] w-32 h-32 rounded-full bg-amber-300/20 blur-3xl"
      />
    </motion.div>
  );
}
