"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/components/AudioProvider";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";

/**
 * Elegant audio toggle — sits in the corner, unobtrusive but discoverable.
 * When collapsed: a small circle with a sound symbol.
 * When expanded: waveform visualizer + volume slider.
 * Sound is OFF by default — user chooses to enable.
 */
export default function AudioToggle() {
  const { enabled, volume, toggle, setVolume } = useAudio();
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-collapse after inactivity
  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 6000);
    return () => clearTimeout(timer);
  }, [expanded]);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  const handleToggle = () => {
    toggle();
    if (!expanded) setExpanded(true);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 lg:bottom-6 right-4 z-[60] flex items-end gap-3"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-3 p-4 rounded-2xl premium-card-elevated min-w-[200px]"
          >
            {/* Waveform visualizer */}
            <div className="h-8 w-full rounded-lg overflow-hidden bg-[#FAF8F5]/50">
              <WaveformVisualizer />
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                className="text-[13px] opacity-50 hover:opacity-80 transition-opacity cursor-pointer"
              >
                {enabled ? "◉" : "⊘"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 appearance-none bg-[#E0D8CC]/40 rounded-full outline-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C9A96E]
                  [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-[11px] text-foreground/60 font-normal w-7 text-right">
                {Math.round(volume * 100)}
              </span>
            </div>

            {/* Status */}
            <p className="text-[11px] text-foreground/55 font-normal text-center">
              {enabled ? "Звук включён" : "Нажмите для звука"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => {
          if (!expanded) {
            setExpanded(true);
            if (!enabled) toggle();
          } else {
            handleToggle();
          }
        }}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 cursor-pointer ${
          enabled
            ? "premium-card-elevated"
            : hovering
            ? "premium-card"
            : "bg-white/40 border border-[#C9A96E]/10"
        }`}
        whileTap={{ scale: 0.92 }}
        title={enabled ? "Выключить звук" : "Включить звук"}
      >
        {/* Pulsing ring when active */}
        {enabled && (
          <motion.div
            className="absolute inset-0 rounded-full border border-[#C9A96E]/25"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Sound symbol */}
        <span className={`text-base transition-all duration-300 ${enabled ? "text-[#C9A96E]" : "text-foreground/40"}`}>
          {enabled ? "♫" : "♩"}
        </span>
      </motion.button>
    </div>
  );
}
