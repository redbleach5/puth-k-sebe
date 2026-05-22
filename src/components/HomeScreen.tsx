"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { affirmations, tests, dailyThoughts } from "@/lib/data";
import { WaveBottom, MandalaRing, FlowingCurves, LeafAccent, SacredGeometry, OrganicBlob, MountainSilhouette, ZenLines } from "@/components/SvgDecor";

export default function HomeScreen({
  onNavigate,
}: {
  onNavigate: (screen: "breathe" | "test" | "wisdom" | "journal") => void;
}) {
  const { streak, xp, getTodayAffirmation, completedTests, breathingSessions, journalEntries, drawnCards, getLevel } = useStore();
  const level = getLevel();
  const affIndex = getTodayAffirmation(affirmations.length);
  const todayAffirmation = affirmations[affIndex];

  const todayThoughtIndex = (() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % dailyThoughts.length;
  })();
  const todayThought = dailyThoughts[todayThoughtIndex];

  const today = new Date().toISOString().split("T")[0];
  const hasActivity = breathingSessions.some((s) => s.date.startsWith(today)) || journalEntries.some((j) => j.date.startsWith(today));

  const hour = new Date().getHours();
  const greeting = hour < 6 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-24 lg:pb-8 min-h-screen">
      {/* SVG Decorative elements — MORE of them, MORE visible */}
      <FlowingCurves className="absolute right-0 top-0 h-full w-40 lg:w-56" />
      <MandalaRing size={320} className="absolute -right-24 top-8 slow-spin hidden lg:block" />
      <SacredGeometry size={280} className="absolute -left-16 top-40 drift-slow hidden lg:block" />
      <LeafAccent className="absolute left-2 bottom-36 h-44 hidden sm:block" />
      <OrganicBlob className="absolute left-[-10%] top-[15%] w-72 h-72 drift hidden lg:block" color="#C9A96E" />
      <ZenLines className="absolute right-4 bottom-40 h-64 w-20 hidden lg:block" />
      <MountainSilhouette className="absolute bottom-0 left-0 right-0 w-full h-24" color="#8B7D6B" />

      <div className="relative w-full max-w-5xl z-10">
        {/* Greeting + Streak */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground tracking-tight">
              {greeting}
            </h1>
            <p className="text-[14px] text-foreground/75 font-normal mt-1">
              {level.name} · {xp} XP
            </p>
          </div>
          <motion.div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl premium-card"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm text-[#C9A96E]">{streak.count > 0 ? "○" : "·"}</span>
            <span className="text-[14px] font-normal text-foreground/80">{streak.count} дн.</span>
          </motion.div>
        </div>

        {/* Streak message */}
        {streak.count >= 3 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[14px] text-[#C9A96E] font-normal italic">
              {streak.count >= 7 ? "Неделя осознанности — вы впечатляющи." : "Не прерывайте цепочку."}
            </p>
          </motion.div>
        )}

        {/* Level Progress — MORE prominent */}
        <div className="mb-5 p-4 rounded-xl premium-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-medium text-foreground/80 tracking-wider uppercase">{level.name}</span>
            {level.nextXp !== null && (
              <span className="text-[13px] text-foreground/70 font-normal">
                {xp} / {level.nextXp} XP
              </span>
            )}
          </div>
          <div className="h-2 bg-[#E0D8CC]/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#C9A96E]/75 to-[#7A8B6F]/75 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${level.progress * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Main grid: affirmation + actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
          {/* Daily Affirmation — BIGGER, more readable */}
          <motion.div
            className="lg:col-span-7 p-5 lg:p-6 rounded-xl premium-card-elevated"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <p className="text-[12px] font-medium text-foreground/70 tracking-wider uppercase mb-3">Сегодняшняя аффирмация</p>
            <p className="text-[16px] lg:text-[17px] text-foreground/88 font-normal leading-relaxed italic">
              {todayAffirmation}
            </p>
          </motion.div>

          {/* Quick Actions — more descriptive */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <QuickAction symbol="◌" label="Подышать" desc="Замедлиться и успокоиться" onPress={() => onNavigate("breathe")} />
            <QuickAction symbol="✦" label="Карта дня" desc="Послушать мудрость" onPress={() => onNavigate("wisdom")} />
            <QuickAction symbol="◈" label="Новый тест" desc="Узнать себя глубже" onPress={() => onNavigate("test")} />
            <QuickAction symbol="✎" label="Дневник" desc="Записать мысли" onPress={() => onNavigate("journal")} />
          </div>
        </div>

        {/* Nudge if no activity — more encouraging */}
        {!hasActivity && (
          <motion.div
            className="mb-4 py-3 px-4 rounded-xl premium-card hint-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p className="text-[14px] text-foreground/75 font-normal">
              Ваш внутренний голос ждёт вас — начните с дыхания или вытяните карту.
            </p>
          </motion.div>
        )}

        {/* Inspirational quote section — NEW, fills space */}
        <motion.div
          className="mb-5 p-5 rounded-xl bg-gradient-to-br from-[#7A8B6F]/[0.08] to-[#C9A96E]/[0.05] border border-[#7A8B6F]/12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className="text-[12px] font-medium text-foreground/65 tracking-wider uppercase mb-2">Мысль дня</p>
          <p className="text-[15px] text-foreground/82 font-normal leading-relaxed">
            {todayThought}
          </p>
        </motion.div>

        {/* Stats Grid — bigger, more readable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Дыхание" value={`${breathingSessions.length} сессий`} symbol="◌" />
          <StatCard label="Тесты" value={`${completedTests.length} / ${tests.length}`} symbol="◈" />
          <StatCard label="Карты" value={`${drawnCards.length} собрано`} symbol="✦" />
          <StatCard label="Дневник" value={`${journalEntries.length} записей`} symbol="✎" />
        </div>

        {/* Daily practice suggestion — NEW section */}
        <motion.div
          className="p-4 rounded-xl border border-[#C9A96E]/12 bg-[#C9A96E]/[0.04]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg opacity-60 mt-0.5">◎</span>
            <div>
              <p className="text-[14px] font-medium text-foreground/80 mb-1">Практика дня</p>
              <p className="text-[14px] text-foreground/72 font-normal leading-relaxed">
                {hour < 12
                  ? "Утро — лучшее время для настройки. Сделайте дыхательную практику и вытяните карту дня."
                  : hour < 18
                  ? "Середина дня — момент перезагрузки. Дыхание 4-7-8 вернёт равновесие."
                  : "Вечер — время reflection. Запишите мысли в дневник и отпустите день."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Wave at bottom — more visible */}
      <WaveBottom />
    </div>
  );
}

function QuickAction({ symbol, label, desc, onPress }: { symbol: string; label: string; desc: string; onPress: () => void }) {
  return (
    <motion.button
      onClick={onPress}
      className="group flex items-center gap-3 p-3.5 rounded-xl premium-card hover:border-[#C9A96E]/25 transition-all duration-300 cursor-pointer text-left"
      whileTap={{ scale: 0.97 }}
    >
      <span className="text-base opacity-65 group-hover:opacity-85 transition-opacity duration-300">{symbol}</span>
      <div className="min-w-0">
        <span className="text-[14px] font-normal text-foreground/82 group-hover:text-foreground/92 transition-colors duration-300 block">{label}</span>
        <span className="text-[12px] text-foreground/65 font-normal block">{desc}</span>
      </div>
    </motion.button>
  );
}

function StatCard({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-3.5 rounded-xl premium-card">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[14px] opacity-55">{symbol}</span>
        <span className="text-[12px] font-medium text-foreground/70 tracking-wider uppercase">{label}</span>
      </div>
      <span className="text-[15px] text-foreground/82 font-normal">{value}</span>
    </div>
  );
}
