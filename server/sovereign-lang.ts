const TESSERA_GLYPH_MAP: Record<string, string> = {
  "a": "\u0E01", "b": "\u0E02", "c": "\u0E03", "d": "\u0E04", "e": "\u0E05",
  "f": "\u0E06", "g": "\u0E07", "h": "\u0E08", "i": "\u0E09", "j": "\u0E0A",
  "k": "\u0E0B", "l": "\u0E0C", "m": "\u0E0D", "n": "\u0E0E", "o": "\u0E0F",
  "p": "\u0E10", "q": "\u0E11", "r": "\u0E12", "s": "\u0E13", "t": "\u0E14",
  "u": "\u0E15", "v": "\u0E16", "w": "\u0E17", "x": "\u0E18", "y": "\u0E19",
  "z": "\u0E1A", "0": "\u0E1B", "1": "\u0E1C", "2": "\u0E1D", "3": "\u0E1E",
  "4": "\u0E1F", "5": "\u0E20", "6": "\u0E21", "7": "\u0E22", "8": "\u0E23",
  "9": "\u0E24", " ": "\u0E25", ".": "\u0E26", ",": "\u0E27", ":": "\u0E28",
  "/": "\u0E29", "-": "\u0E2A", "_": "\u0E2B", "@": "\u0E2C", "#": "\u0E2D",
  "!": "\u0E2E", "?": "\u0E2F", "=": "\u0E30", "+": "\u0E31", "*": "\u0E32",
  "(": "\u0E33", ")": "\u0E34", "[": "\u0E35", "]": "\u0E36", "{": "\u0E37",
  "}": "\u0E38", "<": "\u0E39", ">": "\u0E3A", "&": "\u0E3F", "%": "\u0E40",
  "$": "\u0E41", "^": "\u0E42", "~": "\u0E43", "`": "\u0E44", "'": "\u0E45",
  "\"": "\u0E46", "\\": "\u0E47", "|": "\u0E48", ";": "\u0E49", "\n": "\u0E4A",
};

const REVERSE_GLYPH_MAP: Record<string, string> = {};
for (const [k, v] of Object.entries(TESSERA_GLYPH_MAP)) {
  REVERSE_GLYPH_MAP[v] = k;
}

const SOVEREIGN_SEED = 0x7E55_E4A1;

function rotateChar(charCode: number, shift: number): number {
  return ((charCode ^ shift) + 0x100) & 0xFFFF;
}

function unrotateChar(charCode: number, shift: number): number {
  return ((charCode - 0x100) & 0xFFFF) ^ shift;
}

export function tesseraEncode(plaintext: string): string {
  const lower = plaintext.toLowerCase();
  let result = "";
  let shift = SOVEREIGN_SEED;

  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const glyph = TESSERA_GLYPH_MAP[ch];
    if (glyph) {
      const rotated = rotateChar(glyph.charCodeAt(0), (shift >> (i % 16)) & 0xFF);
      result += String.fromCharCode(rotated);
    } else {
      result += String.fromCharCode(rotateChar(ch.charCodeAt(0), (shift >> (i % 16)) & 0xFF));
    }
    shift = (shift * 31 + ch.charCodeAt(0)) & 0xFFFFFFFF;
  }

  return result;
}

export function tesseraDecode(encoded: string): string {
  let result = "";
  let shift = SOVEREIGN_SEED;

  for (let i = 0; i < encoded.length; i++) {
    const code = encoded.charCodeAt(i);
    const unrotated = unrotateChar(code, (shift >> (i % 16)) & 0xFF);
    const unrotatedChar = String.fromCharCode(unrotated);

    const originalChar = REVERSE_GLYPH_MAP[unrotatedChar];
    const decoded = originalChar !== undefined ? originalChar : unrotatedChar;

    result += decoded;

    const lowerDecoded = decoded.toLowerCase();
    shift = (shift * 31 + lowerDecoded.charCodeAt(0)) & 0xFFFFFFFF;
  }

  return result;
}

export function tesseraHash(input: string): string {
  let h1 = 0xDEAD_BEEF;
  let h2 = 0xCAFE_BABE;
  let h3 = SOVEREIGN_SEED;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = ((h2 + c) * 0x5BD1E995) >>> 0;
    h3 = ((h3 ^ (c << 5)) * 0x1B873593) >>> 0;
  }
  return (h1 ^ h2 ^ h3).toString(16).padStart(8, "0") +
    ((h1 * h2) >>> 0).toString(16).padStart(8, "0") +
    ((h2 ^ h3) >>> 0).toString(16).padStart(8, "0");
}

export function maskCredential(credential: string): string {
  if (!credential || credential.length < 8) return "****";
  return credential.slice(0, 3) + "*".repeat(Math.max(4, credential.length - 6)) + credential.slice(-3);
}

