"use client";

import { useRef, useState, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DoubleTapHeartProps {
  children: ReactElement;
  onDoubleTap: () => void;
}

export function DoubleTapHeart({ children, onDoubleTap }: DoubleTapHeartProps) {
  const lastTap = useRef(0);
  const [showHeart, setShowHeart] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <div className="relative" onClick={handleClick}>
      {children}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.4 }}
              className="text-5xl drop-shadow-lg"
            >
              ❤️
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
