"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { journalPrompts } from "@/lib/data";
import { useStore } from "@/store/useStore";

const moods = [
  { symbol: "✦", label: "Сияние", value: "radiant", color: "#C9A96E" },
  { symbol: "◌", label: "Покой", value: "calm", color: "#7A8B6F" },
  { symbol: "○", label: "Нейтрал", value: "neutral", color: "#8B7D6B" },
  { symbol: "△", label: "Тревога", value: "anxious", color: "#D4875A" },
  { symbol: "▽", label: "Тяжесть", value: "heavy", color: "#5A6080" },
];

export default function JournalScreen() {
  const { journalEntries, saveJournalEntry } = useStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todayPrompt = journalPrompts[dayOfYear % journalPrompts.length];

  const handleSave = () => {
    if (!selectedMood || !text.trim()) return;
    saveJournalEntry(selectedMood, text.trim(), todayPrompt);
    setSaved(true);
    setTimeout(() => {
      setSelectedMood(null);
      setText("");
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-10 min-h-screen">
      <div className="w-full max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-light text-foreground/85 mb-1">Дневник</h2>
        <p className="text-sm text-muted-foreground/55 font-light mb-6">
          Запишите то, что чувствуете
        </p>

        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              key="saved"
              className="flex flex-col items-center justify-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-4xl mb-4 gentle-pulse text-[#C9A96E]/60">✎</div>
              <p className="text-lg font-light text-foreground/65 mb-2">Записано</p>
              <p className="text-sm text-[#C9A96E]/50 font-light">+20 XP</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Mood selector */}
              <div className="mb-6">
                <p className="label-text mb-4">Как вы себя чувствуете?</p>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`flex flex-col items-center gap-2 py-3 px-2 sm:px-3 rounded-xl transition-all duration-400 cursor-pointer flex-1 ${
                        selectedMood === mood.value
                          ? "bg-[#C9A96E]/[0.07] border border-[#C9A96E]/25 shadow-sm"
                          : "border border-transparent hover:bg-[#C9A96E]/[0.03]"
                      }`}
                    >
                      <span
                        className={`text-xl transition-all duration-400 ${
                          selectedMood === mood.value ? "scale-110" : "opacity-50"
                        }`}
                        style={{ color: mood.color }}
                      >
                        {mood.symbol}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground/50 font-light">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily prompt */}
              <div className="mb-5 p-4 rounded-xl bg-[#C9A96E]/[0.04] border border-[#C9A96E]/10">
                <p className="label-text mb-2">Подсказка дня</p>
                <p className="text-sm text-foreground/60 font-light italic leading-relaxed">
                  {todayPrompt}
                </p>
              </div>

              {/* Text area */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напишите то, что приходит..."
                className="w-full h-40 p-4 rounded-xl border border-[#E0D8CC]/30 bg-transparent text-[15px] font-light text-foreground/70 placeholder:text-muted-foreground/30 focus:border-[#C9A96E]/30 focus:outline-none transition-colors duration-400 resize-none leading-[1.75]"
              />

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!selectedMood || !text.trim()}
                className={`w-full mt-4 py-3.5 text-sm font-light tracking-[0.12em] rounded-full transition-all duration-400 cursor-pointer ${
                  selectedMood && text.trim()
                    ? "text-foreground/65 border border-[#C9A96E]/25 hover:border-[#C9A96E]/45 hover:bg-[#C9A96E]/[0.03]"
                    : "text-muted-foreground/25 border border-[#E0D8CC]/20 cursor-not-allowed"
                }`}
              >
                Сохранить запись
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History toggle */}
        {journalEntries.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-muted-foreground/45 font-light tracking-wider hover:text-muted-foreground/65 transition-colors duration-400 cursor-pointer"
            >
              {showHistory ? "Скрыть историю" : `Записи (${journalEntries.length})`}
            </button>

            {showHistory && (
              <motion.div
                className="mt-4 flex flex-col gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {journalEntries.slice(0, 10).map((entry) => {
                  const moodData = moods.find((m) => m.value === entry.mood);
                  const date = new Date(entry.date);
                  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl border border-[#E0D8CC]/25 bg-[#F5F1EB]/40"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm" style={{ color: moodData?.color || "#8B7D6B" }}>
                          {moodData?.symbol || "○"}
                        </span>
                        <span className="text-[11px] text-muted-foreground/45 font-light">{dateStr}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground/45 font-light italic mb-2">
                        {entry.prompt}
                      </p>
                      <p className="text-sm text-foreground/55 font-light leading-relaxed line-clamp-3">
                        {entry.text}
                      </p>
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
