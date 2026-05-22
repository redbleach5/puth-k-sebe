"use client";

import { motion } from "framer-motion";

export type Screen = "home" | "breathe" | "test" | "wisdom" | "journal" | "profile";

const tabs: { id: Screen; label: string; icon: string }[] = [
  { id: "home", label: "Дом", icon: "⌂" },
  { id: "breathe", label: "Дыши", icon: "○" },
  { id: "test", label: "Тест", icon: "◈" },
  { id: "wisdom", label: "Мудрость", icon: "✦" },
  { id: "journal", label: "Дневник", icon: "✎" },
  { id: "profile", label: "Профиль", icon: "◉" },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (screen: Screen) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/80 backdrop-blur-xl border-t border-[#E0D8CC]/40">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-500 cursor-pointer ${
              active === tab.id
                ? "text-[#C9A96E]"
                : "text-[#8A8478]/50 hover:text-[#8A8478]/70"
            }`}
          >
            <span className={`text-lg transition-all duration-500 ${active === tab.id ? "scale-110" : ""}`}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-light tracking-wider">
              {tab.label}
            </span>
            {active === tab.id && (
              <motion.div
                layoutId="nav-indicator"
                className="w-4 h-[2px] rounded-full bg-[#C9A96E]/60 mt-0.5"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
