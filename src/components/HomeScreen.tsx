"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { affirmations } from "@/lib/data";

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
    <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-10 min-h-screen">
      <div className="w-full max-w-5xl">
        {/* Greeting + Streak */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground/85 tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-xs text-muted-foreground/55 font-light mt-1 tracking-wide">
              {level.name} · {xp} XP
            </p>
          </div>
          <motion.div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C9A96E]/[0.08] border border-[#C9A96E]/10"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm text-[#C9A96E]/70">{streak.count > 0 ? "○" : "·"}</span>
            <span className="text-sm font-light text-foreground/65">{streak.count} дн.</span>
          </motion.div>
        </div>

        {/* Streak message */}
        {streak.count >= 3 && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs text-[#C9A96E]/55 font-light italic">
              {streak.count >= 7 ? "Неделя осознанности — вы впечатляющи." : "Не прерывайте цепочку."}
            </p>
          </motion.div>
        )}

        {/* Level Progress */}
        <div className="mb-6 lg:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="label-text">{level.name}</span>
            {level.nextXp !== null && (
              <span className="text-[11px] text-muted-foreground/45 font-light">
                {xp} / {level.nextXp} XP
              </span>
            )}
          </div>
          <div className="h-1 bg-[#E0D8CC]/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#C9A96E]/60 to-[#7A8B6F]/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${level.progress * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Desktop: Two-column layout; Mobile: stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
          {/* Daily Affirmation — spans 2 cols on desktop */}
          <motion.div
            className="lg:col-span-2 p-5 lg:p-6 rounded-2xl bg-gradient-to-br from-[#C9A96E]/[0.06] to-[#7A8B6F]/[0.04] border border-[#C9A96E]/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <p className="label-text mb-3">Сегодняшняя аффирмация</p>
            <p className="text-base lg:text-lg text-foreground/70 font-light leading-relaxed italic">
              {todayAffirmation}
            </p>
          </motion.div>

          {/* Quick Actions — 2x2 grid */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <QuickAction
              symbol="◌"
              label="Подышать"
              desc="Замедлиться"
              onPress={() => onNavigate("breathe")}
            />
            <QuickAction
              symbol="✦"
              label="Карта дня"
              desc="Послушать"
              onPress={() => onNavigate("wisdom")}
            />
            <QuickAction
              symbol="◈"
              label="Новый тест"
              desc="Узнать себя"
              onPress={() => onNavigate("test")}
            />
            <QuickAction
              symbol="✎"
              label="Дневник"
              desc="Записать"
              onPress={() => onNavigate("journal")}
            />
          </div>
        </div>

        {/* Motivational nudge if no activity */}
        {!hasActivity && (
          <motion.div
            className="mb-6 py-3 px-4 rounded-xl bg-[#C9A96E]/[0.04] border border-[#C9A96E]/8 hint-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p className="text-sm text-muted-foreground/50 font-light">
              Ваш внутренний голос ждёт вас — начните с дыхания или вытяните карту.
            </p>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Дыхание" value={`${breathingSessions.length} сессий`} symbol="◌" />
          <StatCard label="Тесты" value={`${completedTests.length} / 3`} symbol="◈" />
          <StatCard label="Карты" value={`${drawnCards.length} собрано`} symbol="✦" />
          <StatCard label="Дневник" value={`${journalEntries.length} записей`} symbol="✎" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ symbol, label, desc, onPress }: { symbol: string; label: string; desc: string; onPress: () => void }) {
  return (
    <motion.button
      onClick={onPress}
      className="group flex items-center gap-3 p-3.5 lg:p-4 rounded-xl border border-[#C9A96E]/10 hover:border-[#C9A96E]/25 hover:bg-[#C9A96E]/[0.03] transition-all duration-400 cursor-pointer text-left"
      whileTap={{ scale: 0.97 }}
    >
      <span className="text-lg opacity-50 group-hover:opacity-70 transition-opacity duration-400">{symbol}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-light text-foreground/70 group-hover:text-foreground/80 transition-colors duration-400 block">{label}</span>
        <span className="text-[11px] text-muted-foreground/45 font-light block">{desc}</span>
      </div>
    </motion.button>
  );
}

function StatCard({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-4 rounded-xl bg-[#F5F1EB]/60 border border-[#E0D8CC]/25">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm opacity-45">{symbol}</span>
        <span className="label-text">{label}</span>
      </div>
      <span className="text-base text-foreground/65 font-light">{value}</span>
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
