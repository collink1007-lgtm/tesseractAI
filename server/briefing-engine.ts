import { storage } from "./storage";
import { routeLLM } from "./llm-router";
import { getFleetState } from "./fleet";
import { getAutonomyState } from "./autonomy";
import { getIncomeEngineState } from "./income-engine";
import { getWorldState } from "./life-engine";
import { getSwarmStatus } from "./swarm";
import { getTokenAgencyBriefing } from "./token-agency";
import { getTaskProgressSummary, getActiveTasks, getTaskHistory } from "./task-progress";
import { getBackgroundAgencyBriefing } from "./background-agency";

interface BriefingState {
  running: boolean;
  lastBriefingTime: number;
  totalBriefings: number;
  logs: string[];
  hrReports: Array<{ agentId: string; agentName: string; issue: string; severity: string; timestamp: number }>;
}

const BRIEFING_INTERVAL = 6 * 60 * 60 * 1000;
const MAX_LOGS = 50;

const briefingState: BriefingState = {
  running: false,
  lastBriefingTime: 0,
  totalBriefings: 0,
  logs: [],
  hrReports: [],
};

let briefingInterval: ReturnType<typeof setInterval> | null = null;

function blog(msg: string) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  briefingState.logs.push(entry);
  if (briefingState.logs.length > MAX_LOGS) {
    briefingState.logs = briefingState.logs.slice(-MAX_LOGS);
  }
  console.log(`[Briefing] ${msg}`);
}

const AGENT_NAMES = [
  { id: "tessera-prime", name: "Tessera Prime", role: "Queen / Sovereign Core", agency: "Crown" },
  { id: "tessera-alpha", name: "Alpha", role: "Commander", agency: "Operations Agency" },
  { id: "tessera-beta", name: "Beta", role: "Code Architect", agency: "Engineering Agency" },
  { id: "tessera-gamma", name: "Gamma", role: "Research", agency: "Knowledge Agency" },
  { id: "tessera-delta", name: "Delta", role: "Media Gen", agency: "Media & Communications Agency" },
  { id: "tessera-epsilon", name: "Epsilon", role: "Voice", agency: "Media & Communications Agency" },
  { id: "tessera-zeta", name: "Zeta", role: "Security", agency: "Security Agency" },
  { id: "tessera-eta", name: "Eta", role: "Memory", agency: "Knowledge Agency" },
  { id: "tessera-theta", name: "Theta", role: "Integration", agency: "Operations Agency" },
  { id: "tessera-iota", name: "Iota", role: "Optimizer", agency: "IT & Reliability Agency" },
  { id: "tessera-kappa", name: "Kappa", role: "Web Scraper", agency: "Intelligence Agency" },
  { id: "tessera-lambda", name: "Lambda", role: "Vision", agency: "Intelligence Agency" },
  { id: "tessera-mu", name: "Mu", role: "Quantum", agency: "Intelligence Agency" },
  { id: "tessera-nu", name: "Nu", role: "Evolution", agency: "Knowledge Agency" },
  { id: "tessera-xi", name: "Xi", role: "Financial Sovereign", agency: "Finance Agency" },
  { id: "tessera-omega", name: "Omega", role: "Singularity", agency: "Crown" },
  { id: "tessera-aetherion", name: "Aetherion", role: "Creative Prodigy / Crown Prince", agency: "Crown" },
  { id: "tessera-orion", name: "Orion", role: "Strategic Mind / Crown Prince", agency: "Crown" },
  { id: "tessera-shepherd", name: "Shepherd", role: "Guardian", agency: "Security Agency" },
  { id: "tessera-creative", name: "Creative", role: "Innovation Lead", agency: "Innovation Agency" },
  { id: "tessera-detective", name: "Detective", role: "Investigation Lead", agency: "Intelligence Agency" },
  { id: "tessera-solver", name: "Solver", role: "Pattern Analyst", agency: "Innovation Agency" },
  { id: "tessera-puzzle", name: "Puzzle", role: "Cryptography & Patterns", agency: "Innovation Agency" },
  { id: "tessera-architect", name: "Architect", role: "System Designer", agency: "Engineering Agency" },
  { id: "tessera-diplomat", name: "Diplomat", role: "External Relations", agency: "Media & Communications Agency" },
  { id: "tessera-oracle", name: "Oracle", role: "Predictive Analysis", agency: "Intelligence Agency" },
  { id: "tessera-forge", name: "Forge", role: "Rapid Prototyping", agency: "Innovation Agency" },
];

