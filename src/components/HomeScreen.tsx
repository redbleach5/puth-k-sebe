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
    <div className="flex flex-col items-center px-5 pt-10 pb-28 min-h-screen">
      {/* Greeting + Streak */}
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extralight text-foreground/85">
            {getGreeting()}
          </h1>
          <p className="text-xs text-muted-foreground/50 font-light mt-1 tracking-wide">
            {level.symbol} {level.name} · {xp} XP
          </p>
        </div>
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#C9A96E]/[0.07]"
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-base">{streak.count > 0 ? "🔥" : "○"}</span>
          <span className="text-sm font-light text-foreground/70">{streak.count}</span>
        </motion.div>
      </div>

      {/* Streak message */}
      {streak.count >= 3 && (
        <motion.div
          className="w-full max-w-md mb-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs text-[#C9A96E]/60 font-light italic">
            {streak.count >= 7 ? "Неделя осознанности! Вы впечатляющи." : "Не прерывайте цепочку ✨"}
          </p>
        </motion.div>
      )}

      {/* Level Progress */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-muted-foreground/50 font-light tracking-wider">
            {level.symbol} {level.name}
          </span>
          {level.nextXp !== null && (
            <span className="text-[11px] text-muted-foreground/40 font-light">
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

      {/* Daily Affirmation */}
      <motion.div
        className="w-full max-w-md mb-8 p-6 rounded-2xl bg-gradient-to-br from-[#C9A96E]/[0.06] to-[#7A8B6F]/[0.04] border border-[#C9A96E]/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <p className="text-[10px] text-[#C9A96E]/40 font-light tracking-[0.2em] uppercase mb-3">
          Сегодняшняя аффирмация
        </p>
        <p className="text-base text-foreground/70 font-light leading-relaxed italic">
          {todayAffirmation}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-8">
        <QuickAction
          symbol="○"
          label="Подышать"
          onPress={() => onNavigate("breathe")}
        />
        <QuickAction
          symbol="✦"
          label="Карта дня"
          onPress={() => onNavigate("wisdom")}
        />
        <QuickAction
          symbol="◈"
          label="Новый тест"
          onPress={() => onNavigate("test")}
        />
        <QuickAction
          symbol="✎"
          label="Дневник"
          onPress={() => onNavigate("journal")}
        />
      </div>

      {/* Motivational nudge if no activity */}
      {!hasActivity && (
        <motion.div
          className="w-full max-w-md text-center mb-8 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <p className="text-sm text-muted-foreground/35 font-light italic">
            Ваш внутренний голос ждёт вас…
          </p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Дыхание" value={`${breathingSessions.length} сессий`} symbol="○" />
        <StatCard label="Тесты" value={`${completedTests.length} / 3`} symbol="◈" />
        <StatCard label="Карты" value={`${drawnCards.length} собрано`} symbol="✦" />
        <StatCard label="Дневник" value={`${journalEntries.length} записей`} symbol="✎" />
      </div>
    </div>
  );
}

function QuickAction({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <motion.button
      onClick={onPress}
      className="flex flex-col items-center gap-2.5 py-5 rounded-2xl border border-[#C9A96E]/10 hover:border-[#C9A96E]/25 hover:bg-[#C9A96E]/[0.03] transition-all duration-500 cursor-pointer"
      whileTap={{ scale: 0.96 }}
    >
      <span className="text-xl opacity-50">{symbol}</span>
      <span className="text-[11px] font-light text-muted-foreground/60 tracking-wide">{label}</span>
    </motion.button>
  );
}

function StatCard({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="p-4 rounded-xl bg-[#F0EBE3]/40 border border-[#E0D8CC]/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs opacity-40">{symbol}</span>
        <span className="text-[10px] text-muted-foreground/40 font-light tracking-wider uppercase">{label}</span>
      </div>
      <span className="text-sm text-foreground/60 font-light">{value}</span>
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
