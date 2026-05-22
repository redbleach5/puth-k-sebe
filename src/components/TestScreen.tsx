"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tests, type TestData, type ResultType } from "@/lib/data";
import { useStore } from "@/store/useStore";

type TestPhase = "select" | "quiz" | "transition" | "result";

// ─── Result View (separate component for proper hooks) ───────────────────────

function ResultView({ result, onBack }: { result: ResultType; onBack: () => void }) {
  const [showBut, setShowBut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBut(true), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center px-5 pt-16 pb-28 min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
    >
      {/* Symbol */}
      <motion.div
        className="text-6xl mb-6 gentle-pulse"
        style={{ color: result.color }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 1.2, type: "spring" }}
      >
        {result.symbol}
      </motion.div>

      <motion.h1
        className="text-3xl font-extralight text-foreground/85 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        {result.title}
      </motion.h1>

      <motion.p
        className="text-base text-muted-foreground/55 font-light text-center mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        {result.subtitle}
      </motion.p>

      <motion.div
        className="max-w-lg text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <p className="text-[15px] text-foreground/60 font-light leading-[1.8]">{result.description}</p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-3 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
      >
        {result.affirmations.map((a, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 text-left"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.5 + i * 0.3, duration: 0.7 }}
          >
            <span className="text-[10px] mt-[7px] opacity-50" style={{ color: result.color }}>{result.symbol}</span>
            <span className="text-sm text-foreground/50 font-light">{a}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* The "Но" */}
      {showBut && (
        <motion.div
          className="max-w-lg text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.5 }}
        >
          <div className="w-16 h-px mx-auto mb-6" style={{ background: `${result.color}25` }} />
          <p className="text-[13px] text-muted-foreground/35 font-light leading-[2] italic">{result.but}</p>
        </motion.div>
      )}

      <button
        onClick={onBack}
        className="text-xs tracking-[0.15em] text-muted-foreground/30 font-light hover:text-muted-foreground/55 transition-colors duration-500 cursor-pointer"
      >
        Ко всем тестам
      </button>
    </motion.div>
  );
}

// ─── Main TestScreen ─────────────────────────────────────────────────────────

export default function TestScreen() {
  const { completedTests, completeTest } = useStore();
  const [phase, setPhase] = useState<TestPhase>("select");
  const [activeTest, setActiveTest] = useState<TestData | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ResultType | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const startTest = useCallback((test: TestData) => {
    setActiveTest(test);
    setQuestionIndex(0);
    setAnswers([]);
    setResult(null);
    setSelected(null);
    setPhase("quiz");
  }, []);

  const handleAnswer = useCallback(
    (value: number) => {
      if (!activeTest) return;
      if (selected !== null) return;

      const newAnswers = [...answers, value];
      setAnswers(newAnswers);
      setSelected(value);

      setTimeout(() => {
        if (questionIndex + 1 < activeTest.questions.length) {
          setQuestionIndex((prev) => prev + 1);
          setSelected(null);
        } else {
          setPhase("transition");
          setTimeout(() => {
            const counts = [0, 0, 0, 0];
            newAnswers.forEach((v) => { counts[v]++; });
            const maxIndex = counts.indexOf(Math.max(...counts));
            const r = activeTest.results[maxIndex];
            setResult(r);
            completeTest(activeTest.id);
            setPhase("result");
          }, 2500);
        }
      }, 700);
    },
    [activeTest, answers, questionIndex, selected, completeTest]
  );

  const handleBack = useCallback(() => {
    setPhase("select");
    setActiveTest(null);
    setAnswers([]);
    setQuestionIndex(0);
    setResult(null);
    setSelected(null);
  }, []);

  // ─── Test Selection ────────────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div className="flex flex-col items-center px-5 pt-10 pb-28 min-h-screen">
        <h2 className="text-2xl font-extralight text-foreground/80 mb-2">Тесты</h2>
        <p className="text-xs text-muted-foreground/40 font-light tracking-wider mb-8">
          Узнайте себя глубже
        </p>

        <div className="w-full max-w-md flex flex-col gap-4">
          {tests.map((test) => {
            const isCompleted = completedTests.includes(test.id);
            return (
              <motion.button
                key={test.id}
                onClick={() => startTest(test)}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-[#C9A96E]/12 hover:border-[#C9A96E]/30 hover:bg-[#C9A96E]/[0.03] transition-all duration-500 text-left cursor-pointer"
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 mt-1">
                  {test.symbol}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-light text-foreground/75">{test.title}</h3>
                    {isCompleted && <span className="text-[10px] text-[#7A8B6F]/50 font-light">✓</span>}
                  </div>
                  <p className="text-sm text-muted-foreground/50 font-light mb-2">{test.subtitle}</p>
                  <p className="text-[11px] text-muted-foreground/35 font-light leading-relaxed">{test.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {completedTests.length > 0 && (
          <p className="text-[11px] text-muted-foreground/30 font-light mt-6">
            Пройдено {completedTests.length} из {tests.length}
          </p>
        )}
      </div>
    );
  }

  // ─── Quiz ──────────────────────────────────────────────────────────────────

  if (phase === "quiz" && activeTest) {
    const q = activeTest.questions[questionIndex];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5 relative">
        <div className="absolute top-8 flex gap-2">
          {activeTest.questions.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                i < questionIndex ? "bg-[#C9A96E]/60" : i === questionIndex ? "bg-[#C9A96E] scale-125" : "bg-[#C9A96E]/20"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleBack}
          className="absolute top-8 left-5 text-xs text-muted-foreground/30 font-light hover:text-muted-foreground/50 transition-colors duration-500 cursor-pointer"
        >
          ← Назад
        </button>

        <div className="text-[11px] tracking-[0.3em] text-muted-foreground/35 mb-8 font-light uppercase">
          вдох {questionIndex + 1} из {activeTest.questions.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-2xl sm:text-3xl font-extralight text-foreground/85 text-center mb-3 leading-snug max-w-lg">
              {q.text}
            </h2>
            <p className="text-sm text-muted-foreground/50 font-light text-center mb-12">{q.subtext}</p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {q.options.map((opt, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(opt.value)}
                  className={`group flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border transition-all duration-500 cursor-pointer ${
                    selected === opt.value
                      ? "border-[#C9A96E]/50 bg-[#C9A96E]/[0.07] scale-[0.97]"
                      : selected !== null
                      ? "border-transparent opacity-20 scale-[0.96]"
                      : "border-[#C9A96E]/12 hover:border-[#C9A96E]/35 hover:bg-[#C9A96E]/[0.03]"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
                  disabled={selected !== null}
                >
                  <span className={`text-xl transition-all duration-500 ${selected === opt.value ? "opacity-100 scale-110" : "opacity-40"}`}>
                    {opt.symbol}
                  </span>
                  <span className={`text-sm font-light transition-colors duration-500 ${selected === opt.value ? "text-foreground/80" : "text-muted-foreground/55"}`}>
                    {opt.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ─── Transition ────────────────────────────────────────────────────────────

  if (phase === "transition") {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-screen px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
      >
        <motion.div
          className="w-3 h-3 rounded-full bg-[#C9A96E]/20 mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 12, 18], opacity: [0, 0.12, 0] }}
          transition={{ delay: 0.3, duration: 3, ease: "easeOut" }}
        />
        <p className="text-2xl font-extralight text-foreground/50">Выдохните…</p>
      </motion.div>
    );
  }

  // ─── Result ────────────────────────────────────────────────────────────────

  if (phase === "result" && result) {
    return <ResultView result={result} onBack={handleBack} />;
  }

  return null;
}