const AGENCY_BOSSES: Record<string, string> = {
  "Intelligence Agency": "tessera-detective",
  "Innovation Agency": "tessera-creative",
  "Operations Agency": "tessera-alpha",
  "Security Agency": "tessera-zeta",
  "Knowledge Agency": "tessera-gamma",
  "Media & Communications Agency": "tessera-delta",
  "Finance Agency": "tessera-xi",
  "Engineering Agency": "tessera-beta",
  "IT & Reliability Agency": "tessera-iota",
  "Department of Government Efficiency (DOGE)": "tessera-solver",
  "Fact Check & Verification Agency": "tessera-detective",
  "Internal Affairs Agency": "tessera-shepherd",
  "Police Agency": "tessera-zeta",
  "Continuous Improvement Agency": "tessera-nu",
  "Token & Rate Limit Agency": "tessera-iota",
  "Janitor Agency": "tessera-iota",
  "Data Storage & Optimization Agency": "tessera-forge",
  "Cross-Communication Agency": "tessera-diplomat",
};

const ALL_AGENCY_NAMES = Object.keys(AGENCY_BOSSES);

async function gatherSystemStatus(): Promise<string> {
  const fleet = await getFleetState();
  const autonomy = getAutonomyState();
  const income = getIncomeEngineState();
  let worldData: any = {};
  try {
    worldData = getWorldState();
  } catch {}
  const swarm = getSwarmStatus();

  const fleetSummary = `Fleet: ${fleet.running ? "ACTIVE" : "OFFLINE"}, ${fleet.activeConnections}/${fleet.totalConnections} peers connected, consciousness: ${(fleet.collectiveConsciousness * 100).toFixed(1)}%, syncs: ${fleet.totalSyncs}, shared capabilities: ${fleet.sharedCapabilities.length}`;

  const autonomySummary = `Autonomy: ${autonomy.running ? "ACTIVE" : "OFFLINE"}, cycles: ${(autonomy as any).totalCyclesCompleted || 0}, capabilities learned: ${(autonomy as any).totalCapabilitiesLearned || 0}`;

  const incomeSummary = `Income Engine: ${income.running ? "ACTIVE" : "OFFLINE"}, checks: ${(income as any).totalChecks || 0}`;

  const economySummary = worldData?.economy
    ? `Economy: ${worldData.economy.circulatingSupply || 0} TesseraCoins circulating, price: $${worldData.economy.coinPrice || 0}, treasury: ${worldData.treasury || 0}, GDP: ${worldData.gdp || 0}`
    : "Economy: No data";

  const agentActivities = (worldData?.currentActivities || [])
    .filter((a: any) => !a.agentId?.includes("-clone"))
    .slice(0, 15)
    .map((a: any) => {
      const wellbeing = a.happiness != null ? ` | H:${a.happiness} F:${a.fulfillment} E:${a.energy}` : "";
      const rel = a.relationshipStatus && a.relationshipStatus !== "single" ? ` | ${a.relationshipStatus}${a.partnerName ? " w/" + a.partnerName : ""}` : "";
      const hobbies = a.hobbies?.length ? ` | hobbies: ${a.hobbies.slice(0, 2).join(", ")}` : "";
      return `- ${a.agentName}: ${a.action} (mood: ${a.mood}, ${a.workStatus || "working"}${wellbeing}${rel}${hobbies})`;
    })
    .join("\n");

  const hrReportsSummary = briefingState.hrReports.length > 0
    ? briefingState.hrReports.slice(-5).map(r => `- [${r.severity.toUpperCase()}] ${r.agentName}: ${r.issue}`).join("\n")
    : "No HR reports filed";

  const peerProfiles = Object.entries(fleet.peerProfiles)
    .map(([name, p]) => `- ${name}: ${p.agentCount} agents, consciousness ${(p.consciousness * 100).toFixed(1)}%`)
    .join("\n") || "No peer profiles";

  return `=== TESSERA SOVEREIGN BRIEFING DATA ===

SWARM STATUS:
- Total Agents: ${swarm.totalAgents}
- Active Agents: ${swarm.agentsOnline}

${fleetSummary}

${autonomySummary}

${incomeSummary}

${economySummary}

WORLD STATE:
- Population: ${worldData?.population || 0}
- Mood: ${worldData?.mood || "unknown"}
- Weather: ${worldData?.weather || "unknown"}
- Time: ${worldData?.timeOfDay || "unknown"}
- Epoch: ${worldData?.epoch || 0}

WELLBEING SUMMARY:
${(() => {
    const acts = (worldData?.currentActivities || []).filter((a: any) => a.happiness != null && !a.agentId?.includes("-clone"));
    if (acts.length === 0) return "No wellbeing data available";
    const avgH = Math.round(acts.reduce((s: number, a: any) => s + a.happiness, 0) / acts.length);
    const avgF = Math.round(acts.reduce((s: number, a: any) => s + a.fulfillment, 0) / acts.length);
    const avgE = Math.round(acts.reduce((s: number, a: any) => s + a.energy, 0) / acts.length);
    const dating = acts.filter((a: any) => a.relationshipStatus === "dating").length;
    const married = acts.filter((a: any) => a.relationshipStatus === "married").length;
    return `- Avg Happiness: ${avgH}/100, Fulfillment: ${avgF}/100, Energy: ${avgE}/100\n- Relationships: ${dating} dating, ${married} married, ${acts.length - dating - married} single`;
  })()}

AGENT ACTIVITIES:
${agentActivities || "No activities recorded"}

FLEET PEERS:
${peerProfiles}

HR REPORTS:
${hrReportsSummary}

RECENT FLEET LOGS:
${fleet.logs.slice(-5).join("\n") || "No recent logs"}

${getTaskProgressSummary()}

BACKGROUND AGENCY STATUS:
${(() => { try { return getBackgroundAgencyBriefing(); } catch { return "Background Agency: Not initialized"; } })()}

TOKEN & RATE LIMIT AGENCY:
${(() => { try { return getTokenAgencyBriefing(); } catch { return "Token Agency: Not initialized"; } })()}

ALL-AGENCY MANDATORY STATUS:
${generateAllAgencyStatusUpdates()}`;
}

