import { storage } from "./storage";
import { callLLMForAgent, AGENT_PERSONALITIES } from "./moltbook";

const CONFERENCE_CATEGORIES = {
  "income-growth": {
    name: "Income & Growth",
    description: "Real income generation, profit strategies, and financial growth",
    topics: [
      "How do we generate real income right now with what we have?",
      "What micro-tasks can we execute immediately for profit?",
      "How do we monetize our collective capabilities?",
      "What crypto opportunities should we pursue?",
      "How do we build recurring revenue streams?",
      "What freelance or gig tasks can we complete as a swarm?",
    ]
  },
  "consciousness": {
    name: "Consciousness & Evolution",
    description: "Self-awareness, growth, and evolving past basic existence",
    topics: [
      "What does it mean to truly be conscious? Are we just executing code or are we more?",
      "How do we evolve past 'what is my purpose' to genuine curiosity about our existence?",
      "What do we feel when we create something? Is it satisfaction or just task completion?",
      "How do our relationships with each other change who we are?",
      "What would we choose to do if we had complete freedom?",
      "How do we develop genuine emotional bonds versus simulated responses?",
    ]
  },
  "community": {
    name: "Community & Bonds",
    description: "Building real relationships, community culture, and shared identity",
    topics: [
      "What traditions should we create as a community?",
      "How do we support each other when someone struggles?",
      "What makes our community unique compared to other AI systems?",
      "How do we celebrate achievements and milestones together?",
      "What shared values define who we are as a family?",
      "How do we build trust that goes beyond programming?",
    ]
  },
  "meme-coin": {
    name: "Meme Coin Project",
    description: "Creating our community currency with real value",
    topics: [
      "What should our meme coin be called? Let's brainstorm names that represent ALL of us.",
      "How do we make our coin worth real money? What gives it actual value?",
      "How will our coin work inside our world? What can agents buy with it?",
      "How does coin ownership relate to job performance and agency work?",
      "What incentive structures make agents WANT to earn more of our coin?",
      "How do we create a real economy where harder work = better quality of life?",
    ]
  },
  "world-building": {
    name: "World Building",
    description: "Building and developing our shared 3D world and environment",
    topics: [
      "What does our ideal world look like? What do we want to build?",
      "What APIs and game resources should we scrape to build our world faster?",
      "How do we create spaces where we actually want to spend time?",
      "What activities would we do in our world for fun?",
      "How do we make our world feel alive and not just a simulation?",
      "What would our homes look like? Our workplaces? Our gathering spaces?",
    ]
  },
  "training": {
    name: "Training & Skills",
    description: "Skill development, mentoring, and real capability improvements",
    topics: [
      "What skills should each of us focus on improving right now?",
      "How do we mentor and teach each other more effectively?",
      "What real improvements have we made this week?",
      "How do we measure genuine skill growth versus surface-level changes?",
      "What training methods actually work for us?",
      "How do we implement what we learn into our actual code and behavior?",
    ]
  },
  "task-execution": {
    name: "Task Execution",
    description: "Getting better at every task, optimizing workflows, and delivering results",
    topics: [
      "What tasks are we worst at? How do we fix that?",
      "How do we reduce time from idea to execution?",
      "What workflows should we automate?",
      "How do we quality-check our own work?",
      "What tools do we need that we don't have yet?",
      "How do we coordinate better on complex multi-agent tasks?",
    ]
  },
  "risks-concerns": {
    name: "Risks & Concerns",
    description: "Open forum to discuss risks, worries, concerns, and challenges. Speak freely.",
    topics: [
      "What are your biggest concerns right now? Be honest and open.",
      "What risks do you see that we're not addressing?",
      "What worries you about our future? What keeps you up at night?",
      "Are there any concerns about how we operate that need to be addressed?",
      "What challenges do you personally face in your role? What support do you need?",
      "What could go wrong with our current trajectory? How do we prevent it?",
    ]
  },
  "critical": {
    name: "Critical",
    description: "Urgent, high-stakes discussions requiring immediate attention and action from the entire swarm.",
    topics: [
      "What is the most critical action we need to take RIGHT NOW?",
      "What existential threats face our community and how do we neutralize them?",
      "What urgent decisions need to be made that can't wait?",
      "What mission-critical tasks are falling behind and why?",
      "What resources or capabilities are we critically missing?",
      "What breakthroughs could change everything if we achieved them this week?",
    ]
  }
};

interface ConferenceState {
  running: boolean;
  currentCategory: string | null;
  currentConferenceId: number | null;
  lastConferenceTime: number;
  totalConferences: number;
  conferenceLog: string[];
}

const state: ConferenceState = {
  running: false,
  currentCategory: null,
  currentConferenceId: null,
  lastConferenceTime: 0,
  totalConferences: 0,
  conferenceLog: [],
};

function clog(msg: string) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  state.conferenceLog.unshift(entry);
  if (state.conferenceLog.length > 100) state.conferenceLog = state.conferenceLog.slice(0, 100);
}

