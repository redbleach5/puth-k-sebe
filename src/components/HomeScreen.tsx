"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { affirmations } from "@/lib/data";
import { WaveBottom, MandalaRing, FlowingCurves, LeafAccent } from "@/components/SvgDecor";

export default function HomeScreen({
  onNavigate,
}: {
  onNavigate: (screen: "breathe" | "test" | "wisdom" | "journal") => void;
}) {
  const { streak, xp, getTodayAffirmation, completedTests, breathingSessions, journalEntries, drawnCards, getLevel } = useStore();
  const level = getLevel();
  const affIndex = getTodayAffirmation(affirmations.length);
  const todayAffirmation = affirmations[affIndex];

  const today = new Date().toISOString().split("T")[0];
  const hasActivity = breathingSessions.some((s) => s.date.startsWith(today)) || journalEntries.some((j) => j.date.startsWith(today));

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-20 lg:pb-8 min-h-screen">
      {/* SVG Decorative elements */}
      <FlowingCurves className="absolute right-0 top-0 h-full w-40 lg:w-56" />
      <MandalaRing size={280} className="absolute -right-20 top-10 slow-spin hidden lg:block" />
      <LeafAccent className="absolute left-2 bottom-32 h-40 hidden sm:block" />

      <div className="relative w-full max-w-5xl z-10">
        {/* Greeting + Streak */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground/90 tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-[13px] text-foreground/60 font-light mt-0.5">
              {level.name} · {xp} XP
            </p>
          </div>
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C9A96E]/[0.08] border border-[#C9A96E]/12"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm text-[#C9A96E]/80">{streak.count > 0 ? "○" : "·"}</span>
            <span className="text-[13px] font-light text-foreground/70">{streak.count} дн.</span>
          </motion.div>
        </div>

        {/* Streak message */}
        {streak.count >= 3 && (
          <motion.div
            className="mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[13px] text-[#C9A96E]/65 font-light italic">
              {streak.count >= 7 ? "Неделя осознанности — вы впечатляющи." : "Не прерывайте цепочку."}
            </p>
          </motion.div>
        )}

        {/* Level Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="label-text">{level.name}</span>
            {level.nextXp !== null && (
              <span className="text-[12px] text-foreground/50 font-light">
                {xp} / {level.nextXp} XP
              </span>
            )}
          </div>
          <div className="h-1 bg-[#E0D8CC]/35 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#C9A96E]/65 to-[#7A8B6F]/65 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${level.progress * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Main grid: affirmation + actions + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
          {/* Daily Affirmation */}
          <motion.div
            className="lg:col-span-7 p-4 lg:p-5 rounded-xl bg-gradient-to-br from-[#C9A96E]/[0.07] to-[#7A8B6F]/[0.05] border border-[#C9A96E]/12"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <p className="label-text mb-2">Сегодняшняя аффирмация</p>
            <p className="text-[15px] lg:text-base text-foreground/75 font-light leading-relaxed italic">
              {todayAffirmation}
            </p>
          </motion.div>

          {/* Quick Actions — right column */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2">
            <QuickAction symbol="◌" label="Подышать" desc="Замедлиться" onPress={() => onNavigate("breathe")} />
            <QuickAction symbol="✦" label="Карта дня" desc="Послушать" onPress={() => onNavigate("wisdom")} />
            <QuickAction symbol="◈" label="Новый тест" desc="Узнать себя" onPress={() => onNavigate("test")} />
            <QuickAction symbol="✎" label="Дневник" desc="Записать" onPress={() => onNavigate("journal")} />
          </div>
        </div>

        {/* Nudge if no activity */}
        {!hasActivity && (
          <motion.div
            className="mb-3 py-2.5 px-3.5 rounded-lg bg-[#C9A96E]/[0.05] border border-[#C9A96E]/8 hint-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p className="text-[13px] text-foreground/60 font-light">
              Ваш внутренний голос ждёт вас — начните с дыхания или вытяните карту.
            </p>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Дыхание" value={`${breathingSessions.length} сессий`} symbol="◌" />
          <StatCard label="Тесты" value={`${completedTests.length} / 3`} symbol="◈" />
          <StatCard label="Карты" value={`${drawnCards.length} собрано`} symbol="✦" />
          <StatCard label="Дневник" value={`${journalEntries.length} записей`} symbol="✎" />
        </div>
      </div>

      {/* Wave at bottom */}
      <WaveBottom />
    </div>
  );
}

function QuickAction({ symbol, label, desc, onPress }: { symbol: string; label: string; desc: string; onPress: () => void }) {
  return (
    <motion.button
      onClick={onPress}
      className="group flex items-center gap-3 p-3 rounded-xl border border-[#C9A96E]/10 hover:border-[#C9A96E]/25 hover:bg-[#C9A96E]/[0.04] transition-all duration-300 cursor-pointer text-left"
      whileTap={{ scale: 0.97 }}
    >
      <span className="text-base opacity-55 group-hover:opacity-75 transition-opacity duration-300">{symbol}</span>
      <div className="min-w-0">
        <span className="text-[13px] font-light text-foreground/75 group-hover:text-foreground/85 transition-colors duration-300 block">{label}</span>
        <span className="text-[11px] text-foreground/50 font-light block">{desc}</span>
      </div>
    </motion.button>
  );
}

function StatCard({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#F5F1EB]/55 border border-[#E0D8CC]/25">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[13px] opacity-45">{symbol}</span>
        <span className="label-text">{label}</span>
      </div>
      <span className="text-[14px] text-foreground/70 font-light">{value}</span>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}
