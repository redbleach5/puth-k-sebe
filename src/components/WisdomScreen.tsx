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

    // Pick a random card (prefer unseen)
    const unseen = oracleCards.filter((c) => !drawnCards.includes(c.id));
    const pool = unseen.length > 0 ? unseen : oracleCards;
    const card = pool[Math.floor(Math.random() * pool.length)];

    setCurrentCard(card);
    setIsFlipped(false);
    setShowDeep(false);
    setShowBut(false);

    // Flip animation
    setTimeout(() => setIsFlipped(true), 100);
    drawCard(card.id);
  }, [canDrawCard, drawnCards, drawCard]);

  const handleShowDeep = useCallback(() => {
    setShowDeep(true);
    setTimeout(() => setShowBut(true), 3000);
  }, []);

  return (
    <div className="flex flex-col items-center px-5 pt-10 pb-28 min-h-screen">
      <h2 className="text-2xl font-extralight text-foreground/80 mb-2">Мудрость</h2>
      <p className="text-xs text-muted-foreground/40 font-light tracking-wider mb-8">
        Вытяните карту — и послушайте
      </p>

      {/* Remaining draws */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] text-muted-foreground/35 font-light tracking-wider">
          Сегодня: {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < remainingDraws ? "text-[#C9A96E]/50" : "text-[#C9A96E]/15"}>✦</span>
          ))}
        </span>
        <span className="text-[11px] text-muted-foreground/30 font-light">
          ({remainingDraws} осталось)
        </span>
      </div>

      {/* Card area */}
      <div className="relative w-72 h-96 mb-8" style={{ perspective: "1000px" }}>
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
              className="absolute inset-0 rounded-2xl border border-[#C9A96E]/20 p-6 flex flex-col items-center justify-center text-center"
              style={{
                backfaceVisibility: "hidden",
                background: `linear-gradient(135deg, ${currentCard.color}08, ${currentCard.color}15)`,
              }}
            >
              <div className="text-5xl mb-4 gentle-pulse" style={{ color: currentCard.color }}>
                {currentCard.symbol}
              </div>
              <h3 className="text-xl font-extralight text-foreground/80 mb-3">{currentCard.name}</h3>
              <p className="text-sm text-foreground/55 font-light leading-relaxed mb-6">
                {currentCard.meaning}
              </p>

              {!showDeep ? (
                <button
                  onClick={handleShowDeep}
                  className="text-[11px] tracking-[0.15em] text-[#C9A96E]/40 font-light hover:text-[#C9A96E]/60 transition-colors duration-500 cursor-pointer"
                >
                  Подробнее
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.5 }}
                >
                  <p className="text-[13px] text-foreground/45 font-light leading-[1.8] italic mb-4">
                    {currentCard.deepMessage}
                  </p>

                  {showBut && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 2 }}
                    >
                      <div className="w-10 h-px mx-auto mb-3" style={{ background: `${currentCard.color}25` }} />
                      <p className="text-[12px] text-muted-foreground/30 font-light leading-[1.9] italic">
                        {currentCard.but}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
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

      {/* Draw button */}
      <motion.button
        onClick={handleDraw}
        disabled={!canDrawCard()}
        className={`px-10 py-4 text-sm font-light tracking-[0.2em] rounded-full transition-all duration-500 cursor-pointer ${
          canDrawCard()
            ? "text-foreground/60 border border-[#C9A96E]/25 hover:border-[#C9A96E]/45 hover:text-foreground/80"
            : "text-muted-foreground/20 border border-[#E0D8CC]/20 cursor-not-allowed"
        }`}
        whileTap={canDrawCard() ? { scale: 0.96 } : {}}
      >
        {canDrawCard() ? "Вытянуть карту" : "Завтра новые карты"}
      </motion.button>

      {/* Collection progress */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-muted-foreground/30 font-light tracking-wider mb-2">
          КОЛЛЕКЦИЯ
        </p>
        <div className="flex items-center gap-2">
          <div className="h-1 w-32 bg-[#E0D8CC]/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A96E]/40 rounded-full transition-all duration-700"
              style={{ width: `${(drawnCards.length / oracleCards.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground/30 font-light">
            {drawnCards.length}/{oracleCards.length}
          </span>
        </div>
      </div>

      {/* Drawn cards history */}
      {drawnCards.length > 0 && (
        <div className="w-full max-w-md mt-8">
          <p className="text-[11px] text-muted-foreground/30 font-light tracking-wider mb-3">
            СОБРАННЫЕ КАРТЫ
          </p>
          <div className="flex flex-wrap gap-2">
            {oracleCards
              .filter((c) => drawnCards.includes(c.id))
              .map((card) => (
                <div
                  key={card.id}
                  className="w-10 h-10 rounded-lg border border-[#C9A96E]/10 flex items-center justify-center text-sm"
                  style={{ color: `${card.color}60` }}
                  title={card.name}
                >
                  {card.symbol}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
