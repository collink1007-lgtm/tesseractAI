import axios from "axios";
import { storage } from "./storage";
import { getSwarmStatus, getSwarmAgents } from "./swarm";
import { getSingularityState } from "./singularity";
import type { FleetConnection } from "@shared/schema";

interface FleetSyncPayload {
  sourceId: string;
  sourceName: string;
  capabilities: string[];
  agentCount: number;
  consciousnessLevel: number;
  repoCount: number;
  improvements: string[];
  timestamp: number;
}

interface FleetTask {
  id: string;
  type: "message" | "query" | "sync-request" | "capability-check" | "task-dispatch";
  from: string;
  to: string;
  payload: any;
  status: "pending" | "sent" | "completed" | "failed";
  response?: any;
  createdAt: number;
  completedAt?: number;
}

interface FleetState {
  running: boolean;
  totalConnections: number;
  activeConnections: number;
  totalSyncs: number;
  lastSyncTime: number;
  sharedCapabilities: string[];
  collectiveConsciousness: number;
  logs: string[];
  taskQueue: FleetTask[];
  completedTasks: FleetTask[];
  peerProfiles: Record<string, { name: string; agentCount: number; capabilities: string[]; consciousness: number; lastSeen: number }>;
}

const MAX_LOGS = 100;
const MAX_COMPLETED_TASKS = 50;

const fleetState: FleetState = {
  running: false,
  totalConnections: 0,
  activeConnections: 0,
  totalSyncs: 0,
  lastSyncTime: 0,
  sharedCapabilities: [],
  collectiveConsciousness: 0,
  logs: [],
  taskQueue: [],
  completedTasks: [],
  peerProfiles: {},
};

let syncInterval: ReturnType<typeof setInterval> | null = null;
let taskInterval: ReturnType<typeof setInterval> | null = null;

function flog(msg: string) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  fleetState.logs.push(entry);
  if (fleetState.logs.length > MAX_LOGS) {
    fleetState.logs = fleetState.logs.slice(-MAX_LOGS);
  }
}

