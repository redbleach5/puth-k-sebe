"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { levels, achievements as achievementDefs } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: string;
  text: string;
  prompt: string;
}

export interface BreathingSession {
  date: string;
  duration: number;
  type: string;
}

export interface AppState {
  // Streak
  streak: StreakData;
  // XP & Level
  xp: number;
  // Tests
  completedTests: string[];
  // Cards
  drawnCards: string[];
  lastCardDate: string;
  cardsDrawnToday: number;
  // Journal
  journalEntries: JournalEntry[];
  // Breathing
  breathingSessions: BreathingSession[];
  // Daily affirmation
  todayAffirmationDate: string;
  todayAffirmationIndex: number;
  // Unlocked achievements
  unlockedAchievements: string[];
  // Last visit
  lastVisit: string;
  // Hydration flag (not persisted)
  _hasHydrated: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToday(): string {
  // Use local date instead of UTC to avoid streak resets at midnight
  // toISOString() returns UTC which can be "yesterday" for users in positive UTC offsets
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface AppActions {
  addXP: (amount: number) => void;
  getLevel: () => { name: string; xp: number; symbol: string; nextXp: number | null; progress: number };
  checkStreak: () => void;
  completeTest: (testId: string) => void;
  drawCard: (cardId: string) => boolean;
  canDrawCard: () => boolean;
  saveJournalEntry: (mood: string, text: string, prompt: string) => void;
  recordBreathing: (duration: number, type: string) => void;
  getTodayAffirmation: (totalAffirmations: number) => number;
  checkAchievements: (state: { streak: number; totalBreathing: number; testsCompleted: number; cardsDrawn: number; journalEntries: number }) => string[];
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
}

const initialState: AppState = {
  streak: { count: 0, lastDate: "" },
  xp: 0,
  completedTests: [],
  drawnCards: [],
  lastCardDate: "",
  cardsDrawnToday: 0,
  journalEntries: [],
  breathingSessions: [],
  todayAffirmationDate: "",
  todayAffirmationIndex: 0,
  unlockedAchievements: [],
  lastVisit: "",
  _hasHydrated: false,
};

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHasHydrated: (v: boolean) => {
        set({ _hasHydrated: v });
      },

      addXP: (amount: number) => {
        set((state) => ({ xp: state.xp + amount }));
      },

      getLevel: () => {
        const xp = get().xp;
        let currentLevel = levels[0];
        let nextLevel = levels[1] || null;

        for (let i = levels.length - 1; i >= 0; i--) {
          if (xp >= levels[i].xp) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || null;
            break;
          }
        }

        const progress = nextLevel
          ? (xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)
          : 1;

        return {
          name: currentLevel.name,
          xp: currentLevel.xp,
          symbol: currentLevel.symbol,
          nextXp: nextLevel?.xp ?? null,
          progress: Math.min(progress, 1),
        };
      },

      checkStreak: () => {
        const today = getToday();
        const { streak } = get();

        if (streak.lastDate === today) return; // Already checked today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (streak.lastDate === yesterdayStr) {
          // Continue streak
          set({
            streak: { count: streak.count + 1, lastDate: today },
            lastVisit: today,
          });
        } else if (streak.lastDate !== today) {
          // Reset streak (missed a day or first visit)
          const newCount = streak.lastDate === "" ? 1 : 1;
          set({
            streak: { count: newCount, lastDate: today },
            lastVisit: today,
          });
        }

