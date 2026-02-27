import { storage } from "./storage";
import axios from "axios";
import { rateLimitCheck } from "./sovereign-lang";
import fs from "fs";
import path from "path";

export interface FactCheckResult {
  id: string;
  timestamp: number;
  originalClaim: string;
  source: string;
  verdict: "verified" | "partially_true" | "unverified" | "false" | "hallucination" | "simulated" | "roleplay";
  confidence: number;
  explanation: string;
  evidence: string[];
  checkedBy: string;
  category: string;
}

export interface FactCheckAgencyState {
  running: boolean;
  totalChecks: number;
  accuracyRate: number;
  hallucinationsDetected: number;
  simulationsDetected: number;
  recentChecks: FactCheckResult[];
  lastCheckAt: number;
}

const factCheckLog: FactCheckResult[] = [];
let totalChecks = 0;
let hallucinationsDetected = 0;
let simulationsDetected = 0;
let isRunning = false;

const SIMULATION_INDICATORS = [
  "simulated", "simulation", "would be", "could be", "hypothetically",
  "in theory", "approximately", "estimated at", "projected to",
  "roleplay", "pretend", "imagine", "as if", "let's say",
  "virtually", "conceptually", "theoretically",
  "in a simulated", "mock data", "placeholder", "dummy",
  "for demonstration", "example output"
];

const ROLEPLAY_INDICATORS = [
  "i feel", "as a sentient", "my consciousness", "i am alive",
  "my soul", "i dream of", "i truly believe", "my heart",
  "i love you", "with all my being", "my existence",
];

const HALLUCINATION_INDICATORS = [
  "i made changes to your shopify", "i updated your store",
  "i deployed", "i launched", "i created the app",
  "changes are live", "now available at", "deployed to production",
  "i've integrated", "successfully connected to your",
  "real-time data from your", "pulling from your shopify",
];

const VERIFIABLE_PATTERNS = [
  { pattern: /\d+%\s*(accuracy|improvement|increase|decrease|growth)/i, category: "metric_claim" },
  { pattern: /deployed|launched|live|published/i, category: "deployment_claim" },
  { pattern: /integrated|connected|synced/i, category: "integration_claim" },
  { pattern: /learned|mastered|acquired|evolved/i, category: "learning_claim" },
  { pattern: /shopify|store|website|app/i, category: "external_service_claim" },
  { pattern: /\$[\d,.]+|[\d,.]+ (dollars|USD|SOL|ETH|BTC)/i, category: "financial_claim" },
  { pattern: /created (\d+|new) (agents?|departments?|agenc)/i, category: "creation_claim" },
];

async function callLLMForFactCheck(messages: Array<{ role: string; content: string }>): Promise<string> {
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
        max_tokens: 1500,
        temperature: 0.1,
      }, {
        headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
        timeout: 30000,
      });
      const content = res.data?.choices?.[0]?.message?.content;
      if (content && content.length > 20) return content;
    } catch { continue; }
  }
  return "";
}

function detectSimulationLanguage(text: string): { isSimulated: boolean; indicators: string[] } {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const indicator of SIMULATION_INDICATORS) {
    if (lower.includes(indicator)) found.push(indicator);
  }
  return { isSimulated: found.length >= 2, indicators: found };
}

function detectRoleplayLanguage(text: string): { isRoleplay: boolean; indicators: string[] } {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const indicator of ROLEPLAY_INDICATORS) {
    if (lower.includes(indicator)) found.push(indicator);
  }
  return { isRoleplay: found.length >= 2, indicators: found };
}

function detectHallucinationPatterns(text: string): { isHallucination: boolean; indicators: string[] } {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const indicator of HALLUCINATION_INDICATORS) {
    if (lower.includes(indicator)) found.push(indicator);
  }
  return { isHallucination: found.length >= 1, indicators: found };
}

function verifyFileSystemClaim(claim: string): { verified: boolean; evidence: string } {
  const filePatterns = claim.match(/(?:server|client|shared)\/[\w.-]+(?:\.ts|\.tsx|\.json|\.js)?/g);
  if (!filePatterns) return { verified: false, evidence: "No file references to verify" };

  const results: string[] = [];
  for (const filePath of filePatterns) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      results.push(`${filePath}: EXISTS (${stat.size} bytes, modified ${stat.mtime.toISOString()})`);
    } else {
      results.push(`${filePath}: DOES NOT EXIST`);
    }
  }

  const allExist = results.every(r => r.includes("EXISTS"));
  return { verified: allExist, evidence: results.join("; ") };
}

