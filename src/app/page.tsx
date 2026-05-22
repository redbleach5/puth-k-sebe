"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "intro" | "quiz" | "transition" | "result";

interface Question {
  text: string;
  subtext: string;
  options: { label: string; symbol: string; value: number }[];
}

interface ResultType {
  title: string;
  subtitle: string;
  description: string;
  affirmations: string[];
  but: string;
  color: string;
  symbol: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const questions: Question[] = [
  {
    text: "Когда вы закрываете глаза, что вы видите?",
    subtext: "Не думайте. Просто почувствуйте.",
    options: [
      { label: "Свет", symbol: "✦", value: 0 },
      { label: "Тьму", symbol: "●", value: 1 },
      { label: "Цвета", symbol: "◈", value: 2 },
      { label: "Ничего", symbol: "○", value: 3 },
    ],
  },
  {
    text: "Какой звук вас успокаивает?",
    subtext: "Прислушайтесь к тишине между словами.",
    options: [
      { label: "Шум дождя", symbol: "☁", value: 0 },
      { label: "Тишина", symbol: "◌", value: 1 },
      { label: "Пение птиц", symbol: "♬", value: 2 },
      { label: "Шум ветра", symbol: "≈", value: 3 },
    ],
  },
  {
    text: "Где живёт ваше счастье?",
    subtext: "Оно ближе, чем кажется.",
    options: [
      { label: "В сердце", symbol: "♡", value: 0 },
      { label: "В мыслях", symbol: "◈", value: 1 },
      { label: "В людях", symbol: "⬡", value: 2 },
      { label: "В моменте", symbol: "◉", value: 3 },
    ],
  },
  {
    text: "Что вы отпускаете прямо сейчас?",
    subtext: "Выдохните. Пусть уйдёт.",
    options: [
      { label: "Страх", symbol: "◇", value: 0 },
      { label: "Сомнения", symbol: "▽", value: 1 },
      { label: "Прошлое", symbol: "△", value: 2 },
      { label: "Ожидания", symbol: "◎", value: 3 },
    ],
  },
  {
    text: "Каково ваше отношение к тишине?",
    subtext: "Она говорит на своём языке.",
    options: [
      { label: "Она — друг", symbol: "⟐", value: 0 },
      { label: "Она — учитель", symbol: "△", value: 1 },
      { label: "Она — вызов", symbol: "◇", value: 2 },
      { label: "Она — свобода", symbol: "○", value: 3 },
    ],
  },
  {
    text: "Если бы ваша душа была временем года…",
    subtext: "Не выбирайте. Дайте ей самой ответить.",
    options: [
      { label: "Весна", symbol: "❀", value: 0 },
      { label: "Лето", symbol: "✺", value: 2 },
      { label: "Осень", symbol: "❋", value: 1 },
      { label: "Зима", symbol: "✻", value: 3 },
    ],
  },
  {
    text: "Последний вдох. Что вы чувствуете?",
    subtext: "Позвольте этому чувству быть.",
    options: [
      { label: "Благодарность", symbol: "♡", value: 0 },
      { label: "Покой", symbol: "○", value: 1 },
      { label: "Лёгкость", symbol: "◇", value: 3 },
      { label: "Любовь", symbol: "✦", value: 2 },
    ],
  },
];

const results: ResultType[] = [
  {
    title: "Светлое сердце",
    subtitle: "Вы — тот, кто видит красоту повсюду",
    description:
      "Ваш внутренний компас настроен на свет. Там, где другие замечают тени, вы находите золотые лучи. Ваша энергия согревает пространство вокруг, и люди тянутся к вам, как подсолнухи к солнцу. Вы умеете превращать обыденное в прекрасное одним лишь взглядом.",
    affirmations: [
      "Ваш свет — не случайность, а природа",
      "Вы создаёте тепло, просто присутствуя",
      "Мир становится ярче, когда вы в нём",
    ],
    but: "Но помните: даже самый ясный свет иногда нуждается в тени, чтобы его могли увидеть другие. Позвольте себе не сиять — это тоже красиво.",
    color: "#C9A96E",
    symbol: "✦",
  },
  {
    title: "Тихий мудрец",
    subtitle: "Вы находите мудрость в неподвижности",
    description:
      "Ваша сила — в глубоком слушании. Там, где другие спешат говорить, вы выбираете молчание — и в нём находите ответы, недоступные суетливому уму. Ваша мудрость не кричит, она шепчет, и те, кто готов услышать, приходят к вам сами. Вы как древнее дерево — корни глубоки, крона щедра.",
    affirmations: [
      "Ваша тишина — не пустота, а полнота",
      "Мудрость приходит к тем, кто умеет ждать",
      "Ваш покой — это дар, а не отсутствие",
    ],
    but: "Но помните: даже глубокой реке нужен берег, чтобы сохранить направление. Позвольте другим стать вашими берегами.",
    color: "#7A8B6F",
    symbol: "◈",
  },
  {
    title: "Вольный ветер",
    subtitle: "Вы — свободны, как сама жизнь",
    description:
      "Вы не принадлежите ни одному месту — и потому принадлежите всему миру. Ваша свобода не отталкивает, а вдохновляет. Вы как весенний ветер, который приносит с собой перемены, новые запахи, далёкие истории. Рядом с вами люди чувствуют, что возможно всё — нужно лишь решиться.",
    affirmations: [
      "Ваша свобода — источник вдохновения",
      "Вы приносите перемены туда, куда приходите",
      "Даже ветер возвращается к тем, кого любит",
    ],
    but: "Но помните: даже вольный ветер иногда устаёт и ищет место, где можно замереть. Быть рядом — не значит потерять свободу.",
    color: "#8B7D6B",
    symbol: "≈",
  },
  {
    title: "Тёплый корень",
    subtitle: "Вы — основа, на которой стоит многое",
    description:
      "Ваша глубина — как корни древнего дерева: невидима, но без неё ничего бы не стояло. Вы создаёте пространство, в котором другим безопасно расти. Ваша забота — не жест, а сущность. Вы знаете, что настоящая сила — в том, чтобы держать, не удерживая.",
    affirmations: [
      "Ваша глубина — опора для многих",
      "Вы создаёте дом там, где находитесь",
      "Корень питает дерево, даже когда его не видят",
    ],
    but: "Но помните: даже самый глубокий корень нуждается в солнце. Позвольте себе тянуться вверх — не только вниз.",
    color: "#A3B088",
    symbol: "⬡",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateResult(answers: number[]): ResultType {
  const counts = [0, 0, 0, 0];
  answers.forEach((v) => {
    counts[v]++;
  });
  const maxIndex = counts.indexOf(Math.max(...counts));
  return results[maxIndex];
}

// ─── SVG Mandala ─────────────────────────────────────────────────────────────

function Mandala({ color, opacity = 0.08 }: { color: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      {/* Outer ring */}
      <circle cx="200" cy="200" r="190" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="200" cy="200" r="170" fill="none" stroke={color} strokeWidth="0.3" />
      {/* Petals */}
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 30} 200 200)`}>
          <ellipse
            cx="200"
            cy="80"
            rx="18"
            ry="55"
            fill="none"
            stroke={color}
            strokeWidth="0.4"
          />
        </g>
      ))}
      {/* Inner petals */}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45 + 22.5} 200 200)`}>
          <ellipse
            cx="200"
            cy="130"
            rx="12"
            ry="35"
            fill="none"
            stroke={color}
            strokeWidth="0.3"
          />
        </g>
      ))}
      {/* Center circles */}
      <circle cx="200" cy="200" r="30" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="200" cy="200" r="15" fill="none" stroke={color} strokeWidth="0.3" />
      {/* Center dot */}
      <circle cx="200" cy="200" r="3" fill={color} />
      {/* Radial lines */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="200"
          y1="45"
          x2="200"
          y2="30"
          stroke={color}
          strokeWidth="0.3"
          transform={`rotate(${i * 15} 200 200)`}
        />
      ))}
    </svg>
  );
}

