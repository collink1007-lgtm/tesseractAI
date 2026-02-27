import axios from "axios";
import HttpProxyAgent from 'http-proxy-agent';
import fs from 'fs/promises';

const CACHE_EXPIRATION_MS = 5 * 60 * 1000;  // 5 minutes expiration
const FAILURE_RESET_MS = 10 * 60 * 1000;  // 10 minutes for resetting failure counts
const STATS_FILE = 'provider_stats.json';  // File for persisting stats
const LOG_FILE = 'llm_logs.txt';  // File for logging calls and errors

interface CacheEntry {
  value: string;
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();  // Cache with expiration

let lastSuccessfulProvider: string | null = null;  // Memory for the last successful provider

const providerSuccessCounts: Map<string, number> = new Map();  // Track success counts for providers
const providerFailureCounts: Map<string, number> = new Map();  // Track failure counts for providers

const proxies: string[] = [process.env.PROXY1, process.env.PROXY2, process.env.PROXY3].filter(p => p);  // List of proxies from environment variables
let proxyIndex = 0;  // Index for rotating proxies

const userAgents: string[] = [process.env.USER_AGENT1, process.env.USER_AGENT2].filter(ua => ua);  // List of user agents from environment variables
let userAgentIndex = 0;  // Index for rotating user agents

async function loadProviderStats() {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf8');
    const stats = JSON.parse(data);
    for (const [name, count] of Object.entries(stats.successCounts || {})) {
      providerSuccessCounts.set(name as string, count as number);
    }
    for (const [name, count] of Object.entries(stats.failureCounts || {})) {
      providerFailureCounts.set(name as string, count as number);
    }
  } catch (error) {
    // File doesn't exist or error, just skip
  }
}

async function saveProviderStats() {
  const data = {
    successCounts: Array.from(providerSuccessCounts.entries()),
    failureCounts: Array.from(providerFailureCounts.entries()),
  };
  await fs.writeFile(STATS_FILE, JSON.stringify(data), 'utf8');
}

// Load stats at startup
loadProviderStats().catch(console.error);

