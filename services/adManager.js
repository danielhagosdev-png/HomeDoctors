/**
 * adManager.js — stub until google-services.json is configured
 *
 * react-native-google-mobile-ads requires:
 *  1. A real google-services.json from Firebase console
 *  2. The plugin added back to app.json
 *  3. npm install react-native-google-mobile-ads
 *
 * To re-enable:
 *  - Add your real google-services.json to the project root
 *  - Add the plugin back to app.json
 *  - Replace this file with the full adManager implementation
 */

export const AD_UNITS = {
  BANNER:       'ca-app-pub-3940256099942544/6300978111',  // test ID
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',  // test ID
};

export function loadInterstitial() {
  // no-op until AdMob is re-enabled
  return () => {};
}

export async function maybeShowInterstitial() {
  // no-op
}
