"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { achievements, levels, tests, oracleCards } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/components/AuthProvider";
import { usePremium } from "@/hooks/use-premium";
import { MandalaRing, WaveBottom, SacredGeometry, DotGrid } from "@/components/SvgDecor";

interface ProfileScreenProps {
  onShowAuthModal?: () => void;
  onShowPremiumModal?: () => void;
}

export default function ProfileScreen({ onShowAuthModal, onShowPremiumModal }: ProfileScreenProps) {
  const { xp, streak, completedTests, drawnCards, breathingSessions, journalEntries, unlockedAchievements, getLevel, reset } = useStore();
  const { user, subscription, isPremium, logout } = useAuth();
  const { featureLimits, getFeatureLimit } = usePremium();
  const [showReset, setShowReset] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const level = getLevel();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const planLabel = isPremium
    ? subscription?.plan === "yearly"
      ? "Годовая подписка"
      : "Ежемесячная подписка"
    : "Бесплатный план";

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-24 lg:pb-8 min-h-screen">
      <MandalaRing size={280} className="absolute -right-20 -top-8 slow-spin hidden lg:block" />
      <SacredGeometry size={220} className="absolute -left-16 bottom-40 drift-slow hidden lg:block" color="#7A8B6F" />
      <DotGrid className="absolute right-0 top-20 h-64 w-24 hidden lg:block" />
      <WaveBottom />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-1">Профиль</h2>
        <p className="text-[15px] text-foreground/80 font-normal mb-5">Ваш путь</p>

        {/* User info section */}
        {user ? (
          <motion.div
            className="p-5 lg:p-6 rounded-xl premium-card-elevated mb-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#7A8B6F]/20 border border-[#C9A96E]/20 flex items-center justify-center shrink-0">
                <span className="text-lg text-[#C9A96E]">
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-foreground/90 truncate">
                  {user.name || "Пользователь"}
                </h3>
                <p className="text-[13px] text-foreground/55 font-normal truncate">{user.email}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="p-5 rounded-xl premium-card mb-5 text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[14px] text-foreground/65 font-normal mb-3">
              Войдите, чтобы сохранить прогресс и синхронизировать данные
            </p>
            <button
              onClick={onShowAuthModal}
              className="h-10 px-6 rounded-lg bg-gradient-to-r from-[#C9A96E]/85 to-[#7A8B6F]/85 text-white text-[14px] font-medium transition-all duration-300 hover:from-[#C9A96E] hover:to-[#7A8B6F] cursor-pointer shadow-sm"
            >
              Войти
            </button>
          </motion.div>
        )}

        {/* Subscription status card */}
        <motion.div
          className={`p-5 lg:p-6 rounded-xl mb-5 ${
            isPremium
              ? "bg-gradient-to-br from-[#C9A96E]/[0.08] to-[#7A8B6F]/[0.06] border border-[#C9A96E]/25"
              : "premium-card"
          }`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isPremium
                ? "bg-[#C9A96E]/15 border border-[#C9A96E]/25"
                : "bg-[#E0D8CC]/20 border border-[#E0D8CC]/30"
            }`}>
              <span className="text-[16px]">{isPremium ? "✦" : "○"}</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-[15px] font-medium ${isPremium ? "text-[#C9A96E]" : "text-foreground/80"}`}>
                {isPremium ? "Премиум план" : "Бесплатный план"}
              </h3>
              <p className="text-[12px] text-foreground/55 font-normal">
                {isPremium ? planLabel : "Обновите для полного доступа"}
              </p>
            </div>
          </div>

          {isPremium && renewalDate && (
            <p className="text-[12px] text-foreground/50 font-normal mb-3">
              Продление: {renewalDate}
              {subscription?.cancelAtPeriodEnd && " · Отменена"}
            </p>
          )}

          {/* Free tier limits overview */}
          {!isPremium && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <LimitItem
                label="Карты в день"
                value={`${getFeatureLimit("cardDrawsPerDay")}`}
              />
              <LimitItem
                label="Дыхание"
                value={`${getFeatureLimit("breathingPresets")} из 5`}
              />
              <LimitItem
                label="Тесты"
                value={`${getFeatureLimit("testsAvailable")} из 5`}
              />
              <LimitItem
                label="Статистика"
                value={`${getFeatureLimit("statsHistory")} дней`}
              />
            </div>
          )}

          {isPremium ? (
            <button
              onClick={handleManageSubscription}
              className="h-9 px-4 rounded-lg border border-[#C9A96E]/25 bg-[#C9A96E]/[0.06] text-[13px] text-foreground/70 font-normal hover:bg-[#C9A96E]/[0.12] hover:border-[#C9A96E]/35 transition-all duration-300 cursor-pointer"
            >
              Управлять подпиской
            </button>
          ) : (
            <button
              onClick={onShowPremiumModal}
              className="h-10 px-6 rounded-lg bg-gradient-to-r from-[#C9A96E]/85 to-[#7A8B6F]/85 text-white text-[14px] font-medium transition-all duration-300 hover:from-[#C9A96E] hover:to-[#7A8B6F] cursor-pointer shadow-sm"
            >
              Обновить
            </button>
          )}
        </motion.div>

        {/* Level card */}
        <motion.div className="p-5 lg:p-6 rounded-xl premium-card-elevated mb-5"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
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
          <StatBlock label="Тесты" value={`${completedTests.length}/${tests.length}`} symbol="◈" />
          <StatBlock label="Карты" value={`${drawnCards.length}/${oracleCards.length}`} symbol="✦" />
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

        {/* Actions */}
        <div className="pt-4 border-t border-[#C9A96E]/12">
          <div className="flex flex-col gap-2">
            {/* Reset progress */}
            {!showReset ? (
              <button onClick={() => setShowReset(true)} className="text-[12px] text-foreground/45 font-normal hover:text-foreground/65 transition-colors duration-300 cursor-pointer text-left">Сбросить прогресс</button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-foreground/70 font-normal">Точно?</span>
                <button onClick={() => { reset(); setShowReset(false); }} className="text-[13px] text-red-400/60 font-normal hover:text-red-400/85 transition-colors duration-300 cursor-pointer">Да, сбросить</button>
                <button onClick={() => setShowReset(false)} className="text-[13px] text-foreground/65 font-normal hover:text-foreground/85 transition-colors duration-300 cursor-pointer">Нет</button>
              </div>
            )}

            {/* Logout */}
            {user && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-[12px] text-foreground/45 font-normal hover:text-foreground/65 transition-colors duration-300 cursor-pointer text-left disabled:opacity-50"
              >
                {loggingOut ? "Выходим..." : "Выйти"}
              </button>
            )}
          </div>
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

function LimitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-[#E0D8CC]/10 border border-[#E0D8CC]/15">
      <p className="text-[11px] text-foreground/50 font-normal mb-0.5">{label}</p>
      <p className="text-[13px] text-foreground/70 font-medium">{value}</p>
    </div>
  );
}
