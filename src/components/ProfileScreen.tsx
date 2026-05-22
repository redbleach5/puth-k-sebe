"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { achievements, levels } from "@/lib/data";
import { useStore } from "@/store/useStore";

export default function ProfileScreen() {
  const { xp, streak, completedTests, drawnCards, breathingSessions, journalEntries, unlockedAchievements, getLevel, reset } = useStore();
  const [showReset, setShowReset] = useState(false);

  const level = getLevel();
  const maxStreak = streak.count; // Simplified — actual max streak would need tracking

  return (
    <div className="flex flex-col items-center px-5 pt-10 pb-28 min-h-screen">
      <h2 className="text-2xl font-extralight text-foreground/80 mb-2">Профиль</h2>
      <p className="text-xs text-muted-foreground/40 font-light tracking-wider mb-8">
        Ваш путь
      </p>

      {/* Level card */}
      <motion.div
        className="w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-[#C9A96E]/[0.06] to-[#7A8B6F]/[0.04] border border-[#C9A96E]/10 mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-4xl mb-2">{level.symbol}</div>
        <h3 className="text-xl font-extralight text-foreground/80 mb-1">{level.name}</h3>
        <p className="text-sm text-muted-foreground/40 font-light">{xp} XP</p>

        {/* Level progress */}
        {level.nextXp !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground/30 font-light mb-1.5">
              <span>{level.name}</span>
              <span>Следующий: {levels.find((l) => l.xp === level.nextXp)?.name}</span>
            </div>
            <div className="h-1.5 bg-[#E0D8CC]/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#C9A96E]/50 to-[#7A8B6F]/50 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${level.progress * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div className="w-full max-w-md grid grid-cols-3 gap-3 mb-8">
        <StatBlock label="Streak" value={`${maxStreak}`} symbol="🔥" />
        <StatBlock label="Дыхание" value={`${breathingSessions.length}`} symbol="○" />
        <StatBlock label="Тесты" value={`${completedTests.length}/3`} symbol="◈" />
        <StatBlock label="Карты" value={`${drawnCards.length}/32`} symbol="✦" />
        <StatBlock label="Дневник" value={`${journalEntries.length}`} symbol="✎" />
        <StatBlock label="Достижения" value={`${unlockedAchievements.length}/${achievements.length}`} symbol="★" />
      </div>

      {/* Achievements */}
      <div className="w-full max-w-md mb-8">
        <p className="text-[11px] text-muted-foreground/35 font-light tracking-[0.2em] uppercase mb-4">
          Достижения
        </p>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((ach) => {
            const unlocked = unlockedAchievements.includes(ach.id);
            return (
              <motion.div
                key={ach.id}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-500 ${
                  unlocked
                    ? "border-[#C9A96E]/20 bg-[#C9A96E]/[0.04]"
                    : "border-[#E0D8CC]/15 opacity-40"
                }`}
                whileTap={unlocked ? { scale: 0.95 } : {}}
              >
                <span className={`text-xl ${unlocked ? "" : "grayscale"}`}>{ach.symbol}</span>
                <span className="text-[10px] text-foreground/50 font-light text-center leading-tight">{ach.name}</span>
                {unlocked && (
                  <span className="text-[9px] text-[#C9A96E]/40 font-light">+{ach.xp} XP</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Level milestones */}
      <div className="w-full max-w-md mb-8">
        <p className="text-[11px] text-muted-foreground/35 font-light tracking-[0.2em] uppercase mb-4">
          Уровни
        </p>
        <div className="flex flex-col gap-2">
          {levels.map((l) => {
            const isCurrent = l.name === level.name;
            const isUnlocked = xp >= l.xp;
            return (
              <div
                key={l.name}
                className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-500 ${
                  isCurrent
                    ? "bg-[#C9A96E]/[0.06] border border-[#C9A96E]/15"
                    : "border border-transparent"
                }`}
              >
                <span className={`text-sm ${isUnlocked ? "" : "opacity-30"}`}>{l.symbol}</span>
                <span className={`text-sm font-light ${isUnlocked ? "text-foreground/60" : "text-muted-foreground/30"}`}>
                  {l.name}
                </span>
                <span className="text-[10px] text-muted-foreground/25 font-light ml-auto">
                  {l.xp} XP
                </span>
                {isCurrent && <span className="text-[9px] text-[#C9A96E]/40 font-light">← вы</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="mt-4">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="text-[10px] text-muted-foreground/20 font-light hover:text-muted-foreground/35 transition-colors duration-500 cursor-pointer"
          >
            Сбросить прогресс
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted-foreground/40 font-light">Точно?</span>
            <button
              onClick={() => { reset(); setShowReset(false); }}
              className="text-[11px] text-red-400/40 font-light hover:text-red-400/60 transition-colors duration-500 cursor-pointer"
            >
              Да, сбросить
            </button>
            <button
              onClick={() => setShowReset(false)}
              className="text-[11px] text-muted-foreground/30 font-light hover:text-muted-foreground/50 transition-colors duration-500 cursor-pointer"
            >
              Нет
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#F0EBE3]/30 border border-[#E0D8CC]/15 text-center">
      <span className="text-xs opacity-30 block mb-1">{symbol}</span>
      <span className="text-base font-extralight text-foreground/60">{value}</span>
      <p className="text-[9px] text-muted-foreground/30 font-light mt-0.5 tracking-wider">{label}</p>
    </div>
  );
}
