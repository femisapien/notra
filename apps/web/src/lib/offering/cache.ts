import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

import { OFFERING_CACHE_TTL_SECONDS } from "@/constants/offering";
import type { OfferingScanResult } from "@/types/offering";

const REDIS_KEY_PREFIX = "offering-scan:v1:";

const memory = new Map<
  string,
  { result: OfferingScanResult; expiresAt: number }
>();
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) {
    return redis;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!(url && token)) {
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

export function offeringCacheKey(
  brand: string,
  feature: string | null
): string {
  return createHash("sha256")
    .update(`${brand.toLowerCase()}\0${(feature ?? "").toLowerCase()}`)
    .digest("hex");
}

function memoryGet(key: string): OfferingScanResult | null {
  const entry = memory.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.result;
  }
  return null;
}

function memorySet(key: string, result: OfferingScanResult) {
  memory.set(key, {
    result,
    expiresAt: Date.now() + OFFERING_CACHE_TTL_SECONDS * 1000,
  });
}

export async function readOfferingScanCache(
  key: string
): Promise<OfferingScanResult | null> {
  const cached = memoryGet(key);
  if (cached) {
    return { ...cached, cached: true };
  }
  const client = getRedis();
  if (!client) {
    return null;
  }
  try {
    const stored = await client.get<OfferingScanResult>(
      `${REDIS_KEY_PREFIX}${key}`
    );
    if (!stored) {
      return null;
    }
    memorySet(key, stored);
    return { ...stored, cached: true };
  } catch {
    return null;
  }
}

export async function writeOfferingScanCache(
  key: string,
  result: OfferingScanResult
): Promise<void> {
  memorySet(key, result);
  const client = getRedis();
  if (!client) {
    return;
  }
  try {
    await client.set(`${REDIS_KEY_PREFIX}${key}`, result, {
      ex: OFFERING_CACHE_TTL_SECONDS,
    });
  } catch {
    return;
  }
}