// ─── Ambient Canvas ──────────────────────────────────────────────────────────

function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];

    const createParticle = (): Particle => ({
      x: Math.random() * width,
      y: height + 10,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.2 + Math.random() * 0.5),
      size: 1 + Math.random() * 2,
      opacity: 0,
      life: 0,
      maxLife: 300 + Math.random() * 400,
    });

    // Start with some particles already in scene
    for (let i = 0; i < 15; i++) {
      const p = createParticle();
      p.y = Math.random() * height;
      p.life = Math.random() * p.maxLife;
      p.opacity = 0.15;
      particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (Math.random() < 0.03 && particles.length < 25) {
        particles.push(createParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        if (progress < 0.1) {
          p.opacity = progress * 1.5;
        } else if (progress > 0.8) {
          p.opacity = (1 - progress) * 5;
        } else {
          p.opacity = 0.15;
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${p.opacity * 0.5})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

// ─── Breathing Circle ────────────────────────────────────────────────────────

function BreathingCircle() {
  return (
    <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64">
      {/* Outermost aura */}
      <div
        className="absolute rounded-full breathe-ring"
        style={{
          inset: "-10%",
          background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)",
        }}
      />
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full breathe-ring bg-gradient-to-br from-[#C9A96E]/15 to-[#7A8B6F]/15" />
      {/* Middle ring */}
      <div
        className="absolute rounded-full breathe-ring bg-gradient-to-br from-[#C9A96E]/12 to-[#7A8B6F]/12"
        style={{ inset: "18%", animationDelay: "0.6s" }}
      />
      {/* Core */}
      <div className="breathe-circle absolute inset-[28%] rounded-full bg-gradient-to-br from-[#C9A96E]/25 to-[#7A8B6F]/30 backdrop-blur-[1px]" />
      {/* Inner glow */}
      <div className="absolute inset-[38%] rounded-full bg-gradient-to-br from-[#C9A96E]/15 to-[#7A8B6F]/20 breathe-circle" style={{ animationDelay: "0.3s" }} />
      {/* Center dot */}
      <div className="absolute w-2 h-2 rounded-full bg-[#C9A96E]/70 gentle-pulse" />
    </div>
  );
}

// ─── Drawing Line ────────────────────────────────────────────────────────────

function DrawingLine({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      className="w-16 h-px mx-auto"
      style={{ background: color }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 0.4 }}
      transition={{ delay, duration: 1.5, ease: "easeInOut" }}
    />
  );
}

// ─── Intro Phase ─────────────────────────────────────────────────────────────

function IntroPhase({ onStart }: { onStart: () => void }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8 }}
    >
      {/* Breathing circle */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 2 }}
      >
        <BreathingCircle />
      </motion.div>

      {/* Breathing text */}
      <motion.div
        className="breathe-text text-[11px] tracking-[0.35em] text-muted-foreground/50 mb-8 font-light uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
      >
        вдох · выдох · вдох · выдох
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl font-extralight tracking-tight text-foreground/85 mb-5 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1.5 }}
      >
        Путь к себе
      </motion.h1>

      {/* Decorative line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <DrawingLine color="#C9A96E" delay={1.3} />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-base sm:text-lg text-muted-foreground/70 font-light text-center max-w-md mt-6 mb-14 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1.2 }}
      >
        Закройте глаза. Сделайте вдох.
        <br />
        И найдите свой путь.
      </motion.p>

      {/* Start button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            onClick={onStart}
            className="group relative px-12 py-4 text-[13px] tracking-[0.25em] text-foreground/70 font-light border border-[#C9A96E]/25 rounded-full hover:border-[#C9A96E]/50 hover:text-foreground/90 transition-all duration-800 bg-transparent cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.2 }}
          >
            <span className="relative z-10">Начать путь</span>
            <div className="absolute inset-0 rounded-full bg-[#C9A96E]/[0.04] group-hover:bg-[#C9A96E]/[0.08] transition-colors duration-800" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom hint */}
      <motion.div
        className="absolute bottom-10 text-[10px] text-muted-foreground/30 font-light tracking-[0.2em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1.5 }}
      >
        7 вдохов · 7 вопросов · 1 истина
      </motion.div>
    </motion.div>
  );
}