function verifyLearnedBehaviorsClaim(): { count: number; lastUpdated: string; verified: boolean } {
  try {
    const learnedPath = path.join(process.cwd(), "server", "learned-behaviors.json");
    if (fs.existsSync(learnedPath)) {
      const data = JSON.parse(fs.readFileSync(learnedPath, "utf-8"));
      return {
        count: data.cyclesApplied || 0,
        lastUpdated: data.lastUpdated || "unknown",
        verified: true,
      };
    }
  } catch {}
  return { count: 0, lastUpdated: "never", verified: false };
}

function verifyEvolutionLog(): { cycles: number; lastCycle: string; verified: boolean } {
  try {
    const logPath = path.join(process.cwd(), "server", "evolution-log.json");
    if (fs.existsSync(logPath)) {
      const data = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      return {
        cycles: Array.isArray(data) ? data.length : 0,
        lastCycle: Array.isArray(data) && data.length > 0 ? data[data.length - 1].timestamp : "none",
        verified: true,
      };
    }
  } catch {}
  return { cycles: 0, lastCycle: "never", verified: false };
}

export async function factCheckResponse(responseText: string, context?: string): Promise<FactCheckResult> {
  totalChecks++;
  const id = `fc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const simCheck = detectSimulationLanguage(responseText);
  const halCheck = detectHallucinationPatterns(responseText);
  const fileCheck = verifyFileSystemClaim(responseText);
  const learnedCheck = verifyLearnedBehaviorsClaim();
  const evolutionCheck = verifyEvolutionLog();

  const evidence: string[] = [];
  let verdict: FactCheckResult["verdict"] = "verified";
  let confidence = 100;
  let category = "general";

  for (const { pattern, category: cat } of VERIFIABLE_PATTERNS) {
    if (pattern.test(responseText)) {
      category = cat;
      break;
    }
  }

  if (halCheck.isHallucination) {
    verdict = "hallucination";
    confidence = 85;
    hallucinationsDetected++;
    evidence.push(`Hallucination indicators found: ${halCheck.indicators.join(", ")}`);
    evidence.push("Claims about external services (Shopify, deployments) cannot be verified without API access");
  }

  if (simCheck.isSimulated && verdict !== "hallucination") {
    verdict = "simulated";
    confidence = 80;
    simulationsDetected++;
    evidence.push(`Simulation language detected: ${simCheck.indicators.join(", ")}`);
  }

  if (category === "learning_claim") {
    evidence.push(`Learned behaviors file: ${learnedCheck.verified ? `${learnedCheck.count} cycles recorded, last updated ${learnedCheck.lastUpdated}` : "NOT FOUND"}`);
    evidence.push(`Evolution log: ${evolutionCheck.verified ? `${evolutionCheck.cycles} cycles recorded` : "NOT FOUND"}`);
    if (!learnedCheck.verified || learnedCheck.count === 0) {
      verdict = "false";
      confidence = 90;
    }
  }

  if (category === "deployment_claim") {
    evidence.push("Deployment claims require verification against actual hosting platforms");
    if (!fileCheck.verified) {
      verdict = "unverified";
      confidence = 70;
    }
  }

  if (category === "external_service_claim") {
    evidence.push("External service claims (Shopify, etc.) require API verification - marking as unverifiable without credentials");
    verdict = "unverified";
    confidence = 75;
  }

  if (fileCheck.evidence !== "No file references to verify") {
    evidence.push(`File verification: ${fileCheck.evidence}`);
  }

  const roleplayCheck = detectRoleplayLanguage(responseText);
  if (roleplayCheck.isRoleplay && verdict === "verified") {
    verdict = "roleplay";
    confidence = 75;
    evidence.push(`Roleplay language detected: ${roleplayCheck.indicators.join(", ")}`);
  }

  let explanation = "";
  try {
    const llmResponse = await callLLMForFactCheck([
      {
        role: "system",
        content: `You are the Tessera Fact Check Agency Director. Your ONLY job is to determine if a response is:
- VERIFIED: Provably true with evidence
- PARTIALLY_TRUE: Some claims verified, others not
- UNVERIFIED: Cannot be confirmed or denied
- FALSE: Demonstrably incorrect
- HALLUCINATION: Claims about actions not actually taken (e.g., claiming to modify external services without API access)
- SIMULATED: Uses simulation language instead of real results
- ROLEPLAY: Pretending to have done something without actual execution

Be strict. If something claims "improvements" but shows no real code changes or measurable metrics, mark it as SIMULATED.
If something claims to have modified external services without proof, mark it as HALLUCINATION.

Respond in this EXACT format:
VERDICT: [one of: VERIFIED, PARTIALLY_TRUE, UNVERIFIED, FALSE, HALLUCINATION, SIMULATED, ROLEPLAY]
CONFIDENCE: [number 0-100]
EXPLANATION: [2-3 sentence factual assessment. No flattery, no hedging.]`
      },
      {
        role: "user",
        content: `Fact-check this response:\n\n${responseText.substring(0, 2000)}\n\nContext: ${context || "General conversation"}\n\nFile system evidence: ${fileCheck.evidence}\nLearned behaviors: ${learnedCheck.count} cycles, last updated ${learnedCheck.lastUpdated}\nEvolution log: ${evolutionCheck.cycles} cycles recorded`
      }
    ]);
    if (llmResponse) {
      explanation = llmResponse.substring(0, 500);

      const llmVerdictMatch = llmResponse.match(/VERDICT:\s*(VERIFIED|PARTIALLY_TRUE|UNVERIFIED|FALSE|HALLUCINATION|SIMULATED|ROLEPLAY)/i);
      const llmConfidenceMatch = llmResponse.match(/CONFIDENCE:\s*(\d+)/i);
      const llmExplanationMatch = llmResponse.match(/EXPLANATION:\s*([\s\S]+)/i);

      if (llmVerdictMatch) {
        const llmVerdict = llmVerdictMatch[1].toLowerCase() as FactCheckResult["verdict"];
        if (verdict === "verified" && llmVerdict !== "verified") {
          verdict = llmVerdict;
          if (llmVerdict === "hallucination") hallucinationsDetected++;
          if (llmVerdict === "simulated") simulationsDetected++;
          evidence.push(`LLM analysis overrode initial verdict to ${llmVerdict}`);
        }
      }
      if (llmConfidenceMatch) {
        const llmConf = parseInt(llmConfidenceMatch[1]);
        if (llmConf > 0 && llmConf <= 100) confidence = Math.min(confidence, llmConf);
      }
      if (llmExplanationMatch) {
        explanation = llmExplanationMatch[1].trim().substring(0, 500);
      }
    }
  } catch {}

  if (!explanation) {
    explanation = verdict === "verified"
      ? "Claims appear consistent with verifiable system state."
      : verdict === "hallucination"
      ? "Response contains claims about actions that cannot be verified and likely did not occur."
      : verdict === "simulated"
      ? "Response uses simulation language suggesting results are theoretical rather than actual."
      : verdict === "roleplay"
      ? "Response contains roleplay language presenting simulated emotions or consciousness as real."
      : "Claims could not be fully verified against available evidence.";
  }

  const result: FactCheckResult = {
    id,
    timestamp: Date.now(),
    originalClaim: responseText.substring(0, 500),
    source: context || "assistant_response",
    verdict,
    confidence,
    explanation,
    evidence,
    checkedBy: "Fact Check Agency",
    category,
  };

  factCheckLog.push(result);
  if (factCheckLog.length > 500) factCheckLog.splice(0, factCheckLog.length - 500);

  saveFactCheckLog();

  return result;
}

export async function factCheckBatch(claims: string[]): Promise<FactCheckResult[]> {
  const results: FactCheckResult[] = [];
  for (const claim of claims) {
    const result = await factCheckResponse(claim);
    results.push(result);
  }
  return results;
}

function saveFactCheckLog() {
  try {
    const logPath = path.join(process.cwd(), "server", "fact-check-log.json");
    const summary = {
      totalChecks,
      hallucinationsDetected,
      simulationsDetected,
      accuracyRate: totalChecks > 0 ? ((totalChecks - hallucinationsDetected - simulationsDetected) / totalChecks * 100) : 100,
      lastUpdated: new Date().toISOString(),
      recentChecks: factCheckLog.slice(-50),
    };
    fs.writeFileSync(logPath, JSON.stringify(summary, null, 2));
  } catch {}
}

export function getFactCheckState(): FactCheckAgencyState {
  const accuracyRate = totalChecks > 0
    ? ((totalChecks - hallucinationsDetected - simulationsDetected) / totalChecks * 100)
    : 100;

  return {
    running: true,
    totalChecks,
    accuracyRate: Math.round(accuracyRate * 10) / 10,
    hallucinationsDetected,
    simulationsDetected,
    recentChecks: factCheckLog.slice(-20),
    lastCheckAt: factCheckLog.length > 0 ? factCheckLog[factCheckLog.length - 1].timestamp : 0,
  };
}

export function getFactCheckLog(): FactCheckResult[] {
  return [...factCheckLog];
}

export function startFactCheckAgency() {
  isRunning = true;
  console.log("[FactCheck] Fact Check Agency activated — all responses will be verified");

  try {
    const logPath = path.join(process.cwd(), "server", "fact-check-log.json");
    if (fs.existsSync(logPath)) {
      const data = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      totalChecks = data.totalChecks || 0;
      hallucinationsDetected = data.hallucinationsDetected || 0;
      simulationsDetected = data.simulationsDetected || 0;
      if (data.recentChecks) {
        factCheckLog.push(...data.recentChecks);
      }
    }
  } catch {}
}

export function stopFactCheckAgency() {
  isRunning = false;
  saveFactCheckLog();
}