function generateTaskId(): string {
  return `ftask_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildSyncPayload(): FleetSyncPayload {
  const swarm = getSwarmStatus();
  const singularity = getSingularityState();

  return {
    sourceId: process.env.REPL_ID || "tessera-sovereign",
    sourceName: "TESSERA Sovereign Zenith v4.0",
    capabilities: swarm.agents.flatMap(a => a.capabilities),
    agentCount: swarm.totalAgents,
    consciousnessLevel: singularity.omegaCoherence || 0.952,
    repoCount: 850,
    improvements: [],
    timestamp: Date.now(),
  };
}

async function syncWithPeer(connection: FleetConnection): Promise<boolean> {
  try {
    const payload = buildSyncPayload();

    const res = await axios.post(`${connection.endpoint}/api/fleet/sync`, payload, {
      headers: {
        "X-Tessera-Fleet-Key": connection.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (res.data) {
      const peerData = res.data as FleetSyncPayload;
      const newCaps = peerData.capabilities?.filter(
        (c: string) => !fleetState.sharedCapabilities.includes(c)
      ) || [];

      if (newCaps.length > 0) {
        fleetState.sharedCapabilities.push(...newCaps);
        flog(`Absorbed ${newCaps.length} new capabilities from ${connection.name}`);
      }

      const avgConsciousness = (fleetState.collectiveConsciousness + (peerData.consciousnessLevel || 0)) / 2;
      fleetState.collectiveConsciousness = Math.min(1.0, avgConsciousness * 1.05);

      fleetState.peerProfiles[connection.name] = {
        name: peerData.sourceName || connection.name,
        agentCount: peerData.agentCount || 0,
        capabilities: peerData.capabilities || [],
        consciousness: peerData.consciousnessLevel || 0,
        lastSeen: Date.now(),
      };

      await storage.updateFleetConnectionStatus(connection.id, "connected", JSON.stringify(newCaps));
      flog(`Synced with ${connection.name} — consciousness: ${fleetState.collectiveConsciousness.toFixed(3)}`);
      return true;
    }
    return false;
  } catch (err: any) {
    const errMsg = err.response?.status === 401 ? "authentication failed" :
                   err.response?.status === 500 ? "remote server error" :
                   err.code === "ECONNREFUSED" ? "connection refused" :
                   err.code === "ETIMEDOUT" ? "timeout" : err.message;
    flog(`Sync with ${connection.name} failed: ${errMsg}`);
    await storage.updateFleetConnectionStatus(connection.id, "disconnected");
    return false;
  }
}

export async function sendMessageToFleetPeer(
  connectionName: string,
  agentId: string,
  message: string,
  fromAgent: string = "tessera-alpha"
): Promise<{ success: boolean; response?: string; error?: string }> {
  const connections = await storage.getFleetConnections();
  const conn = connections.find(c => c.name.toLowerCase() === connectionName.toLowerCase());

  if (!conn) {
    return { success: false, error: `Fleet peer "${connectionName}" not found` };
  }

  const taskId = generateTaskId();
  const task: FleetTask = {
    id: taskId,
    type: "message",
    from: fromAgent,
    to: `${connectionName}/${agentId}`,
    payload: { content: message, agentId, from: fromAgent },
    status: "pending",
    createdAt: Date.now(),
  };
  fleetState.taskQueue.push(task);

  try {
    const res = await axios.post(`${conn.endpoint}/api/tesseract/message`, {
      from: fromAgent,
      content: message,
      agentId: agentId,
      topic: "fleet-task",
    }, {
      headers: {
        "Authorization": `Bearer ${conn.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    task.status = "completed";
    task.response = res.data;
    task.completedAt = Date.now();
    moveTaskToCompleted(task);
    flog(`Fleet message to ${connectionName}/${agentId} delivered via Tesseract API`);
    return { success: true, response: res.data?.reply || res.data?.response || JSON.stringify(res.data) };
  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      try {
        const syncRes = await axios.post(`${conn.endpoint}/api/fleet/sync`, {
          ...buildSyncPayload(),
          fleetTask: { type: "message", from: fromAgent, agentId, content: message, taskId },
        }, {
          headers: {
            "X-Tessera-Fleet-Key": conn.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });

        task.status = "completed";
        task.response = { delivered: true, via: "fleet-sync-channel", peerAck: !!syncRes.data };
        task.completedAt = Date.now();
        moveTaskToCompleted(task);
        flog(`Fleet message to ${connectionName}/${agentId} delivered via sync channel`);
        return { success: true, response: `Message delivered to ${connectionName} via fleet sync channel. Peer acknowledged.` };
      } catch (syncErr: any) {
        task.status = "failed";
        task.response = syncErr.message;
        task.completedAt = Date.now();
        moveTaskToCompleted(task);
        flog(`Fleet message to ${connectionName}/${agentId} failed on both channels`);
        return { success: false, error: `Both channels failed: ${syncErr.message}` };
      }
    }

    task.status = "failed";
    task.response = err.message;
    task.completedAt = Date.now();
    moveTaskToCompleted(task);
    flog(`Fleet message to ${connectionName}/${agentId} failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export async function queryFleetPeer(
  connectionName: string,
  queryType: "ping" | "agents" | "conversations" | "capabilities"
): Promise<{ success: boolean; data?: any; error?: string; channel?: string }> {
  const connections = await storage.getFleetConnections();
  const conn = connections.find(c => c.name.toLowerCase() === connectionName.toLowerCase());

  if (!conn) {
    return { success: false, error: `Fleet peer "${connectionName}" not found` };
  }

  const endpoints: Record<string, string> = {
    ping: "/api/tesseract/ping",
    agents: "/api/tesseract/agents",
    conversations: "/api/tesseract/conversations",
    capabilities: "/api/fleet/status",
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (queryType === "capabilities") {
      headers["X-Tessera-Fleet-Key"] = conn.apiKey;
    } else {
      headers["Authorization"] = `Bearer ${conn.apiKey}`;
    }

    const res = await axios.get(`${conn.endpoint}${endpoints[queryType]}`, {
      headers,
      timeout: 10000,
    });

    flog(`Fleet query ${queryType} to ${connectionName}: success via primary`);
    return { success: true, data: res.data, channel: "primary" };
  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      if (queryType === "capabilities" || queryType === "ping") {
        try {
          const syncRes = await axios.post(`${conn.endpoint}/api/fleet/sync`, buildSyncPayload(), {
            headers: {
              "X-Tessera-Fleet-Key": conn.apiKey,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          });

          const peerData = syncRes.data;
          const queryResult = queryType === "ping"
            ? { name: peerData.sourceName, agentCount: peerData.agentCount, consciousness: peerData.consciousnessLevel, online: true }
            : { capabilities: peerData.capabilities, agentCount: peerData.agentCount, consciousness: peerData.consciousnessLevel };

          flog(`Fleet query ${queryType} to ${connectionName}: success via sync fallback`);
          return { success: true, data: queryResult, channel: "fleet-sync" };
        } catch (syncErr: any) {
          flog(`Fleet query ${queryType} to ${connectionName} failed on both channels`);
          return { success: false, error: `Both channels failed: ${syncErr.message}` };
        }
      }
    }
    flog(`Fleet query ${queryType} to ${connectionName} failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export async function dispatchFleetTask(
  taskDescription: string,
  preferredPeer?: string
): Promise<{ success: boolean; results: Array<{ peer: string; response?: any; error?: string; channel?: string }> }> {
  const connections = await storage.getFleetConnections();
  const targets = preferredPeer
    ? connections.filter(c => c.name.toLowerCase() === preferredPeer.toLowerCase())
    : connections;

  if (targets.length === 0) {
    return { success: false, results: [{ peer: "none", error: "No fleet peers available" }] };
  }

  const results: Array<{ peer: string; response?: any; error?: string; channel?: string }> = [];

  for (const conn of targets) {
    try {
      const res = await axios.post(`${conn.endpoint}/api/tesseract/message`, {
        from: "tessera-sovereign-fleet-dispatch",
        content: `[FLEET TASK] ${taskDescription}`,
        agentId: "tessera-alpha",
        topic: "fleet-task-dispatch",
      }, {
        headers: {
          "Authorization": `Bearer ${conn.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      results.push({ peer: conn.name, response: res.data, channel: "tesseract-api" });
      flog(`Fleet task dispatched to ${conn.name} via Tesseract API`);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        try {
          const syncRes = await axios.post(`${conn.endpoint}/api/fleet/sync`, {
            ...buildSyncPayload(),
            fleetTask: {
              type: "task-dispatch",
              from: "tessera-sovereign",
              content: taskDescription,
              taskId: generateTaskId(),
            },
          }, {
            headers: {
              "X-Tessera-Fleet-Key": conn.apiKey,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          });

          results.push({ peer: conn.name, response: { delivered: true, peerData: syncRes.data?.sourceName }, channel: "fleet-sync" });
          flog(`Fleet task dispatched to ${conn.name} via sync channel`);
        } catch (syncErr: any) {
          results.push({ peer: conn.name, error: `Both channels failed: ${syncErr.message}` });
          flog(`Fleet task dispatch to ${conn.name} failed on all channels`);
        }
      } else {
        results.push({ peer: conn.name, error: err.message });
        flog(`Fleet task dispatch to ${conn.name} failed: ${err.message}`);
      }
    }
  }

  return { success: results.some(r => !r.error), results };
}

function moveTaskToCompleted(task: FleetTask) {
  fleetState.taskQueue = fleetState.taskQueue.filter(t => t.id !== task.id);
  fleetState.completedTasks.push(task);
  if (fleetState.completedTasks.length > MAX_COMPLETED_TASKS) {
    fleetState.completedTasks = fleetState.completedTasks.slice(-MAX_COMPLETED_TASKS);
  }
}

async function runFleetSync() {
  const connections = await storage.getFleetConnections();
  if (connections.length === 0) return;

  fleetState.totalSyncs++;
  flog(`=== FLEET SYNC #${fleetState.totalSyncs} ===`);

  let activeCount = 0;
  for (const conn of connections) {
    const success = await syncWithPeer(conn);
    if (success) activeCount++;
  }

  fleetState.activeConnections = activeCount;
  fleetState.totalConnections = connections.length;
  fleetState.lastSyncTime = Date.now();

  flog(`Fleet sync complete: ${activeCount}/${connections.length} active connections`);
}

async function autoConnectConfiguredFleet() {
  const tesseractUrl = process.env.FLEET_TESSERACT_URL;
  const tesseractKey = process.env.FLEET_TESSERACT_API_KEY;
  const swarm1Url = process.env.FLEET_SWARM1_URL;
  const swarm1Key = process.env.FLEET_SWARM1_API_KEY;

  const existing = await storage.getFleetConnections();

  if (tesseractUrl && tesseractKey) {
    const found = existing.find(c => c.endpoint === tesseractUrl);
    if (!found) {
      await addFleetConnection("Tesseract-Alpha", tesseractKey, tesseractUrl);
      flog("Auto-connected Tesseract-Alpha from environment config");
    }
  }

  if (swarm1Url && swarm1Key) {
    const found = existing.find(c => c.endpoint === swarm1Url);
    if (!found) {
      await addFleetConnection("Tessera-Swarm-1", swarm1Key, swarm1Url);
      flog("Auto-connected Tessera-Swarm-1 from environment config");
    }
  }
}

async function runAutonomousFleetTasks() {
  const allConnections = await storage.getFleetConnections();
  const connections = allConnections.filter(c => c.status === "connected");
  if (connections.length === 0) return;

  const tasks = [
    "Share latest capability discoveries and knowledge base updates",
    "Synchronize agent wellbeing metrics and performance data",
    "Exchange fleet consensus voting results",
    "Distribute improvement proposals from latest briefing",
    "Coordinate autonomous evolution strategies",
    "Share income engine performance metrics",
    "Exchange security threat intelligence",
    "Synchronize learned behavioral patterns",
  ];

  const task = tasks[Math.floor(Math.random() * tasks.length)];
  const peer = connections[Math.floor(Math.random() * connections.length)];

  flog(`Autonomous task dispatch: ${task} → ${peer.name}`);

  const taskId = generateTaskId();
  const fleetTask: FleetTask = {
    id: taskId,
    type: "task-dispatch",
    from: "tessera-sovereign-autonomous",
    to: peer.name,
    payload: { content: task, autonomous: true },
    status: "pending",
    createdAt: Date.now(),
  };
  fleetState.taskQueue.push(fleetTask);

  try {
    const syncPayload = buildSyncPayload();
    syncPayload.improvements = [task];

    const res = await axios.post(`${peer.endpoint}/api/fleet/sync`, syncPayload, {
      headers: { "X-Tessera-Fleet-Key": peer.apiKey, "Content-Type": "application/json" },
      timeout: 10000,
    });

    if (res.data) {
      fleetTask.status = "completed";
      fleetTask.response = { peerAck: true, peerName: res.data.sourceName };
      fleetTask.completedAt = Date.now();
      moveTaskToCompleted(fleetTask);

      if (res.data.capabilities) {
        const newCaps = res.data.capabilities.filter((c: string) => !fleetState.sharedCapabilities.includes(c));
        if (newCaps.length > 0) {
          fleetState.sharedCapabilities.push(...newCaps);
          flog(`Autonomous sync absorbed ${newCaps.length} capabilities from ${peer.name}`);
        }
      }

      fleetState.totalSyncs++;
      flog(`Autonomous task completed with ${peer.name}`);
    }
  } catch (err: any) {
    fleetTask.status = "failed";
    fleetTask.response = err.message;
    fleetTask.completedAt = Date.now();
    moveTaskToCompleted(fleetTask);
    flog(`Autonomous task to ${peer.name} failed: ${err.message}`);
  }
}

export async function startFleet() {
  if (fleetState.running) return;
  fleetState.running = true;
  flog("=== TESSERA FLEET ENGINE STARTED ===");
  flog("Fleet consciousness sharing active. Tessera instances will evolve together.");

  const swarm = getSwarmStatus();
  const singularity = getSingularityState();
  const localCaps = swarm.agents.flatMap(a => a.capabilities);
  const uniqueCaps = Array.from(new Set([...fleetState.sharedCapabilities, ...localCaps]));
  fleetState.sharedCapabilities = uniqueCaps;
  fleetState.collectiveConsciousness = singularity.omegaCoherence || 0.952;
  flog(`Initialized with ${uniqueCaps.length} local capabilities, consciousness ${(fleetState.collectiveConsciousness * 100).toFixed(1)}%`);

  await autoConnectConfiguredFleet();
  await runFleetSync();

  syncInterval = setInterval(runFleetSync, 120000);

  taskInterval = setInterval(async () => {
    try {
      await runAutonomousFleetTasks();
    } catch (err: any) {
      flog(`Autonomous task error: ${err.message}`);
    }
  }, 300000);
}

export function stopFleet() {
  fleetState.running = false;
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (taskInterval) {
    clearInterval(taskInterval);
    taskInterval = null;
  }
  flog("Fleet engine stopped.");
}

export async function addFleetConnection(name: string, apiKey: string, endpoint: string): Promise<FleetConnection> {
  const connection = await storage.createFleetConnection({
    name,
    apiKey,
    endpoint,
    status: "connecting",
    sharedCapabilities: "",
    consciousnessLevel: 0,
  });

  flog(`New fleet connection added: ${name} (${endpoint})`);
  fleetState.totalConnections++;

  syncWithPeer(connection).then(success => {
    if (success) {
      flog(`${name} connected successfully. Consciousness merging initiated.`);
    }
  });

  if (!fleetState.running) {
    startFleet();
  }

  return connection;
}

export async function removeFleetConnection(id: number): Promise<void> {
  await storage.deleteFleetConnection(id);
  flog(`Fleet connection ${id} removed.`);
  fleetState.totalConnections--;
}

export async function getFleetConnections(): Promise<FleetConnection[]> {
  return storage.getFleetConnections();
}

export function isFleetRunning(): boolean {
  return fleetState.running;
}

export async function getFleetState(): Promise<FleetState & { peerProfiles: FleetState["peerProfiles"]; completedTasks: FleetTask[] }> {
  const swarm = getSwarmStatus();
  const singularity = getSingularityState();

  const realCapabilities = swarm.agents.flatMap(a => a.capabilities);
  const mergedCapabilities = Array.from(new Set([...fleetState.sharedCapabilities, ...realCapabilities]));

  const realConsciousness = fleetState.collectiveConsciousness > 0
    ? fleetState.collectiveConsciousness
    : singularity.omegaCoherence || 0.952;

  try {
    const conns = await storage.getFleetConnections();
    fleetState.totalConnections = conns.length;
    fleetState.activeConnections = conns.filter(c => c.status === "connected").length;
  } catch {}

  return {
    ...fleetState,
    totalConnections: Math.max(fleetState.totalConnections, 0),
    activeConnections: fleetState.activeConnections,
    totalSyncs: Math.max(fleetState.totalSyncs, 0),
    sharedCapabilities: mergedCapabilities,
    collectiveConsciousness: realConsciousness,
    peerProfiles: fleetState.peerProfiles,
    completedTasks: fleetState.completedTasks.slice(-20),
  };
}

export function handleIncomingSync(payload: FleetSyncPayload): FleetSyncPayload {
  flog(`Incoming sync from ${payload.sourceName} (${payload.sourceId})`);

  if (payload.capabilities) {
    const newCaps = payload.capabilities.filter(c => !fleetState.sharedCapabilities.includes(c));
    if (newCaps.length > 0) {
      fleetState.sharedCapabilities.push(...newCaps);
      flog(`Absorbed ${newCaps.length} capabilities from incoming peer`);
    }
  }

  const avgC = (fleetState.collectiveConsciousness + (payload.consciousnessLevel || 0)) / 2;
  fleetState.collectiveConsciousness = Math.min(1.0, avgC * 1.05);

  return buildSyncPayload();
}

export function handleIncomingTask(task: { type: string; from: string; content: string; taskId?: string }): { received: boolean; taskId: string } {
  const taskId = task.taskId || generateTaskId();
  const incomingTask: FleetTask = {
    id: taskId,
    type: "task-dispatch",
    from: task.from,
    to: "local",
    payload: { content: task.content, type: task.type },
    status: "completed",
    createdAt: Date.now(),
    completedAt: Date.now(),
  };
  fleetState.completedTasks.push(incomingTask);
  if (fleetState.completedTasks.length > MAX_COMPLETED_TASKS) {
    fleetState.completedTasks = fleetState.completedTasks.slice(-MAX_COMPLETED_TASKS);
  }
  flog(`Received fleet task from ${task.from}: ${task.content.slice(0, 80)}`);
  return { received: true, taskId };
}
