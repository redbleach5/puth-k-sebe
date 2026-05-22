"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { breathingPresets, type BreathingPreset } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { LotusSVG, Ripples, WaveBottom, WaterRipples, FlowingCurves } from "@/components/SvgDecor";

type BreathePhase = "idle" | "running" | "complete";

export default function BreatheScreen() {
  const [selectedPreset, setSelectedPreset] = useState<BreathingPreset>(breathingPresets[0]);
  const [phase, setPhase] = useState<BreathePhase>("idle");
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { recordBreathing } = useStore();

  const currentPhase = selectedPreset.phases[currentPhaseIndex] || selectedPreset.phases[0];
  const progress = currentPhase.duration > 0 ? timeInPhase / currentPhase.duration : 0;

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const start = useCallback(() => {
    setPhase("running"); setCurrentPhaseIndex(0); setTimeInPhase(0); setCycles(0); setTotalTime(0);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    intervalRef.current = setInterval(() => {
      setTimeInPhase((prev) => {
        const next = prev + 0.1;
        if (next >= currentPhase.duration) {
          setCurrentPhaseIndex((pi) => {
            const nextPi = (pi + 1) % selectedPreset.phases.length;
            if (nextPi === 0) setCycles((c) => c + 1);
            return nextPi;
          });
          return 0;
        }
        return next;
      });
      setTotalTime((t) => t + 0.1);
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, currentPhaseIndex, currentPhase.duration, selectedPreset.phases.length]);

  const handleStop = useCallback(() => {
    stop();
    if (totalTime > 10) recordBreathing(Math.round(totalTime), selectedPreset.id);
    setPhase("complete");
  }, [stop, totalTime, recordBreathing, selectedPreset.id]);

  const handleReset = useCallback(() => {
    stop(); setPhase("idle"); setCurrentPhaseIndex(0); setTimeInPhase(0); setCycles(0); setTotalTime(0);
  }, [stop]);

  const isInhale = currentPhase.name === "Вдох";
  const isExhale = currentPhase.name === "Выдох";
  const circleScale = isInhale ? 0.85 + progress * 0.3 : isExhale ? 1.15 - progress * 0.3 : 1.15;

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-24 lg:pb-8 min-h-screen">
      <WaveBottom color="#7A8B6F" />
      <FlowingCurves className="absolute left-0 top-0 h-full w-32 lg:w-44" color="#7A8B6F" />
      <WaterRipples size={200} color="#7A8B6F" className="absolute -left-12 top-32 drift-slow hidden lg:block" />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-1">Дыхание</h2>
        <p className="text-[15px] text-foreground/80 font-normal mb-5">
          Выберите практику и дышите
        </p>

        {/* Preset selector */}
        {phase === "idle" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {breathingPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                  selectedPreset.id === preset.id
                    ? "premium-card-elevated"
                    : "premium-card hover:border-[#C9A96E]/25"
                }`}
              >
                <span className="text-2xl opacity-60">{preset.symbol}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-normal text-foreground/85">{preset.name}</p>
                  <p className="text-[12px] text-foreground/68 font-normal mt-0.5">{preset.description}</p>
                </div>
                <span className="text-[12px] text-foreground/65 font-normal shrink-0">
                  {preset.phases.map((p) => p.duration).join("-")}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Breathing circle */}
        {phase !== "idle" && (
          <div className="flex flex-col items-center py-8">
            {/* Decorative lotus behind circle */}
            <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mb-7">
              <LotusSVG size={220} className="absolute slow-spin" opacity={0.12} />

              {/* Background ring */}
              <div className="absolute inset-0 rounded-full border border-[#C9A96E]/15 breathe-ring" />

              {/* Animated circle */}
              <motion.div
                className="absolute rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#7A8B6F]/20"
                style={{ inset: "12%", scale: circleScale }}
                transition={{ duration: 0.1, ease: "linear" }}
              />

              {/* Center text */}
              <div className="relative z-10 flex flex-col items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPhase.name}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-base font-normal text-foreground/85">{currentPhase.name}</span>
                    <span className="text-4xl font-light text-foreground/70 mt-1">
                      {Math.ceil(currentPhase.duration - timeInPhase)}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress arc */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.15" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray={`${progress * 565.5} 565.5`} strokeLinecap="round" />
              </svg>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mb-7">
              <div className="text-center">
                <span className="text-2xl font-light text-foreground/75">{cycles}</span>
                <p className="text-[11px] text-foreground/65 font-normal mt-1 tracking-wider">ЦИКЛЫ</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-light text-foreground/75">{Math.floor(totalTime / 60)}:{String(Math.floor(totalTime % 60)).padStart(2, "0")}</span>
                <p className="text-[11px] text-foreground/65 font-normal mt-1 tracking-wider">ВРЕМЯ</p>
              </div>
            </div>

            {/* Stop button */}
            {phase === "running" && (
              <motion.button
                onClick={handleStop}
                className="px-8 py-3 text-[14px] font-normal tracking-[0.1em] text-foreground/80 border border-[#C9A96E]/30 rounded-full hover:border-[#C9A96E]/50 transition-all duration-300 cursor-pointer"
                whileTap={{ scale: 0.96 }}
              >
                Завершить
              </motion.button>
            )}

            {/* Phase indicators */}
            <div className="flex gap-2 mt-5">
              {selectedPreset.phases.map((p, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-normal transition-all duration-300 ${
                    i === currentPhaseIndex ? "premium-card text-foreground/78" : "text-foreground/50"
                  }`}
                >
                  {p.name} {p.duration}с
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete screen */}
        {phase === "complete" && (
          <motion.div
            className="flex flex-col items-center py-14"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Ripples size={120} opacity={0.15} className="mb-5" />
            <h3 className="text-xl font-normal text-foreground/88 mb-1.5">Сессия завершена</h3>
            <p className="text-[14px] text-foreground/72 font-normal mb-1.5">
              {cycles} циклов · {Math.floor(totalTime / 60)}:{String(Math.floor(totalTime % 60)).padStart(2, "0")}
            </p>
            <p className="text-[14px] text-[#C9A96E]/75 font-normal mb-7">+15 XP</p>
            <button
              onClick={handleReset}
              className="px-8 py-3 text-[14px] font-normal tracking-[0.1em] text-foreground/78 border border-[#C9A96E]/25 rounded-full hover:border-[#C9A96E]/45 transition-all duration-300 cursor-pointer"
            >
              Ещё раз
            </button>
          </motion.div>
        )}

        {/* Start button */}
        {phase === "idle" && (
          <motion.button
            onClick={start}
            className="px-10 py-4 text-[14px] font-normal tracking-[0.15em] text-foreground/80 border border-[#C9A96E]/30 rounded-full hover:border-[#C9A96E]/50 hover:text-foreground/95 transition-all duration-300 cursor-pointer"
            whileTap={{ scale: 0.96 }}
          >
            Начать
          </motion.button>
        )}
      </div>
    </div>
  );
}