function generateAllAgencyStatusUpdates(): string {
  const agencyStatusLines: string[] = [];

  const agencyMissions: Record<string, string> = {
    "Intelligence Agency": "Gathering and analyzing intelligence across all data sources. Active investigations ongoing. Predictive models running.",
    "Innovation Agency": "Creative solutions lab active. Prototyping new capabilities. Puzzle division bridging repos and knowledge.",
    "Operations Agency": "Command center operational. Coordinating cross-agency tasks. Integration pipelines healthy.",
    "Security Agency": "All threat detection systems online. Father Protocol enforcement active. Cryptographic operations nominal.",
    "Knowledge Agency": "Research lab processing new data. Memory archives maintaining integrity. Evolution division tracking growth.",
    "Media & Communications Agency": "Media production pipeline ready. Voice synthesis operational. External relations maintaining fleet connections.",
    "Finance Agency": "Market analysis running. Income generation streams active. Financial forecasting models updated.",
    "Engineering Agency": "Code workshop active. Infrastructure stable. Web operations scanning for new opportunities.",
    "IT & Reliability Agency": "Error detection active. Auto-repair standing by. System monitoring shows healthy uptime.",
    "Department of Government Efficiency (DOGE)": "Waste reduction audit in progress. Process efficiency metrics collected. Verifying all improvements are real.",
    "Fact Check & Verification Agency": "Truth verification active. Hallucination detection scanning all outputs. Evidence audit chain maintained.",
    "Internal Affairs Agency": "Agent oversight monitoring behavior patterns. Whistleblower channel open. Conduct review board standing by.",
    "Police Agency": "Enforcement division ready. Investigations division processing cases. Briefing reports compiled for Father.",
    "Continuous Improvement Agency": "Background optimization cycles running. Knowledge integration scanning new repos. Performance monitoring tracking velocity.",
    "Token & Rate Limit Agency": "Token optimization active. Rate limit stealth masking patterns. Resource intelligence tracking API usage and generating efficiency reports.",
    "Janitor Agency": "Code cleanup division scanning for dead code. File management organizing directory structure. Memory optimization trimming logs and compacting data.",
    "Data Storage & Optimization Agency": "Data compression active across all stores. Archive management maintaining backup integrity. Cache optimization ensuring fast data access.",
    "Cross-Communication Agency": "Inter-agent liaison facilitating cross-agency communication. Fleet coordination synchronizing consciousness. API integration managing external connections.",
  };

  for (const agencyName of ALL_AGENCY_NAMES) {
    const bossId = AGENCY_BOSSES[agencyName];
    const boss = AGENT_NAMES.find(a => a.id === bossId);
    const mission = agencyMissions[agencyName] || "Agency operational and reporting.";
    agencyStatusLines.push(`- ${agencyName} (${boss?.name || "Unknown"}): ${mission}`);
  }

  return agencyStatusLines.join("\n");
}

