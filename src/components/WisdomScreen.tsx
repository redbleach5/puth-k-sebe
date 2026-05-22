"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { oracleCards, type OracleCard } from "@/lib/data";
import { useStore } from "@/store/useStore";

export default function WisdomScreen() {
  const { drawnCards, drawCard, canDrawCard, lastCardDate, cardsDrawnToday } = useStore();
  const [currentCard, setCurrentCard] = useState<OracleCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const [showBut, setShowBut] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayDraws = lastCardDate === today ? cardsDrawnToday : 0;
  const remainingDraws = 3 - todayDraws;

  const handleDraw = useCallback(() => {
    if (!canDrawCard()) return;

    const unseen = oracleCards.filter((c) => !drawnCards.includes(c.id));
    const pool = unseen.length > 0 ? unseen : oracleCards;
    const card = pool[Math.floor(Math.random() * pool.length)];

    setCurrentCard(card);
    setIsFlipped(false);
    setShowDeep(false);
    setShowBut(false);

    setTimeout(() => setIsFlipped(true), 100);
    drawCard(card.id);
  }, [canDrawCard, drawnCards, drawCard]);

  const handleShowDeep = useCallback(() => {
    setShowDeep(true);
    setTimeout(() => setShowBut(true), 3000);
  }, []);

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-10 min-h-screen">
      <div className="w-full max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-light text-foreground/85 mb-1">Мудрость</h2>
        <p className="text-sm text-muted-foreground/55 font-light mb-6">
          Вытяните карту — и послушайте
        </p>

        {/* Remaining draws */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < remainingDraws ? "text-[#C9A96E]/55" : "text-[#C9A96E]/15"}`}>✦</span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground/45 font-light">
            {remainingDraws} осталось сегодня
          </span>
        </div>

        {/* Desktop: card + details side by side; Mobile: stacked */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Card area */}
          <div className="relative w-64 h-88 sm:w-72 sm:h-96 mx-auto lg:mx-0 shrink-0" style={{ perspective: "1000px" }}>
            {currentCard ? (
              <motion.div
                className="w-full h-full relative"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front of card */}
                <div
                  className="absolute inset-0 rounded-2xl border border-[#C9A96E]/20 p-5 sm:p-6 flex flex-col items-center justify-center text-center"
                  style={{
                    backfaceVisibility: "hidden",
                    background: `linear-gradient(135deg, ${currentCard.color}08, ${currentCard.color}15)`,
                  }}
                >
                  <div className="text-4xl sm:text-5xl mb-3 gentle-pulse" style={{ color: currentCard.color }}>
                    {currentCard.symbol}
                  </div>
                  <h3 className="text-lg sm:text-xl font-light text-foreground/80 mb-2">{currentCard.name}</h3>
                  <p className="text-sm text-foreground/55 font-light leading-relaxed">
                    {currentCard.meaning}
                  </p>
                </div>

                {/* Back of card */}
                <div
                  className="absolute inset-0 rounded-2xl border border-[#C9A96E]/15 flex items-center justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: "linear-gradient(135deg, #C9A96E08, #7A8B6F08)",
                  }}
                >
                  <div className="text-4xl opacity-20">✦</div>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full rounded-2xl border border-[#C9A96E]/10 flex items-center justify-center bg-gradient-to-br from-[#C9A96E]/[0.03] to-[#7A8B6F]/[0.02]">
                <span className="text-3xl opacity-15">✦</span>
              </div>
            )}
          </div>

          {/* Card details — visible on desktop or after flip on mobile */}
          <div className="flex-1 min-w-0 w-full">
            {currentCard ? (
              <div className="lg:pt-4">
                <AnimatePresence>
                  {showDeep ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2 }}
                    >
                      <p className="body-text mb-5">
                        {currentCard.deepMessage}
                      </p>

                      {showBut && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 2 }}
                        >
                          <div className="premium-divider mb-4" />
                          <p className="text-sm text-muted-foreground/40 font-light leading-[1.8] italic">
                            {currentCard.but}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-sm text-foreground/55 font-light leading-relaxed mb-4">
                        {currentCard.meaning}
                      </p>
                      <button
                        onClick={handleShowDeep}
                        className="text-xs tracking-[0.12em] text-[#C9A96E]/45 font-light hover:text-[#C9A96E]/65 transition-colors duration-400 cursor-pointer"
                      >
                        Подробнее
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="lg:pt-4">
                <p className="text-sm text-muted-foreground/45 font-light leading-relaxed">
                  Нажмите кнопку ниже, чтобы вытянуть карту. Каждая карта несёт послание, которое актуально именно сейчас.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Draw button */}
        <div className="mt-8 text-center lg:text-left">
          <motion.button
            onClick={handleDraw}
            disabled={!canDrawCard()}
            className={`px-10 py-4 text-sm font-light tracking-[0.15em] rounded-full transition-all duration-400 cursor-pointer ${
              canDrawCard()
                ? "text-foreground/60 border border-[#C9A96E]/25 hover:border-[#C9A96E]/45 hover:text-foreground/80"
                : "text-muted-foreground/25 border border-[#E0D8CC]/20 cursor-not-allowed"
            }`}
            whileTap={canDrawCard() ? { scale: 0.96 } : {}}
          >
            {canDrawCard() ? "Вытянуть карту" : "Завтра новые карты"}
          </motion.button>
        </div>

        {/* Collection progress */}
        <div className="mt-8">
          <p className="label-text mb-3">Коллекция</p>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-40 bg-[#E0D8CC]/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A96E]/40 rounded-full transition-all duration-700"
                style={{ width: `${(drawnCards.length / oracleCards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground/45 font-light">
              {drawnCards.length}/{oracleCards.length}
            </span>
          </div>
        </div>

        {/* Drawn cards history */}
        {drawnCards.length > 0 && (
          <div className="mt-6">
            <p className="label-text mb-3">Собранные карты</p>
            <div className="flex flex-wrap gap-2">
              {oracleCards
                .filter((c) => drawnCards.includes(c.id))
                .map((card) => (
                  <div
                    key={card.id}
                    className="w-10 h-10 rounded-lg border border-[#C9A96E]/10 flex items-center justify-center text-sm hover:border-[#C9A96E]/25 transition-all duration-300"
                    style={{ color: `${card.color}70` }}
                    title={card.name}
                  >
                    {card.symbol}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
