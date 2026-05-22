"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

// ─── Feature definitions ──────────────────────────────────────────────────

export type PremiumFeature =
  | "cardDrawsPerDay"
  | "journalEntries"
  | "breathingPresets"
  | "testsAvailable"
  | "statsHistory";

interface FeatureLimit {
  free: number;
  premium: number;
  /** Display label for the limit */
  label: string;
}

export const featureLimits: Record<PremiumFeature, FeatureLimit> = {
  cardDrawsPerDay: { free: 3, premium: Infinity, label: "Карты в день" },
  journalEntries: { free: 30, premium: Infinity, label: "Записи в дневнике" },
  breathingPresets: { free: 3, premium: 5, label: "Дыхательные практики" },
  testsAvailable: { free: 2, premium: 5, label: "Тесты" },
  statsHistory: { free: 7, premium: Infinity, label: "История статистики (дней)" },
};

// ─── Hook ─────────────────────────────────────────────────────────────────

// Global callback that page.tsx will set to open the PremiumModal
let _showPaywallCallback: (() => void) | null = null;

export function registerPaywallCallback(cb: () => void) {
  _showPaywallCallback = cb;
}

export function usePremium() {
  const { isPremium } = useAuth();

  /**
   * Get the numeric limit for a feature based on the current plan.
   * Returns Infinity for unlimited.
   */
  const getFeatureLimit = useCallback(
    (feature: PremiumFeature): number => {
      const limit = featureLimits[feature];
      return isPremium ? limit.premium : limit.free;
    },
    [isPremium]
  );

  /**
   * Check if a specific usage count has exceeded the free limit.
   * Returns true if the user CAN still use the feature (within limits).
   */
  const isWithinLimit = useCallback(
    (feature: PremiumFeature, currentUsage: number): boolean => {
      if (isPremium) return true;
      const limit = featureLimits[feature];
      return currentUsage < limit.free;
    },
    [isPremium]
  );

  /**
   * Check if a feature requires premium to access at all (limit is 0 for free).
   */
  const isPremiumOnly = useCallback(
    (feature: PremiumFeature, index: number): boolean => {
      if (isPremium) return false;
      const limit = featureLimits[feature];
      // For list-based features (tests, presets), items beyond the free limit are premium-only
      return index >= limit.free;
    },
    [isPremium]
  );

  const showPaywall = useCallback(() => {
    if (_showPaywallCallback) {
      _showPaywallCallback();
    }
  }, []);

  /**
   * Require premium for a feature. Shows paywall if not premium.
   * Returns true if the user is premium, false otherwise.
   */
  const requirePremium = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) return true;
      showPaywall();
      return false;
    },
    [isPremium, showPaywall]
  );

  /**
   * Check if user can perform an action that would exceed the free limit.
   * Shows paywall if limit is reached.
   * Returns true if the action is allowed.
   */
  const checkLimit = useCallback(
    (feature: PremiumFeature, currentUsage: number): boolean => {
      if (isPremium) return true;
      const limit = featureLimits[feature];
      if (currentUsage >= limit.free) {
        showPaywall();
        return false;
      }
      return true;
    },
    [isPremium, showPaywall]
  );

  return {
    isPremium,
    getFeatureLimit,
    isWithinLimit,
    isPremiumOnly,
    showPaywall,
    requirePremium,
    checkLimit,
    featureLimits,
  };
}