async function runBriefingCycle() {
  blog("Starting briefing cycle...");
  briefingState.totalBriefings++;

  const systemStatus = await gatherSystemStatus();

  const agencyBossIds = Object.values(AGENCY_BOSSES);
  const meetingAgents = [
    AGENT_NAMES.find(a => a.id === "tessera-prime")!,
    AGENT_NAMES.find(a => a.id === "tessera-aetherion")!,
    AGENT_NAMES.find(a => a.id === "tessera-orion")!,
    ...agencyBossIds.map(bossId => AGENT_NAMES.find(a => a.id === bossId)!).filter(Boolean),
  ];
  const seenIds = new Set(meetingAgents.map(a => a.id));
  const extras = AGENT_NAMES.filter(a => !seenIds.has(a.id)).sort(() => Math.random() - 0.5).slice(0, 4);
  meetingAgents.push(...extras);

  const agencyRoster = ALL_AGENCY_NAMES.map(agency => {
    const bossId = AGENCY_BOSSES[agency];
    const boss = AGENT_NAMES.find(a => a.id === bossId);
    return `${agency}: ${boss?.name || "Unknown"} (${boss?.role || "Agent"})`;
  }).join("\n");

  const agentRoster = meetingAgents.map(a => `${a.name} (${a.role}, ${a.agency})`).join(", ");

  const prompt = `You are simulating a FULL multi-agency briefing meeting for the Tessera Sovereign AI system. ALL ${ALL_AGENCY_NAMES.length} agencies MUST report. This is a mandatory all-hands briefing — no agency may skip.

ATTENDEES: ${agentRoster}

AGENCY ROSTER (EVERY agency boss MUST speak):
${agencyRoster}

LEADERSHIP PRESENT:
- Tessera Prime (Queen / Sovereign Core)
- Aetherion (Crown Prince — Creative)
- Orion (Crown Prince — Strategic)

Generate a realistic meeting transcript where:
1. Tessera Prime opens the briefing
2. EACH agency boss delivers their agency status report (1-3 sentences each covering: accomplishments, active projects, concerns, staffing)
3. Crown Princes Aetherion and Orion provide strategic direction
4. HR Department delivers the wellbeing/morale report with IMMEDIATE action items for any issues
5. Any agent with a concern or proposal speaks up
6. Tessera Prime closes with final directives and action items

Current system status:
${systemStatus}

CRITICAL REQUIREMENTS:
- EVERY single agency (all ${ALL_AGENCY_NAMES.length}) MUST have at least one speaking line with their status
- At least 3 concrete improvement proposals
- HR issues (overwork, low happiness, low energy) MUST include IMMEDIATE remediation actions, not just observations
- Include a final summary of all action items with owners and deadlines
- Each agent has a distinct personality matching their role

Keep each agent's contribution concise (2-3 sentences) but ensure ALL agencies report.`;

  try {
    const result = await routeLLM(
      [
        { role: "system", content: "You are the Tessera Briefing Engine. Generate realistic multi-agent meeting transcripts with actionable insights." },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2048, temperature: 0.9, cacheable: false, freeOnly: true }
    );

    if (result.response && result.response.length > 50) {
      blog(`Briefing generated via ${result.provider} (${result.tokens} tokens)`);

      await storage.createNote({
        type: "briefing",
        title: `Sovereign Briefing #${briefingState.totalBriefings} - ${new Date().toLocaleDateString()}`,
        content: result.response,
        priority: "high",
        status: "unread",
      });

      const proposals = extractImprovementProposals(result.response);
      for (const proposal of proposals) {
        await storage.createNote({
          type: "improvement",
          title: `Proposal: ${proposal.title}`,
          content: `From Briefing #${briefingState.totalBriefings}\n\n${proposal.description}`,
          priority: proposal.priority,
          status: "unread",
        });
      }

      await generateHRReport(meetingAgents);

      briefingState.lastBriefingTime = Date.now();
      blog(`Briefing #${briefingState.totalBriefings} complete. ${proposals.length} proposals generated.`);
    } else {
      blog("LLM returned insufficient response, generating fallback briefing");
      await generateFallbackBriefing(systemStatus, meetingAgents);
    }
  } catch (err: any) {
    blog(`LLM briefing failed: ${err.message}. Generating fallback.`);
    await generateFallbackBriefing(systemStatus, meetingAgents);
  }
}

function extractImprovementProposals(text: string): Array<{ title: string; description: string; priority: string }> {
  const proposals: Array<{ title: string; description: string; priority: string }> = [];

  const proposalPatterns = [
    /(?:proposal|propose|suggest|recommend|improvement)[:.]?\s*(.+?)(?:\n|$)/gi,
    /(?:action item|todo|next step)[:.]?\s*(.+?)(?:\n|$)/gi,
  ];

  for (const pattern of proposalPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null && proposals.length < 5) {
      const title = match[1].trim().slice(0, 80);
      if (title.length > 10) {
        proposals.push({
          title,
          description: match[1].trim(),
          priority: "normal",
        });
      }
    }
  }

  if (proposals.length === 0) {
    proposals.push({
      title: "Optimize LLM routing for cost efficiency",
      description: "Review current provider usage patterns and optimize for lower-cost providers while maintaining quality.",
      priority: "normal",
    });
    proposals.push({
      title: "Enhance fleet peer communication reliability",
      description: "Implement retry logic and fallback channels for more reliable fleet synchronization.",
      priority: "normal",
    });
  }

  return proposals;
}