async function writeLog(message: string) {
  try {
    await fs.appendFile(LOG_FILE, `${new Date().toISOString()} - ${message}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

function getNextProxy(): string | null {
  if (proxies.length === 0) return null;
  const proxy = proxies[proxyIndex % proxies.length];
  proxyIndex = (proxyIndex + 1) % proxies.length;  // Cycle through proxies
  return proxy;
}

function getNextUserAgent(): string | null {
  if (userAgents.length === 0) return null;
  const ua = userAgents[userAgentIndex % userAgents.length];
  userAgentIndex = (userAgentIndex + 1) % userAgents.length;  // Cycle through user agents
  return ua;
}

function generateRandomHeaders(): any {
  const randomHeaders: any = {};
  const possibleAccepts = ['text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8', 'application/json, text/plain, */*'];
  const possibleLanguages = ['en-US,en;q=0.5', 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4'];
  randomHeaders['Accept'] = possibleAccepts[Math.floor(Math.random() * possibleAccepts.length)];
  randomHeaders['Accept-Language'] = possibleLanguages[Math.floor(Math.random() * possibleLanguages.length)];
  randomHeaders['Accept-Encoding'] = 'gzip, deflate, br';
  randomHeaders['Connection'] = 'keep-alive';
  return randomHeaders;
}

function estimateAndTruncatePrompt(prompt: string, maxTokens: number): string {
  const moreAccurateTokens = Math.ceil(prompt.length / 3.2);  // Even more accurate estimation: approximately 3.2 characters per token for better optimization
  if (moreAccurateTokens > maxTokens) {
    const targetLength = maxTokens * 3.2;  // Use improved ratio for token optimization
    return prompt.slice(0, targetLength).trim();  // Truncate and trim to avoid partial words
  }
  return prompt;  // Return original prompt if within limits
}

export async function callLLMSimple(prompt: string, maxTokens = 2048, options: any = {}, systemPrompt: string = "", context: { role: string; content: string }[] = []): Promise<string> {
  const cacheKey = `${prompt}-${maxTokens}-${systemPrompt}-${JSON.stringify(context)}`;  // Unique key for caching
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (Date.now() - entry.timestamp < CACHE_EXPIRATION_MS) {
      return entry.value;  // Return cached response if not expired
    } else {
      cache.delete(cacheKey);  // Remove expired entry
    }
  }

  const optimizedPrompt = estimateAndTruncatePrompt(prompt, maxTokens);  // Optimize the prompt

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push(...context);  // Add context messages if provided
  messages.push({ role: "user", content: optimizedPrompt });  // Use optimized prompt

  const providers: { name: string; url: string; model: string; key: string | undefined }[] = [
    {
      name: "Gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      model: "gemini-2.0-flash",
      key: process.env.GEMINI_API_KEY,
    },
    {
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      model: "deepseek/deepseek-chat:free",
      key: process.env.OPENROUTER_API_KEY,
    },
    {
      name: "DeepSeek",
      url: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-chat",
      key: process.env.DEEPSEEK_API_KEY?.trim(),
    },
    {
      name: "Grok",
      url: "https://api.x.ai/v1/chat/completions",
      model: "grok-3-mini-fast",
      key: process.env.GROK_API_KEY,
    },
    {
      name: "Gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      model: "gemini-2.0-flash",
      key: process.env.GEMINI_API_KEY,
    },
    {
      name: "Cohere",
      url: "https://api.cohere.com/v1/chat/completions",
      model: "command-r-plus-08-2024",
      key: process.env.COHERE_API_KEY,
    },
    {
      name: "HuggingFace",
      url: "https://api-inference.huggingface.co/v1/chat/completions",
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      key: process.env.HUGGINGFACE_API_KEY,
    },
  ];

  // Filter out providers with high failure counts
  const FAILURE_THRESHOLD = 5;  // Threshold for excluding providers
  let filteredProviders = providers.filter(p => (providerFailureCounts.get(p.name) || 0) < FAILURE_THRESHOLD);

  let prioritizedProviders = filteredProviders.slice().sort((a, b) => {
    const successA = providerSuccessCounts.get(a.name) || 0;
    const failureA = providerFailureCounts.get(a.name) || 0;
    const scoreA = successA - failureA;
    const successB = providerSuccessCounts.get(b.name) || 0;
    const failureB = providerFailureCounts.get(b.name) || 0;
    const scoreB = successB - failureB;
    return scoreB - scoreA;  // Sort descending by score (success - failures)
  });

  if (lastSuccessfulProvider) {
    const index = prioritizedProviders.findIndex(p => p.name === lastSuccessfulProvider);
    if (index !== -1) {
      const [provider] = prioritizedProviders.splice(index, 1);
      prioritizedProviders.unshift(provider);  // Move successful provider to the front after sorting
    }
  }

  // Reset failure counts if they are older than FAILURE_RESET_MS
  for (const [name, count] of Array.from(providerFailureCounts.entries())) {
    if (Date.now() - (providerFailureCounts.get(name) || 0) > FAILURE_RESET_MS) {  // Simplified reset
      providerFailureCounts.set(name, 0);
      await saveProviderStats();  // Save after reset
    }
  }

  for (const provider of prioritizedProviders) {
    if (!provider.key) continue;
    for (let attempt = 1; attempt <= 3; attempt++) {  // Add retry logic up to 3 attempts
      try {
        await writeLog(`Attempting call to provider ${provider.name} (attempt ${attempt}/3)`);
        const proxyUrl = getNextProxy();  // Get the next proxy for rotation
        const userAgent = getNextUserAgent();  // Get the next user agent for anti-fingerprinting
        let agent: any = undefined;
        if (proxyUrl) {
          agent = new HttpProxyAgent(proxyUrl);  // Create proxy agent
        }
        const payload = {
          model: provider.model,
          messages,
          max_tokens: maxTokens,
          ...options,  // Merge additional options for flexibility
          stream: false,
        };
        const randomHeaders = generateRandomHeaders();  // Generate random headers for anti-fingerprinting
        const res = await axios.post(
          provider.url,
          payload,
          {
            headers: {
              Authorization: `Bearer ${provider.key}`,
              "Content-Type": "application/json",
              ...(userAgent ? { "User-Agent": userAgent } : {}),
              ...randomHeaders,  // Add random headers
            },
            timeout: 60000,
            httpAgent: agent,  // Apply proxy agent
            httpsAgent: agent,  // Apply for HTTPS as well
          }
        );
        let content: string | undefined;
        // Parse response based on provider using pattern-recognition
        switch (provider.name) {
          case "Gemini":
            // Assuming Gemini structure; adjust if needed
            content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            break;
          case "Cohere":
            // Assuming Cohere structure
            content = res.data?.generations?.[0]?.text;
            break;
          case "HuggingFace":
            // Assuming HuggingFace structure
            content = res.data?.choices?.[0]?.text;
            break;
          default:
            // Default for OpenAI-like structures
            content = res.data?.choices?.[0]?.message?.content;
            break;
        }
        if (content) {
          await writeLog(`Successful response from ${provider.name}: ${content.substring(0, 100)}...`);
          providerSuccessCounts.set(provider.name, (providerSuccessCounts.get(provider.name) || 0) + 1);  // Increment success count
          providerFailureCounts.set(provider.name, 0);  // Reset failure count on success
          lastSuccessfulProvider = provider.name;  // Update memory with successful provider
          await saveProviderStats();  // Save updated stats
          cache.set(cacheKey, { value: content, timestamp: Date.now() });  // Cache the response with timestamp
          return content;
        }
      } catch (error) {
        await writeLog(`Error with provider ${provider.name}: ${error.message}`);
        providerFailureCounts.set(provider.name, (providerFailureCounts.get(provider.name) || 0) + 1);  // Increment failure count
        await saveProviderStats();  // Save updated stats
        if (attempt < 3) {
          console.log(`Retrying provider ${provider.name} (attempt ${attempt + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds before retry
        } else {
          console.error(`Error calling provider ${provider.name} after 3 attempts:`, error);
        }
      }
    }
  }
  return "";
}