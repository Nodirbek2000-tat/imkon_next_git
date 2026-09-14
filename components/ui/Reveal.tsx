"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Skroll paytida paydo bo'lish animatsiyasi.
 * `prefers-reduced-motion` yoqilgan bo'lsa harakat butunlay o'chadi —
 * kontent darhol ko'rinadi, hech narsa yo'qolmaydi.
 */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduced ? 0.2 : 0.7,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
