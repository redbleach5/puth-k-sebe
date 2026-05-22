"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { achievements, levels } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { MandalaRing, WaveBottom } from "@/components/SvgDecor";

export default function ProfileScreen() {
  const { xp, streak, completedTests, drawnCards, breathingSessions, journalEntries, unlockedAchievements, getLevel, reset } = useStore();
  const [showReset, setShowReset] = useState(false);
  const level = getLevel();

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-20 lg:pb-8 min-h-screen">
      <MandalaRing size={240} className="absolute -right-16 -top-8 slow-spin hidden lg:block" />
      <WaveBottom />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-xl sm:text-2xl font-light text-foreground/90 mb-0.5">Профиль</h2>
        <p className="text-[13px] text-foreground/60 font-light mb-4">Ваш путь</p>

        {/* Level card */}
        <motion.div className="p-4 lg:p-5 rounded-xl bg-gradient-to-br from-[#C9A96E]/[0.07] to-[#7A8B6F]/[0.05] border border-[#C9A96E]/12 mb-4"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl text-[#C9A96E]/65">{level.symbol}</div>
            <div className="flex-1">
              <h3 className="text-lg font-light text-foreground/85 mb-0.5">{level.name}</h3>
              <p className="text-[13px] text-foreground/60 font-light">{xp} XP</p>
            </div>
          </div>
          {level.nextXp !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-foreground/50 font-light mb-1.5">
                <span>{level.name}</span>
                <span>Следующий: {levels.find((l) => l.xp === level.nextXp)?.name}</span>
              </div>
              <div className="h-1.5 bg-[#E0D8CC]/25 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#C9A96E]/55 to-[#7A8B6F]/55 rounded-full" initial={{ width: 0 }} animate={{ width: `${level.progress * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          <StatBlock label="Streak" value={`${streak.count}`} symbol="◎" />
          <StatBlock label="Дыхание" value={`${breathingSessions.length}`} symbol="◌" />
          <StatBlock label="Тесты" value={`${completedTests.length}/3`} symbol="◈" />
          <StatBlock label="Карты" value={`${drawnCards.length}/32`} symbol="✦" />
          <StatBlock label="Дневник" value={`${journalEntries.length}`} symbol="✎" />
          <StatBlock label="Достижения" value={`${unlockedAchievements.length}/${achievements.length}`} symbol="★" />
        </div>

        {/* Achievements */}
        <div className="mb-5">
          <p className="label-text mb-3">Достижения</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {achievements.map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);
              return (
                <motion.div key={ach.id}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all duration-300 ${unlocked ? "border-[#C9A96E]/18 bg-[#C9A96E]/[0.04]" : "border-[#E0D8CC]/18 opacity-40"}`}
                  whileTap={unlocked ? { scale: 0.95 } : {}}
                >
                  <span className={`text-base ${unlocked ? "" : "grayscale"}`}>{ach.symbol}</span>
                  <span className="text-[10px] text-foreground/60 font-light text-center leading-tight">{ach.name}</span>
                  {unlocked && <span className="text-[9px] text-[#C9A96E]/50 font-light">+{ach.xp} XP</span>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Levels */}
        <div className="mb-5">
          <p className="label-text mb-2.5">Уровни</p>
          <div className="flex flex-col gap-1">
            {levels.map((l) => {
              const isCurrent = l.name === level.name;
              const isUnlocked = xp >= l.xp;
              return (
                <div key={l.name} className={`flex items-center gap-2.5 py-2 px-3 rounded-lg transition-all duration-300 ${isCurrent ? "bg-[#C9A96E]/[0.06] border border-[#C9A96E]/12" : "border border-transparent"}`}>
                  <span className={`text-[13px] ${isUnlocked ? "" : "opacity-30"}`}>{l.symbol}</span>
                  <span className={`text-[13px] font-light ${isUnlocked ? "text-foreground/65" : "text-foreground/35"}`}>{l.name}</span>
                  <span className="text-[11px] text-foreground/45 font-light ml-auto">{l.xp} XP</span>
                  {isCurrent && <span className="text-[10px] text-[#C9A96E]/50 font-light">← вы</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="pt-3 border-t border-[#E0D8CC]/20">
          {!showReset ? (
            <button onClick={() => setShowReset(true)} className="text-[11px] text-foreground/35 font-light hover:text-foreground/50 transition-colors duration-300 cursor-pointer">Сбросить прогресс</button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-foreground/55 font-light">Точно?</span>
              <button onClick={() => { reset(); setShowReset(false); }} className="text-[12px] text-red-400/50 font-light hover:text-red-400/70 transition-colors duration-300 cursor-pointer">Да, сбросить</button>
              <button onClick={() => setShowReset(false)} className="text-[12px] text-foreground/50 font-light hover:text-foreground/65 transition-colors duration-300 cursor-pointer">Нет</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-[#F5F1EB]/50 border border-[#E0D8CC]/20 text-center">
      <span className="text-[13px] opacity-40 block mb-0.5">{symbol}</span>
      <span className="text-[14px] font-light text-foreground/65">{value}</span>
      <p className="text-[9px] text-foreground/50 font-light mt-0.5 tracking-wider">{label}</p>
    </div>
  );
}