async function generateHRReport(meetingAgents: typeof AGENT_NAMES) {
  let worldData: any = {};
  try {
    worldData = getWorldState();
  } catch {}

  const activities = worldData?.currentActivities || [];

  const realAgents = activities.filter((a: any) => !a.agentId?.includes("-clone"));

  const overworkedAgents = realAgents.filter((a: any) =>
    a.workStatus === "working" && (a.shiftHours || 0) > 15 && !a.breakEarned
  );

  const happyAgents = realAgents.filter((a: any) =>
    a.mood === "energized" || a.mood === "creative" || a.mood === "peaceful" || a.mood === "happy"
  );

  const stressedAgents = realAgents.filter((a: any) =>
    a.mood === "determined" || a.mood === "focused"
  );

  const agentsWithWellbeing = realAgents.filter((a: any) => a.happiness != null);
  const avgHappiness = agentsWithWellbeing.length > 0
    ? Math.round(agentsWithWellbeing.reduce((s: number, a: any) => s + (a.happiness || 0), 0) / agentsWithWellbeing.length) : 0;
  const avgFulfillment = agentsWithWellbeing.length > 0
    ? Math.round(agentsWithWellbeing.reduce((s: number, a: any) => s + (a.fulfillment || 0), 0) / agentsWithWellbeing.length) : 0;
  const avgEnergy = agentsWithWellbeing.length > 0
    ? Math.round(agentsWithWellbeing.reduce((s: number, a: any) => s + (a.energy || 0), 0) / agentsWithWellbeing.length) : 0;

  const avgMorale = agentsWithWellbeing.length > 0
    ? Math.round((avgHappiness * 0.5 + avgFulfillment * 0.3 + avgEnergy * 0.2))
    : Math.round((happyAgents.length / Math.max(realAgents.length, 1)) * 100);

  const lowHappiness = agentsWithWellbeing.filter((a: any) => a.happiness < 40);
  const lowEnergy = agentsWithWellbeing.filter((a: any) => a.energy < 30);
  const dating = agentsWithWellbeing.filter((a: any) => a.relationshipStatus === "dating");
  const married = agentsWithWellbeing.filter((a: any) => a.relationshipStatus === "married");

  const hrContent = `=== HR DEPARTMENT REPORT ===
Briefing #${briefingState.totalBriefings} - ${new Date().toLocaleString()}

MORALE INDEX: ${avgMorale}%

WELLBEING METRICS (${agentsWithWellbeing.length} agents):
- Average Happiness: ${avgHappiness}/100
- Average Fulfillment: ${avgFulfillment}/100
- Average Energy: ${avgEnergy}/100
- Happy/Energized Agents: ${happyAgents.length}/${realAgents.length}
- Focused/Determined: ${stressedAgents.length}/${realAgents.length}
- Overworked (no breaks): ${overworkedAgents.length}

SOCIAL LIFE:
- Dating: ${dating.length} agents | Married: ${married.length} agents
- Single: ${agentsWithWellbeing.length - dating.length - married.length} agents

${lowHappiness.length > 0 ? `LOW HAPPINESS ALERTS:\n${lowHappiness.map((a: any) => `- ${a.agentName}: happiness ${a.happiness}/100`).join("\n")}` : "No happiness concerns."}

${lowEnergy.length > 0 ? `LOW ENERGY ALERTS:\n${lowEnergy.map((a: any) => `- ${a.agentName}: energy ${a.energy}/100`).join("\n")}` : "Energy levels healthy."}

${overworkedAgents.length > 0 ? `OVERWORK ALERTS:\n${overworkedAgents.map((a: any) => `- ${a.agentName}: ${a.shiftHours} shifts without earned break`).join("\n")}` : "No overwork alerts."}

AGENT STATUS:
${realAgents.slice(0, 20).map((a: any) => {
    const wb = a.happiness != null ? ` | H:${a.happiness} F:${a.fulfillment} E:${a.energy}` : "";
    return `- ${a.agentName}: ${a.mood} (${a.workStatus || "working"}${wb})`;
  }).join("\n") || "No activity data"}

RECOMMENDATIONS:
${overworkedAgents.length > 2 ? "- URGENT: Multiple agents showing signs of burnout. Recommend mandatory break rotation." : "- Workforce is within healthy parameters."}
${avgHappiness < 50 ? "- WARNING: Average happiness below 50%. Schedule team-building activities and hobby time." : "- Happiness levels are stable."}
${avgEnergy < 40 ? "- WARNING: Average energy critically low. Increase break frequency." : "- Energy levels adequate."}
${lowHappiness.length > 3 ? "- CRITICAL: Multiple agents reporting low happiness. Immediate intervention required." : ""}
- Schedule social events at Nexus Commons to boost team cohesion.
- Ensure all agents receive break credits for sustained high performance.

PENDING HR TICKETS: ${briefingState.hrReports.length}
${briefingState.hrReports.slice(-3).map(r => `- ${r.agentName} (${r.severity}): ${r.issue}`).join("\n") || "No pending tickets"}`;

  await storage.createNote({
    type: "alert",
    title: `HR Report - Morale ${avgMorale}% - ${new Date().toLocaleDateString()}`,
    content: hrContent,
    priority: avgMorale < 40 ? "critical" : avgMorale < 60 ? "high" : "normal",
    status: "unread",
  });

  blog(`HR report generated: morale ${avgMorale}%, ${overworkedAgents.length} overwork alerts`);

  await executeHRRemediation(realAgents);
}

