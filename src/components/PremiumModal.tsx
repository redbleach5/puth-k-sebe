"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  { icon: "✦", text: "Безлимитные карты оракула" },
  { icon: "◈", text: "Все тесты и результаты" },
  { icon: "✎", text: "Расширенный дневник настроений" },
  { icon: "◌", text: "Эксклюзивные дыхательные практики" },
  { icon: "◎", text: "Персональная статистика" },
  { icon: "⟳", text: "Синхронизация между устройствами" },
];

const plans = [
  {
    id: "monthly" as const,
    name: "Ежемесячно",
    price: "299₽",
    period: "/мес",
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? "",
    badge: null,
  },
  {
    id: "yearly" as const,
    name: "Годовая",
    price: "2 390₽",
    period: "/год",
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID ?? "",
    badge: "Экономия 33%",
  },
];

export default function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: "monthly" | "yearly", priceId: string) => {
    if (!user) {
      setError("Войдите в аккаунт, чтобы оформить подписку");
      return;
    }

    if (!priceId) {
      setError("Оплата временно недоступна. Попробуйте позже.");
      return;
    }

    setError(null);
    setLoadingPlan(planId);

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при создании сессии оплаты");
        return;
      }

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch {
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#FAF8F5] border-[#C9A96E]/20 rounded-2xl p-0 overflow-hidden">
        {/* Decorative top gradient */}
        <div className="relative px-6 pt-6 pb-3">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C9A96E]/30 via-[#C9A96E]/60 to-[#C9A96E]/30" />
          {/* Decorative circle */}
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A96E]/15 to-[#7A8B6F]/15 border border-[#C9A96E]/20 flex items-center justify-center">
              <span className="text-2xl text-[#C9A96E]">✦</span>
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-light text-foreground/90 tracking-tight">
              Расширьте свой путь
            </DialogTitle>
            <DialogDescription className="text-center text-[13px] text-foreground/55">
              Откройте полный потенциал приложения
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 gap-2">
            {benefits.map((b, i) => (
              <motion.div
                key={b.text}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="flex items-center gap-2.5 py-1"
              >
                <span className="text-[13px] text-[#C9A96E] w-5 text-center">{b.icon}</span>
                <span className="text-[13px] text-foreground/75 font-normal">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="premium-divider" />
        </div>

        {/* Plan cards */}
        <div className="px-6 pt-4 pb-2">
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-600/80">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan) => (
              <motion.button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id, plan.priceId)}
                disabled={loadingPlan !== null}
                className={`relative flex flex-col p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                  plan.badge
                    ? "border-[#C9A96E]/30 bg-gradient-to-b from-[#C9A96E]/[0.06] to-[#C9A96E]/[0.02] hover:border-[#C9A96E]/45 hover:from-[#C9A96E]/[0.10] hover:to-[#C9A96E]/[0.04]"
                    : "border-[#E0D8CC]/40 bg-white/60 hover:border-[#C9A96E]/25 hover:bg-white/80"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                whileTap={{ scale: 0.97 }}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#C9A96E] text-white text-[10px] font-medium rounded-full tracking-wider">
                    {plan.badge}
                  </span>
                )}
                <span className="text-[13px] font-medium text-foreground/80 mb-1">
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-[22px] font-light text-foreground/90">{plan.price}</span>
                  <span className="text-[12px] text-foreground/50 font-normal">{plan.period}</span>
                </div>
                <span className={`mt-auto py-2 rounded-lg text-[12px] font-medium text-center transition-all duration-300 ${
                  plan.badge
                    ? "bg-[#C9A96E]/85 text-white hover:bg-[#C9A96E]"
                    : "bg-[#7A8B6F]/85 text-white hover:bg-[#7A8B6F]"
                }`}>
                  {loadingPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Загрузка...
                    </span>
                  ) : (
                    "Выбрать план"
                  )}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Free tier link */}
        <div className="px-6 pb-5 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-[12px] text-foreground/40 font-normal hover:text-foreground/60 transition-colors duration-300 cursor-pointer py-2"
          >
            Продолжить бесплатно
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
