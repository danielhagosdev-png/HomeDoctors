# Home Doctors — React Native (Expo)

A production-ready Android health-guidance app providing home remedy information for 8 medical categories, powered by the NHS Content API and Open-i image API.

---

## Quick Start

```bash
cd home-doctors
npm install
npx expo start
```

Press `a` to open on an Android emulator / connected device, or scan the QR code with Expo Go.

---

## Project Structure

```
home-doctors/
├── App.js                          # Entry point, navigation setup, ad preload
├── app.json                        # Expo + AdMob config
├── screens/
│   ├── HomeScreen.js               # 8 category grid + first-launch disclaimer
│   ├── DiseaseListScreen.js        # Fetches & lists diseases; pull-to-refresh
│   ├── DiseaseDetailScreen.js      # Full detail: causes, symptoms, remedies, ads
│   └── CategoryScreen.js           # Passthrough alias (future extensibility)
├── components/
│   ├── DiseaseCard.js              # Thumbnail card used in list
│   └── DisclaimerModal.js          # First-launch modal disclaimer
├── services/
│   ├── api.js                      # NHS API + Open-i image API + fallback data
│   └── adManager.js                # AdMob interstitial loader/shower
└── utils/
    └── storage.js                  # AsyncStorage: cache, interstitial counter, disclaimer flag
```

---

## Environment Setup

### 1. NHS Content API Key
1. Register at https://developer.api.nhs.uk
2. Create an app and get your subscription key.
3. Open `services/api.js` and replace:
   ```js
   const NHS_API_KEY = 'YOUR_NHS_API_KEY';
   ```

### 2. Google AdMob (Real IDs)
1. Create an AdMob account at https://admob.google.com
2. Create an Android app and two ad units (Banner + Interstitial).
3. Open `app.json` and replace:
   ```json
   "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
   ```
4. Open `services/adManager.js` and replace:
   ```js
   BANNER: 'ca-app-pub-REPLACE_ME/BANNER_ID',
   INTERSTITIAL: 'ca-app-pub-REPLACE_ME/INTERSTITIAL_ID',
   ```
5. Download `google-services.json` from your Firebase project (linked to AdMob) and place it in the `home-doctors/` root.

> **During development** the app automatically uses Google's public test IDs via `TestIds` when `__DEV__` is `true`. You will never be charged or violate AdMob policy with test IDs.

---

## Data Flow

```
HomeScreen → tap category
  └── DiseaseListScreen
        └── api.fetchDiseasesByCategory()
              ├── Check AsyncStorage cache (24h TTL)
              ├── Try NHS Content API for each condition slug
              │     └── On failure → FALLBACK_DISEASES (built-in)
              └── api.fetchDiseaseImage() for each disease via Open-i NLM
                    └── On failure → placeholder image URL

DiseaseDetailScreen
  ├── Renders full disease data
  ├── BannerAd (bottom)
  └── Increments AsyncStorage counter → shows InterstitialAd every 3rd view
```

---

## Offline / Caching

- All fetched disease lists are cached in AsyncStorage with a 24-hour TTL.
- If the network is unavailable AND the cache is empty, the app falls back to the rich built-in dataset (8 categories × 2–4 diseases = 24 conditions total).
- Pull-to-refresh on the disease list bypasses cache and re-fetches from API.

---

## Building for Production (Android APK/AAB)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build APK
eas build -p android --profile preview

# Build AAB (Play Store)
eas build -p android --profile production
```

Make sure your `google-services.json` is present before building.

---

## Dependencies

| Package | Purpose |
|---|---|
| `expo ~50` | Build toolchain |
| `@react-navigation/native-stack` | Stack navigator |
| `react-native-google-mobile-ads` | AdMob banner + interstitial |
| `@react-native-async-storage/async-storage` | Caching + state persistence |
| `react-native-safe-area-context` | Notch/nav bar safe areas |
| `react-native-reanimated` | Smooth navigation animations |

---

## Legal

This app displays a mandatory disclaimer modal on first launch and a permanent disclaimer footer on every disease detail screen. Content is sourced from publicly available health APIs and is for educational use only.
