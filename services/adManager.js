/**
 * adManager.js
 *
 * Safe AdMob wrapper.
 *
 * react-native-google-mobile-ads requires a custom native build (EAS / expo run:android).
 * It will NOT work inside Expo Go because the native module is absent.
 *
 * This file detects whether the native module is available at runtime and silently
 * falls back to no-ops so the rest of the app works normally in Expo Go during
 * development. When you build with EAS (`eas build`) ads will be fully active.
 */

import { resetInterstitialCount } from '../utils/storage';

// ─── Real Ad Unit IDs ─────────────────────────────────────────────────────────
// Replace these with real IDs from admob.google.com before your production build.
const REAL_BANNER       = 'ca-app-pub-REPLACE_ME/BANNER_AD_UNIT_ID';
const REAL_INTERSTITIAL = 'ca-app-pub-REPLACE_ME/INTERSTITIAL_AD_UNIT_ID';

// Google's public test IDs (safe to ship in dev builds, never in production)
const TEST_BANNER       = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';

export const AD_UNITS = {
  BANNER:       __DEV__ ? TEST_BANNER       : REAL_BANNER,
  INTERSTITIAL: __DEV__ ? TEST_INTERSTITIAL : REAL_INTERSTITIAL,
};

// ─── Attempt to load the native module ───────────────────────────────────────
let InterstitialAd = null;
let AdEventType    = null;
let nativeAvailable = false;

try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd  = admob.InterstitialAd;
  AdEventType     = admob.AdEventType;
  nativeAvailable = true;
} catch {
  console.info('[AdMob] Native module not available – running in mock mode (Expo Go).');
}

// ─── Interstitial lifecycle ───────────────────────────────────────────────────
let interstitialInstance = null;
let isLoaded = false;

export function loadInterstitial() {
  if (!nativeAvailable) return () => {};

  try {
    interstitialInstance = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unLoaded = interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
    });

    const unClosed = interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded = false;
      loadInterstitial(); // preload next
    });

    interstitialInstance.load();

    return () => { unLoaded(); unClosed(); };
  } catch (e) {
    console.warn('[AdMob] loadInterstitial error:', e.message);
    return () => {};
  }
}

// Show interstitial on every 3rd disease detail view
export async function maybeShowInterstitial(count) {
  if (!nativeAvailable) return;
  try {
    if (count > 0 && count % 3 === 0 && isLoaded && interstitialInstance) {
      await interstitialInstance.show();
      await resetInterstitialCount();
    }
  } catch (e) {
    console.warn('[AdMob] maybeShowInterstitial error:', e.message);
  }
}
