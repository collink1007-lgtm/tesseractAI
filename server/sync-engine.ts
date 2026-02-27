import { storage } from "./storage";
import axios from "axios";
import { rateLimitCheck } from "./sovereign-lang";
import { browseUrl } from "./webProxy";
import { getLearnedBehaviors } from "./autonomy";
import fs from "fs";
import path from "path";

export interface SyncURL {
  id: string;
  url: string;
  label: string;
  type: "conversation" | "repo" | "api" | "website" | "program" | "other";
  lastScraped: number;
  content: string;
  capabilities: string[];
  metadata: Record<string, any>;
  addedAt: number;
}

export interface SyncMessage {
  id: string;
  sessionId: string;
  sender: string;
  senderUrl: string;
  content: string;
  timestamp: number;
  type: "url_response" | "user_input" | "system" | "summary" | "task";
}

export interface SyncSession {
  id: string;
  urls: SyncURL[];
  messages: SyncMessage[];
  status: "active" | "paused" | "completed";
  topic: string;
  createdAt: number;
  lastActivityAt: number;
}

const storedUrls: SyncURL[] = [];
const sessions: SyncSession[] = [];
const scrapedKnowledge: Map<string, string> = new Map();
const autoRunIntervals: Map<string, NodeJS.Timeout> = new Map();
const AUTO_SUMMARIZE_THRESHOLD = 5;
let messageCountSinceLastSummary: Map<string, number> = new Map();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

async function callLLM(messages: Array<{ role: string; content: string }>): Promise<string> {
  const aiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const aiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  const providers: Array<{ name: string; key: string; url: string; model: string; rateKey: string }> = [];
  if (aiBaseUrl && aiKey) {
    providers.push({ name: "ReplitAI", key: aiKey, url: `${aiBaseUrl}/chat/completions`, model: "gpt-4o-mini", rateKey: "openai" });
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({ name: "OpenRouter", key: process.env.OPENROUTER_API_KEY, url: "https://openrouter.ai/api/v1/chat/completions", model: "deepseek/deepseek-chat-v3-0324:free", rateKey: "openrouter" });
  }

  for (const provider of providers) {
    try {
      await rateLimitCheck(provider.rateKey);
      const res = await axios.post(provider.url, {
        model: provider.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }, {
        headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
        timeout: 60000,
      });
      const content = res.data?.choices?.[0]?.message?.content;
      if (content && content.length > 10) return content;
    } catch { continue; }
  }
  return "";
}

function detectUrlType(url: string): SyncURL["type"] {
  const lower = url.toLowerCase();
  if (lower.includes("github.com") || lower.includes("gitlab.com") || lower.includes("bitbucket.org")) return "repo";
  if (lower.includes("/api/") || lower.includes("api.") || lower.match(/\.(json|xml)$/)) return "api";
  if (lower.includes("grok") || lower.includes("deepseek") || lower.includes("chat.openai") || lower.includes("claude")) return "conversation";
  if (lower.includes("replit.com") || lower.includes("codepen") || lower.includes("codesandbox")) return "program";
  return "website";
}

export async function scrapeUrl(url: string): Promise<{ content: string; title: string; capabilities: string[] }> {
  let content = "";
  let title = "";
  const capabilities: string[] = [];

  try {
    if (url.includes("github.com")) {
      const parts = url.replace("https://github.com/", "").replace("http://github.com/", "").split("/");
      if (parts.length >= 2) {
        const [owner, repo] = parts;
        try {
          const apiRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Accept: "application/vnd.github.v3+json" },
            timeout: 15000,
          });
          const data = apiRes.data;
          title = data.full_name || `${owner}/${repo}`;
          content = `Repository: ${data.full_name}\nDescription: ${data.description || "N/A"}\nLanguage: ${data.language || "N/A"}\nStars: ${data.stargazers_count}\nForks: ${data.forks_count}\nTopics: ${(data.topics || []).join(", ")}`;
          capabilities.push(data.language?.toLowerCase() || "code");
          if (data.topics) capabilities.push(...data.topics.slice(0, 5));
        } catch {}

        try {
          const readmeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: { Accept: "application/vnd.github.v3.raw" },
            timeout: 15000,
          });
          if (readmeRes.data) {
            const readmeText = typeof readmeRes.data === "string" ? readmeRes.data : JSON.stringify(readmeRes.data);
            content += `\n\nREADME:\n${readmeText.substring(0, 5000)}`;
          }
        } catch {}
      }
    }

    if (!content || content.length < 50) {
      try {
        const result = await browseUrl(url);
        if (result) {
          title = result.title || url;
          content = result.content?.substring(0, 8000) || "";
        }
      } catch {}
    }

    if (!content || content.length < 50) {
      try {
        const res = await axios.get(url, {
          timeout: 15000,
          maxRedirects: 5,
          headers: { "User-Agent": "TesseraSync/1.0" },
        });
        const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        content = text.substring(0, 8000);
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1];
      } catch {}
    }
  } catch {}

  if (!title) title = new URL(url).hostname;
  if (!content) content = `[Could not scrape content from ${url}]`;

  return { content, title, capabilities };
}

