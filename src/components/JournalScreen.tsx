"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { journalPrompts } from "@/lib/data";
import { useStore } from "@/store/useStore";

const moods = [
  { emoji: "😊", label: "Сияние", value: "radiant" },
  { emoji: "😌", label: "Покой", value: "calm" },
  { emoji: "😐", label: "Нейтрал", value: "neutral" },
  { emoji: "😟", label: "Тревога", value: "anxious" },
  { emoji: "😢", label: "Тяжесть", value: "heavy" },
];

export default function JournalScreen() {
  const { journalEntries, saveJournalEntry } = useStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Get today's prompt based on date
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
    <div className="flex flex-col items-center px-5 pt-10 pb-28 min-h-screen">
      <h2 className="text-2xl font-extralight text-foreground/80 mb-2">Дневник</h2>
      <p className="text-xs text-muted-foreground/40 font-light tracking-wider mb-8">
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
            <div className="text-4xl mb-4 gentle-pulse">✎</div>
            <p className="text-lg font-extralight text-foreground/60 mb-2">Записано</p>
            <p className="text-sm text-[#C9A96E]/50 font-light">+20 XP</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Mood selector */}
            <div className="mb-8">
              <p className="text-[11px] text-muted-foreground/40 font-light tracking-[0.2em] uppercase mb-4">
                Как вы себя чувствуете?
              </p>
              <div className="flex justify-between gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-500 cursor-pointer flex-1 ${
                      selectedMood === mood.value
                        ? "bg-[#C9A96E]/[0.07] border border-[#C9A96E]/25"
                        : "border border-transparent hover:bg-[#C9A96E]/[0.03]"
                    }`}
                  >
                    <span className={`text-xl transition-all duration-500 ${selectedMood === mood.value ? "scale-110" : "opacity-50"}`}>
                      {mood.emoji}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 font-light">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily prompt */}
            <div className="mb-6 p-4 rounded-xl bg-[#C9A96E]/[0.04] border border-[#C9A96E]/8">
              <p className="text-[10px] text-[#C9A96E]/35 font-light tracking-[0.2em] uppercase mb-2">
                Подсказка дня
              </p>
              <p className="text-sm text-foreground/55 font-light italic leading-relaxed">
                {todayPrompt}
              </p>
            </div>

            {/* Text area */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишите то, что приходит…"
              className="w-full h-40 p-4 rounded-xl border border-[#E0D8CC]/30 bg-transparent text-sm font-light text-foreground/65 placeholder:text-muted-foreground/25 focus:border-[#C9A96E]/30 focus:outline-none transition-colors duration-500 resize-none leading-relaxed"
            />

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!selectedMood || !text.trim()}
              className={`w-full mt-4 py-3.5 text-sm font-light tracking-[0.15em] rounded-full transition-all duration-500 cursor-pointer ${
                selectedMood && text.trim()
                  ? "text-foreground/60 border border-[#C9A96E]/25 hover:border-[#C9A96E]/45"
                  : "text-muted-foreground/20 border border-[#E0D8CC]/20 cursor-not-allowed"
              }`}
            >
              Сохранить запись
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History toggle */}
      {journalEntries.length > 0 && (
        <div className="w-full max-w-md mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] text-muted-foreground/30 font-light tracking-wider hover:text-muted-foreground/50 transition-colors duration-500 cursor-pointer"
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
                const moodEmoji = moods.find((m) => m.value === entry.mood)?.emoji || "○";
                const date = new Date(entry.date);
                const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl border border-[#E0D8CC]/20 bg-[#F0EBE3]/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{moodEmoji}</span>
                      <span className="text-[10px] text-muted-foreground/35 font-light">{dateStr}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/35 font-light italic mb-1.5">
                      {entry.prompt}
                    </p>
                    <p className="text-sm text-foreground/50 font-light leading-relaxed line-clamp-3">
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
  );
}
