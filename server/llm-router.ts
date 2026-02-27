import axios from "axios";
import { rateLimitCheck } from "./sovereign-lang";
import crypto from "crypto";
import fs from "fs";
import path from "path";

type TokenTracker = (data: { provider: string; tokensUsed: number; cacheHit: boolean; promptLength: number; responseLength: number }) => void;
let tokenAgencyTracker: TokenTracker | null = null;

export function setTokenAgencyTracker(tracker: TokenTracker) {
  tokenAgencyTracker = tracker;
}

interface LLMProvider {
  id: string;
  name: string;
  key: string;
  url: string;
  model: string;
  rateKey: string;
  maxTokens: number;
  costTier: number;
  format: "openai" | "gemini";
  free: boolean;
}

interface CacheEntry {
  response: string;
  timestamp: number;
  provider: string;
  tokens: number;
}

interface RouterStats {
  totalCalls: number;
  cacheHits: number;
  providerCalls: Record<string, number>;
  providerErrors: Record<string, number>;
  providerLastSuccess: Record<string, number>;
  providerCooldowns: Record<string, number>;
  totalTokensSaved: number;
  totalCostSaved: number;
}

const responseCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 500;
const CACHE_TTL = 3600000;
const COOLDOWN_DURATION = 60000;

const stats: RouterStats = {
  totalCalls: 0,
  cacheHits: 0,
  providerCalls: {},
  providerErrors: {},
  providerLastSuccess: {},
  providerCooldowns: {},
  totalTokensSaved: 0,
  totalCostSaved: 0,
};

function hashPrompt(messages: Array<{ role: string; content: string }>): string {
  const combined = messages.map(m => `${m.role}:${m.content.substring(0, 200)}`).join("|");
  return crypto.createHash("sha256").update(combined).digest("hex").substring(0, 16);
}

