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
import AuthModal from "@/components/AuthModal";
import PremiumModal from "@/components/PremiumModal";
import { useStore } from "@/store/useStore";
import OnboardingHints from "@/components/OnboardingHints";
import AudioToggle from "@/components/AudioToggle";
import { useAudio } from "@/components/AudioProvider";
import { registerPaywallCallback } from "@/hooks/use-premium";
import type { SoundscapeId } from "@/lib/audioEngine";

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
        ctx.fillStyle = `rgba(201,169,110,${p.o * 0.7})`;
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

const screenToSoundscape: Record<Screen, SoundscapeId> = {
  home: "home",
  breathe: "breathe",
  test: "test",
  wisdom: "wisdom",
  journal: "journal",
  profile: "profile",
};

// Loading state shown during SSR and initial hydration — same on server and client
function LoadingShell() {
  return (
    <div className="relative min-h-screen bg-[#FAF8F5] overflow-x-hidden flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-[#C9A96E]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[#7A8B6F]/[0.05] rounded-full blur-[120px]" />
      </div>
      <div className="flex flex-col items-center gap-3" style={{ zIndex: 2 }}>
        <div className="w-10 h-10 rounded-full border border-[#C9A96E]/30 flex items-center justify-center gentle-pulse">
          <span className="text-[#C9A96E] text-lg">○</span>
        </div>
        <p className="text-[13px] text-foreground/55 font-normal tracking-wider">Загрузка...</p>
      </div>
    </div>
  );
}

export default function MeditationApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [mounted, setMounted] = useState(false);
  const { checkStreak, _hasHydrated } = useStore();
  const { switchSoundscape, playTransition } = useAudio();

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Register the paywall callback so usePremium().showPaywall() can open the modal
  useEffect(() => {
    registerPaywallCallback(() => setShowPremiumModal(true));
  }, []);

  // Wait for client-side mount + store hydration to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && _hasHydrated) {
      checkStreak();
    }
  }, [mounted, _hasHydrated, checkStreak]);

  // Switch soundscape when screen changes
  useEffect(() => {
    if (mounted) {
      switchSoundscape(screenToSoundscape[activeScreen]);
    }
  }, [activeScreen, switchSoundscape, mounted]);

  const handleScreenChange = (screen: Screen) => {
    if (screen !== activeScreen) {
      playTransition();
    }
    setActiveScreen(screen);
  };

  const handleHomeNavigate = (screen: "breathe" | "test" | "wisdom" | "journal") => {
    playTransition();
    setActiveScreen(screen);
  };

  // During SSR and initial hydration, render a static shell to avoid mismatches
  if (!mounted || !_hasHydrated) {
    return <LoadingShell />;
  }

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-[#C9A96E]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[#7A8B6F]/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-[#8B7D6B]/[0.03] rounded-full blur-[100px] drift-slow" />
        <div className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] bg-[#C9A96E]/[0.025] rounded-full blur-[100px] drift" />
      </div>

      <AmbientCanvas />

      {/* Main content — offset for desktop sidebar */}
      <div className="relative lg:ml-[78px]" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {activeScreen === "home" && (
              <HomeScreen onNavigate={handleHomeNavigate} onShowAuthModal={() => setShowAuthModal(true)} />
            )}
            {activeScreen === "breathe" && <BreatheScreen />}
            {activeScreen === "test" && <TestScreen />}
            {activeScreen === "wisdom" && <WisdomScreen />}
            {activeScreen === "journal" && <JournalScreen />}
            {activeScreen === "profile" && (
              <ProfileScreen
                onShowAuthModal={() => setShowAuthModal(true)}
                onShowPremiumModal={() => setShowPremiumModal(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <BottomNav active={activeScreen} onChange={handleScreenChange} />

      {/* Audio toggle */}
      <AudioToggle />

      {/* Onboarding hints overlay */}
      <OnboardingHints />

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Premium Modal */}
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
    </div>
  );
}