// ─── Quiz Phase ──────────────────────────────────────────────────────────────

function QuizPhase({
  questionIndex,
  onAnswer,
}: {
  questionIndex: number;
  onAnswer: (value: number) => void;
}) {
  const q = questions[questionIndex];
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = useCallback(
    (value: number) => {
      if (selected !== null) return;
      setSelected(value);
      setTimeout(() => onAnswer(value), 900);
    },
    [selected, onAnswer]
  );

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Progress — subtle dots */}
      <div className="absolute top-10 flex gap-2.5">
        {questions.map((_, i) => (
          <motion.div
            key={i}
            className={`rounded-full transition-all duration-800 ${
              i < questionIndex
                ? "w-2 h-2 bg-[#C9A96E]/60"
                : i === questionIndex
                ? "w-2.5 h-2.5 bg-[#C9A96E]"
                : "w-1.5 h-1.5 bg-[#C9A96E]/20"
            }`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
          />
        ))}
      </div>

      {/* Question number */}
      <motion.div
        className="text-[11px] tracking-[0.35em] text-muted-foreground/35 mb-10 font-light uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        вдох {questionIndex + 1} из {questions.length}
      </motion.div>

      {/* Question content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Question text */}
          <h2 className="text-2xl sm:text-3xl md:text-[2.5rem] font-extralight text-foreground/85 text-center mb-4 leading-snug max-w-lg">
            {q.text}
          </h2>

          {/* Subtext */}
          <p className="text-sm text-muted-foreground/50 font-light text-center mb-14">
            {q.subtext}
          </p>

          {/* Options */}
          <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
            {q.options.map((opt, i) => (
              <motion.button
                key={i}
                onClick={() => handleSelect(opt.value)}
                className={`group relative flex flex-col items-center gap-3.5 py-7 px-5 rounded-2xl border transition-all duration-600 cursor-pointer ${
                  selected === opt.value
                    ? "border-[#C9A96E]/50 bg-[#C9A96E]/[0.07] scale-[0.97]"
                    : selected !== null
                    ? "border-transparent opacity-20 scale-[0.96]"
                    : "border-[#C9A96E]/12 hover:border-[#C9A96E]/35 hover:bg-[#C9A96E]/[0.03]"
                }`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.6 }}
                disabled={selected !== null}
              >
                <span
                  className={`text-2xl transition-all duration-600 ${
                    selected === opt.value
                      ? "opacity-100 scale-110"
                      : "opacity-40 group-hover:opacity-70"
                  }`}
                >
                  {opt.symbol}
                </span>
                <span
                  className={`text-sm font-light tracking-wide transition-colors duration-600 ${
                    selected === opt.value
                      ? "text-foreground/85"
                      : "text-muted-foreground/60 group-hover:text-foreground/60"
                  }`}
                >
                  {opt.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom breathing indicator */}
      <motion.div
        className="absolute bottom-10 breathe-text text-[10px] tracking-[0.3em] text-muted-foreground/25 font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        дышите
      </motion.div>
    </motion.div>
  );
}

// ─── Transition Phase ────────────────────────────────────────────────────────

function TransitionPhase() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
    >
      {/* Expanding circle */}
      <motion.div
        className="w-3 h-3 rounded-full bg-[#C9A96E]/20 mb-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 15, 20], opacity: [0, 0.15, 0] }}
        transition={{ delay: 0.3, duration: 3, ease: "easeOut" }}
      />

      <motion.div
        className="text-2xl sm:text-3xl font-extralight text-foreground/50 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1.5 }}
      >
        Выдохните…
      </motion.div>

      <motion.div
        className="mt-6 text-[11px] text-muted-foreground/30 font-light tracking-[0.25em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        Ваш путь раскрывается
      </motion.div>
    </motion.div>
  );
}