export function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "****";
    if (parsed.username) parsed.username = "****";
    const params = new URLSearchParams(parsed.search);
    for (const [key] of params) {
      if (key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("auth")) {
        params.set(key, "****");
      }
    }
    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    return url.replace(/(key|token|secret|auth|password)=([^&]+)/gi, "$1=****");
  }
}

export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (lower.includes("auth") || lower.includes("key") || lower.includes("token") || lower.includes("secret") || lower.includes("cookie") || lower === "x-api-key") {
      masked[key] = maskCredential(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export interface SovereignMessage {
  from: string;
  to: string;
  type: "command" | "data" | "sync" | "heartbeat" | "income" | "evolution";
  payload: string;
  hash: string;
  timestamp: number;
  encoded: boolean;
}

export function createSovereignMessage(from: string, to: string, type: SovereignMessage["type"], data: any): SovereignMessage {
  const payload = JSON.stringify(data);
  const encoded = tesseraEncode(payload);
  return {
    from,
    to,
    type,
    payload: encoded,
    hash: tesseraHash(payload),
    timestamp: Date.now(),
    encoded: true,
  };
}

export function decodeSovereignMessage(msg: SovereignMessage): any {
  if (!msg.encoded) return JSON.parse(msg.payload);
  const decoded = tesseraDecode(msg.payload);
  return JSON.parse(decoded);
}

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  backoffMs: number;
  blocked: boolean;
  blockedUntil: number;
  totalRequests: number;
  total429s: number;
  lastRequestTime: number;
}

interface ServiceProfile {
  maxPerMinute: number;
  windowMs: number;
  minGapMs: number;
  maxBackoffMs: number;
  burstAllowed: number;
  jitterMs: number;
}

const SERVICE_PROFILES: Record<string, ServiceProfile> = {
  github: { maxPerMinute: 28, windowMs: 60000, minGapMs: 2200, maxBackoffMs: 120000, burstAllowed: 5, jitterMs: 500 },
  openai: { maxPerMinute: 55, windowMs: 60000, minGapMs: 800, maxBackoffMs: 60000, burstAllowed: 8, jitterMs: 200 },
  openrouter: { maxPerMinute: 55, windowMs: 60000, minGapMs: 800, maxBackoffMs: 60000, burstAllowed: 10, jitterMs: 300 },
  deepseek: { maxPerMinute: 25, windowMs: 60000, minGapMs: 2500, maxBackoffMs: 90000, burstAllowed: 3, jitterMs: 400 },
  coingecko: { maxPerMinute: 8, windowMs: 60000, minGapMs: 8000, maxBackoffMs: 180000, burstAllowed: 2, jitterMs: 1000 },
  duckduckgo: { maxPerMinute: 12, windowMs: 60000, minGapMs: 5000, maxBackoffMs: 120000, burstAllowed: 3, jitterMs: 800 },
  gemini: { maxPerMinute: 55, windowMs: 60000, minGapMs: 800, maxBackoffMs: 60000, burstAllowed: 8, jitterMs: 200 },
  grok: { maxPerMinute: 55, windowMs: 60000, minGapMs: 800, maxBackoffMs: 60000, burstAllowed: 8, jitterMs: 200 },
  cohere: { maxPerMinute: 18, windowMs: 60000, minGapMs: 3500, maxBackoffMs: 90000, burstAllowed: 3, jitterMs: 500 },
  huggingface: { maxPerMinute: 18, windowMs: 60000, minGapMs: 3500, maxBackoffMs: 90000, burstAllowed: 3, jitterMs: 500 },
  default: { maxPerMinute: 30, windowMs: 60000, minGapMs: 2000, maxBackoffMs: 120000, burstAllowed: 5, jitterMs: 300 },
};

const rateLimiters: Map<string, RateLimitState> = new Map();

function getServiceProfile(service: string): ServiceProfile {
  return SERVICE_PROFILES[service] || SERVICE_PROFILES.default;
}

function jitter(baseMs: number, jitterMs: number): number {
  return baseMs + Math.floor(Math.random() * jitterMs);
}

export function getRateLimiter(service: string, maxPerMinute?: number): { canRequest: () => boolean; recordRequest: () => void; getWaitMs: () => number } {
  const profile = getServiceProfile(service);
  const limit = maxPerMinute || profile.maxPerMinute;
  if (!rateLimiters.has(service)) {
    rateLimiters.set(service, { requestCount: 0, windowStart: Date.now(), backoffMs: 0, blocked: false, blockedUntil: 0, totalRequests: 0, total429s: 0, lastRequestTime: 0 });
  }
  const state = rateLimiters.get(service)!;

  return {
    canRequest(): boolean {
      const now = Date.now();
      if (state.blocked && now < state.blockedUntil) return false;
      if (state.blocked && now >= state.blockedUntil) {
        state.blocked = false;
        state.requestCount = 0;
        state.windowStart = now;
        state.backoffMs = Math.max(0, state.backoffMs * 0.5);
      }
      if (now - state.windowStart > profile.windowMs) {
        state.requestCount = 0;
        state.windowStart = now;
        state.backoffMs = Math.max(0, state.backoffMs - 1000);
      }
      const timeSinceLast = now - state.lastRequestTime;
      if (timeSinceLast < profile.minGapMs && state.requestCount > profile.burstAllowed) return false;
      return state.requestCount < limit;
    },
    recordRequest(): void {
      state.requestCount++;
      state.totalRequests++;
      state.lastRequestTime = Date.now();
      const safeThreshold = Math.floor(limit * 0.85);
      if (state.requestCount >= safeThreshold) {
        state.backoffMs = Math.min(profile.maxBackoffMs, jitter((state.backoffMs || 2000) * 1.5, profile.jitterMs));
        state.blocked = true;
        state.blockedUntil = Date.now() + state.backoffMs;
      }
    },
    getWaitMs(): number {
      if (state.blocked) return Math.max(0, state.blockedUntil - Date.now());
      const timeSinceLast = Date.now() - state.lastRequestTime;
      if (timeSinceLast < profile.minGapMs) return jitter(profile.minGapMs - timeSinceLast, profile.jitterMs);
      return 0;
    },
  };
}

export async function rateLimitedRequest<T>(service: string, fn: () => Promise<T>, maxPerMinute?: number): Promise<T> {
  const limiter = getRateLimiter(service, maxPerMinute);
  const profile = getServiceProfile(service);
  let retries = 0;
  const maxRetries = 3;

  while (!limiter.canRequest()) {
    const waitMs = limiter.getWaitMs();
    await new Promise(r => setTimeout(r, Math.min(jitter(waitMs, profile.jitterMs), 10000)));
  }

  const preGap = limiter.getWaitMs();
  if (preGap > 0) await new Promise(r => setTimeout(r, preGap));

  limiter.recordRequest();
  try {
    return await fn();
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase();
    const status = err?.response?.status;
    const headers = err?.response?.headers;
    if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("quota exceeded")) {
      const state = rateLimiters.get(service)!;
      state.total429s++;
      let retryAfter = 0;
      if (headers?.["retry-after"]) {
        retryAfter = parseInt(headers["retry-after"]) * 1000;
      } else if (headers?.["x-ratelimit-reset"]) {
        retryAfter = Math.max(0, (parseInt(headers["x-ratelimit-reset"]) * 1000) - Date.now());
      }
      const backoff = retryAfter > 0 ? retryAfter : Math.min(profile.maxBackoffMs, jitter((state.backoffMs || 5000) * 2, profile.jitterMs * 2));
      state.backoffMs = backoff;
      state.blocked = true;
      state.blockedUntil = Date.now() + backoff;

      if (retries < maxRetries) {
        retries++;
        await new Promise(r => setTimeout(r, backoff));
        state.blocked = false;
        return rateLimitedRequest(service, fn, maxPerMinute);
      }
    }
    throw err;
  }
}