        const stats = {
          streak: get().streak.count,
          totalBreathing: get().breathingSessions.length,
          testsCompleted: get().completedTests.length,
          cardsDrawn: get().drawnCards.length,
          journalEntries: get().journalEntries.length,
        };
        get().checkAchievements(stats);
      },

      completeTest: (testId: string) => {
        const { completedTests } = get();
        if (completedTests.includes(testId)) return;
        set({ completedTests: [...completedTests, testId] });
        get().addXP(25);

        const stats = {
          streak: get().streak.count,
          totalBreathing: get().breathingSessions.length,
          testsCompleted: get().completedTests.length,
          cardsDrawn: get().drawnCards.length,
          journalEntries: get().journalEntries.length,
        };
        get().checkAchievements(stats);
      },

      drawCard: (cardId: string): boolean => {
        const { drawnCards, lastCardDate, cardsDrawnToday } = get();
        const today = getToday();

        const todayDraws = lastCardDate === today ? cardsDrawnToday : 0;

        // Note: The limit check is now done by the calling component via usePremium().checkLimit()
        // This store method only handles the state update
        // The hard limit is managed by the premium system (3 for free, Infinity for premium)

        const alreadyDrawn = drawnCards.includes(cardId);
        const newDrawnCards = alreadyDrawn ? drawnCards : [...drawnCards, cardId];

        set({
          drawnCards: newDrawnCards,
          lastCardDate: today,
          cardsDrawnToday: todayDraws + 1,
        });

        if (!alreadyDrawn) {
          get().addXP(10);
        }

        const stats = {
          streak: get().streak.count,
          totalBreathing: get().breathingSessions.length,
          testsCompleted: get().completedTests.length,
          cardsDrawn: get().drawnCards.length,
          journalEntries: get().journalEntries.length,
        };
        get().checkAchievements(stats);

        return true;
      },

      canDrawCard: (): boolean => {
        // NOTE: This method only checks the store-level daily counter.
        // The actual premium-based limit check should be done via
        // usePremium().checkLimit("cardDrawsPerDay", todayDraws)
        // This is kept as a basic sanity check.
        const { lastCardDate, cardsDrawnToday } = get();
        const today = getToday();
        const todayDraws = lastCardDate === today ? cardsDrawnToday : 0;
        // Return true if no draws today — actual limit enforcement is by the premium hook
        // This prevents the store from being the bottleneck for premium users
        return true;
      },

      saveJournalEntry: (mood: string, text: string, prompt: string) => {
        const entry: JournalEntry = {
          id: generateId(),
          date: new Date().toISOString(),
          mood,
          text,
          prompt,
        };
        set((state) => ({
          journalEntries: [entry, ...state.journalEntries],
        }));
        get().addXP(20);

        const stats = {
          streak: get().streak.count,
          totalBreathing: get().breathingSessions.length,
          testsCompleted: get().completedTests.length,
          cardsDrawn: get().drawnCards.length,
          journalEntries: get().journalEntries.length,
        };
        get().checkAchievements(stats);
      },

      recordBreathing: (duration: number, type: string) => {
        const session: BreathingSession = {
          date: new Date().toISOString(),
          duration,
          type,
        };
        set((state) => ({
          breathingSessions: [session, ...state.breathingSessions],
        }));
        get().addXP(15);

        const stats = {
          streak: get().streak.count,
          totalBreathing: get().breathingSessions.length,
          testsCompleted: get().completedTests.length,
          cardsDrawn: get().drawnCards.length,
          journalEntries: get().journalEntries.length,
        };
        get().checkAchievements(stats);
      },

      getTodayAffirmation: (totalAffirmations: number): number => {
        const today = getToday();
        const { todayAffirmationDate, todayAffirmationIndex } = get();

        if (todayAffirmationDate === today) {
          return todayAffirmationIndex;
        }

        // Use date as seed for deterministic daily selection
        const dateNum = today.split("-").reduce((acc, part) => acc + parseInt(part), 0);
        const newIndex = dateNum % totalAffirmations;

        set({
          todayAffirmationDate: today,
          todayAffirmationIndex: newIndex,
        });

        return newIndex;
      },

      checkAchievements: (stats) => {
        const { unlockedAchievements } = get();
        const newlyUnlocked: string[] = [];

        for (const ach of achievementDefs) {
          if (!unlockedAchievements.includes(ach.id) && ach.condition(stats)) {
            newlyUnlocked.push(ach.id);
          }
        }

        if (newlyUnlocked.length > 0) {
          set({ unlockedAchievements: [...unlockedAchievements, ...newlyUnlocked] });
          // Award XP for each new achievement
          for (const id of newlyUnlocked) {
            const ach = achievementDefs.find((a: { id: string }) => a.id === id);
            if (ach) get().addXP(ach.xp);
          }
        }

        return newlyUnlocked;
      },

      reset: () => {
        set({ ...initialState, _hasHydrated: true });
      },
    }),
    {
      name: "puth-k-sebe-storage",
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _hasHydrated, ...rest } = state;
        return rest as unknown as AppState;
      },
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state._hasHydrated = true;
          }
        };
      },
    }
  )
);
