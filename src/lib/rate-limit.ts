import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

type Limiter = {
  limit: (id: string) => Promise<{ success: boolean; remaining: number }>;
};

function makeLimiter(prefix: string, max: number, windowSec: number): Limiter {
  if (!redis) {
    return {
      async limit() {
        return { success: true, remaining: max };
      },
    };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
    analytics: false,
    prefix,
  });
}

export const authLimiter = makeLimiter("rl:auth", 10, 60);
export const checkoutLimiter = makeLimiter("rl:checkout", 30, 60);
export const apiLimiter = makeLimiter("rl:api", 120, 60);
