"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

// ─── Feature definitions ──────────────────────────────────────────────────

export type PremiumFeature =
  | "cardDraws"
  | "journalEntries"
  | "breathingPresets"
  | "testsAvailable"
  | "statsHistory";

interface FeatureLimit {
  free: number | string;
  premium: number | string;
}

export const featureLimits: Record<PremiumFeature, FeatureLimit> = {
  cardDrawsPerDay: { free: 3, premium: Infinity },
  journalEntries: { free: 30, premium: Infinity },
  breathingPresets: { free: 3, premium: 5 },
  testsAvailable: { free: 2, premium: 5 },
  statsHistory: { free: 7, premium: Infinity }, // days
};

// ─── Hook ─────────────────────────────────────────────────────────────────

// Global callback that page.tsx will set to open the PremiumModal
let _showPaywallCallback: (() => void) | null = null;

export function registerPaywallCallback(cb: () => void) {
  _showPaywallCallback = cb;
}

export function usePremium() {
  const { isPremium } = useAuth();

  const canAccessFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) return true;

      const limit = featureLimits[feature];
      if (!limit) return true;

      // For features with numeric limits, we just check if the feature is premium-only
      // The actual limit checking (e.g., how many cards drawn today) should be done
      // by the component using this hook in conjunction with the store
      return false; // free users get limited access
    },
    [isPremium]
  );

  const getFeatureLimit = useCallback(
    (feature: PremiumFeature): number | string => {
      const limit = featureLimits[feature];
      return isPremium ? limit.premium : limit.free;
    },
    [isPremium]
  );

  const showPaywall = useCallback(() => {
    if (_showPaywallCallback) {
      _showPaywallCallback();
    }
  }, []);

  const requirePremium = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) return true;
      showPaywall();
      return false;
    },
    [isPremium, showPaywall]
  );

  return {
    isPremium,
    canAccessFeature,
    getFeatureLimit,
    showPaywall,
    requirePremium,
    featureLimits,
  };
}
