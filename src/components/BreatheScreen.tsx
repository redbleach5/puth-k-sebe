"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { breathingPresets, type BreathingPreset } from "@/lib/data";
import { useStore } from "@/store/useStore";

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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setPhase("running");
    setCurrentPhaseIndex(0);
    setTimeInPhase(0);
    setCycles(0);
    setTotalTime(0);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;

    intervalRef.current = setInterval(() => {
      setTimeInPhase((prev) => {
        const next = prev + 0.1;
        if (next >= currentPhase.duration) {
          setCurrentPhaseIndex((pi) => {
            const nextPi = (pi + 1) % selectedPreset.phases.length;
            if (nextPi === 0) {
              setCycles((c) => c + 1);
            }
            return nextPi;
          });
          return 0;
        }
        return next;
      });
      setTotalTime((t) => t + 0.1);
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, currentPhaseIndex, currentPhase.duration, selectedPreset.phases.length]);

  const handleStop = useCallback(() => {
    stop();
    if (totalTime > 10) {
      recordBreathing(Math.round(totalTime), selectedPreset.id);
    }
    setPhase("complete");
  }, [stop, totalTime, recordBreathing, selectedPreset.id]);

  const handleReset = useCallback(() => {
    stop();
    setPhase("idle");
    setCurrentPhaseIndex(0);
    setTimeInPhase(0);
    setCycles(0);
    setTotalTime(0);
  }, [stop]);

  const isInhale = currentPhase.name === "Вдох";
  const isExhale = currentPhase.name === "Выдох";
  const isHold = currentPhase.name === "Задержка";
  const circleScale = isInhale ? 0.85 + progress * 0.3 : isExhale ? 1.15 - progress * 0.3 : 1.15;

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-10 min-h-screen">
      <div className="w-full max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-light text-foreground/85 mb-1">Дыхание</h2>
        <p className="text-sm text-muted-foreground/55 font-light mb-6">
          Выберите практику и дышите
        </p>

        {/* Preset selector */}
        {phase === "idle" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {breathingPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-400 cursor-pointer text-left ${
                  selectedPreset.id === preset.id
                    ? "border-[#C9A96E]/30 bg-[#C9A96E]/[0.05]"
                    : "border-[#E0D8CC]/30 hover:border-[#C9A96E]/15"
                }`}
              >
                <span className="text-2xl opacity-50">{preset.symbol}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-foreground/70">{preset.name}</p>
                  <p className="text-[11px] text-muted-foreground/45 font-light mt-0.5">{preset.description}</p>
                </div>
                <span className="text-[11px] text-muted-foreground/40 font-light shrink-0">
                  {preset.phases.map((p) => p.duration).join("-")}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Breathing circle */}
        {phase !== "idle" && (
          <div className="flex flex-col items-center flex-1 justify-center w-full py-8">
            {/* Circle */}
            <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mb-8">
              {/* Background ring */}
              <div className="absolute inset-0 rounded-full border border-[#C9A96E]/10" />

              {/* Animated circle */}
              <motion.div
                className="absolute rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#7A8B6F]/20"
                style={{
                  inset: "10%",
                  scale: circleScale,
                }}
                transition={{ duration: 0.1, ease: "linear" }}
              />

              {/* Center text */}
              <div className="relative z-10 flex flex-col items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPhase.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-base font-light text-foreground/65">{currentPhase.name}</span>
                    <span className="text-3xl font-extralight text-foreground/50 mt-1">
                      {Math.ceil(currentPhase.duration - timeInPhase)}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress arc */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#C9A96E"
                  strokeWidth="1.5"
                  strokeOpacity="0.15"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#C9A96E"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  strokeDasharray={`${progress * 565.5} 565.5`}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mb-8">
              <div className="text-center">
                <span className="text-2xl font-extralight text-foreground/55">{cycles}</span>
                <p className="text-[10px] text-muted-foreground/45 font-light mt-1 tracking-wider">ЦИКЛЫ</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-extralight text-foreground/55">{Math.floor(totalTime / 60)}:{String(Math.floor(totalTime % 60)).padStart(2, "0")}</span>
                <p className="text-[10px] text-muted-foreground/45 font-light mt-1 tracking-wider">ВРЕМЯ</p>
              </div>
            </div>

            {/* Controls */}
            {phase === "running" && (
              <motion.button
                onClick={handleStop}
                className="px-8 py-3 text-sm font-light tracking-[0.12em] text-foreground/60 border border-[#C9A96E]/25 rounded-full hover:border-[#C9A96E]/40 transition-all duration-400 cursor-pointer"
                whileTap={{ scale: 0.96 }}
              >
                Завершить
              </motion.button>
            )}

            {/* Phase indicators */}
            <div className="flex gap-2 mt-6">
              {selectedPreset.phases.map((p, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-light transition-all duration-400 ${
                    i === currentPhaseIndex
                      ? "bg-[#C9A96E]/12 text-foreground/55"
                      : "text-muted-foreground/35"
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
            className="flex flex-col items-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-4xl mb-4 gentle-pulse text-[#C9A96E]/60">○</div>
            <h3 className="text-xl font-light text-foreground/70 mb-2">Сессия завершена</h3>
            <p className="text-sm text-muted-foreground/50 font-light mb-2">
              {cycles} циклов · {Math.floor(totalTime / 60)}:{String(Math.floor(totalTime % 60)).padStart(2, "0")}
            </p>
            <p className="text-sm text-[#C9A96E]/50 font-light mb-8">+15 XP</p>
            <button
              onClick={handleReset}
              className="px-8 py-3 text-sm font-light tracking-[0.12em] text-foreground/55 border border-[#C9A96E]/20 rounded-full hover:border-[#C9A96E]/35 transition-all duration-400 cursor-pointer"
            >
              Ещё раз
            </button>
          </motion.div>
        )}

        {/* Start button */}
        {phase === "idle" && (
          <motion.button
            onClick={start}
            className="px-10 py-4 text-sm font-light tracking-[0.15em] text-foreground/60 border border-[#C9A96E]/25 rounded-full hover:border-[#C9A96E]/45 hover:text-foreground/80 transition-all duration-400 cursor-pointer"
            whileTap={{ scale: 0.96 }}
          >
            Начать
          </motion.button>
        )}
      </div>
    </div>
  );
}
