"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { achievements, levels } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { MandalaRing, WaveBottom, SacredGeometry, DotGrid } from "@/components/SvgDecor";

export default function ProfileScreen() {
  const { xp, streak, completedTests, drawnCards, breathingSessions, journalEntries, unlockedAchievements, getLevel, reset } = useStore();
  const [showReset, setShowReset] = useState(false);
  const level = getLevel();

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-24 lg:pb-8 min-h-screen">
      <MandalaRing size={280} className="absolute -right-20 -top-8 slow-spin hidden lg:block" />
      <SacredGeometry size={220} className="absolute -left-16 bottom-40 drift-slow hidden lg:block" color="#7A8B6F" />
      <DotGrid className="absolute right-0 top-20 h-64 w-24 hidden lg:block" />
      <WaveBottom />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-1">Профиль</h2>
        <p className="text-[15px] text-foreground/80 font-normal mb-5">Ваш путь</p>

        {/* Level card */}
        <motion.div className="p-5 lg:p-6 rounded-xl premium-card-elevated mb-5"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl text-[#C9A96E]">{level.symbol}</div>
            <div className="flex-1">
              <h3 className="text-lg font-normal text-foreground/90 mb-0.5">{level.name}</h3>
              <p className="text-[14px] text-foreground/78 font-normal">{xp} XP</p>
            </div>
          </div>
          {level.nextXp !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-[12px] text-foreground/72 font-normal mb-2">
                <span>{level.name}</span>
                <span>Следующий: {levels.find((l) => l.xp === level.nextXp)?.name}</span>
              </div>
              <div className="h-2 bg-[#E0D8CC]/35 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#C9A96E]/70 to-[#7A8B6F]/70 rounded-full" initial={{ width: 0 }} animate={{ width: `${level.progress * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          <StatBlock label="Streak" value={`${streak.count}`} symbol="◎" />
          <StatBlock label="Дыхание" value={`${breathingSessions.length}`} symbol="◌" />
          <StatBlock label="Тесты" value={`${completedTests.length}/3`} symbol="◈" />
          <StatBlock label="Карты" value={`${drawnCards.length}/32`} symbol="✦" />
          <StatBlock label="Дневник" value={`${journalEntries.length}`} symbol="✎" />
          <StatBlock label="Достижения" value={`${unlockedAchievements.length}/${achievements.length}`} symbol="★" />
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <p className="text-[13px] font-medium text-foreground/75 tracking-wider uppercase mb-3">Достижения</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {achievements.map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);
              return (
                <motion.div key={ach.id}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 ${unlocked ? "premium-card" : "border-[#E0D8CC]/20 opacity-45"}`}
                  whileTap={unlocked ? { scale: 0.95 } : {}}
                >
                  <span className={`text-lg ${unlocked ? "" : "grayscale"}`}>{ach.symbol}</span>
                  <span className="text-[11px] text-foreground/72 font-normal text-center leading-tight">{ach.name}</span>
                  {unlocked && <span className="text-[10px] text-[#C9A96E]/70 font-normal">+{ach.xp} XP</span>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Levels */}
        <div className="mb-6">
          <p className="text-[13px] font-medium text-foreground/75 tracking-wider uppercase mb-3">Уровни</p>
          <div className="flex flex-col gap-1.5">
            {levels.map((l) => {
              const isCurrent = l.name === level.name;
              const isUnlocked = xp >= l.xp;
              return (
                <div key={l.name} className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition-all duration-300 ${isCurrent ? "premium-card" : "border border-transparent"}`}>
                  <span className={`text-[14px] ${isUnlocked ? "" : "opacity-35"}`}>{l.symbol}</span>
                  <span className={`text-[14px] font-normal ${isUnlocked ? "text-foreground/78" : "text-foreground/40"}`}>{l.name}</span>
                  <span className="text-[12px] text-foreground/60 font-normal ml-auto">{l.xp} XP</span>
                  {isCurrent && <span className="text-[11px] text-[#C9A96E]/70 font-normal">← вы</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="pt-4 border-t border-[#C9A96E]/12">
          {!showReset ? (
            <button onClick={() => setShowReset(true)} className="text-[12px] text-foreground/45 font-normal hover:text-foreground/65 transition-colors duration-300 cursor-pointer">Сбросить прогресс</button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-foreground/70 font-normal">Точно?</span>
              <button onClick={() => { reset(); setShowReset(false); }} className="text-[13px] text-red-400/60 font-normal hover:text-red-400/85 transition-colors duration-300 cursor-pointer">Да, сбросить</button>
              <button onClick={() => setShowReset(false)} className="text-[13px] text-foreground/65 font-normal hover:text-foreground/85 transition-colors duration-300 cursor-pointer">Нет</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-3 rounded-xl premium-card text-center">
      <span className="text-[14px] opacity-55 block mb-1">{symbol}</span>
      <span className="text-[15px] font-normal text-foreground/82">{value}</span>
      <p className="text-[10px] text-foreground/65 font-normal mt-0.5 tracking-wider">{label}</p>
    </div>
  );
}