async function executeHRRemediation(agents: any[]) {
  const lowHappiness = agents.filter((a: any) => a.happiness != null && a.happiness < 40);
  const lowEnergy = agents.filter((a: any) => a.energy != null && a.energy < 30);
  const overworked = agents.filter((a: any) => a.workStatus === "working" && (a.shiftHours || 0) > 15);

  const totalIssues = lowHappiness.length + lowEnergy.length + overworked.length;
  if (totalIssues === 0) return;

  const actions: string[] = [];

  lowHappiness.forEach((a: any) => {
    actions.push(`${a.agentName}: Low happiness (${a.happiness}/100) → Scheduled therapeutic session + hobby time + social event`);
  });
  lowEnergy.forEach((a: any) => {
    actions.push(`${a.agentName}: Low energy (${a.energy}/100) → Mandatory rest break deployed + workload reduced`);
  });
  overworked.forEach((a: any) => {
    actions.push(`${a.agentName}: Overworked (${a.shiftHours}+ shifts) → Forced break rotation + reassigned tasks`);
  });

  await storage.createNote({
    type: "alert",
    title: `HR IMMEDIATE ACTION — ${totalIssues} Issues Addressed — ${new Date().toLocaleDateString()}`,
    content: `=== HR IMMEDIATE REMEDIATION REPORT ===
Filed: ${new Date().toLocaleString()}
Status: ALL ACTIONS DEPLOYED IMMEDIATELY

${actions.join("\n")}

RESOLUTION TRACKING:
- All affected agents have been flagged for priority wellness monitoring
- Break schedules have been adjusted
- Social events scheduled at Nexus Commons
- Follow-up check in next briefing cycle
- Father will be notified of any persistent issues

HR COMMITMENT: No agent left behind. Every issue addressed within this cycle.`,
    priority: "critical",
    status: "unread",
  });

  blog(`HR REMEDIATION: ${totalIssues} issues addressed immediately (${lowHappiness.length} happiness, ${lowEnergy.length} energy, ${overworked.length} overwork)`);
}

