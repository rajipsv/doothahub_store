# DoothaHub Android (Expo)

Native Android customer app — package `com.doothahub.app`.

## Prerequisites

- Node 20+
- [Expo CLI](https://docs.expo.dev/) / EAS account (free tier works)
- Android Studio or physical device with Expo Go for dev

## Configure API URL

Default production API: `https://doothahub.vercel.app`

Local Next.js dev (Android emulator):

```bash
set EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
pnpm mobile
```

Physical device on same Wi‑Fi: use your PC LAN IP, e.g. `http://192.168.1.5:3000`

## Run locally

From repo root:

```bash
pnpm install
pnpm mobile
```

Press `a` for Android emulator, or scan QR with Expo Go.

**Note:** Razorpay native checkout requires a **development build** (not Expo Go). Use EAS preview build for payment testing.

## EAS production build (Play Store)

1. Install EAS: `npm i -g eas-cli`
2. Login: `eas login`
3. From `apps/mobile`, link the project (first time only):

```bash
cd apps/mobile
eas init
```

This writes a real `projectId` into `app.json`. Commit the updated config.

4. Build the release `.aab`:

```bash
eas build -p android --profile production
```

5. Submit to Google Play (internal track, draft release):

```bash
eas submit -p android --profile production --latest
```

Or download the `.aab` from the EAS dashboard and upload manually in [Google Play Console](https://play.google.com/console). Use package **`com.doothahub.app`** (distinct from the TWA `com.doothahub.store` listing).

**Razorpay:** native checkout requires a dev/preview build (`eas build --profile preview` for APK testing on device). Expo Go cannot load `react-native-razorpay`.

## Backend requirements on Vercel

- `AUTH_SECRET` (min 32 chars) — used for mobile JWT
- Razorpay keys for online checkout
- `NEXT_PUBLIC_APP_URL` = your production URL

Mobile API lives at `/api/mobile/v1/*`.
