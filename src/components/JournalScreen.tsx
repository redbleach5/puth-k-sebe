"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { journalPrompts } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { usePremium } from "@/hooks/use-premium";
import { LeafAccent, WaveBottom, DotGrid, OrganicBlob } from "@/components/SvgDecor";
import { useAudio } from "@/components/AudioProvider";

const moods = [
  { symbol: "✦", label: "Сияние", value: "radiant", color: "#C9A96E" },
  { symbol: "◌", label: "Покой", value: "calm", color: "#7A8B6F" },
  { symbol: "○", label: "Нейтрал", value: "neutral", color: "#8B7D6B" },
  { symbol: "△", label: "Тревога", value: "anxious", color: "#D4875A" },
  { symbol: "▽", label: "Тяжесть", value: "heavy", color: "#5A6080" },
];

export default function JournalScreen() {
  const { journalEntries, saveJournalEntry } = useStore();
  const { checkLimit, isPremium, getFeatureLimit } = usePremium();
  const { playChime } = useAudio();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const journalLimit = getFeatureLimit("journalEntries");
  const isAtLimit = !isPremium && journalEntries.length >= journalLimit;

  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const todayPrompt = journalPrompts[dayOfYear % journalPrompts.length];

  const handleSave = () => {
    if (!selectedMood || !text.trim()) return;

    // Check journal entry limit
    if (!checkLimit("journalEntries", journalEntries.length)) return;

    saveJournalEntry(selectedMood, text.trim(), todayPrompt);
    playChime(660, 2);
    setSaved(true);
    setTimeout(() => { setSelectedMood(null); setText(""); setSaved(false); }, 2000);
  };

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-24 lg:pb-8 min-h-screen">
      <LeafAccent className="absolute right-3 top-16 h-36 hidden sm:block" />
      <DotGrid className="absolute left-0 top-0 h-full w-28 hidden lg:block" />
      <OrganicBlob color="#7A8B6F" className="absolute right-[-8%] top-[20%] w-56 h-56 drift hidden lg:block" />
      <WaveBottom color="#7A8B6F" />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-1">Дневник</h2>
        <p className="text-[15px] text-foreground/80 font-normal mb-5">Запишите то, что чувствуете</p>

        {/* Journal limit notice */}
        {isAtLimit && (
          <div className="mb-5 p-4 rounded-xl border border-[#C9A96E]/20 bg-[#C9A96E]/[0.05]">
            <p className="text-[14px] text-foreground/75 font-normal">
              Вы достигли лимита бесплатных записей ({journalLimit}). Оформите подписку для безлимитного дневника.
            </p>
          </div>
        )}

        {!isAtLimit && (
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div key="saved" className="flex flex-col items-center justify-center py-14" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <div className="text-4xl mb-4 gentle-pulse text-[#C9A96E]">✎</div>
              <p className="text-lg font-normal text-foreground/85 mb-1">Записано</p>
              <p className="text-[14px] text-[#C9A96E]/80 font-normal">+20 XP</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Mood selector */}
              <div className="mb-5">
                <p className="text-[13px] font-medium text-foreground/75 tracking-wider uppercase mb-3">Как вы себя чувствуете?</p>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {moods.map((mood) => (
                    <button key={mood.value} onClick={() => setSelectedMood(mood.value)}
                      className={`flex flex-col items-center gap-2 py-3 px-2 sm:px-3 rounded-xl transition-all duration-300 cursor-pointer flex-1 ${
                        selectedMood === mood.value ? "premium-card-elevated" : "border border-transparent hover:bg-[#C9A96E]/[0.04]"
                      }`}
                    >
                      <span className={`text-xl transition-all duration-300 ${selectedMood === mood.value ? "scale-115" : "opacity-65"}`} style={{ color: mood.color }}>{mood.symbol}</span>
                      <span className="text-[11px] sm:text-[12px] text-foreground/72 font-normal">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily prompt */}
              <div className="mb-5 p-4 rounded-xl premium-card">
                <p className="text-[12px] font-medium text-foreground/70 tracking-wider uppercase mb-2">Подсказка дня</p>
                <p className="text-[14px] text-foreground/80 font-normal italic leading-relaxed">{todayPrompt}</p>
              </div>

              {/* Text area */}
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите то, что приходит..."
                className="w-full h-40 p-4 rounded-xl border border-[#C9A96E]/15 bg-white/60 text-[15px] font-normal text-foreground/88 placeholder:text-foreground/40 focus:border-[#C9A96E]/35 focus:outline-none transition-colors duration-300 resize-none leading-[1.75]"
              />

              {/* Save button */}
              <button onClick={handleSave} disabled={!selectedMood || !text.trim()}
                className={`w-full mt-4 py-3.5 text-[14px] font-normal tracking-[0.1em] rounded-full transition-all duration-300 cursor-pointer ${
                  selectedMood && text.trim() ? "text-foreground/80 border border-[#C9A96E]/30 hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/[0.05]" : "text-foreground/35 border border-[#E0D8CC]/25 cursor-not-allowed"
                }`}
              >
                Сохранить запись
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* History */}
        {journalEntries.length > 0 && (
          <div className="mt-6">
            <button onClick={() => setShowHistory(!showHistory)} className="text-[13px] text-foreground/72 font-normal tracking-wider hover:text-foreground/90 transition-colors duration-300 cursor-pointer">
              {showHistory ? "Скрыть историю" : `Записи (${journalEntries.length})`}
            </button>
            {showHistory && (
              <motion.div className="mt-3 flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                {journalEntries.slice(0, 10).map((entry) => {
                  const moodData = moods.find((m) => m.value === entry.mood);
                  const date = new Date(entry.date);
                  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
                  return (
                    <div key={entry.id} className="p-4 rounded-xl premium-card">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[14px]" style={{ color: moodData?.color || "#8B7D6B" }}>{moodData?.symbol || "○"}</span>
                        <span className="text-[12px] text-foreground/72 font-normal">{dateStr}</span>
                      </div>
                      <p className="text-[12px] text-foreground/65 font-normal italic mb-1.5">{entry.prompt}</p>
                      <p className="text-[14px] text-foreground/78 font-normal leading-relaxed line-clamp-3">{entry.text}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