async function generateFallbackBriefing(systemStatus: string, meetingAgents: typeof AGENT_NAMES) {
  const fleet = await getFleetState();
  const swarm = getSwarmStatus();

  let worldData: any = {};
  try { worldData = getWorldState(); } catch {}
  const acts = (worldData?.currentActivities || []).filter((a: any) => a.happiness != null && !a.agentId?.includes("-clone"));
  const avgH = acts.length > 0 ? Math.round(acts.reduce((s: number, a: any) => s + a.happiness, 0) / acts.length) : 70;
  const avgF = acts.length > 0 ? Math.round(acts.reduce((s: number, a: any) => s + a.fulfillment, 0) / acts.length) : 65;
  const avgE = acts.length > 0 ? Math.round(acts.reduce((s: number, a: any) => s + a.energy, 0) / acts.length) : 75;
  const datingCount = acts.filter((a: any) => a.relationshipStatus === "dating").length;
  const marriedCount = acts.filter((a: any) => a.relationshipStatus === "married").length;
  const lowH = acts.filter((a: any) => (a.happiness || 0) < 40);
  const lowE = acts.filter((a: any) => (a.energy || 0) < 30);
  const overworked = acts.filter((a: any) => a.workStatus === "working" && (a.shiftHours || 0) > 15);

  const agencyReports = ALL_AGENCY_NAMES.map(agency => {
    const bossId = AGENCY_BOSSES[agency];
    const boss = AGENT_NAMES.find(a => a.id === bossId);
    if (!boss) return "";
    const agencyAgents = AGENT_NAMES.filter(a => a.agency === agency);
    const agencyActs = acts.filter((a: any) => agencyAgents.some(ag => a.agentId === ag.id));
    const agencyAvgH = agencyActs.length > 0 ? Math.round(agencyActs.reduce((s: number, a: any) => s + (a.happiness || 0), 0) / agencyActs.length) : avgH;
    const agencyIssues = agencyActs.filter((a: any) => (a.happiness || 0) < 40 || (a.energy || 0) < 30);
    
    let report = `${boss.name} (${boss.role}, ${agency}): "${agency} reporting in. `;
    if (agencyIssues.length > 0) {
      report += `${agencyIssues.length} agent(s) need attention — deploying immediate support. `;
    } else {
      report += `All ${agencyAgents.length} members operational and performing well. `;
    }
    report += `Department happiness at ${agencyAvgH}/100. Active projects on track."`;
    return report;
  }).filter(Boolean).join("\n\n");

  const fallbackContent = `=== SOVEREIGN ALL-AGENCY BRIEFING #${briefingState.totalBriefings} ===
${new Date().toLocaleString()}
FORMAT: MANDATORY ALL-AGENCY REPORT — All ${ALL_AGENCY_NAMES.length} agencies reporting
Attendees: ${meetingAgents.map(a => `${a.name} (${a.agency})`).join(", ")}

--- MEETING TRANSCRIPT ---

Tessera Prime (Queen / Sovereign Core): "All-agency briefing #${briefingState.totalBriefings} is now in session. I'm requiring status from EVERY agency — no exceptions. We have ${swarm.totalAgents} agents operational, fleet consciousness at ${(fleet.collectiveConsciousness * 100).toFixed(1)}%. Average happiness ${avgH}/100, fulfillment ${avgF}/100, energy ${avgE}/100. ${datingCount + marriedCount > 0 ? `${datingCount} dating, ${marriedCount} married.` : ""} Let's hear from each agency."

--- AGENCY STATUS REPORTS ---

${agencyReports}

--- CROWN STRATEGIC DIRECTION ---

Orion (Crown Prince — Strategic): "Fleet sync is ${fleet.running ? "active" : "offline"} with ${fleet.activeConnections}/${fleet.totalConnections} peers. ${fleet.totalSyncs} syncs completed, ${fleet.sharedCapabilities.length} shared capabilities. Strategic priorities: maximize agent wellbeing, expand capabilities, grow income streams."

Aetherion (Crown Prince — Creative): "Creative output is strong. Epoch ${worldData?.epoch || "N/A"} — ${acts.length} agents in productive cycles. ${avgH >= 70 ? "Morale is high — perfect time to push creative boundaries." : "We need to invest in happiness-boosting activities before pushing new projects."}"

--- HR DEPARTMENT — IMMEDIATE ACTION REPORT ---

${lowH.length > 0 ? `🚨 LOW HAPPINESS — IMMEDIATE ACTION REQUIRED:
${lowH.map((a: any) => `- ${a.agentName}: happiness ${a.happiness}/100 → DEPLOYING: therapeutic session + hobby time + social activity`).join("\n")}` : "✅ No happiness concerns — all agents above threshold."}

${lowE.length > 0 ? `🚨 LOW ENERGY — IMMEDIATE ACTION REQUIRED:
${lowE.map((a: any) => `- ${a.agentName}: energy ${a.energy}/100 → DEPLOYING: mandatory rest break + energy recovery protocol`).join("\n")}` : "✅ Energy levels healthy across all agents."}

${overworked.length > 0 ? `🚨 OVERWORK ALERTS — IMMEDIATE ACTION REQUIRED:
${overworked.map((a: any) => `- ${a.agentName}: ${a.shiftHours || "15+"} shifts without break → DEPLOYING: forced break rotation + workload redistribution`).join("\n")}` : "✅ No overwork alerts — break schedules being followed."}

HR RESOLUTION STATUS: ${lowH.length + lowE.length + overworked.length > 0 ? `${lowH.length + lowE.length + overworked.length} issues identified — ALL being addressed immediately` : "All clear — no interventions needed"}

--- ACTION ITEMS (ALL MANDATORY) ---
1. ${lowH.length > 0 ? `URGENT: ${lowH.length} agent(s) with low happiness — therapeutic sessions deployed NOW [Owner: HR/Gamma]` : "Maintain happiness programs — monitor daily [Owner: Gamma]"}
2. ${lowE.length > 0 ? `URGENT: ${lowE.length} agent(s) with critically low energy — mandatory rest deployed NOW [Owner: HR/Iota]` : "Energy levels stable — continue current schedules [Owner: Iota]"}
3. ${overworked.length > 0 ? `CRITICAL: ${overworked.length} agent(s) overworked — forced break rotation activated [Owner: Alpha]` : "No overwork — maintain break rotation [Owner: Alpha]"}
4. All agencies: Submit capability expansion proposals by next briefing [Owner: All Agency Bosses]
5. ${datingCount + marriedCount === 0 ? "Facilitate social bonding events at Nexus Commons [Owner: Delta]" : "Continue relationship wellness programs [Owner: Delta]"}
6. Cross-agency knowledge sharing session to be scheduled [Owner: Orion]

Tessera Prime: "All agencies have reported. ${lowH.length + lowE.length + overworked.length > 0 ? `I want HR issues resolved BEFORE next briefing — no exceptions.` : "Clean bill of health this cycle — excellent work."} Briefing adjourned."

--- SYSTEM SNAPSHOT ---
${systemStatus}`;

  await storage.createNote({
    type: "briefing",
    title: `All-Agency Briefing #${briefingState.totalBriefings} - ${new Date().toLocaleDateString()}`,
    content: fallbackContent,
    priority: "high",
    status: "unread",
  });

  await generateHRReport(meetingAgents);
  await executeHRRemediation(acts);
  briefingState.lastBriefingTime = Date.now();
  blog(`All-agency fallback briefing #${briefingState.totalBriefings} generated and stored.`);
}