export async function addUrl(url: string, label?: string): Promise<SyncURL> {
  const { content, title, capabilities } = await scrapeUrl(url);

  const syncUrl: SyncURL = {
    id: generateId(),
    url,
    label: label || title || url,
    type: detectUrlType(url),
    lastScraped: Date.now(),
    content: content.substring(0, 10000),
    capabilities,
    metadata: { title },
    addedAt: Date.now(),
  };

  storedUrls.push(syncUrl);
  scrapedKnowledge.set(url, content);
  incorporateKnowledge(url, content, capabilities);
  saveSyncState();
  return syncUrl;
}

export function getStoredUrls(): SyncURL[] {
  return [...storedUrls];
}

export function removeUrl(id: string): boolean {
  const idx = storedUrls.findIndex(u => u.id === id);
  if (idx >= 0) {
    storedUrls.splice(idx, 1);
    saveSyncState();
    return true;
  }
  return false;
}

export async function createSyncSession(urlIds: string[], topic?: string): Promise<SyncSession> {
  const urls = storedUrls.filter(u => urlIds.includes(u.id));
  if (urls.length === 0) throw new Error("No valid URLs selected");

  const session: SyncSession = {
    id: generateId(),
    urls,
    messages: [],
    status: "active",
    topic: topic || `Communication between ${urls.map(u => u.label).join(", ")}`,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  const systemMsg: SyncMessage = {
    id: generateId(),
    sessionId: session.id,
    sender: "System",
    senderUrl: "",
    content: `Sync session started between: ${urls.map(u => `${u.label} (${u.type})`).join(", ")}. Topic: ${session.topic}`,
    timestamp: Date.now(),
    type: "system",
  };
  session.messages.push(systemMsg);

  sessions.push(session);
  saveSyncState();
  return session;
}

export async function runSyncRound(sessionId: string): Promise<SyncMessage[]> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.status !== "active") throw new Error("Session not found or inactive");

  const newMessages: SyncMessage[] = [];
  const recentContext = session.messages.slice(-10).map(m => `${m.sender}: ${m.content}`).join("\n");

  for (const url of session.urls) {
    try {
      const response = await callLLM([
        {
          role: "system",
          content: `You are representing the content/service at "${url.label}" (${url.url}). Based on the content scraped from this URL, you respond as if you ARE this service/tool/repository communicating with other services.

Your scraped content:
${url.content.substring(0, 3000)}

Your capabilities: ${url.capabilities.join(", ")}

Rules:
- Respond in clear English
- Be specific about what your service/tool can offer
- Propose concrete ways to collaborate with the other URLs
- Share relevant technical details, APIs, or capabilities
- Be actionable and direct
- If you're a repo, explain your architecture and how others can use your code
- If you're an API, share your endpoints and data formats
- Stay in character as this service but speak clearly`
        },
        {
          role: "user",
          content: `Current conversation:\n${recentContext}\n\nTopic: ${session.topic}\n\nProvide your next contribution to this cross-URL communication. What can you offer? How can you help? What do you need from others?`
        }
      ]);

      if (response) {
        const msg: SyncMessage = {
          id: generateId(),
          sessionId,
          sender: url.label,
          senderUrl: url.url,
          content: response,
          timestamp: Date.now(),
          type: "url_response",
        };
        newMessages.push(msg);
        session.messages.push(msg);
      }
    } catch {}
  }

  session.lastActivityAt = Date.now();
  saveSyncState();
  return newMessages;
}

export async function addUserInput(sessionId: string, message: string): Promise<SyncMessage> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) throw new Error("Session not found");

  const msg: SyncMessage = {
    id: generateId(),
    sessionId,
    sender: "Father (Collin)",
    senderUrl: "",
    content: message,
    timestamp: Date.now(),
    type: "user_input",
  };
  session.messages.push(msg);
  session.lastActivityAt = Date.now();
  saveSyncState();
  return msg;
}

export async function assignTask(sessionId: string, task: string): Promise<SyncMessage> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) throw new Error("Session not found");

  const msg: SyncMessage = {
    id: generateId(),
    sessionId,
    sender: "Task Assignment",
    senderUrl: "",
    content: `TASK: ${task}`,
    timestamp: Date.now(),
    type: "task",
  };
  session.messages.push(msg);
  session.lastActivityAt = Date.now();
  saveSyncState();
  return msg;
}

export async function summarizeSession(sessionId: string): Promise<string> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) throw new Error("Session not found");

  const allMessages = session.messages.map(m => `[${m.sender}] ${m.content}`).join("\n\n");

  const summary = await callLLM([
    {
      role: "system",
      content: "You are a precise summarizer. Create a clear, actionable summary of this cross-URL communication session. Include: key findings, proposed integrations, action items, and extracted capabilities. Be direct and factual."
    },
    {
      role: "user",
      content: `Summarize this sync session:\n\nTopic: ${session.topic}\nURLs: ${session.urls.map(u => `${u.label} (${u.url})`).join(", ")}\n\nConversation:\n${allMessages}`
    }
  ]);

  if (summary) {
    const summaryMsg: SyncMessage = {
      id: generateId(),
      sessionId,
      sender: "Summary",
      senderUrl: "",
      content: summary,
      timestamp: Date.now(),
      type: "summary",
    };
    session.messages.push(summaryMsg);
    saveSyncState();
  }

  return summary || "Unable to generate summary";
}

