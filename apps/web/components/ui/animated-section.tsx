"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// Staggered container - children animate in one by one
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
  once = true
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger child item
export function StaggerItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Fade in from direction when entering viewport
export function FadeInView({
  children,
  className,
  direction = "up",
  delay = 0,
  once = true
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  once?: boolean;
}) {
  const offsets = {
    up: { x: 0, y: 30 },
    down: { x: 0, y: -30 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offsets[direction].x, y: offsets[direction].y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

// Parallax scroll wrapper
export function ParallaxSection({
  children,
  className,
  speed = 0.3
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80 * speed]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

// Floating bob animation (for floating cards on hero)
export function FloatingElement({
  children,
  className,
  duration = 3,
  distance = 10
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2]
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale in when entering viewport
export function ScaleInView({
  children,
  className,
  delay = 0,
  once = true
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, margin: "-30px" }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

// Section header slide-in animation
export function AnimatedSectionHeader({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
    >
      {children}
    </motion.div>
  );
}