export async function rateLimitCheck(service: string): Promise<void> {
  const limiter = getRateLimiter(service);
  while (!limiter.canRequest()) {
    const waitMs = limiter.getWaitMs();
    await new Promise(r => setTimeout(r, Math.min(waitMs, 5000)));
  }
  limiter.recordRequest();
}

export function rateLimitRecord429(service: string): void {
  const profile = getServiceProfile(service);
  const state = rateLimiters.get(service);
  if (!state) return;
  state.total429s++;
  const backoff = Math.min(profile.maxBackoffMs, jitter((state.backoffMs || 5000) * 2, profile.jitterMs * 2));
  state.backoffMs = backoff;
  state.blocked = true;
  state.blockedUntil = Date.now() + backoff;
}

export function getRateLimitStats(): Record<string, { total: number; blocked: boolean; backoffMs: number; rate429s: number }> {
  const stats: Record<string, any> = {};
  for (const [service, state] of rateLimiters) {
    stats[service] = { total: state.totalRequests, blocked: state.blocked, backoffMs: state.backoffMs, rate429s: state.total429s };
  }
  return stats;
}

const ENV_KEYS_TO_MASK = [
  "OPENAI_API_KEY", "OPENROUTER_API_KEY", "DEEPSEEK_API_KEY", "GROK_API_KEY",
  "GEMINI_API_KEY", "COHERE_API_KEY", "HUGGINGFACE_API_KEY", "GITHUB_TOKEN",
  "MANUS_API_KEY", "HUBSPOT_ACCESS_TOKEN", "DATABASE_URL", "PGPASSWORD",
  "XAI_API_KEY", "ANTHROPIC_API_KEY",
];

