"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { achievements, levels } from "@/lib/data";
import { useStore } from "@/store/useStore";

export default function ProfileScreen() {
  const { xp, streak, completedTests, drawnCards, breathingSessions, journalEntries, unlockedAchievements, getLevel, reset } = useStore();
  const [showReset, setShowReset] = useState(false);

  const level = getLevel();

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-10 min-h-screen">
      <div className="w-full max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-light text-foreground/85 mb-1">Профиль</h2>
        <p className="text-sm text-muted-foreground/55 font-light mb-6">
          Ваш путь
        </p>

        {/* Level card */}
        <motion.div
          className="p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#C9A96E]/[0.06] to-[#7A8B6F]/[0.04] border border-[#C9A96E]/10 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-5">
            <div className="text-4xl text-[#C9A96E]/60">{level.symbol}</div>
            <div className="flex-1">
              <h3 className="text-xl font-light text-foreground/80 mb-1">{level.name}</h3>
              <p className="text-sm text-muted-foreground/55 font-light">{xp} XP</p>
            </div>
          </div>

          {/* Level progress */}
          {level.nextXp !== null && (
            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-muted-foreground/45 font-light mb-2">
                <span>{level.name}</span>
                <span>Следующий: {levels.find((l) => l.xp === level.nextXp)?.name}</span>
              </div>
              <div className="h-1.5 bg-[#E0D8CC]/25 rounded-full overflow-hidden">
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          <StatBlock label="Streak" value={`${streak.count}`} symbol="◎" />
          <StatBlock label="Дыхание" value={`${breathingSessions.length}`} symbol="◌" />
          <StatBlock label="Тесты" value={`${completedTests.length}/3`} symbol="◈" />
          <StatBlock label="Карты" value={`${drawnCards.length}/32`} symbol="✦" />
          <StatBlock label="Дневник" value={`${journalEntries.length}`} symbol="✎" />
          <StatBlock label="Достижения" value={`${unlockedAchievements.length}/${achievements.length}`} symbol="★" />
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <p className="label-text mb-4">Достижения</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {achievements.map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);
              return (
                <motion.div
                  key={ach.id}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-400 ${
                    unlocked
                      ? "border-[#C9A96E]/20 bg-[#C9A96E]/[0.04]"
                      : "border-[#E0D8CC]/20 opacity-40"
                  }`}
                  whileTap={unlocked ? { scale: 0.95 } : {}}
                >
                  <span className={`text-lg ${unlocked ? "" : "grayscale"}`}>{ach.symbol}</span>
                  <span className="text-[10px] sm:text-[11px] text-foreground/55 font-light text-center leading-tight">{ach.name}</span>
                  {unlocked && (
                    <span className="text-[9px] text-[#C9A96E]/45 font-light">+{ach.xp} XP</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Level milestones */}
        <div className="mb-8">
          <p className="label-text mb-4">Уровни</p>
          <div className="flex flex-col gap-1.5">
            {levels.map((l) => {
              const isCurrent = l.name === level.name;
              const isUnlocked = xp >= l.xp;
              return (
                <div
                  key={l.name}
                  className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-400 ${
                    isCurrent
                      ? "bg-[#C9A96E]/[0.06] border border-[#C9A96E]/15"
                      : "border border-transparent"
                  }`}
                >
                  <span className={`text-sm ${isUnlocked ? "" : "opacity-30"}`}>{l.symbol}</span>
                  <span className={`text-sm font-light ${isUnlocked ? "text-foreground/60" : "text-muted-foreground/35"}`}>
                    {l.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground/35 font-light ml-auto">
                    {l.xp} XP
                  </span>
                  {isCurrent && <span className="text-[10px] text-[#C9A96E]/45 font-light">← вы</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="pt-4 border-t border-[#E0D8CC]/20">
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="text-[11px] text-muted-foreground/25 font-light hover:text-muted-foreground/40 transition-colors duration-400 cursor-pointer"
            >
              Сбросить прогресс
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground/45 font-light">Точно?</span>
              <button
                onClick={() => { reset(); setShowReset(false); }}
                className="text-xs text-red-400/40 font-light hover:text-red-400/60 transition-colors duration-400 cursor-pointer"
              >
                Да, сбросить
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="text-xs text-muted-foreground/40 font-light hover:text-muted-foreground/60 transition-colors duration-400 cursor-pointer"
              >
                Нет
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#F5F1EB]/50 border border-[#E0D8CC]/20 text-center">
      <span className="text-sm opacity-40 block mb-1">{symbol}</span>
      <span className="text-base font-light text-foreground/60">{value}</span>
      <p className="text-[10px] text-muted-foreground/40 font-light mt-0.5 tracking-wider">{label}</p>
    </div>
  );
}
