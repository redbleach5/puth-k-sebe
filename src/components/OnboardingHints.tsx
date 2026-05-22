"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const hints = [
  {
    id: "welcome",
    title: "Добро пожаловать",
    text: "Это пространство для осознанности. Дышите, исследуйте, узнавайте себя — в своём ритме.",
  },
  {
    id: "breathe",
    title: "Начните с дыхания",
    text: "Раздел «Дыши» — ваш первый шаг. Выберите практику и позвольте телу замедлиться.",
  },
  {
    id: "test",
    title: "Узнайте себя глубже",
    text: "Тесты помогают увидеть то, что скрыто за повседневностью. Ответы приходят изнутри.",
  },
  {
    id: "wisdom",
    title: "Карта дня",
    text: "Каждый день — три карты с посланием. Слушайте то, что резонирует.",
  },
];

export default function OnboardingHints() {
  const [visible, setVisible] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasShown = localStorage.getItem("onboarding-shown");
    if (!wasShown) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("onboarding-shown", "true");
    setTimeout(() => setVisible(false), 400);
  };

  const handleNext = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  const hint = hints[currentHint];

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-4 lg:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#2C2C2C]/25 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Card */}
          <motion.div
            className="relative max-w-md w-full rounded-2xl bg-white/92 backdrop-blur-xl border border-[#C9A96E]/18 p-7 lg:p-8 shadow-lg shadow-[#C9A96E]/[0.05]"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Progress dots */}
            <div className="flex gap-1.5 mb-5">
              {hints.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === currentHint
                      ? "w-7 bg-[#C9A96E]/60"
                      : i < currentHint
                      ? "w-2 bg-[#C9A96E]/35"
                      : "w-2 bg-[#E0D8CC]/45"
                  }`}
                />
              ))}
            </div>

            <h3 className="text-lg font-normal text-foreground/90 mb-2.5">
              {hint.title}
            </h3>
            <p className="body-text mb-7">
              {hint.text}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={handleDismiss}
                className="text-sm text-foreground/55 font-normal hover:text-foreground/78 transition-colors duration-300 cursor-pointer"
              >
                Пропустить
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 text-sm font-normal tracking-wide text-foreground/80 border border-[#C9A96E]/30 rounded-full hover:border-[#C9A96E]/50 hover:text-foreground/95 transition-all duration-300 cursor-pointer"
              >
                {currentHint < hints.length - 1 ? "Далее" : "Начать"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