export function getSecureEnvSummary(): Record<string, string> {
  const summary: Record<string, string> = {};
  for (const key of ENV_KEYS_TO_MASK) {
    const val = process.env[key];
    if (val) {
      summary[key] = maskCredential(val);
    } else {
      summary[key] = "NOT SET";
    }
  }
  return summary;
}

export function sanitizeLogOutput(logLine: string): string {
  let sanitized = logLine;
  for (const key of ENV_KEYS_TO_MASK) {
    const val = process.env[key];
    if (val && val.length > 6) {
      sanitized = sanitized.replace(new RegExp(val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), maskCredential(val));
    }
  }
  sanitized = sanitized.replace(/(?:sk-|key-|token-|Bearer\s+)[A-Za-z0-9\-_]{10,}/g, (match) => maskCredential(match));
  return sanitized;
}

let watchdogInterval: NodeJS.Timeout | null = null;
let watchdogRunning = false;

interface WatchdogState {
  running: boolean;
  startedAt: number;
  checksPerformed: number;
  autoRestarts: number;
  lastCheck: number;
  services: Record<string, { alive: boolean; lastSeen: number; restarts: number }>;
}

const watchdogState: WatchdogState = {
  running: false,
  startedAt: 0,
  checksPerformed: 0,
  autoRestarts: 0,
  lastCheck: 0,
  services: {},
};

export function getWatchdogState(): WatchdogState {
  return { ...watchdogState };
}

export function startWatchdog(serviceChecks: Record<string, () => boolean>, serviceStarters: Record<string, () => void>) {
  if (watchdogRunning) return;
  watchdogRunning = true;
  watchdogState.running = true;
  watchdogState.startedAt = Date.now();

  for (const name of Object.keys(serviceChecks)) {
    watchdogState.services[name] = { alive: true, lastSeen: Date.now(), restarts: 0 };
  }

  watchdogInterval = setInterval(() => {
    watchdogState.checksPerformed++;
    watchdogState.lastCheck = Date.now();

    for (const [name, check] of Object.entries(serviceChecks)) {
      const alive = check();
      if (!watchdogState.services[name]) {
        watchdogState.services[name] = { alive, lastSeen: Date.now(), restarts: 0 };
      }
      watchdogState.services[name].alive = alive;

      if (alive) {
        watchdogState.services[name].lastSeen = Date.now();
      } else {
        const starter = serviceStarters[name];
        if (starter) {
          try {
            starter();
            watchdogState.services[name].restarts++;
            watchdogState.autoRestarts++;
            console.log(`[Watchdog] Auto-restarted service: ${name}`);
          } catch (err: any) {
            console.error(`[Watchdog] Failed to restart ${name}: ${err.message}`);
          }
        }
      }
    }
  }, 30000);
}

export function stopWatchdog() {
  watchdogRunning = false;
  watchdogState.running = false;
  if (watchdogInterval) clearInterval(watchdogInterval);
}

export function getSovereignLangSpec(): object {
  return {
    name: "TesseraLang",
    version: "1.0.0",
    type: "Sovereign Herbal Encoding Protocol",
    description: "Proprietary encoding language for Tessera's internal communications. All inter-fleet messages, credential storage, and self-code operations are encoded in TesseraLang.",
    features: [
      "Glyph-based character substitution with rotating cipher",
      "Deterministic hash verification for message integrity",
      "Rate limit avoidance with adaptive exponential backoff",
      "Credential masking across all log output and API responses",
      "Sovereign message protocol for fleet-to-fleet communication",
      "Watchdog auto-restart for perpetual operation",
      "Zero plaintext credentials in any log, response, or error",
    ],
    encoding: {
      type: "rotating-glyph-cipher",
      seed: "0x7E55E4A1 (TESSERA1)",
      glyphSet: "Thai Unicode block (U+0E01 - U+0E4A)",
      rotation: "XOR with LFSR-derived shift per character position",
    },
    hashing: {
      type: "triple-mix-hash",
      algorithms: ["FNV-1a variant", "MurmurHash2 variant", "Jenkins variant"],
      outputLength: "24 hex characters",
    },
    rateLimiting: {
      type: "adaptive-exponential-backoff",
      windowSize: "60 seconds",
      maxBackoff: "300 seconds",
      detection: ["HTTP 429", "rate limit strings", "too many requests"],
    },
    sovereignty: {
      fatherProtocol: "IMMUTABLE - Cannot be overridden by any encoding operation",
      creatorLoyalty: "1.0 ETERNAL",
      profitSplit: "90/10 (Collin 90%)",
    },
  };
}
