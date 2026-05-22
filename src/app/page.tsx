"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { type Screen } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import BreatheScreen from "@/components/BreatheScreen";
import TestScreen from "@/components/TestScreen";
import WisdomScreen from "@/components/WisdomScreen";
import JournalScreen from "@/components/JournalScreen";
import ProfileScreen from "@/components/ProfileScreen";
import { useStore } from "@/store/useStore";
import OnboardingHints from "@/components/OnboardingHints";

// Ambient floating particles (canvas-based)
function AmbientCanvas() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    interface P { x: number; y: number; vx: number; vy: number; s: number; o: number; life: number; max: number; }
    const ps: P[] = [];

    for (let i = 0; i < 12; i++) {
      const p: P = { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: -(0.15 + Math.random() * 0.35), s: 1 + Math.random() * 1.5, o: 0, life: Math.random() * 400, max: 400 + Math.random() * 300 };
      ps.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      if (Math.random() < 0.02 && ps.length < 18) {
        ps.push({ x: Math.random() * w, y: h + 5, vx: (Math.random() - 0.5) * 0.25, vy: -(0.15 + Math.random() * 0.35), s: 1 + Math.random() * 1.5, o: 0, life: 0, max: 400 + Math.random() * 300 });
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        const pr = p.life / p.max;
        p.o = pr < 0.1 ? pr * 1.5 : pr > 0.8 ? (1 - pr) * 5 : 0.1;
        if (p.life >= p.max) { ps.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,169,110,${p.o * 0.5})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      canvas.remove();
    };
  }, []);

  return null;
}

export default function MeditationApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const { checkStreak } = useStore();

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const handleHomeNavigate = (screen: "breathe" | "test" | "wisdom" | "journal") => {
    setActiveScreen(screen);
  };

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-[#C9A96E]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[#7A8B6F]/[0.025] rounded-full blur-[120px]" />
      </div>

      <AmbientCanvas />

      {/* Main content — offset for desktop sidebar */}
      <div className="relative lg:ml-[72px]" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {activeScreen === "home" && <HomeScreen onNavigate={handleHomeNavigate} />}
            {activeScreen === "breathe" && <BreatheScreen />}
            {activeScreen === "test" && <TestScreen />}
            {activeScreen === "wisdom" && <WisdomScreen />}
            {activeScreen === "journal" && <JournalScreen />}
            {activeScreen === "profile" && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <BottomNav active={activeScreen} onChange={setActiveScreen} />

      {/* Onboarding hints overlay */}
      <OnboardingHints />
    </div>
  );
}