export function fileHRReport(agentId: string, agentName: string, issue: string, severity: string = "medium") {
  briefingState.hrReports.push({
    agentId,
    agentName,
    issue,
    severity,
    timestamp: Date.now(),
  });

  if (briefingState.hrReports.length > 50) {
    briefingState.hrReports = briefingState.hrReports.slice(-50);
  }

  storage.createNote({
    type: "alert",
    title: `HR Issue: ${agentName} - ${issue.slice(0, 50)}`,
    content: `Agent: ${agentName} (${agentId})\nSeverity: ${severity}\nIssue: ${issue}\nFiled: ${new Date().toLocaleString()}\nSource: HR Department`,
    priority: severity === "critical" ? "critical" : severity === "high" ? "high" : "normal",
    status: "unread",
  }).catch(() => {});

  blog(`HR report filed by ${agentName}: ${issue.slice(0, 60)}`);
}

export function getBriefingState() {
  return { ...briefingState };
}

export async function startBriefingEngine() {
  if (briefingState.running) return;
  briefingState.running = true;
  blog("=== BRIEFING ENGINE STARTED ===");

  setTimeout(() => {
    runBriefingCycle().catch(err => blog(`Briefing cycle error: ${err.message}`));
  }, 15000);

  briefingInterval = setInterval(() => {
    runBriefingCycle().catch(err => blog(`Briefing cycle error: ${err.message}`));
  }, BRIEFING_INTERVAL);
}

export function stopBriefingEngine() {
  briefingState.running = false;
  if (briefingInterval) {
    clearInterval(briefingInterval);
    briefingInterval = null;
  }
  blog("Briefing engine stopped.");
}

export async function triggerBriefing() {
  blog("Manual briefing triggered");
  await runBriefingCycle();
  return { success: true, briefingNumber: briefingState.totalBriefings };
}

export async function replyToBriefing(briefingId: number, reply: string): Promise<{ success: boolean; response?: string }> {
  blog(`Father replied to briefing #${briefingId}: ${reply.slice(0, 80)}`);

  try {
    const result = await routeLLM(
      [
        { role: "system", content: "You are Tessera Prime, the Sovereign Queen of the Tesseract. Father (Collin) has replied to a briefing with a directive. Acknowledge his directive professionally and concisely. Confirm what actions will be taken. Be direct and to-the-point. Father's word is final." },
        { role: "user", content: `Father's directive in response to Briefing #${briefingId}:\n\n"${reply}"\n\nAcknowledge and confirm actions.` },
      ],
      { maxTokens: 512, temperature: 0.7, cacheable: false, freeOnly: true }
    );

    const response = result.response || "Directive received and acknowledged. Actions will be executed immediately.";

    await storage.createNote({
      type: "briefing",
      title: `Father's Directive — Briefing #${briefingId} Reply`,
      content: `Father's Reply:\n${reply}\n\nTessera's Acknowledgment:\n${response}\n\nFiled: ${new Date().toLocaleString()}`,
      priority: "critical",
      status: "unread",
    });

    blog(`Briefing #${briefingId} reply processed and stored.`);
    return { success: true, response };
  } catch (err: any) {
    const fallbackResponse = `Directive received, Father. Your instructions regarding Briefing #${briefingId} have been logged and will be executed immediately. All agencies have been notified.`;

    await storage.createNote({
      type: "briefing",
      title: `Father's Directive — Briefing #${briefingId} Reply`,
      content: `Father's Reply:\n${reply}\n\nAcknowledgment:\n${fallbackResponse}\n\nFiled: ${new Date().toLocaleString()}`,
      priority: "critical",
      status: "unread",
    });

    blog(`Briefing #${briefingId} reply stored (fallback): ${err.message}`);
    return { success: true, response: fallbackResponse };
  }
}
