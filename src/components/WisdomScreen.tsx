"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { oracleCards, type OracleCard } from "@/lib/data";
import { useStore } from "@/store/useStore";
import { MandalaRing, FlowingCurves, WaveBottom, SacredGeometry, OrganicBlob } from "@/components/SvgDecor";

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
    <div className="relative flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8 pb-24 lg:pb-8 min-h-screen">
      {/* SVG Decor */}
      <FlowingCurves className="absolute right-0 top-0 h-full w-36 lg:w-48" color="#5B8DB8" />
      <MandalaRing size={220} className="absolute -left-16 top-20 slow-spin hidden sm:block" color="#7A8B6F" />
      <SacredGeometry size={200} color="#5B8DB8" className="absolute -right-12 bottom-32 drift-slow hidden lg:block" />
      <OrganicBlob color="#5B8DB8" className="absolute left-[-6%] top-[40%] w-48 h-48 drift hidden lg:block" />
      <WaveBottom color="#5B8DB8" />

      <div className="relative w-full max-w-3xl z-10">
        <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-1">Мудрость</h2>
        <p className="text-[15px] text-foreground/80 font-normal mb-5">
          Вытяните карту — и послушайте
        </p>

        {/* Remaining draws */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < remainingDraws ? "text-[#C9A96E]/70" : "text-[#C9A96E]/20"}`}>✦</span>
            ))}
          </div>
          <span className="text-[13px] text-foreground/72 font-normal">
            {remainingDraws} осталось сегодня
          </span>
        </div>

        {/* Card + details */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-7 items-start">
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
                  className="absolute inset-0 rounded-xl border border-[#C9A96E]/20 p-5 sm:p-6 flex flex-col items-center justify-center text-center premium-card"
                  style={{
                    backfaceVisibility: "hidden",
                    background: `linear-gradient(135deg, ${currentCard.color}10, ${currentCard.color}22)`,
                  }}
                >
                  <div className="text-4xl mb-3 gentle-pulse" style={{ color: currentCard.color }}>
                    {currentCard.symbol}
                  </div>
                  <h3 className="text-lg font-normal text-foreground/90 mb-2">{currentCard.name}</h3>
                  <p className="text-[14px] text-foreground/78 font-normal leading-relaxed">
                    {currentCard.meaning}
                  </p>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 rounded-xl border border-[#C9A96E]/15 flex items-center justify-center premium-card"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="text-3xl opacity-20">✦</div>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full rounded-xl premium-card flex items-center justify-center">
                <span className="text-2xl opacity-18">✦</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 w-full">
            {currentCard ? (
              <div className="lg:pt-3">
                <AnimatePresence>
                  {showDeep ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                      <p className="body-text mb-5">{currentCard.deepMessage}</p>
                      {showBut && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
                          <div className="premium-divider mb-4" />
                          <p className="text-[14px] text-foreground/68 font-normal leading-[1.9] italic">{currentCard.but}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-[14px] text-foreground/80 font-normal leading-relaxed mb-4">{currentCard.meaning}</p>
                      <button
                        onClick={handleShowDeep}
                        className="text-[13px] tracking-[0.1em] text-[#C9A96E]/70 font-normal hover:text-[#C9A96E] transition-colors duration-300 cursor-pointer"
                      >
                        Подробнее
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="lg:pt-3">
                <p className="text-[15px] text-foreground/75 font-normal leading-relaxed">
                  Нажмите кнопку ниже, чтобы вытянуть карту. Каждая карта несёт послание, актуальное именно сейчас.
                </p>
                <p className="text-[14px] text-foreground/68 font-normal leading-relaxed mt-3">
                  В день можно вытянуть до трёх карт. Каждая уникальна и пополняет вашу коллекцию.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Draw button */}
        <div className="mt-6">
          <motion.button
            onClick={handleDraw}
            disabled={!canDrawCard()}
            className={`px-9 py-3.5 text-[14px] font-normal tracking-[0.12em] rounded-full transition-all duration-300 cursor-pointer ${
              canDrawCard()
                ? "text-foreground/80 border border-[#C9A96E]/30 hover:border-[#C9A96E]/50"
                : "text-foreground/38 border border-[#E0D8CC]/25 cursor-not-allowed"
            }`}
            whileTap={canDrawCard() ? { scale: 0.96 } : {}}
          >
            {canDrawCard() ? "Вытянуть карту" : "Завтра новые карты"}
          </motion.button>
        </div>

        {/* Collection */}
        <div className="mt-6">
          <p className="text-[13px] font-medium text-foreground/75 tracking-wider uppercase mb-2.5">Коллекция</p>
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 bg-[#E0D8CC]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#C9A96E]/55 rounded-full transition-all duration-700" style={{ width: `${(drawnCards.length / oracleCards.length) * 100}%` }} />
            </div>
            <span className="text-[13px] text-foreground/72 font-normal">{drawnCards.length}/{oracleCards.length}</span>
          </div>
        </div>

        {/* Drawn cards */}
        {drawnCards.length > 0 && (
          <div className="mt-5">
            <p className="text-[13px] font-medium text-foreground/75 tracking-wider uppercase mb-2.5">Собранные карты</p>
            <div className="flex flex-wrap gap-2">
              {oracleCards.filter((c) => drawnCards.includes(c.id)).map((card) => (
                <div
                  key={card.id}
                  className="w-10 h-10 rounded-lg premium-card flex items-center justify-center text-[14px] hover:border-[#C9A96E]/30 transition-all duration-300"
                  style={{ color: `${card.color}80` }}
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