function compressPrompt(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{3,}/g, " ")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/```[\s\S]*?```/g, "[code block]")
    .trim();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function buildProviderList(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  const aiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const aiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (aiBaseUrl && aiKey) {
    providers.push({
      id: "replit-ai", name: "ReplitAI", key: aiKey,
      url: `${aiBaseUrl}/chat/completions`, model: "gpt-4o-mini",
      rateKey: "replit", maxTokens: 4096, costTier: 0, format: "openai", free: true
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    const orKey = process.env.OPENROUTER_API_KEY;
    const freeModels = [
      { model: "meta-llama/llama-3.2-3b-instruct:free", id: "or-llama32-free", name: "Llama-3.2-Free" },
      { model: "nousresearch/hermes-3-llama-3.1-405b:free", id: "or-hermes-free", name: "Hermes-405B-Free" },
    ];
    for (const fm of freeModels) {
      providers.push({
        id: fm.id, name: fm.name, key: orKey,
        url: "https://openrouter.ai/api/v1/chat/completions", model: fm.model,
        rateKey: `openrouter-${fm.id}`, maxTokens: 4096, costTier: 0, format: "openai", free: true
      });
    }
    providers.push({
      id: "or-deepseek-paid", name: "DeepSeek-Chat", key: orKey,
      url: "https://openrouter.ai/api/v1/chat/completions", model: "deepseek/deepseek-chat",
      rateKey: "openrouter-paid", maxTokens: 4096, costTier: 1, format: "openai", free: false
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      id: "gemini-flash", name: "Gemini-Flash", key: process.env.GEMINI_API_KEY,
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      model: "gemini-2.0-flash", rateKey: "gemini", maxTokens: 8192, costTier: 0, format: "gemini", free: true
    });
  }

  if (process.env.DEEPSEEK_API_KEY) {
    providers.push({
      id: "deepseek-direct", name: "DeepSeek-Direct", key: process.env.DEEPSEEK_API_KEY,
      url: "https://api.deepseek.com/chat/completions", model: "deepseek-chat",
      rateKey: "deepseek", maxTokens: 4096, costTier: 1, format: "openai", free: false
    });
  }

  if (process.env.OPENAI_API_KEY && !aiBaseUrl) {
    providers.push({
      id: "openai-direct", name: "OpenAI-Direct", key: process.env.OPENAI_API_KEY,
      url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini",
      rateKey: "openai", maxTokens: 4096, costTier: 2, format: "openai", free: false
    });
  }

  if (process.env.GROK_API_KEY) {
    providers.push({
      id: "grok-mini", name: "Grok-Mini", key: process.env.GROK_API_KEY,
      url: "https://api.x.ai/v1/chat/completions", model: "grok-3-mini",
      rateKey: "grok", maxTokens: 4096, costTier: 1, format: "openai", free: false
    });
    providers.push({
      id: "grok", name: "Grok", key: process.env.GROK_API_KEY,
      url: "https://api.x.ai/v1/chat/completions", model: "grok-3",
      rateKey: "grok-full", maxTokens: 4096, costTier: 2, format: "openai", free: false
    });
  }

  if (process.env.COHERE_API_KEY) {
    providers.push({
      id: "cohere", name: "Cohere", key: process.env.COHERE_API_KEY,
      url: "https://api.cohere.ai/v1/chat", model: "command-r-plus",
      rateKey: "cohere", maxTokens: 4096, costTier: 2, format: "openai", free: false
    });
  }

  return providers.sort((a, b) => {
    if (a.costTier !== b.costTier) return a.costTier - b.costTier;
    const aErrors = stats.providerErrors[a.id] || 0;
    const bErrors = stats.providerErrors[b.id] || 0;
    return aErrors - bErrors;
  });
}

function isProviderCoolingDown(providerId: string): boolean {
  const cooldownUntil = stats.providerCooldowns[providerId] || 0;
  return Date.now() < cooldownUntil;
}

function setCooldown(providerId: string, durationMs: number = COOLDOWN_DURATION) {
  stats.providerCooldowns[providerId] = Date.now() + durationMs;
}

function pruneCache() {
  if (responseCache.size <= MAX_CACHE_SIZE) return;
  const entries = Array.from(responseCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  for (const [key] of toRemove) {
    responseCache.delete(key);
  }
}

export async function routeLLM(
  messages: Array<{ role: string; content: string }>,
  options: {
    maxTokens?: number;
    temperature?: number;
    freeOnly?: boolean;
    preferredProvider?: string;
    cacheable?: boolean;
    minResponseLength?: number;
  } = {}
): Promise<{ response: string; provider: string; cached: boolean; tokens: number }> {
  const {
    maxTokens = 4096,
    temperature = 0.8,
    freeOnly = false,
    preferredProvider,
    cacheable = true,
    minResponseLength = 30,
  } = options;

  stats.totalCalls++;

  const compressedMessages = messages.map(m => ({
    role: m.role,
    content: compressPrompt(m.content),
  }));

  if (cacheable) {
    const cacheKey = hashPrompt(compressedMessages);
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      stats.cacheHits++;
      stats.totalTokensSaved += cached.tokens;
      if (tokenAgencyTracker) {
        tokenAgencyTracker({
          provider: `${cached.provider} (cached)`,
          tokensUsed: 0,
          cacheHit: true,
          promptLength: compressedMessages.reduce((s, m) => s + m.content.length, 0),
          responseLength: cached.response.length,
        });
      }
      return { response: cached.response, provider: `${cached.provider} (cached)`, cached: true, tokens: 0 };
    }
  }

  let allProviders = buildProviderList();

  if (freeOnly) {
    allProviders = allProviders.filter(p => p.free);
  }

  if (preferredProvider) {
    const preferred = allProviders.find(p => p.id === preferredProvider);
    if (preferred) {
      allProviders = [preferred, ...allProviders.filter(p => p.id !== preferredProvider)];
    }
  }

  for (const provider of allProviders) {
    if (isProviderCoolingDown(provider.id)) continue;

    try {
      await rateLimitCheck(provider.rateKey);
    } catch {
      setCooldown(provider.id, 30000);
      continue;
    }

    try {
      const effectiveMaxTokens = Math.min(maxTokens, provider.maxTokens);

      let responseText = "";

      if (provider.format === "gemini") {
        const geminiMessages = compressedMessages.map(m => ({
          role: m.role === "system" ? "user" : m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));
        const res = await axios.post(provider.url, {
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: effectiveMaxTokens, temperature },
        }, { timeout: 60000 });
        responseText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const res = await axios.post(provider.url, {
          model: provider.model,
          messages: compressedMessages,
          max_tokens: effectiveMaxTokens,
          temperature,
        }, {
          headers: {
            Authorization: `Bearer ${provider.key}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        });
        responseText = res.data?.choices?.[0]?.message?.content || "";
      }

      if (responseText.length < minResponseLength) {
        continue;
      }

      stats.providerCalls[provider.id] = (stats.providerCalls[provider.id] || 0) + 1;
      stats.providerLastSuccess[provider.id] = Date.now();

      const tokens = estimateTokens(responseText);

      if (cacheable) {
        const cacheKey = hashPrompt(compressedMessages);
        responseCache.set(cacheKey, {
          response: responseText,
          timestamp: Date.now(),
          provider: provider.name,
          tokens,
        });
        pruneCache();
      }

      if (tokenAgencyTracker) {
        tokenAgencyTracker({
          provider: provider.name,
          tokensUsed: tokens,
          cacheHit: false,
          promptLength: compressedMessages.reduce((s, m) => s + m.content.length, 0),
          responseLength: responseText.length,
        });
      }

      return { response: responseText, provider: provider.name, cached: false, tokens };
    } catch (err: any) {
      stats.providerErrors[provider.id] = (stats.providerErrors[provider.id] || 0) + 1;

      const status = err.response?.status;
      if (status === 429) {
        setCooldown(provider.id, 120000);
      } else if (status === 401 || status === 403) {
        setCooldown(provider.id, 600000);
      } else {
        setCooldown(provider.id, 30000);
      }
      continue;
    }
  }

  return { response: "", provider: "none", cached: false, tokens: 0 };
}

export function getRouterStats(): RouterStats & { cacheSize: number; activeProviders: number; freeProviders: number } {
  const providers = buildProviderList();
  return {
    ...stats,
    cacheSize: responseCache.size,
    activeProviders: providers.length,
    freeProviders: providers.filter(p => p.free).length,
  };
}

export function clearCache() {
  responseCache.clear();
  return { cleared: true, previousSize: responseCache.size };
}

export function getProviderHealth(): Array<{ id: string; name: string; free: boolean; calls: number; errors: number; lastSuccess: number; coolingDown: boolean }> {
  const providers = buildProviderList();
  return providers.map(p => ({
    id: p.id,
    name: p.name,
    free: p.free,
    calls: stats.providerCalls[p.id] || 0,
    errors: stats.providerErrors[p.id] || 0,
    lastSuccess: stats.providerLastSuccess[p.id] || 0,
    coolingDown: isProviderCoolingDown(p.id),
  }));
}
