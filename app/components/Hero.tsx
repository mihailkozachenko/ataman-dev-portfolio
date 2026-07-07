"use client";

import { motion, MotionConfig, type Variants } from "framer-motion";
import { CloudScene } from "./CloudScene";
import { Container } from "./Container";
import { PlaneTrail } from "./PlaneTrail";
import { ScanCard } from "./ScanCard";
import { SendIcon } from "./icons";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-24">
        <CloudScene />
        <PlaneTrail />

        <Container className="relative">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-14 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="max-w-2xl">
              <motion.p
                variants={item}
                className="font-mono text-xs uppercase tracking-[0.2em] text-steel"
              >
                Available for new projects
              </motion.p>

              <motion.h1
                variants={item}
                className="mt-6 flex flex-col font-sans font-light leading-[0.95] text-almost-white"
              >
                <span className="font-display text-[40px] italic font-light text-lavender-mist sm:text-[56px]">
                  Hi, I&apos;m
                </span>
                <span className="text-[64px] tracking-[-0.02em] sm:text-[88px]">Ataman Dev</span>
                <span className="font-display text-[32px] italic font-light text-lavender-mist sm:text-[48px]">
                  AI Web Developer
                </span>
              </motion.h1>

              <motion.p
                variants={item}
                className="mt-8 max-w-xl font-sans text-lg font-light leading-relaxed text-steel"
              >
                I build web applications with AI, authentication and payments. Fast delivery,
                honest prices.
              </motion.p>

              <div className="mt-10 flex flex-wrap gap-4">
                <motion.a
                  variants={item}
                  href="https://t.me/AtamanApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 32px 4px rgba(175,80,255,0.45)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 rounded-[1584px] bg-signal-violet px-8 py-4 font-sans text-base font-medium text-near-black"
                >
                  <SendIcon className="h-4 w-4" />
                  Contact me
                </motion.a>
                <motion.a
                  variants={item}
                  href="#projects"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 24px 2px rgba(247,249,250,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex items-center rounded-[8px] border border-almost-white/30 px-8 py-4 font-sans text-base text-almost-white"
                >
                  View projects
                </motion.a>
              </div>
            </div>

            <motion.div variants={cardItem} className="hidden lg:block lg:w-[380px] lg:shrink-0">
              <ScanCard />
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </MotionConfig>
  );
}
