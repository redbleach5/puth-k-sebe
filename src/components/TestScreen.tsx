"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tests, type TestData, type ResultType } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { MandalaRing, WaveBottom } from "@/components/SvgDecor";

type TestPhase = "select" | "quiz" | "transition" | "result";

function ResultView({ result, onBack }: { result: ResultType; onBack: () => void }) {
  const [showBut, setShowBut] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowBut(true), 4500); return () => clearTimeout(t); }, []);

  return (
    <motion.div className="relative flex flex-col items-center px-4 sm:px-6 pt-8 lg:pt-14 pb-20 lg:pb-8 min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
      <WaveBottom color={result.color} />
      <MandalaRing size={300} color={result.color} className="absolute -right-24 top-0 slow-spin hidden lg:block" />

      <div className="relative w-full max-w-xl z-10">
        <motion.div className="text-5xl sm:text-6xl mb-4 gentle-pulse text-center" style={{ color: result.color }} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1.2, type: "spring" }}>
          {result.symbol}
        </motion.div>

        <motion.h1 className="text-2xl sm:text-3xl font-light text-foreground/90 text-center mb-1.5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }}>
          {result.title}
        </motion.h1>

        <motion.p className="text-[15px] text-foreground/65 font-light text-center mb-5 max-w-md mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
          {result.subtitle}
        </motion.p>

        <motion.div className="max-w-lg mx-auto text-center mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}>
          <p className="body-text">{result.description}</p>
        </motion.div>

        <motion.div className="flex flex-col gap-2.5 mb-6 max-w-md mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}>
          {result.affirmations.map((a, i) => (
            <motion.div key={i} className="flex items-start gap-2.5 text-left" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 + i * 0.3, duration: 0.7 }}>
              <span className="text-[11px] mt-[5px] opacity-50" style={{ color: result.color }}>{result.symbol}</span>
              <span className="text-[13px] text-foreground/60 font-light">{a}</span>
            </motion.div>
          ))}
        </motion.div>

        {showBut && (
          <motion.div className="max-w-lg mx-auto text-center mb-10" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 2.5 }}>
            <div className="premium-divider mb-4" />
            <p className="text-[13px] text-foreground/50 font-light leading-[1.9] italic">{result.but}</p>
          </motion.div>
        )}

        <div className="text-center">
          <button onClick={onBack} className="text-[12px] tracking-[0.1em] text-foreground/50 font-light hover:text-foreground/70 transition-colors duration-300 cursor-pointer">
            Ко всем тестам
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestScreen() {
  const { completedTests, completeTest } = useStore();
  const [phase, setPhase] = useState<TestPhase>("select");
  const [activeTest, setActiveTest] = useState<TestData | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ResultType | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const startTest = useCallback((test: TestData) => {
    setActiveTest(test); setQuestionIndex(0); setAnswers([]); setResult(null); setSelected(null); setPhase("quiz");
  }, []);

  const handleAnswer = useCallback((value: number) => {
    if (!activeTest || selected !== null) return;
    const newAnswers = [...answers, value];
    setAnswers(newAnswers); setSelected(value);
    setTimeout(() => {
      if (questionIndex + 1 < activeTest.questions.length) {
        setQuestionIndex((prev) => prev + 1); setSelected(null);
      } else {
        setPhase("transition");
        setTimeout(() => {
          const counts = [0, 0, 0, 0];
          newAnswers.forEach((v) => { counts[v]++; });
          const maxIndex = counts.indexOf(Math.max(...counts));
          const r = activeTest.results[maxIndex];
          setResult(r); completeTest(activeTest.id); setPhase("result");
        }, 2500);
      }
    }, 700);
  }, [activeTest, answers, questionIndex, selected, completeTest]);

  const handleBack = useCallback(() => {
    setPhase("select"); setActiveTest(null); setAnswers([]); setQuestionIndex(0); setResult(null); setSelected(null);
  }, []);

  if (phase === "select") {
    return (
      <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-20 lg:pb-8 min-h-screen">
        <WaveBottom />
        <div className="relative w-full max-w-3xl z-10">
          <h2 className="text-xl sm:text-2xl font-light text-foreground/90 mb-0.5">Тесты</h2>
          <p className="text-[13px] text-foreground/60 font-light mb-4">Узнайте себя глубже</p>

          <div className="flex flex-col gap-2.5">
            {tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <motion.button key={test.id} onClick={() => startTest(test)}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-[#C9A96E]/10 hover:border-[#C9A96E]/22 hover:bg-[#C9A96E]/[0.03] transition-all duration-300 text-left cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300 mt-0.5">{test.symbol}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[14px] font-light text-foreground/78">{test.title}</h3>
                      {isCompleted && <span className="text-[10px] text-[#7A8B6F]/60 font-light">пройден</span>}
                    </div>
                    <p className="text-[13px] text-foreground/60 font-light mb-0.5">{test.subtitle}</p>
                    <p className="text-[12px] text-foreground/50 font-light leading-relaxed">{test.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {completedTests.length > 0 && (
            <p className="text-[12px] text-foreground/50 font-light mt-4">Пройдено {completedTests.length} из {tests.length}</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === "quiz" && activeTest) {
    const q = activeTest.questions[questionIndex];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 relative">
        <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between max-w-xl mx-auto">
          <button onClick={handleBack} className="text-[12px] text-foreground/55 font-light hover:text-foreground/75 transition-colors duration-300 cursor-pointer">← Назад</button>
          <div className="flex gap-1.5">
            {activeTest.questions.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i < questionIndex ? "bg-[#C9A96E]/55" : i === questionIndex ? "bg-[#C9A96E] scale-125" : "bg-[#C9A96E]/20"}`} />
            ))}
          </div>
        </div>

        <div className="text-[11px] tracking-[0.18em] text-foreground/50 mb-5 font-light uppercase">
          вопрос {questionIndex + 1} из {activeTest.questions.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={questionIndex} className="flex flex-col items-center max-w-xl w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground/90 text-center mb-1.5 leading-snug">{q.text}</h2>
            <p className="text-[13px] text-foreground/60 font-light text-center mb-8">{q.subtext}</p>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-sm">
              {q.options.map((opt, i) => (
                <motion.button key={i} onClick={() => handleAnswer(opt.value)}
                  className={`group flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    selected === opt.value ? "border-[#C9A96E]/50 bg-[#C9A96E]/[0.07] scale-[0.97]"
                    : selected !== null ? "border-transparent opacity-20 scale-[0.96]"
                    : "border-[#C9A96E]/12 hover:border-[#C9A96E]/28 hover:bg-[#C9A96E]/[0.03]"
                  }`}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.35 }}
                  disabled={selected !== null}
                >
                  <span className={`text-base transition-all duration-300 ${selected === opt.value ? "opacity-100 scale-110" : "opacity-50"}`}>{opt.symbol}</span>
                  <span className={`text-[13px] font-light transition-colors duration-300 ${selected === opt.value ? "text-foreground/80" : "text-foreground/62"}`}>{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "transition") {
    return (
      <motion.div className="flex flex-col items-center justify-center min-h-screen px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}>
        <motion.div className="w-3 h-3 rounded-full bg-[#C9A96E]/20 mb-6" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 12, 18], opacity: [0, 0.12, 0] }} transition={{ delay: 0.3, duration: 3, ease: "easeOut" }} />
        <p className="text-2xl font-light text-foreground/60">Выдохните...</p>
      </motion.div>
    );
  }

  if (phase === "result" && result) return <ResultView result={result} onBack={handleBack} />;
  return null;
}
