# Android app (Trusted Web Activity)

This folder holds config for wrapping the live DoothaHub store in a Play Store Android app. The app loads your deployed site full-screen — same UI, cart, checkout, and Razorpay as the website.

## Prerequisites

- Production site deployed with PWA manifest (`/manifest.webmanifest`)
- [Google Play Developer account](https://play.google.com/console) ($25 one-time)
- Node.js 20+ and JDK 17+ (for Bubblewrap)

## 1. Verify PWA on production

Open `https://YOUR_DOMAIN/manifest.webmanifest` and confirm icons + `display: standalone`.

Install on Android Chrome: menu → **Add to Home screen** (optional smoke test before Play Store).

## 2. Initialize Bubblewrap

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR_DOMAIN/manifest.webmanifest
```

Suggested answers:

- **App name:** DoothaHub Store
- **Package name:** `com.doothahub.store` (or your choice — must match env below)
- **Start URL:** `/products` (already in manifest)
- **Theme / background:** `#0a0e17`

This creates an `android/` project (often in the current directory). Keep the signing keystore safe — you need it for every update.

## 3. Digital Asset Links (required for full-screen TWA)

Get your signing certificate SHA-256 fingerprint:

```bash
keytool -list -v -keystore android.keystore -alias android
```

On **Vercel**, set environment variables:

| Variable | Example |
|----------|---------|
| `TWA_ANDROID_PACKAGE_NAME` | `com.doothahub.store` |
| `TWA_SHA256_CERT_FINGERPRINTS` | `14:6D:E9:83:...` (colon-separated; comma-separate if multiple) |

Redeploy, then verify:

```bash
curl https://YOUR_DOMAIN/.well-known/assetlinks.json
```

Should return JSON with your `package_name` and fingerprint (not `[]`).

## 4. Build the Android app

```bash
bubblewrap build
```

Output: `app-release-signed.apk` and `app-release-bundle.aab` (upload `.aab` to Play Console).

## 5. Play Store listing

- **Category:** Shopping
- **Screenshots:** capture from a phone on `/products`, product detail, cart, checkout
- **Privacy policy:** link to your site privacy page (required)
- Upload **AAB**, complete content rating questionnaire, submit for review

## Updates

- **Website changes:** deploy to Vercel → app updates automatically (no Play Store resubmit)
- **Manifest / icon / package changes:** rebuild with Bubblewrap and upload a new AAB

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Browser bar still visible | Asset links not verified — check env vars and redeploy |
| `assetlinks.json` is `[]` | Set `TWA_ANDROID_PACKAGE_NAME` and `TWA_SHA256_CERT_FINGERPRINTS` on Vercel |
| Razorpay / login broken | Ensure `AUTH_URL` and `NEXT_PUBLIC_APP_URL` match production domain |
| Admin visible in app | Only admin users see Admin link; non-admins are blocked by middleware |

## Local manifest URL (dev)

Bubblewrap needs a public HTTPS manifest. Use production URL, or expose local dev with ngrok:

```bash
ngrok http 3000
# bubblewrap init --manifest https://xxxx.ngrok.io/manifest.webmanifest
```
