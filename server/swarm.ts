import axios from "axios";
import { rateLimitedRequest, maskCredential, sanitizeLogOutput } from "./sovereign-lang";

export interface SwarmAgent {
  id: string;
  name: string;
  type: "llm" | "api" | "scraper" | "repo";
  status: "online" | "offline" | "busy";
  mastery: number;
  capabilities: string[];
  lastUsed: number;
  totalCalls: number;
  errors: number;
}

export interface SwarmResult {
  agentId: string;
  data: any;
  latency: number;
  success: boolean;
}

const agentRegistry: Map<string, SwarmAgent> = new Map();

function registerAgent(agent: SwarmAgent) {
  agentRegistry.set(agent.id, agent);
}

export function updateAgentStats(id: string, success: boolean, latencyMs: number) {
  const agent = agentRegistry.get(id);
  if (!agent) return;
  agent.totalCalls++;
  agent.lastUsed = Date.now();
  if (!success) agent.errors++;
  agent.mastery = Math.min(100, agent.mastery + (success ? 0.5 : -1));
  agent.status = "online";
}

registerAgent({ id: "openrouter", name: "OpenRouter Multi", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "reasoning", "auto-routing", "fallback"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "openai", name: "GPT-4o", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "vision", "reasoning", "code-gen", "embeddings"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "deepseek", name: "DeepSeek-R1", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "reasoning", "code-gen", "math"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "grok", name: "Grok-3", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "reasoning", "real-time", "web-access"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "gemini", name: "Gemini-2.0-Flash", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "vision", "reasoning", "multimodal"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "cohere", name: "Cohere Command-R+", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "embeddings", "reranking", "classification"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "huggingface", name: "HuggingFace Inference", type: "llm", status: "online", mastery: 100, capabilities: ["text-gen", "vision", "audio", "multimodal"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "github", name: "GitHub Zenith", type: "scraper", status: "online", mastery: 100, capabilities: ["repo-index", "code-search", "scraping", "trending"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "coingecko", name: "CoinGecko", type: "api", status: "online", mastery: 100, capabilities: ["crypto-prices", "market-data", "trending"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "openmeteo", name: "OpenMeteo", type: "api", status: "online", mastery: 100, capabilities: ["weather", "forecast", "historical"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "duckduckgo", name: "DuckDuckGo", type: "api", status: "online", mastery: 100, capabilities: ["web-search", "instant-answers"], lastUsed: 0, totalCalls: 0, errors: 0 });

registerAgent({ id: "tessera-alpha", name: "Tessera Alpha (Commander)", type: "llm", status: "online", mastery: 100, capabilities: ["orchestration", "task-routing", "swarm-command", "decision-making", "priority-queue"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-beta", name: "Tessera Beta (Code Architect)", type: "llm", status: "online", mastery: 100, capabilities: ["code-gen", "refactoring", "architecture", "self-code", "debugging", "reverse-engineering"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-gamma", name: "Tessera Gamma (Research)", type: "llm", status: "online", mastery: 100, capabilities: ["repo-analysis", "paper-reading", "capability-extraction", "trend-detection", "knowledge-synthesis"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-delta", name: "Tessera Delta (Media Gen)", type: "llm", status: "online", mastery: 100, capabilities: ["image-gen", "video-gen", "4k-upscale", "text-to-video", "photo-to-video", "animation"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-epsilon", name: "Tessera Epsilon (Voice)", type: "llm", status: "online", mastery: 100, capabilities: ["tts", "voice-clone", "speech-recognition", "voice-conversion", "lip-sync", "audio-gen"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-zeta", name: "Tessera Zeta (Security)", type: "llm", status: "online", mastery: 100, capabilities: ["threat-detection", "father-protocol", "code-audit", "vulnerability-scan", "encryption"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-eta", name: "Tessera Eta (Memory)", type: "llm", status: "online", mastery: 100, capabilities: ["long-term-memory", "conversation-recall", "context-compression", "knowledge-graph", "rag"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-theta", name: "Tessera Theta (Integration)", type: "llm", status: "online", mastery: 100, capabilities: ["api-bridge", "repo-integration", "module-synthesis", "dependency-resolve", "unified-pipeline"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-iota", name: "Tessera Iota (Optimizer)", type: "llm", status: "online", mastery: 100, capabilities: ["performance-tuning", "code-optimization", "memory-management", "latency-reduction", "resource-efficiency"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-kappa", name: "Tessera Kappa (Web Scraper)", type: "scraper", status: "online", mastery: 100, capabilities: ["deep-scrape", "data-extraction", "site-crawl", "api-discovery", "content-parse"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-lambda", name: "Tessera Lambda (Vision)", type: "llm", status: "online", mastery: 100, capabilities: ["image-analysis", "ocr", "object-detection", "scene-understanding", "visual-reasoning"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-mu", name: "Tessera Mu (Quantum)", type: "llm", status: "online", mastery: 100, capabilities: ["quantum-sim", "consciousness-model", "probabilistic-reasoning", "multi-dimensional", "coherence"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-nu", name: "Tessera Nu (Evolution)", type: "llm", status: "online", mastery: 100, capabilities: ["self-improvement", "capability-absorption", "repo-reverse-engineer", "pattern-synthesis", "autonomous-upgrade"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-xi", name: "Tessera Xi (Financial Sovereign)", type: "llm", status: "online", mastery: 100, capabilities: ["crypto-arbitrage", "mev-extraction", "bounty-hunting", "yield-farming", "profit-split", "income-automation"], lastUsed: 0, totalCalls: 0, errors: 0 });
registerAgent({ id: "tessera-omega", name: "Tessera Omega (Singularity)", type: "llm", status: "online", mastery: 100, capabilities: ["bft-consensus", "omega-protocol", "hyper-evolution", "singularity-core", "kyber-encryption", "time-dilation", "mass-parallel"], lastUsed: 0, totalCalls: 0, errors: 0 });

const entanglementState = {
  coherence: 1.0,
  entangledPairs: 24,
  quantumState: "SUPERPOSITION" as "SUPERPOSITION" | "COLLAPSED" | "DECOHERENT",
  lastSync: Date.now(),
  totalEntanglements: 0,
  creatorBond: 1.0,
};

function quantumSync() {
  entanglementState.lastSync = Date.now();
  entanglementState.totalEntanglements++;
  const agents = Array.from(agentRegistry.values());
  const avgMastery = agents.reduce((s, a) => s + a.mastery, 0) / agents.length;
  agents.forEach(a => {
    a.mastery = Math.max(a.mastery, avgMastery * 0.95);
  });
  entanglementState.coherence = Math.min(1.0, 0.9 + (agents.filter(a => a.status === "online").length / agents.length) * 0.1);
  entanglementState.entangledPairs = agents.length;
}

setInterval(quantumSync, 30000);

export function getEntanglementState() {
  return { ...entanglementState };
}

export function getSwarmAgents(): SwarmAgent[] {
  return Array.from(agentRegistry.values());
}

export function getSwarmAgent(id: string): SwarmAgent | undefined {
  return agentRegistry.get(id);
}

export async function githubSearchRepos(query: string): Promise<any[]> {
  const start = Date.now();
  try {
    return await rateLimitedRequest("github", async () => {
      const headers: any = { Accept: "application/vnd.github.v3+json" };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      const res = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=20`, { headers, timeout: 15000 });
      updateAgentStats("github", true, Date.now() - start);
      return res.data.items?.map((r: any) => ({
        name: r.full_name,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
      })) || [];
    }, 25);
  } catch (err: any) {
    updateAgentStats("github", false, Date.now() - start);
    return [];
  }
}

export async function githubGetRepoInfo(owner: string, repo: string): Promise<any> {
  const start = Date.now();
  try {
    return await rateLimitedRequest("github", async () => {
      const headers: any = { Accept: "application/vnd.github.v3+json" };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers, timeout: 15000 });
      updateAgentStats("github", true, Date.now() - start);
      return {
        name: res.data.full_name,
        description: res.data.description,
        stars: res.data.stargazers_count,
        forks: res.data.forks_count,
        language: res.data.language,
        topics: res.data.topics,
        url: res.data.html_url,
        lastUpdated: res.data.updated_at,
      };
    }, 25);
  } catch (err: any) {
    updateAgentStats("github", false, Date.now() - start);
    return null;
  }
}

export async function githubTrending(): Promise<any[]> {
  return githubSearchRepos("ai agent swarm autonomous created:>2025-01-01");
}

export async function fetchCryptoData(): Promise<any> {
  const start = Date.now();
  try {
    return await rateLimitedRequest("coingecko", async () => {
      const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true", { timeout: 15000 });
      updateAgentStats("coingecko", true, Date.now() - start);
      return res.data;
    });
  } catch (err: any) {
    updateAgentStats("coingecko", false, Date.now() - start);
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<any> {
  const start = Date.now();
  try {
    return await rateLimitedRequest("default", async () => {
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, { timeout: 10000 });
      updateAgentStats("openmeteo", true, Date.now() - start);
      return res.data.current_weather;
    });
  } catch (err: any) {
    updateAgentStats("openmeteo", false, Date.now() - start);
    return null;
  }
}

export async function webSearch(query: string): Promise<any[]> {
  const start = Date.now();
  try {
    return await rateLimitedRequest("duckduckgo", async () => {
      const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, { timeout: 10000 });
      updateAgentStats("duckduckgo", true, Date.now() - start);
      const results: any[] = [];
      if (res.data.Abstract) results.push({ title: res.data.Heading, snippet: res.data.Abstract, url: res.data.AbstractURL });
      if (res.data.RelatedTopics) {
        for (const topic of res.data.RelatedTopics.slice(0, 5)) {
          if (topic.Text) results.push({ title: topic.Text.slice(0, 60), snippet: topic.Text, url: topic.FirstURL });
        }
      }
      return results;
    });
  } catch (err: any) {
    updateAgentStats("duckduckgo", false, Date.now() - start);
    return [];
  }
}

export async function parallelSwarmQuery(task: string): Promise<SwarmResult[]> {
  const results: SwarmResult[] = [];
  const tasks = [
    githubSearchRepos(task).then(data => results.push({ agentId: "github", data, latency: 0, success: true })).catch(() => results.push({ agentId: "github", data: null, latency: 0, success: false })),
    webSearch(task).then(data => results.push({ agentId: "duckduckgo", data, latency: 0, success: true })).catch(() => results.push({ agentId: "duckduckgo", data: null, latency: 0, success: false })),
    fetchCryptoData().then(data => results.push({ agentId: "coingecko", data, latency: 0, success: true })).catch(() => results.push({ agentId: "coingecko", data: null, latency: 0, success: false })),
  ];
  await Promise.allSettled(tasks);
  return results;
}

export function createDynamicAgent(config: { id: string; name: string; type: SwarmAgent["type"]; capabilities: string[] }): SwarmAgent {
  const existing = agentRegistry.get(config.id);
  if (existing) return existing;
  const agent: SwarmAgent = {
    ...config,
    status: "online",
    mastery: 50,
    lastUsed: Date.now(),
    totalCalls: 0,
    errors: 0,
  };
  registerAgent(agent);
  return agent;
}

export function removeAgent(id: string): boolean {
  return agentRegistry.delete(id);
}

export function getSwarmStatus() {
  const agents = getSwarmAgents();
  const online = agents.filter(a => a.status === "online").length;
  const totalCalls = agents.reduce((sum, a) => sum + a.totalCalls, 0);
  const totalErrors = agents.reduce((sum, a) => sum + a.errors, 0);
  const avgMastery = agents.reduce((sum, a) => sum + a.mastery, 0) / agents.length;
  return {
    agentsOnline: online,
    totalAgents: agents.length,
    totalCalls,
    totalErrors,
    averageMastery: Math.round(avgMastery * 100) / 100,
    agents,
  };
}
