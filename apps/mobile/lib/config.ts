import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

/** Override with EXPO_PUBLIC_API_URL for local dev (e.g. http://10.0.2.2:3000 on emulator). */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  extra?.apiUrl ??
  "https://doothahub.vercel.app";

export const API_BASE = `${API_URL.replace(/\/$/, "")}/api/mobile/v1`;
