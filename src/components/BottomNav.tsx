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
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[78px] flex-col items-center py-8 z-50 border-r border-[#C9A96E]/12 bg-[#FAF8F5]/92 backdrop-blur-xl">
        {/* Logo mark */}
        <div className="mb-10 flex items-center justify-center w-11 h-11 rounded-full border border-[#C9A96E]/30">
          <span className="text-lg text-[#C9A96E]">○</span>
        </div>

        <nav className="flex flex-col items-center gap-2 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`group relative flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl transition-all duration-300 cursor-pointer w-full ${
                active === tab.id
                  ? "text-[#C9A96E]"
                  : "text-[#8A8478]/65 hover:text-[#8A8478]/90"
              }`}
              title={tab.label}
            >
              <span className={`text-lg transition-all duration-300 ${active === tab.id ? "scale-115" : ""}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-normal tracking-wider">{tab.label}</span>
              {active === tab.id && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-[#C9A96E]/70"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom accent */}
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/35 to-transparent" />
      </aside>

      {/* Mobile Bottom Nav — visible below lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/92 backdrop-blur-xl border-t border-[#C9A96E]/12">
        <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                active === tab.id
                  ? "text-[#C9A96E]"
                  : "text-[#8A8478]/65 hover:text-[#8A8478]/90"
              }`}
            >
              <span className={`text-lg transition-all duration-300 ${active === tab.id ? "scale-115" : ""}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-normal tracking-wider">{tab.label}</span>
              {active === tab.id && (
                <motion.div
                  layoutId="nav-indicator"
                  className="w-5 h-[2px] rounded-full bg-[#C9A96E]/70 mt-0.5"
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