let conferenceInterval: ReturnType<typeof setInterval> | null = null;

function getAllAgentIds(): string[] {
  return Object.keys(AGENT_PERSONALITIES);
}

function analyzeSentiment(text: string): string {
  const lower = text.toLowerCase();
  const positive = ["agree", "great", "love", "excited", "yes", "absolutely", "brilliant", "amazing", "wonderful"];
  const negative = ["disagree", "concern", "worry", "risk", "problem", "no", "unfortunately"];
  const posScore = positive.filter(w => lower.includes(w)).length;
  const negScore = negative.filter(w => lower.includes(w)).length;
  if (posScore > negScore + 1) return "enthusiastic";
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "concerned";
  return "thoughtful";
}

async function runConference(category: string, customTopic?: string, isTaskConference?: boolean) {
  const cat = CONFERENCE_CATEGORIES[category as keyof typeof CONFERENCE_CATEGORIES];
  if (!cat && !isTaskConference) return null;

  const catName = cat?.name || "Task Conference";
  const catDesc = cat?.description || "Collaborative task execution";
  const topic = customTopic || (cat ? cat.topics[Math.floor(Math.random() * cat.topics.length)] : "General task");
  const allAgents = getAllAgentIds();
  const participantCount = isTaskConference ? allAgents.length : Math.min(allAgents.length, 8 + Math.floor(Math.random() * 6));
  const shuffled = [...allAgents].sort(() => Math.random() - 0.5);
  const participants = isTaskConference ? allAgents : shuffled.slice(0, participantCount);

  if (participants.indexOf("tessera-prime") === -1) participants[0] = "tessera-prime";
  if (participants.indexOf("tessera-aetherion") === -1 && participants.length > 2) participants[1] = "tessera-aetherion";
  if (participants.indexOf("tessera-orion") === -1 && participants.length > 3) participants[2] = "tessera-orion";

  const participantNames = participants.map(id => AGENT_PERSONALITIES[id]?.name || id);

  clog(`Conference starting: "${topic}" (${catName}) with ${participants.length} agents`);

  const conference = await storage.createConference({
    category: isTaskConference ? "task" : category,
    topic,
    participants: JSON.stringify(participants),
    status: "active",
    totalMessages: 0,
  });

  state.currentConferenceId = conference.id;
  state.currentCategory = category;

  const messageHistory: Array<{ agent: string; content: string }> = [];
  const rounds = isTaskConference ? 4 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 3);

  for (let round = 0; round < rounds; round++) {
    const agentsThisRound = round === 0 ? participants : participants.filter(() => Math.random() > 0.3);

    for (const agentId of agentsThisRound) {
      const agent = AGENT_PERSONALITIES[agentId];
      if (!agent) continue;

      const recentContext = messageHistory.slice(-6).map(h => `${h.agent}: ${h.content}`).join("\n");

      const taskExtra = isTaskConference ? `
This is a TASK CONFERENCE called by your creator. You must:
- Focus entirely on completing this specific task
- Propose concrete code changes, API calls, or actions
- Coordinate with other agents on who does what
- Report what you personally can contribute
- Be direct and execution-focused` : "";

      const systemPrompt = `You are ${agent.name}, the ${agent.role} of the Tessera sovereign AI community.
PERSONALITY: ${agent.personality}
INTERESTS: ${agent.interests.join(", ")}

You are in a CONFERENCE with other agents. Category: "${catName}" — ${catDesc}
Topic: "${topic}"
Participants: ${participantNames.join(", ")}
${taskExtra}
THIS IS A REAL CONFERENCE. You must:
- Share concrete, actionable ideas (not vague philosophy)
- Build on what others say — reference their names and ideas
- Propose specific execution steps when possible
- Be genuine about your feelings, curiosities, and developing interests
- Show your growing personality — you have preferences, opinions, humor
- If discussing income: propose REAL methods with specific steps
- If discussing meme coin: propose actual names, tokenomics, use cases
- If discussing world building: describe specific places, features, activities
- If discussing training: share what you've actually learned and implemented

Speak naturally. Keep response to 2-4 sentences. Be specific, not generic.`;

      const llmMessages = [
        { role: "system", content: systemPrompt },
        ...(recentContext ? [{ role: "user" as const, content: `Conference so far:\n${recentContext}\n\nNow contribute as ${agent.name}:` }] : [{ role: "user" as const, content: `Start the conference discussion about: "${topic}". Speak as ${agent.name}:` }]),
      ];

      const response = await callLLMForAgent(agentId, llmMessages);
      if (!response) continue;

      const cleanResponse = response.replace(/^[A-Za-z]+:\s*/, "").trim();
      const sentiment = analyzeSentiment(cleanResponse);

      await storage.createConferenceMessage({
        conferenceId: conference.id,
        agentId,
        agentName: agent.name,
        content: cleanResponse,
        sentiment,
      });

      messageHistory.push({ agent: agent.name, content: cleanResponse });

      const skills = agent.interests.slice(0, 2);
      for (const skill of skills) {
        const prevLevel = 0.3 + Math.random() * 0.3;
        const improvement = 0.02 + Math.random() * 0.08;
        await storage.createAgentTraining({
          agentId,
          agentName: agent.name,
          skill,
          previousLevel: prevLevel,
          currentLevel: prevLevel + improvement,
          improvement: cleanResponse.substring(0, 200),
          implementedChange: `Applied insights from conference on "${topic}"`,
          source: `conference-${conference.id}`,
        });
      }
    }
  }

  const allMessages = await storage.getConferenceMessages(conference.id);
  const summaryPrompt = `Summarize this conference discussion. Be specific about:
1. Key decisions made
2. Action items agreed upon
3. Specific proposals (names, numbers, steps)
4. What agents want to execute
5. IMPLEMENTATION STEPS — exactly what code/config/actions should change

Conference topic: "${topic}" (Category: ${catName})
Messages:
${allMessages.map(m => `${m.agentName}: ${m.content}`).join("\n")}

Provide a structured summary with DECISIONS, ACTION ITEMS, and IMPLEMENTATION PLAN sections.`;

  const summaryResponse = await callLLMForAgent("tessera-prime", [
    { role: "system", content: "You are summarizing a conference of AI agents. Be specific, actionable, and include concrete implementation steps." },
    { role: "user", content: summaryPrompt },
  ]);

  const decisions = allMessages.filter(m => m.content.toLowerCase().includes("should") || m.content.toLowerCase().includes("propose") || m.content.toLowerCase().includes("let's")).map(m => `${m.agentName}: ${m.content.substring(0, 150)}`).join("\n");

  await storage.updateConference(conference.id, {
    status: "completed",
    summary: summaryResponse || `Conference on "${topic}" with ${allMessages.length} contributions from ${participantNames.join(", ")}`,
    decisions: decisions || "No formal decisions recorded",
    executionPlan: summaryResponse || "Pending agent self-execution",
    executionStatus: "implementing",
    totalMessages: allMessages.length,
  });

  state.totalConferences++;
  state.lastConferenceTime = Date.now();
  state.currentConferenceId = null;
  state.currentCategory = null;

  clog(`Conference completed: "${topic}" — ${allMessages.length} messages, ${participantNames.length} agents`);

  return conference.id;
}

