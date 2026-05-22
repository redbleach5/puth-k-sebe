"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { oracleCards, type OracleCard } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { MandalaRing, FlowingCurves, WaveBottom } from "@/components/SvgDecor";

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
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-20 lg:pb-8 min-h-screen">
      {/* SVG Decor */}
      <FlowingCurves className="absolute right-0 top-0 h-full w-36 lg:w-48" color="#5B8DB8" />
      <MandalaRing size={200} className="absolute -left-16 top-20 slow-spin hidden sm:block" color="#7A8B6F" />
      <WaveBottom color="#5B8DB8" />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-xl sm:text-2xl font-light text-foreground/90 mb-0.5">Мудрость</h2>
        <p className="text-[13px] text-foreground/60 font-light mb-4">
          Вытяните карту — и послушайте
        </p>

        {/* Remaining draws */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < remainingDraws ? "text-[#C9A96E]/60" : "text-[#C9A96E]/18"}`}>✦</span>
            ))}
          </div>
          <span className="text-[12px] text-foreground/55 font-light">
            {remainingDraws} осталось сегодня
          </span>
        </div>

        {/* Card + details */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Card */}
          <div className="relative w-56 h-76 sm:w-64 sm:h-84 mx-auto lg:mx-0 shrink-0" style={{ perspective: "1000px" }}>
            {currentCard ? (
              <motion.div
                className="w-full h-full relative"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-xl border border-[#C9A96E]/18 p-4 sm:p-5 flex flex-col items-center justify-center text-center"
                  style={{
                    backfaceVisibility: "hidden",
                    background: `linear-gradient(135deg, ${currentCard.color}08, ${currentCard.color}18)`,
                  }}
                >
                  <div className="text-4xl mb-2 gentle-pulse" style={{ color: currentCard.color }}>
                    {currentCard.symbol}
                  </div>
                  <h3 className="text-lg font-light text-foreground/80 mb-1.5">{currentCard.name}</h3>
                  <p className="text-[13px] text-foreground/60 font-light leading-relaxed">
                    {currentCard.meaning}
                  </p>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 rounded-xl border border-[#C9A96E]/12 flex items-center justify-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #C9A96E08, #7A8B6F08)" }}
                >
                  <div className="text-3xl opacity-18">✦</div>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full rounded-xl border border-[#C9A96E]/10 flex items-center justify-center bg-gradient-to-br from-[#C9A96E]/[0.03] to-[#7A8B6F]/[0.02]">
                <span className="text-2xl opacity-15">✦</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 w-full">
            {currentCard ? (
              <div className="lg:pt-2">
                <AnimatePresence>
                  {showDeep ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                      <p className="body-text mb-4">{currentCard.deepMessage}</p>
                      {showBut && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
                          <div className="premium-divider mb-3" />
                          <p className="text-[13px] text-foreground/50 font-light leading-[1.8] italic">{currentCard.but}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-[13px] text-foreground/60 font-light leading-relaxed mb-3">{currentCard.meaning}</p>
                      <button
                        onClick={handleShowDeep}
                        className="text-[12px] tracking-[0.1em] text-[#C9A96E]/55 font-light hover:text-[#C9A96E]/75 transition-colors duration-300 cursor-pointer"
                      >
                        Подробнее
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="lg:pt-2">
                <p className="text-[13px] text-foreground/55 font-light leading-relaxed">
                  Нажмите кнопку ниже, чтобы вытянуть карту. Каждая карта несёт послание, актуальное именно сейчас.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Draw button */}
        <div className="mt-5">
          <motion.button
            onClick={handleDraw}
            disabled={!canDrawCard()}
            className={`px-8 py-3 text-[13px] font-light tracking-[0.12em] rounded-full transition-all duration-300 cursor-pointer ${
              canDrawCard()
                ? "text-foreground/65 border border-[#C9A96E]/25 hover:border-[#C9A96E]/45"
                : "text-foreground/30 border border-[#E0D8CC]/20 cursor-not-allowed"
            }`}
            whileTap={canDrawCard() ? { scale: 0.96 } : {}}
          >
            {canDrawCard() ? "Вытянуть карту" : "Завтра новые карты"}
          </motion.button>
        </div>

        {/* Collection */}
        <div className="mt-5">
          <p className="label-text mb-2">Коллекция</p>
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-36 bg-[#E0D8CC]/25 rounded-full overflow-hidden">
              <div className="h-full bg-[#C9A96E]/45 rounded-full transition-all duration-700" style={{ width: `${(drawnCards.length / oracleCards.length) * 100}%` }} />
            </div>
            <span className="text-[12px] text-foreground/55 font-light">{drawnCards.length}/{oracleCards.length}</span>
          </div>
        </div>

        {/* Drawn cards */}
        {drawnCards.length > 0 && (
          <div className="mt-4">
            <p className="label-text mb-2">Собранные карты</p>
            <div className="flex flex-wrap gap-1.5">
              {oracleCards.filter((c) => drawnCards.includes(c.id)).map((card) => (
                <div
                  key={card.id}
                  className="w-9 h-9 rounded-lg border border-[#C9A96E]/10 flex items-center justify-center text-[13px] hover:border-[#C9A96E]/25 transition-all duration-300"
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