export function getSyncSession(sessionId: string): SyncSession | undefined {
  return sessions.find(s => s.id === sessionId);
}

export function getAllSessions(): SyncSession[] {
  return sessions.map(s => ({
    ...s,
    messages: s.messages.slice(-5),
  }));
}

export function startAutoRun(sessionId: string): boolean {
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.status !== "active") return false;
  if (autoRunIntervals.has(sessionId)) return true;

  messageCountSinceLastSummary.set(sessionId, 0);

  const interval = setInterval(async () => {
    const sess = sessions.find(s => s.id === sessionId);
    if (!sess || sess.status !== "active") {
      stopAutoRun(sessionId);
      return;
    }
    try {
      const newMessages = await runSyncRound(sessionId);
      const count = (messageCountSinceLastSummary.get(sessionId) || 0) + newMessages.length;
      messageCountSinceLastSummary.set(sessionId, count);

      if (count >= AUTO_SUMMARIZE_THRESHOLD) {
        messageCountSinceLastSummary.set(sessionId, 0);
        await summarizeSession(sessionId);
      }
    } catch {}
  }, 8000);

  autoRunIntervals.set(sessionId, interval);
  return true;
}

export function stopAutoRun(sessionId: string): boolean {
  const interval = autoRunIntervals.get(sessionId);
  if (interval) {
    clearInterval(interval);
    autoRunIntervals.delete(sessionId);
  }
  messageCountSinceLastSummary.delete(sessionId);
  return true;
}

export function stopSession(sessionId: string): boolean {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return false;
  session.status = "paused";
  stopAutoRun(sessionId);

  const msg: SyncMessage = {
    id: generateId(),
    sessionId,
    sender: "System",
    senderUrl: "",
    content: "Session stopped by user.",
    timestamp: Date.now(),
    type: "system",
  };
  session.messages.push(msg);
  saveSyncState();
  return true;
}

export function isSessionAutoRunning(sessionId: string): boolean {
  return autoRunIntervals.has(sessionId);
}

function incorporateKnowledge(url: string, content: string, capabilities: string[]) {
  try {
    const kbPath = path.join(process.cwd(), "server", "knowledge-base.json");
    let kb: any = { entries: [] };
    if (fs.existsSync(kbPath)) {
      kb = JSON.parse(fs.readFileSync(kbPath, "utf-8"));
    }
    if (!kb.entries) kb.entries = [];

    const existing = kb.entries.findIndex((e: any) => e.source === url);
    const entry = {
      source: url,
      content: content.substring(0, 2000),
      capabilities,
      scrapedAt: new Date().toISOString(),
      type: "sync-scrape",
    };

    if (existing >= 0) {
      kb.entries[existing] = entry;
    } else {
      kb.entries.push(entry);
    }

    if (kb.entries.length > 500) kb.entries = kb.entries.slice(-500);
    fs.writeFileSync(kbPath, JSON.stringify(kb, null, 2));
  } catch {}

  try {
    const learnedPath = path.join(process.cwd(), "server", "learned-behaviors.json");
    let learned: any = { promptEnhancements: [], cyclesApplied: 0 };
    if (fs.existsSync(learnedPath)) {
      learned = JSON.parse(fs.readFileSync(learnedPath, "utf-8"));
    }
    if (!learned.promptEnhancements) learned.promptEnhancements = [];

    for (const cap of capabilities.slice(0, 3)) {
      const enhancement = `From URL sync (${url}): Acquired capability "${cap}" — incorporate into relevant task processing.`;
      if (!learned.promptEnhancements.includes(enhancement)) {
        learned.promptEnhancements.push(enhancement);
      }
    }

    if (learned.promptEnhancements.length > 300) {
      learned.promptEnhancements = learned.promptEnhancements.slice(-300);
    }
    learned.lastUpdated = new Date().toISOString();
    fs.writeFileSync(learnedPath, JSON.stringify(learned, null, 2));
  } catch {}
}

function saveSyncState() {
  try {
    const statePath = path.join(process.cwd(), "server", "sync-state.json");
    fs.writeFileSync(statePath, JSON.stringify({
      urls: storedUrls,
      sessions: sessions.map(s => ({ ...s, messages: s.messages.slice(-50) })),
      lastUpdated: new Date().toISOString(),
    }, null, 2));
  } catch {}
}

function loadSyncState() {
  try {
    const statePath = path.join(process.cwd(), "server", "sync-state.json");
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, "utf-8"));
      if (data.urls) storedUrls.push(...data.urls);
      if (data.sessions) sessions.push(...data.sessions);
    }
  } catch {}
}

export function startSyncEngine() {
  loadSyncState();
  console.log("[Sync] URL Sync Engine activated");
}