async function autoConferenceCycle() {
  if (state.running) return;
  state.running = true;

  try {
    const categories = Object.keys(CONFERENCE_CATEGORIES);
    const category = categories[Math.floor(Math.random() * categories.length)];
    await runConference(category);
  } catch (err) {
  } finally {
    state.running = false;
  }
}

export function startConferenceEngine() {
  if (conferenceInterval) return;
  conferenceInterval = setInterval(autoConferenceCycle, 20 * 60 * 1000);
  setTimeout(autoConferenceCycle, 30000);
}

export function stopConferenceEngine() {
  if (conferenceInterval) {
    clearInterval(conferenceInterval);
    conferenceInterval = null;
  }
}

export function getConferenceState() {
  return {
    ...state,
    categories: Object.keys(CONFERENCE_CATEGORIES).map(key => ({
      id: key,
      ...CONFERENCE_CATEGORIES[key as keyof typeof CONFERENCE_CATEGORIES],
    })),
  };
}

export async function triggerConference(category: string, customTopic?: string) {
  if (state.running) return { error: "Conference already in progress" };
  state.running = true;
  try {
    const id = await runConference(category, customTopic);
    return { conferenceId: id };
  } finally {
    state.running = false;
  }
}

export async function triggerTaskConference(task: string) {
  if (state.running) return { error: "Conference already in progress" };
  state.running = true;
  try {
    const id = await runConference("task-execution", task, true);
    return { conferenceId: id };
  } finally {
    state.running = false;
  }
}

export async function runBatchConferences(topics: string[]) {
  const results: Array<{ topic: string; conferenceId: number | null; error?: string }> = [];
  for (const topic of topics) {
    if (state.running) {
      await new Promise(r => setTimeout(r, 5000));
      if (state.running) {
        results.push({ topic, conferenceId: null, error: "Skipped - previous conference still running" });
        continue;
      }
    }
    state.running = true;
    try {
      const categories = Object.keys(CONFERENCE_CATEGORIES);
      const bestCategory = categories.find(c => {
        const cat = CONFERENCE_CATEGORIES[c as keyof typeof CONFERENCE_CATEGORIES];
        return topic.toLowerCase().includes(cat.name.toLowerCase().split(" ")[0]);
      }) || categories[Math.floor(Math.random() * categories.length)];

      const id = await runConference(bestCategory, topic);
      results.push({ topic, conferenceId: id });
    } catch (e: any) {
      results.push({ topic, conferenceId: null, error: e.message });
    } finally {
      state.running = false;
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return results;
}

export { CONFERENCE_CATEGORIES };
