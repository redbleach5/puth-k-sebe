"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { useStore, type JournalEntry, type BreathingSession } from "@/store/useStore";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  } | null;
  subscription: SubscriptionInfo | null;
  isPremium: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  syncProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextType | null>(null);

// ─── Inner provider (needs useSession, so must be inside SessionProvider) ──

function AuthContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const loading = status === "loading" || subLoading;
  // Premium requires an active subscription (not past_due, not canceled)
  const isPremium =
    (subscription?.plan === "monthly" || subscription?.plan === "yearly") &&
    subscription?.status === "active" &&
    (subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) > new Date() : true);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  // Fetch subscription on session change
  const refreshSubscription = useCallback(async () => {
    if (!session?.user?.id) {
      setSubscription(null);
      return;
    }
    try {
      setSubLoading(true);
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const data = await res.json();
        setSubscription({
          plan: data.plan ?? "free",
          status: data.status ?? "free",
          currentPeriodEnd: data.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        });
        // Update the JWT token with the latest plan so session reflects subscription changes
        // This is important after payment so the user sees premium immediately
      }
    } catch {
      // Silently fail — subscription info is not critical for basic usage
    } finally {
      setSubLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: "Неверный email или пароль" };
      }

      if (result?.ok) {
        return { success: true };
      }

      return { success: false, error: "Произошла ошибка при входе" };
    } catch {
      return { success: false, error: "Произошла ошибка при входе" };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Произошла ошибка при регистрации" };
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        return { success: true };
      }

      return { success: false, error: "Аккаунт создан, но не удалось войти автоматически" };
    } catch {
      return { success: false, error: "Произошла ошибка при регистрации" };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    setSubscription(null);
  }, []);

  // ─── Progress sync ───────────────────────────────────────────────────────
  const lastSyncRef = useRef(0);

  const syncProgress = useCallback(async () => {
    if (!session?.user?.id) return;
    // Throttle: no more than once every 30 seconds
    const now = Date.now();
    if (now - lastSyncRef.current < 30000) return;
    lastSyncRef.current = now;

    try {
      const state = useStore.getState();
      await fetch("/api/progress/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xp: state.xp,
          streakCount: state.streak.count,
          streakLastDate: state.streak.lastDate,
          completedTests: JSON.stringify(state.completedTests),
          drawnCards: JSON.stringify(state.drawnCards),
          lastCardDate: state.lastCardDate,
          cardsDrawnToday: state.cardsDrawnToday,
          journalEntries: JSON.stringify(state.journalEntries),
          breathingSessions: JSON.stringify(state.breathingSessions),
          unlockedAchievements: JSON.stringify(state.unlockedAchievements),
          lastVisit: state.lastVisit,
        }),
      });
    } catch {
      // Silently fail — progress sync is non-critical
    }
  }, [session?.user?.id]);

  const loadProgress = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/progress/load");
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.xp) return; // No saved progress

      const store = useStore.getState();
      // Only overwrite local state if server has newer data
      // (simple heuristic: compare XP)
      if (data.xp > store.xp) {
        // Safely parse JSON fields — corrupted data won't crash the app
        const safeParse = <T,>(str: string | undefined | null, fallback: T): T => {
          if (!str) return fallback;
          try { return JSON.parse(str) as T; } catch { return fallback; }
        };

        store.setHasHydrated(false); // Temporarily allow overwrite
        useStore.setState({
          xp: data.xp ?? 0,
          streak: {
            count: data.streakCount ?? 0,
            lastDate: data.streakLastDate ?? "",
          },
          completedTests: safeParse<string[]>(data.completedTests, []),
          drawnCards: safeParse<string[]>(data.drawnCards, []),
          lastCardDate: data.lastCardDate ?? "",
          cardsDrawnToday: data.cardsDrawnToday ?? 0,
          journalEntries: safeParse<JournalEntry[]>(data.journalEntries, []),
          breathingSessions: safeParse<BreathingSession[]>(data.breathingSessions, []),
          unlockedAchievements: safeParse<string[]>(data.unlockedAchievements, []),
          lastVisit: data.lastVisit ?? "",
        });
        store.setHasHydrated(true);
      }
    } catch {
      // Silently fail
    }
  }, [session?.user?.id]);

  // Load progress on login, sync periodically
  // Also refresh subscription on login to catch payment status changes
  useEffect(() => {
    if (session?.user?.id) {
      loadProgress();
      refreshSubscription();
    }
  }, [session?.user?.id, loadProgress, refreshSubscription]);

  // Auto-sync every 2 minutes when logged in
  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(syncProgress, 120000); // 2 min
    return () => clearInterval(interval);
  }, [session?.user?.id, syncProgress]);

  // Sync on page unload using fetch keepalive (sendBeacon doesn't set Content-Type)
  useEffect(() => {
    if (!session?.user?.id) return;
    const handleUnload = () => {
      const state = useStore.getState();
      const body = JSON.stringify({
        xp: state.xp,
        streakCount: state.streak.count,
        streakLastDate: state.streak.lastDate,
        completedTests: JSON.stringify(state.completedTests),
        drawnCards: JSON.stringify(state.drawnCards),
        lastCardDate: state.lastCardDate,
        cardsDrawnToday: state.cardsDrawnToday,
        journalEntries: JSON.stringify(state.journalEntries),
        breathingSessions: JSON.stringify(state.breathingSessions),
        unlockedAchievements: JSON.stringify(state.unlockedAchievements),
        lastVisit: state.lastVisit,
      });
      fetch("/api/progress/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently fail — progress sync is non-critical
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [session?.user?.id]);

  return (
    <AuthCtx.Provider
      value={{
        user,
        subscription,
        isPremium,
        loading,
        login,
        register,
        logout,
        refreshSubscription,
        syncProgress,
        loadProgress,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

// ─── Outer provider (wraps with SessionProvider) ──────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