// ─── Result Phase ────────────────────────────────────────────────────────────

function ResultPhase({
  result,
  onRestart,
}: {
  result: ResultType;
  onRestart: () => void;
}) {
  const [showBut, setShowBut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBut(true), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-start min-h-screen px-6 pt-16 pb-12 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
    >
      {/* Mandala background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: 1, rotate: 360 }}
        transition={{ opacity: { delay: 1, duration: 2 }, rotate: { delay: 1, duration: 300, repeat: Infinity, ease: "linear" } }}
      >
        <Mandala color={result.color} opacity={0.06} />
      </motion.div>

      {/* Symbol */}
      <motion.div
        className="text-7xl sm:text-8xl mb-6 gentle-pulse relative z-10"
        style={{ color: result.color }}
        initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, duration: 1.5, type: "spring", stiffness: 100 }}
      >
        {result.symbol}
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-3xl sm:text-4xl md:text-5xl font-extralight text-foreground/85 text-center mb-3 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 1.2 }}
      >
        {result.title}
      </motion.h1>

      {/* Decorative line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        <DrawingLine color={result.color} delay={1.2} />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-base sm:text-lg text-muted-foreground/60 font-light text-center mt-5 mb-12 max-w-md relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        {result.subtitle}
      </motion.p>

      {/* Description */}
      <motion.div
        className="max-w-lg text-center mb-12 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.2 }}
      >
        <p className="text-[15px] text-foreground/65 font-light leading-[1.8]">
          {result.description}
        </p>
      </motion.div>

      {/* Affirmations */}
      <motion.div
        className="flex flex-col gap-5 mb-14 max-w-md relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
      >
        {result.affirmations.map((affirmation, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-4 text-left"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.1 + i * 0.35, duration: 0.8 }}
          >
            <span
              className="text-[10px] mt-[7px] flex-shrink-0 opacity-60"
              style={{ color: result.color }}
            >
              {result.symbol}
            </span>
            <span className="text-sm text-foreground/55 font-light leading-relaxed">
              {affirmation}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* The subtle "Но" */}
      <AnimatePresence>
        {showBut && (
          <motion.div
            className="max-w-lg text-center mb-16 relative z-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            {/* Thin separator */}
            <motion.div
              className="w-20 h-px mx-auto mb-8"
              style={{ background: `${result.color}25` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
            />
            <p className="text-[13px] text-muted-foreground/40 font-light leading-[2] italic">
              {result.but}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restart */}
      <motion.div
        className="pb-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 7, duration: 1.5 }}
      >
        <button
          onClick={onRestart}
          className="text-[11px] tracking-[0.2em] text-muted-foreground/30 font-light hover:text-muted-foreground/60 transition-colors duration-800 cursor-pointer"
        >
          Пройти снова
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MeditationPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ResultType | null>(null);

  const handleStart = useCallback(() => {
    setPhase("quiz");
    setQuestionIndex(0);
    setAnswers([]);
  }, []);

  const handleAnswer = useCallback(
    (value: number) => {
      const newAnswers = [...answers, value];
      setAnswers(newAnswers);

      if (questionIndex + 1 < questions.length) {
        setQuestionIndex((prev) => prev + 1);
      } else {
        setPhase("transition");
        setTimeout(() => {
          const r = calculateResult(newAnswers);
          setResult(r);
          setPhase("result");
        }, 2800);
      }
    },
    [answers, questionIndex]
  );

  const handleRestart = useCallback(() => {
    setResult(null);
    setAnswers([]);
    setQuestionIndex(0);
    setPhase("intro");
  }, []);

  return (
    <main className="relative min-h-screen bg-[#FAF8F5] overflow-x-hidden">
      {/* Subtle background gradients */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-[#C9A96E]/[0.025] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[#7A8B6F]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-[#A3B088]/[0.02] rounded-full blur-[100px] -translate-x-1/2" />
      </div>

      {/* Ambient floating particles */}
      <AmbientCanvas />

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <IntroPhase key="intro" onStart={handleStart} />
          )}
          {phase === "quiz" && (
            <QuizPhase
              key={`quiz-${questionIndex}`}
              questionIndex={questionIndex}
              onAnswer={handleAnswer}
            />
          )}
          {phase === "transition" && <TransitionPhase key="transition" />}
          {phase === "result" && result && (
            <ResultPhase
              key="result"
              result={result}
              onRestart={handleRestart}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
