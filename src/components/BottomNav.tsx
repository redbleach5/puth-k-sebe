"use client";

import { motion } from "framer-motion";

export type Screen = "home" | "breathe" | "test" | "wisdom" | "journal" | "profile";

const tabs: { id: Screen; label: string; icon: string }[] = [
  { id: "home", label: "Дом", icon: "○" },
  { id: "breathe", label: "Дыши", icon: "◌" },
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
    <>
      {/* Desktop Sidebar — visible lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[72px] flex-col items-center py-8 z-50 border-r border-[#E0D8CC]/40 bg-[#FAF8F5]/90 backdrop-blur-xl">
        {/* Logo mark */}
        <div className="mb-8 flex items-center justify-center w-10 h-10 rounded-full border border-[#C9A96E]/25">
          <span className="text-lg text-[#C9A96E]/70">○</span>
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`group relative flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl transition-all duration-300 cursor-pointer w-full ${
                active === tab.id
                  ? "text-[#C9A96E]"
                  : "text-[#8A8478]/45 hover:text-[#8A8478]/70"
              }`}
              title={tab.label}
            >
              <span className={`text-lg transition-all duration-300 ${active === tab.id ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className="text-[9px] font-light tracking-wider">{tab.label}</span>
              {active === tab.id && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#C9A96E]/50"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom accent */}
        <div className="w-6 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />
      </aside>

      {/* Mobile Bottom Nav — visible below lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/85 backdrop-blur-xl border-t border-[#E0D8CC]/40">
        <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                active === tab.id
                  ? "text-[#C9A96E]"
                  : "text-[#8A8478]/45 hover:text-[#8A8478]/70"
              }`}
            >
              <span className={`text-lg transition-all duration-300 ${active === tab.id ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className="text-[9px] font-light tracking-wider">{tab.label}</span>
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
    </>
  );
}
