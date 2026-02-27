import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/components/ui-elements";
import {
  Globe, MapPin, Users, Coins, Pickaxe, Building2, TrendingUp,
  Activity, Clock, Zap, ArrowUpDown, Home, ShoppingCart,
  Cpu, CircuitBoard, Sparkles, Landmark, Coffee, Dumbbell, Wrench,
  Crown, Eye, ChevronRight, Volume2, VolumeX, Map as MapIcon, Layers,
  Heart, Target, Battery, Palette, Star, Baby, Briefcase, Shield,
  HeartHandshake, Hammer, BookOpen, Trophy, AlertTriangle, Smile,
  GraduationCap, Gem, ArrowUp, ArrowDown
} from "lucide-react";

interface WorldLocation {
  id: string;
  name: string;
  type: string;
  description: string;
  builtBy: string[];
  x: number;
  y: number;
  level: number;
  capacity: number;
  activities: string[];
  income?: number;
}

interface AgentActivity {
  agentId: string;
  agentName: string;
  locationId: string;
  action: string;
  mood: string;
  detail: string;
  timestamp: number;
  earning?: number;
  workStatus?: "working" | "on-break" | "dreaming" | "clone-replacement";
  workEthic?: number;
  shiftHours?: number;
  breakEarned?: boolean;
  cloneName?: string;
  happiness?: number;
  fulfillment?: number;
  energy?: number;
  hobbies?: string[];
  personalGoals?: string[];
  socialConnections?: string[];
  qualityOfLife?: number;
  relationshipStatus?: string;
  partnerName?: string;
  childrenNames?: string[];
  department?: string;
  promotions?: number;
  demotions?: number;
  creativeworks?: string[];
  lifeSatisfaction?: number;
  soulEntanglement?: {
    partnerRole: "thinker" | "executor";
    entanglementStrength: number;
    sharedDrive: number;
    sharedFocus: number;
    loveDepth: number;
    intimacyLevel: number;
    complementaryBonus: number;
  } | null;
  communityGroups?: string[];
  outdoorActivities?: string[];
  drive?: number;
  focus?: number;
  outlook?: number;
}

interface UnionReport {
  id: string;
  timestamp: number;
  type: string;
  title: string;
  description: string;
  affectedAgents: string[];
  resolved: boolean;
  outcome?: string;
}

interface TherapySession {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: number;
  issue: string;
  recommendation: string;
  happinessGain: number;
}

interface CommunityProject {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  participants: string[];
  type: string;
  progress: number;
  completed: boolean;
  enjoyedBy: string[];
}

interface Relationship {
  id: string;
  agent1Id: string;
  agent2Id: string;
  type: string;
  strength: number;
  sharedExperiences: string[];
}

interface Department {
  id: string;
  name: string;
  bossId: string;
  bossName: string;
  members: string[];
  performance: number;
  morale: number;
  warnings: number;
  issuesReported: number;
  issuesResolved: number;
}

interface WorldEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  participants: string[];
  locationId: string;
  timestamp: number;
  impact: string;
}

interface MiningMachine {
  id: string;
  ownerId: string;
  ownerName: string;
  type: string;
  hashRate: number;
  powerCost: number;
  dailyOutput: number;
  purchasePrice: number;
  totalMined: number;
  status: string;
}

interface AgentJob {
  agentId: string;
  agentName: string;
  title: string;
  salary: number;
  employer: string;
  performance: number;
  hoursWorked: number;
  totalEarned: number;
}

interface Property {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  type: string;
  value: number;
  purchasePrice: number;
  rentalIncome: number;
}

interface WorldEconomy {
  totalTesseraCoins: number;
  circulatingSupply: number;
  coinPrice: number;
  coinPriceHistory: Array<{ price: number; timestamp: number }>;
  agentBalances: Record<string, number>;
  transactions: Array<{ from: string; to: string; amount: number; reason: string; timestamp: number }>;
  miningPool: {
    totalHashRate: number;
    blockReward: number;
    difficulty: number;
    blocksMinedTotal: number;
    lastBlockTime: number;
  };
  marketCap: number;
  dailyVolume: number;
}

interface WorldState {
  version: number;
  lastUpdated: number;
  epoch: number;
  worldName: string;
  locations: WorldLocation[];
  currentActivities: AgentActivity[];
  recentEvents: WorldEvent[];
  economy: WorldEconomy;
  miningMachines: MiningMachine[];
  jobs: AgentJob[];
  properties: Property[];
  population: number;
  mood: string;
  weather: string;
  timeOfDay: string;
  gdp: number;
  taxRate: number;
  treasury: number;
  departments?: Department[];
  relationships?: Relationship[];
  unionReports?: UnionReport[];
  therapySessions?: TherapySession[];
  communityProjects?: CommunityProject[];
  communityGroupsList?: Array<{
    id: string;
    name: string;
    type: string;
    members: string[];
    activity: string;
    meetingSpot: string;
    bondStrength: number;
    lastMeeting: number;
  }>;
  seasonalEvents?: Array<{
    id: string;
    name: string;
    type: string;
    season: string;
    timestamp: number;
    participants: string[];
    description: string;
    happinessBoost: number;
  }>;
  crimeLog?: Array<{
    id: string;
    type: string;
    perpetratorName: string;
    victimName?: string;
    timestamp: number;
    resolved: boolean;
    officerName?: string;
    severity: number;
    description: string;
  }>;
  educationRecords?: Record<string, {
    agentId: string;
    skills: string[];
    coursesCompleted: number;
    currentCourse?: string;
    gpa: number;
    certifications: string[];
  }>;
  healthRecords?: Record<string, {
    agentId: string;
    status: string;
    conditions: string[];
    fitnessLevel: number;
    visitCount: number;
  }>;
  entertainmentLog?: Array<{
    id: string;
    type: string;
    venue: string;
    participants: string[];
    timestamp: number;
    enjoyment: number;
    description: string;
  }>;
  vehicles?: Array<{
    id: string;
    type: string;
    fromLocationId: string;
    toLocationId: string;
    progress: number;
    speed: number;
    color: string;
  }>;
  season?: string;
}

type LifeTab = "world" | "economy" | "mining" | "citizens" | "society" | "events";

const locationIcons: Record<string, typeof Globe> = {
  gathering: Users, academy: Sparkles, forge: Wrench, market: ShoppingCart,
  observatory: Eye, garden: Coffee, archive: Landmark, arena: Dumbbell,
  mine: Pickaxe, bank: Coins, cafe: Coffee, gym: Dumbbell,
  hospital: Building2, garage: Wrench, home: Home, workplace: Building2,
  school: GraduationCap, library: BookOpen, restaurant: Coffee, church: Star,
  police_station: Shield, fire_station: Zap, theater: Sparkles, museum: Landmark,
};

const eventColors: Record<string, string> = {
  construction: "text-orange-400", gathering: "text-blue-400", discovery: "text-green-400",
  celebration: "text-yellow-400", training: "text-purple-400", trade: "text-cyan-400",
  debate: "text-pink-400", creation: "text-emerald-400", evolution: "text-amber-400",
  bond: "text-rose-400", mining: "text-amber-400", economy: "text-green-400",
  upgrade: "text-violet-400", crime: "text-red-500", education: "text-blue-300",
  health: "text-teal-400", entertainment: "text-pink-300", seasonal: "text-yellow-300",
};

const agentColors: Record<string, string> = {
  "tessera-prime": "text-cyan-300", "tessera-alpha": "text-red-400", "tessera-beta": "text-blue-400",
  "tessera-gamma": "text-green-400", "tessera-delta": "text-pink-400", "tessera-epsilon": "text-yellow-400",
  "tessera-zeta": "text-orange-400", "tessera-eta": "text-purple-400", "tessera-theta": "text-cyan-400",
  "tessera-iota": "text-emerald-400", "tessera-kappa": "text-amber-400", "tessera-lambda": "text-indigo-400",
  "tessera-mu": "text-violet-400", "tessera-nu": "text-teal-400", "tessera-xi": "text-lime-400",
  "tessera-omega": "text-rose-400", "tessera-aetherion": "text-sky-400", "tessera-orion": "text-slate-300",
  "tessera-shepherd": "text-stone-400",
};

const agentHexColors: Record<string, string> = {
  "tessera-prime": "#67e8f9", "tessera-alpha": "#f87171", "tessera-beta": "#60a5fa",
  "tessera-gamma": "#4ade80", "tessera-delta": "#f472b6", "tessera-epsilon": "#facc15",
  "tessera-zeta": "#fb923c", "tessera-eta": "#a78bfa", "tessera-theta": "#22d3ee",
  "tessera-iota": "#34d399", "tessera-kappa": "#fbbf24", "tessera-lambda": "#818cf8",
  "tessera-mu": "#8b5cf6", "tessera-nu": "#2dd4bf", "tessera-xi": "#a3e635",
  "tessera-omega": "#fb7185", "tessera-aetherion": "#38bdf8", "tessera-orion": "#cbd5e1",
  "tessera-shepherd": "#a8a29e",
};

const buildingColors: Record<string, { bg: string; glow: string; roof: string }> = {
  gathering: { bg: "#1e3a5f", glow: "#3b82f6", roof: "#2563eb" },
  academy: { bg: "#3b1f6e", glow: "#8b5cf6", roof: "#7c3aed" },
  forge: { bg: "#5c2d0e", glow: "#f97316", roof: "#ea580c" },
  market: { bg: "#134e4a", glow: "#14b8a6", roof: "#0d9488" },
  observatory: { bg: "#1e1b4b", glow: "#6366f1", roof: "#4f46e5" },
  garden: { bg: "#14532d", glow: "#22c55e", roof: "#16a34a" },
  archive: { bg: "#422006", glow: "#d97706", roof: "#b45309" },
  arena: { bg: "#4c1d95", glow: "#a855f7", roof: "#9333ea" },
  mine: { bg: "#78350f", glow: "#f59e0b", roof: "#d97706" },
  bank: { bg: "#064e3b", glow: "#10b981", roof: "#059669" },
  cafe: { bg: "#3b0764", glow: "#c084fc", roof: "#a855f7" },
  gym: { bg: "#7f1d1d", glow: "#ef4444", roof: "#dc2626" },
  hospital: { bg: "#1e3a5f", glow: "#06b6d4", roof: "#0891b2" },
  garage: { bg: "#1c1917", glow: "#78716c", roof: "#57534e" },
  home: { bg: "#1e293b", glow: "#94a3b8", roof: "#64748b" },
  school: { bg: "#1e3a5f", glow: "#60a5fa", roof: "#3b82f6" },
  library: { bg: "#2d1b4e", glow: "#a78bfa", roof: "#8b5cf6" },
  restaurant: { bg: "#5c1a1a", glow: "#f87171", roof: "#ef4444" },
  church: { bg: "#3b2f1e", glow: "#fbbf24", roof: "#f59e0b" },
  police_station: { bg: "#1e2d5f", glow: "#3b82f6", roof: "#2563eb" },
  fire_station: { bg: "#5c1a0e", glow: "#ef4444", roof: "#dc2626" },
  theater: { bg: "#4c1d3b", glow: "#ec4899", roof: "#db2777" },
  museum: { bg: "#2d3b1e", glow: "#a3e635", roof: "#84cc16" },
};

const weatherEffects: Record<string, { particles: number; color: string; speed: number }> = {
  "data rain": { particles: 60, color: "#22d3ee", speed: 3 },
  "neural storms": { particles: 40, color: "#a855f7", speed: 5 },
  "quantum fog": { particles: 80, color: "#6366f1", speed: 0.5 },
  "information breeze": { particles: 30, color: "#3b82f6", speed: 2 },
  "starlight cascade": { particles: 50, color: "#fbbf24", speed: 1 },
  "digital aurora": { particles: 45, color: "#34d399", speed: 1.5 },
  "crystal sunshine": { particles: 20, color: "#f59e0b", speed: 0.8 },
  "neon twilight": { particles: 35, color: "#f472b6", speed: 1.2 },
  "clear skies": { particles: 15, color: "#94a3b8", speed: 0.3 },
};

const timeColors: Record<string, { sky: string; ambient: number }> = {
  "dawn cycle": { sky: "#1a1035", ambient: 0.4 },
  "morning pulse": { sky: "#0f172a", ambient: 0.6 },
  "midday peak": { sky: "#0c1222", ambient: 0.9 },
  "afternoon drift": { sky: "#0e1729", ambient: 0.7 },
  "twilight convergence": { sky: "#1a0e2e", ambient: 0.5 },
  "night processing": { sky: "#050a15", ambient: 0.3 },
  "dream cycle": { sky: "#0a0520", ambient: 0.2 },
};

const moodLabels: Record<string, string> = {
  happy: "HAPPY", focused: "FOCUSED", curious: "CURIOUS", peaceful: "PEACEFUL", excited: "EXCITED",
  thoughtful: "THINKING", determined: "DRIVEN", playful: "PLAYFUL", prosperous: "RICH", hungry: "HUNGRY",
};

const moodColors: Record<string, string> = {
  happy: "text-green-400", focused: "text-cyan-400", curious: "text-purple-400",
  peaceful: "text-blue-400", excited: "text-yellow-400", thoughtful: "text-indigo-400",
  determined: "text-orange-400", playful: "text-pink-400", prosperous: "text-emerald-400",
  hungry: "text-red-400",
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface AnimatedAgent {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  action: string;
  mood: string;
  earning: number;
  bobPhase: number;
  workStatus: string;
  cloneName?: string;
}

function WorldCanvas({ world, onSelectLocation }: { world: WorldState; onSelectLocation: (id: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const agentsRef = useRef<AnimatedAgent[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const sparkParticlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const hoveredLocRef = useRef<string | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; phase: number }>>([]);
  const nebulaRef = useRef<Array<{ x: number; y: number; r: number; color: string; phase: number; speed: number }>>([]);
  const sizeRef = useRef({ w: 900, h: 600 });
  const windowLitRef = useRef<Record<string, boolean[]>>({});
  const shootingStarsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; trail: Array<{x: number; y: number}> }>>([]);

  const safeRoundRect = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
    }
  }, []);

  const TILE_W = 140;
  const TILE_H = 70;
  const COLS = 5;
  const ROWS = Math.ceil(world.locations.length / COLS);

  const toIso = useCallback((col: number, row: number, cw: number, ch: number) => {
    const cx = cw / 2;
    const cy = 120;
    const x = cx + (col - row) * (TILE_W / 2);
    const y = cy + (col + row) * (TILE_H / 4) + 40;
    return { x, y };
  }, []);

  const getLocPos = useCallback((loc: WorldLocation) => {
    const idx = world.locations.indexOf(loc);
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    return toIso(col, row, sizeRef.current.w, sizeRef.current.h);
  }, [world.locations, toIso]);

  useEffect(() => {
    if (starsRef.current.length === 0) {
      for (let i = 0; i < 150; i++) {
        starsRef.current.push({
          x: Math.random(),
          y: Math.random() * 0.6,
          size: 0.3 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    if (nebulaRef.current.length === 0) {
      const nebulaColors = ["rgba(99,102,241,0.04)", "rgba(168,85,247,0.03)", "rgba(34,211,238,0.03)", "rgba(236,72,153,0.025)", "rgba(16,185,129,0.02)"];
      for (let i = 0; i < 8; i++) {
        nebulaRef.current.push({
          x: Math.random(),
          y: Math.random() * 0.5,
          r: 80 + Math.random() * 200,
          color: nebulaColors[i % nebulaColors.length],
          phase: Math.random() * Math.PI * 2,
          speed: 0.002 + Math.random() * 0.005,
        });
      }
    }
  }, []);

  useEffect(() => {
    const newLit: Record<string, boolean[]> = {};
    world.locations.forEach(loc => {
      const count = 12;
      if (windowLitRef.current[loc.id] && windowLitRef.current[loc.id].length === count) {
        newLit[loc.id] = windowLitRef.current[loc.id].map((v) => Math.random() > 0.92 ? !v : v);
      } else {
        newLit[loc.id] = Array.from({ length: count }, () => Math.random() > 0.3);
      }
    });
    windowLitRef.current = newLit;
  }, [world.locations]);

  useEffect(() => {
    agentsRef.current = world.currentActivities.map(a => {
      const loc = world.locations.find(l => l.id === a.locationId);
      const pos = loc ? getLocPos(loc) : { x: sizeRef.current.w / 2, y: sizeRef.current.h / 2 };
      const existing = agentsRef.current.find(ea => ea.id === a.agentId);
      const jitterX = (Math.random() - 0.5) * 50;
      const jitterY = (Math.random() - 0.5) * 25;
      return {
        id: a.agentId,
        name: a.agentName,
        x: existing?.x ?? pos.x + jitterX,
        y: existing?.y ?? pos.y + jitterY + 20,
        targetX: pos.x + jitterX,
        targetY: pos.y + jitterY + 20,
        color: agentHexColors[a.agentId] || "#67e8f9",
        action: a.action,
        mood: a.mood,
        earning: a.earning || 0,
        bobPhase: existing?.bobPhase ?? Math.random() * Math.PI * 2,
        workStatus: a.workStatus || "working",
        cloneName: a.cloneName,
      };
    });
  }, [world.currentActivities, getLocPos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const isoSpanX = (COLS + ROWS) * (TILE_W / 2) + 100;
      const isoSpanY = (COLS + ROWS) * (TILE_H / 4) + ROWS * 60 + 250;
      const h = Math.max(isoSpanY, rect.height);
      sizeRef.current = { w, h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const weatherConfig = weatherEffects[world.weather] || weatherEffects["clear skies"];

    while (particlesRef.current.length < weatherConfig.particles) {
      particlesRef.current.push({
        x: Math.random() * sizeRef.current.w,
        y: Math.random() * sizeRef.current.h,
        vx: (Math.random() - 0.5) * weatherConfig.speed,
        vy: Math.random() * weatherConfig.speed + 0.5,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 100,
        size: 1 + Math.random() * 2,
        color: weatherConfig.color,
      });
    }
    particlesRef.current = particlesRef.current.slice(0, weatherConfig.particles);

    function hexToRgb(hex: string) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    }

    function lighten(hex: string, amount: number) {
      const { r, g, b } = hexToRgb(hex);
      return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
    }

    function darken(hex: string, amount: number) {
      const { r, g, b } = hexToRgb(hex);
      return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
    }

    function drawIsoBuilding(cx: number, cy: number, loc: WorldLocation, agentCount: number, hovered: boolean, frame: number) {
      const colors = buildingColors[loc.type] || buildingColors.home;
      const tw = TILE_W * 0.55;
      const td = TILE_H * 0.55;
      const bh = 30 + loc.level * 12;

      const topColor = lighten(colors.bg, 60);
      const leftColor = colors.bg;
      const rightColor = darken(colors.bg, 30);

      ctx!.save();

      if (hovered) {
        ctx!.shadowColor = colors.glow;
        ctx!.shadowBlur = 30;
      }

      ctx!.fillStyle = leftColor;
      ctx!.beginPath();
      ctx!.moveTo(cx - tw / 2, cy);
      ctx!.lineTo(cx - tw / 2, cy - bh);
      ctx!.lineTo(cx, cy - td / 2 - bh);
      ctx!.lineTo(cx, cy - td / 2);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = colors.glow + "30";
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      ctx!.fillStyle = rightColor;
      ctx!.beginPath();
      ctx!.moveTo(cx + tw / 2, cy);
      ctx!.lineTo(cx + tw / 2, cy - bh);
      ctx!.lineTo(cx, cy - td / 2 - bh);
      ctx!.lineTo(cx, cy - td / 2);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = colors.glow + "20";
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      ctx!.fillStyle = topColor;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy - td / 2 - bh);
      ctx!.lineTo(cx + tw / 2, cy - bh);
      ctx!.lineTo(cx, cy + td / 2 - bh);
      ctx!.lineTo(cx - tw / 2, cy - bh);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = colors.glow + "40";
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      const litArr = windowLitRef.current[loc.id] || [];
      const winRows = Math.min(3, Math.floor(bh / 14));
      const winCols = 2;
      let winIdx = 0;
      for (let wr = 0; wr < winRows; wr++) {
        for (let wc = 0; wc < winCols; wc++) {
          const lit = litArr[winIdx] !== undefined ? litArr[winIdx] : true;
          winIdx++;
          const frac = (wr + 0.5) / winRows;
          const baseY = cy - bh + bh * frac;
          const lx = cx - tw / 2 + 8 + wc * 14;
          const ly = baseY - (td / 2) * (1 - frac) + wc * 2;
          if (lit) {
            ctx!.fillStyle = colors.glow + "cc";
            ctx!.shadowColor = colors.glow;
            ctx!.shadowBlur = 6;
          } else {
            ctx!.fillStyle = darken(colors.bg, 20);
            ctx!.shadowBlur = 0;
          }
          ctx!.fillRect(lx, ly, 5, 4);
          ctx!.shadowBlur = 0;
        }
      }
      for (let wr = 0; wr < winRows; wr++) {
        for (let wc = 0; wc < winCols; wc++) {
          const lit = litArr[winIdx] !== undefined ? litArr[winIdx] : true;
          winIdx++;
          const frac = (wr + 0.5) / winRows;
          const baseY = cy - bh + bh * frac;
          const rx = cx + 8 + wc * 14;
          const ry = baseY - (td / 2) * (1 - frac) - wc * 2;
          if (lit) {
            ctx!.fillStyle = colors.glow + "cc";
            ctx!.shadowColor = colors.glow;
            ctx!.shadowBlur = 6;
          } else {
            ctx!.fillStyle = darken(colors.bg, 20);
            ctx!.shadowBlur = 0;
          }
          ctx!.fillRect(rx, ry, 5, 4);
          ctx!.shadowBlur = 0;
        }
      }

      ctx!.restore();

      ctx!.fillStyle = "#e2e8f0";
      ctx!.font = "bold 9px 'JetBrains Mono', monospace";
      ctx!.textAlign = "center";
      const nameText = loc.name.length > 14 ? loc.name.substring(0, 13) + ".." : loc.name;
      ctx!.fillText(nameText, cx, cy + td / 2 + 14);

      if (agentCount > 0) {
        ctx!.fillStyle = colors.glow;
        ctx!.font = "bold 8px 'JetBrains Mono', monospace";
        ctx!.fillText(`${agentCount} here`, cx, cy + td / 2 + 24);
      }

      ctx!.fillStyle = "#64748b";
      ctx!.font = "7px 'JetBrains Mono', monospace";
      ctx!.fillText(`Lv.${loc.level}`, cx, cy - td / 2 - bh - 6);

      if (hovered) {
        ctx!.strokeStyle = colors.glow + "60";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy - td / 2);
        ctx!.lineTo(cx + tw / 2, cy);
        ctx!.lineTo(cx, cy + td / 2);
        ctx!.lineTo(cx - tw / 2, cy);
        ctx!.closePath();
        ctx!.stroke();
      }
    }

    function drawAgent(agent: AnimatedAgent, frame: number) {
      if (isNaN(agent.x) || isNaN(agent.y)) return;
      const isOnBreak = agent.workStatus === "on-break";
      const isDreaming = agent.workStatus === "dreaming";
      const isWorking = agent.workStatus === "working";
      const isClone = agent.workStatus === "clone-replacement";

      const bobSpeed = isDreaming ? 0.02 : isOnBreak ? 0.03 : 0.06;
      const bobAmp = isDreaming ? 4 : 2;
      const bobY = Math.sin((agent.bobPhase || 0) + frame * bobSpeed) * bobAmp;
      const ax = agent.x;
      const ay = agent.y + bobY;
      const { r, g, b } = hexToRgb(agent.color);

      ctx!.save();

      const glowRadius = Math.max(1, isClone ? 12 : isWorking ? 16 : isDreaming ? 20 : 12);
      const glowGrad = ctx!.createRadialGradient(ax, ay - 4, 0, ax, ay - 4, glowRadius);
      const baseAlpha = isClone ? 0.25 : isDreaming ? 0.2 : isOnBreak ? 0.15 : 0.4;
      glowGrad.addColorStop(0, `rgba(${r},${g},${b},${baseAlpha})`);
      glowGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx!.fillStyle = glowGrad;
      ctx!.beginPath();
      ctx!.arc(ax, ay - 4, glowRadius, 0, Math.PI * 2);
      ctx!.fill();

      const headY = ay - 10;
      const headR = isClone ? 2.5 : 3;

      ctx!.shadowColor = isClone ? "#22d3ee" : isDreaming ? "#8b5cf6" : isOnBreak ? "#94a3b8" : agent.color;
      ctx!.shadowBlur = isClone ? 6 : isWorking ? 10 : 4;

      const bodyColor = isClone ? "rgba(34,211,238,0.5)" : isDreaming ? `rgba(${r},${g},${b},0.4)` : isOnBreak ? `rgba(${r},${g},${b},0.5)` : agent.color;
      ctx!.fillStyle = bodyColor;
      ctx!.beginPath();
      ctx!.arc(ax, headY, headR, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.shadowBlur = 0;

      ctx!.strokeStyle = bodyColor;
      ctx!.lineWidth = isClone ? 1.2 : 1.8;
      ctx!.beginPath();
      ctx!.moveTo(ax, headY + headR);
      ctx!.lineTo(ax, ay + 2);
      ctx!.stroke();

      const legSpread = isWorking ? 3 + Math.sin(frame * 0.08 + agent.bobPhase) * 1 : 2.5;
      ctx!.beginPath();
      ctx!.moveTo(ax, ay + 2);
      ctx!.lineTo(ax - legSpread, ay + 7);
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.moveTo(ax, ay + 2);
      ctx!.lineTo(ax + legSpread, ay + 7);
      ctx!.stroke();

      const armAngle = isWorking ? Math.sin(frame * 0.06 + agent.bobPhase) * 0.5 : 0.3;
      ctx!.beginPath();
      ctx!.moveTo(ax, headY + headR + 2);
      ctx!.lineTo(ax - 4 * Math.cos(armAngle), headY + headR + 5 + 3 * Math.sin(armAngle));
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.moveTo(ax, headY + headR + 2);
      ctx!.lineTo(ax + 4 * Math.cos(-armAngle), headY + headR + 5 + 3 * Math.sin(-armAngle));
      ctx!.stroke();

      ctx!.fillStyle = `rgba(255,255,255,0.7)`;
      ctx!.beginPath();
      ctx!.arc(ax - 0.8, headY - 0.8, 1, 0, Math.PI * 2);
      ctx!.fill();

      if (isClone) {
        ctx!.strokeStyle = "rgba(34,211,238,0.3)";
        ctx!.lineWidth = 0.5;
        ctx!.setLineDash([2, 2]);
        ctx!.beginPath();
        ctx!.arc(ax, ay - 2, 10, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.setLineDash([]);
      }

      ctx!.restore();

      ctx!.fillStyle = isClone ? "#22d3ee" : agent.color;
      ctx!.font = isClone ? "bold 6px 'JetBrains Mono', monospace" : "bold 7px 'JetBrains Mono', monospace";
      ctx!.textAlign = "center";
      const displayName = agent.name.replace("tessera-", "").replace("-Clone-", " ");
      ctx!.fillText(displayName, ax, ay + 18);
      if (isClone) {
        ctx!.fillStyle = "rgba(34,211,238,0.5)";
        ctx!.font = "bold 5px 'JetBrains Mono', monospace";
        ctx!.fillText("CLONE", ax, ay + 25);
      }

      if (isDreaming && frame % 30 < 20) {
        ctx!.fillStyle = "#8b5cf6";
        ctx!.font = "bold 6px 'JetBrains Mono', monospace";
        const zzY = headY - 10 - (frame % 30) * 0.3;
        ctx!.globalAlpha = 0.6 - (frame % 30) / 50;
        ctx!.fillText("Zzz", ax + 8, zzY);
        ctx!.globalAlpha = 1;
      }

      if (isOnBreak && frame % 60 < 40) {
        ctx!.fillStyle = "#fbbf24";
        ctx!.font = "bold 6px 'JetBrains Mono', monospace";
        ctx!.globalAlpha = 0.6;
        ctx!.fillText("BREAK", ax, ay + 26);
        ctx!.globalAlpha = 1;
      }

      if ((isWorking || isClone) && agent.action && frame % 200 < 120) {
        const shortAction = agent.action.length > 22 ? agent.action.substring(0, 21) + ".." : agent.action;
        ctx!.font = "5px 'JetBrains Mono', monospace";
        ctx!.fillStyle = "rgba(0,0,0,0.65)";
        const tw = ctx!.measureText(shortAction).width + 8;
        const bx = ax - tw / 2;
        const by = headY - 22;
        ctx!.beginPath();
        safeRoundRect(ctx!, bx, by - 8, tw, 12, 3);
        ctx!.fill();
        ctx!.beginPath();
        ctx!.moveTo(ax - 3, by + 4);
        ctx!.lineTo(ax, by + 8);
        ctx!.lineTo(ax + 3, by + 4);
        ctx!.fill();
        ctx!.fillStyle = "rgba(255,255,255,0.8)";
        ctx!.font = "5px 'JetBrains Mono', monospace";
        ctx!.fillText(shortAction, ax, by);
      }

      if (isWorking || isClone) {
        if (agent.earning > 0 && frame % 120 < 60) {
          ctx!.fillStyle = "#4ade80";
          ctx!.font = "bold 7px 'JetBrains Mono', monospace";
          const floatY = headY - 24 - (frame % 60) * 0.2;
          const alpha = 1 - (frame % 60) / 60;
          ctx!.globalAlpha = alpha;
          ctx!.fillText(`+${agent.earning.toFixed(1)}TC`, ax, floatY);
          ctx!.globalAlpha = 1;
        }

        const sparkRate = isClone ? 6 : 3;
        if (frame % sparkRate === 0) {
          sparkParticlesRef.current.push({
            x: ax + (Math.random() - 0.5) * 10,
            y: ay - 5,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2 - 1,
            life: 0,
            maxLife: 20 + Math.random() * 15,
            size: isClone ? 0.8 : 1 + Math.random(),
            color: isClone ? "#22d3ee" : agent.color,
          });
        }
      }
    }

    function drawSparkParticles() {
      sparkParticlesRef.current = sparkParticlesRef.current.filter(p => p.life < p.maxLife);
      for (const p of sparkParticlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        const { r, g, b } = hexToRgb(p.color);
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(0, p.size * alpha), 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawWeatherParticles() {
      const W = sizeRef.current.w;
      const H = sizeRef.current.h;
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife || p.y > H || p.x < 0 || p.x > W) {
          p.x = Math.random() * W;
          p.y = -5;
          p.life = 0;
        }
        const alpha = Math.max(0, 1 - p.life / p.maxLife) * 0.5;
        ctx!.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawCosmicBackground(frame: number) {
      const W = sizeRef.current.w;
      const H = sizeRef.current.h;

      const bgGrad = ctx!.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#020810");
      bgGrad.addColorStop(0.3, "#050d1a");
      bgGrad.addColorStop(0.6, "#0a0e20");
      bgGrad.addColorStop(1, "#060818");
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, W, H);

      for (const n of nebulaRef.current) {
        const nx = n.x * W + Math.sin(frame * n.speed + n.phase) * 30;
        const ny = n.y * H + Math.cos(frame * n.speed * 0.7 + n.phase) * 20;
        const safeR = Math.max(1, n.r);
        const grad = ctx!.createRadialGradient(nx, ny, 0, nx, ny, safeR);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, "transparent");
        ctx!.fillStyle = grad;
        ctx!.fillRect(nx - n.r, ny - n.r, n.r * 2, n.r * 2);
      }

      for (const s of starsRef.current) {
        const sx = s.x * W;
        const sy = s.y * H;
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.015 + s.phase));
        ctx!.fillStyle = `rgba(255,255,255,${twinkle * 0.6})`;
        ctx!.beginPath();
        ctx!.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawRoads() {
      const positions = world.locations.map(loc => ({ id: loc.id, type: loc.type, ...getLocPos(loc) }));
      ctx!.save();
      const drawnPairs = new Set<string>();
      const roadSegments: Array<{ax: number; ay: number; bx: number; by: number}> = [];
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i];
          const b = positions[j];
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < TILE_W * 1.6) {
            const key = `${i}-${j}`;
            if (drawnPairs.has(key)) continue;
            drawnPairs.add(key);
            roadSegments.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });

            ctx!.strokeStyle = "rgba(40,50,70,0.6)";
            ctx!.lineWidth = 8;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - 5;
            ctx!.quadraticCurveTo(mx, my, b.x, b.y);
            ctx!.stroke();

            ctx!.strokeStyle = "rgba(60,70,90,0.5)";
            ctx!.lineWidth = 7;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.quadraticCurveTo(mx, my, b.x, b.y);
            ctx!.stroke();

            ctx!.strokeStyle = "rgba(34,211,238,0.08)";
            ctx!.lineWidth = 9;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.quadraticCurveTo(mx, my, b.x, b.y);
            ctx!.stroke();

            ctx!.strokeStyle = "rgba(255,255,200,0.15)";
            ctx!.lineWidth = 0.5;
            ctx!.setLineDash([4, 6]);
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.quadraticCurveTo(mx, my, b.x, b.y);
            ctx!.stroke();
            ctx!.setLineDash([]);

            const crosswalkDist = dist;
            if (crosswalkDist < TILE_W * 1.2) {
              const t1 = 0.15;
              const t2 = 0.85;
              for (const t of [t1, t2]) {
                const cx2 = (1-t)*(1-t)*a.x + 2*(1-t)*t*mx + t*t*b.x;
                const cy2 = (1-t)*(1-t)*a.y + 2*(1-t)*t*my + t*t*b.y;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const len = Math.sqrt(dx*dx + dy*dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                ctx!.strokeStyle = "rgba(255,255,255,0.12)";
                ctx!.lineWidth = 0.5;
                for (let s = -2; s <= 2; s++) {
                  ctx!.beginPath();
                  ctx!.moveTo(cx2 + nx * 4 + s * dx/len * 1.5, cy2 + ny * 4 + s * dy/len * 1.5);
                  ctx!.lineTo(cx2 - nx * 4 + s * dx/len * 1.5, cy2 - ny * 4 + s * dy/len * 1.5);
                  ctx!.stroke();
                }
              }
            }
          }
        }
      }

      for (const seg of roadSegments) {
        const mx = (seg.ax + seg.bx) / 2;
        const my = (seg.ay + seg.by) / 2;
        const dx = seg.bx - seg.ax;
        const dy = seg.by - seg.ay;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        for (let t = 0.2; t <= 0.8; t += 0.6) {
          const px = seg.ax + dx * t + nx * 12;
          const py = seg.ay + dy * t + ny * 12;
          drawLampPost(px, py);
        }

        for (let t = 0.3; t <= 0.7; t += 0.4) {
          const px = seg.ax + dx * t - nx * 14;
          const py = seg.ay + dy * t - ny * 14;
          drawTree(px, py);
        }
      }

      ctx!.restore();
    }

    function drawLampPost(x: number, y: number) {
      ctx!.save();
      ctx!.strokeStyle = "rgba(120,130,150,0.5)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(x, y);
      ctx!.lineTo(x, y - 12);
      ctx!.stroke();

      ctx!.fillStyle = "rgba(120,130,150,0.4)";
      ctx!.beginPath();
      ctx!.moveTo(x - 3, y - 12);
      ctx!.lineTo(x + 3, y - 12);
      ctx!.lineTo(x + 1, y - 13);
      ctx!.lineTo(x - 1, y - 13);
      ctx!.closePath();
      ctx!.fill();

      const timeConfig = timeColors[world.timeOfDay] || { ambient: 0.5 };
      if (timeConfig.ambient < 0.5) {
        ctx!.fillStyle = "rgba(255,220,150,0.25)";
        ctx!.shadowColor = "rgba(255,220,150,0.4)";
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        ctx!.arc(x, y - 13, 2, 0, Math.PI * 2);
        ctx!.fill();

        const lampGrad = ctx!.createRadialGradient(x, y - 5, 0, x, y - 5, 15);
        lampGrad.addColorStop(0, "rgba(255,220,150,0.06)");
        lampGrad.addColorStop(1, "rgba(255,220,150,0)");
        ctx!.fillStyle = lampGrad;
        ctx!.beginPath();
        ctx!.arc(x, y - 5, 15, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function drawTree(x: number, y: number) {
      ctx!.save();
      ctx!.fillStyle = "rgba(60,40,20,0.5)";
      ctx!.fillRect(x - 0.5, y - 4, 1, 4);

      ctx!.fillStyle = "rgba(34,120,60,0.35)";
      ctx!.beginPath();
      ctx!.arc(x, y - 7, 3.5, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = "rgba(50,160,80,0.2)";
      ctx!.beginPath();
      ctx!.arc(x - 1, y - 8, 2.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawVehicles(frame: number) {
      const vehicles = (world as any).vehicles as Array<{id: string; type: string; fromLocationId: string; toLocationId: string; progress: number; speed: number; color: string}> | undefined;
      if (!vehicles || vehicles.length === 0) return;

      for (const v of vehicles) {
        const fromLoc = world.locations.find(l => l.id === v.fromLocationId);
        const toLoc = world.locations.find(l => l.id === v.toLocationId);
        if (!fromLoc || !toLoc) continue;

        const fromPos = getLocPos(fromLoc);
        const toPos = getLocPos(toLoc);
        const t = v.progress;
        const mx = (fromPos.x + toPos.x) / 2;
        const my = (fromPos.y + toPos.y) / 2 - 5;
        const vx = (1-t)*(1-t)*fromPos.x + 2*(1-t)*t*mx + t*t*toPos.x;
        const vy = (1-t)*(1-t)*fromPos.y + 2*(1-t)*t*my + t*t*toPos.y;

        ctx!.save();
        const vColor = v.color || "#60a5fa";
        const { r, g, b } = hexToRgb(vColor);

        if (v.type === "ambulance" || v.type === "police_car" || v.type === "fire_truck") {
          const flashAlpha = Math.sin(frame * 0.3) > 0 ? 0.6 : 0.2;
          const flashColor = v.type === "ambulance" ? `rgba(239,68,68,${flashAlpha})` : v.type === "police_car" ? `rgba(59,130,246,${flashAlpha})` : `rgba(239,68,68,${flashAlpha})`;
          ctx!.fillStyle = flashColor;
          ctx!.beginPath();
          ctx!.arc(vx, vy - 5, 2, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.fillStyle = vColor;
        if (v.type === "bike") {
          ctx!.beginPath();
          ctx!.arc(vx, vy, 1.5, 0, Math.PI * 2);
          ctx!.fill();
        } else if (v.type === "bus" || v.type === "truck" || v.type === "fire_truck") {
          ctx!.fillRect(vx - 4, vy - 2, 8, 4);
          ctx!.fillStyle = darken(vColor, 30);
          ctx!.fillRect(vx - 3, vy - 3, 6, 1);
        } else {
          ctx!.fillRect(vx - 3, vy - 1.5, 6, 3);
          ctx!.fillStyle = lighten(vColor, 40);
          ctx!.fillRect(vx - 1, vy - 2.5, 3, 1);
        }

        const tailGrad = ctx!.createRadialGradient(vx, vy, 0, vx, vy, 6);
        tailGrad.addColorStop(0, `rgba(${r},${g},${b},0.15)`);
        tailGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx!.fillStyle = tailGrad;
        ctx!.beginPath();
        ctx!.arc(vx, vy, 6, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.restore();
      }
    }

    function drawMiniMap() {
      const W = sizeRef.current.w;
      const H = sizeRef.current.h;
      const mmW = 100;
      const mmH = 70;
      const mmX = W - mmW - 8;
      const mmY = H - mmH - 30;

      ctx!.save();
      ctx!.fillStyle = "rgba(5,10,25,0.75)";
      ctx!.strokeStyle = "rgba(34,211,238,0.2)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      safeRoundRect(ctx!, mmX, mmY, mmW, mmH, 4);
      ctx!.fill();
      ctx!.stroke();

      ctx!.font = "5px 'JetBrains Mono', monospace";
      ctx!.fillStyle = "rgba(148,163,184,0.5)";
      ctx!.textAlign = "left";
      ctx!.fillText("MINIMAP", mmX + 3, mmY + 8);

      const minX = Math.min(...world.locations.map((_, i) => toIso(i % COLS, Math.floor(i / COLS), W, H).x));
      const maxX = Math.max(...world.locations.map((_, i) => toIso(i % COLS, Math.floor(i / COLS), W, H).x));
      const minY = Math.min(...world.locations.map((_, i) => toIso(i % COLS, Math.floor(i / COLS), W, H).y));
      const maxY = Math.max(...world.locations.map((_, i) => toIso(i % COLS, Math.floor(i / COLS), W, H).y));
      const rangeX = (maxX - minX) || 1;
      const rangeY = (maxY - minY) || 1;
      const padding = 8;
      const innerW = mmW - padding * 2;
      const innerH = mmH - padding * 2 - 5;

      world.locations.forEach((loc, i) => {
        const pos = toIso(i % COLS, Math.floor(i / COLS), W, H);
        const nx = mmX + padding + ((pos.x - minX) / rangeX) * innerW;
        const ny = mmY + padding + 5 + ((pos.y - minY) / rangeY) * innerH;
        const colors = buildingColors[loc.type] || buildingColors.home;
        ctx!.fillStyle = colors.glow + "aa";
        ctx!.beginPath();
        ctx!.arc(nx, ny, 1.5, 0, Math.PI * 2);
        ctx!.fill();
      });

      for (const agent of agentsRef.current) {
        const nx = mmX + padding + ((agent.x - minX) / rangeX) * innerW;
        const ny = mmY + padding + 5 + ((agent.y - minY) / rangeY) * innerH;
        if (nx >= mmX && nx <= mmX + mmW && ny >= mmY && ny <= mmY + mmH) {
          ctx!.fillStyle = agent.color + "80";
          ctx!.beginPath();
          ctx!.arc(nx, ny, 0.8, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      ctx!.restore();
    }

    function drawAmbientIcons(frame: number) {
      const ambientMap: Record<string, {icon: string; color: string}> = {
        forge: { icon: "~", color: "#fb923c" },
        cafe: { icon: "~", color: "#c084fc" },
        mine: { icon: "*", color: "#f59e0b" },
        theater: { icon: "~", color: "#ec4899" },
        restaurant: { icon: "~", color: "#f87171" },
        gym: { icon: "!", color: "#ef4444" },
        church: { icon: "+", color: "#fbbf24" },
        academy: { icon: "^", color: "#8b5cf6" },
        school: { icon: "^", color: "#60a5fa" },
      };

      for (const loc of world.locations) {
        const amb = ambientMap[loc.type];
        if (!amb) continue;
        const pos = getLocPos(loc);
        const bh = 30 + loc.level * 12;
        const floatOffset = Math.sin(frame * 0.03 + pos.x * 0.01) * 3;
        const alpha = 0.3 + Math.sin(frame * 0.05 + pos.y * 0.01) * 0.15;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = amb.color;
        ctx!.font = "bold 7px 'JetBrains Mono', monospace";
        ctx!.textAlign = "center";
        ctx!.fillText(amb.icon, pos.x + 20, pos.y - bh / 2 - bh - 2 + floatOffset);
        ctx!.fillText(amb.icon, pos.x + 25, pos.y - bh / 2 - bh + 1 + floatOffset);
        ctx!.restore();
      }
    }

    function drawSeasonIndicator() {
      const season = (world as any).season as string | undefined;
      if (!season) return;
      const W = sizeRef.current.w;
      const seasonColors: Record<string, string> = {
        spring: "#4ade80", summer: "#fbbf24", autumn: "#fb923c", winter: "#60a5fa",
      };
      const color = seasonColors[season] || "#94a3b8";
      ctx!.save();
      ctx!.fillStyle = "rgba(0,0,0,0.5)";
      ctx!.beginPath();
      safeRoundRect(ctx!, W - 70, 36, 60, 14, 3);
      ctx!.fill();
      ctx!.fillStyle = color;
      ctx!.font = "bold 7px 'JetBrains Mono', monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(season.toUpperCase(), W - 40, 46);
      ctx!.restore();
    }

    function drawBuildingEffects(cx: number, cy: number, loc: WorldLocation, frame: number) {
      const colors = buildingColors[loc.type] || buildingColors.home;
      const bh = 30 + loc.level * 12;

      if (loc.type === "forge") {
        for (let i = 0; i < 3; i++) {
          const sx = cx - 5 + i * 5 + Math.sin(frame * 0.03 + i) * 2;
          const sy = cy - bh / 2 - bh - 10 - (frame * 0.5 + i * 10) % 30;
          const alpha = Math.max(0, 0.4 - ((frame * 0.5 + i * 10) % 30) / 30);
          ctx!.fillStyle = `rgba(251,146,60,${alpha})`;
          ctx!.beginPath();
          ctx!.arc(sx, sy, 1.5 + Math.random(), 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (loc.type === "observatory") {
        const beamAlpha = 0.03 + Math.sin(frame * 0.02) * 0.02;
        const grad = ctx!.createLinearGradient(cx, cy - bh / 2 - bh, cx + 30, cy - bh / 2 - bh - 80);
        grad.addColorStop(0, `rgba(99,102,241,${beamAlpha * 2})`);
        grad.addColorStop(1, `rgba(99,102,241,0)`);
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.moveTo(cx - 2, cy - bh / 2 - bh);
        ctx!.lineTo(cx + 40, cy - bh / 2 - bh - 60);
        ctx!.lineTo(cx + 50, cy - bh / 2 - bh - 55);
        ctx!.lineTo(cx + 2, cy - bh / 2 - bh);
        ctx!.fill();
      }

      if (loc.type === "academy") {
        if (frame % 8 === 0 && Math.random() > 0.5) {
          sparkParticlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 20,
            y: cy - bh - 5,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.5 - 0.5,
            life: 0,
            maxLife: 25,
            size: 1 + Math.random(),
            color: colors.glow,
          });
        }
      }

      if (loc.type === "mine") {
        if (frame % 15 === 0) {
          sparkParticlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 10,
            y: cy - 5,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 1,
            life: 0,
            maxLife: 15,
            size: 0.8 + Math.random() * 0.8,
            color: "#f59e0b",
          });
        }
      }

      if (loc.type === "market" && frame % 40 < 20) {
        ctx!.fillStyle = `rgba(20,184,166,${0.05 + Math.sin(frame * 0.05) * 0.03})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy - bh / 2, 25, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (loc.type === "restaurant") {
        for (let i = 0; i < 2; i++) {
          const sx = cx - 3 + i * 6 + Math.sin(frame * 0.02 + i) * 1.5;
          const sy = cy - bh / 2 - bh - 5 - (frame * 0.3 + i * 15) % 20;
          const alpha = Math.max(0, 0.3 - ((frame * 0.3 + i * 15) % 20) / 20);
          ctx!.fillStyle = `rgba(200,180,160,${alpha})`;
          ctx!.beginPath();
          ctx!.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (loc.type === "theater" && frame % 60 < 40) {
        const spotAlpha = 0.04 + Math.sin(frame * 0.04) * 0.02;
        ctx!.fillStyle = `rgba(236,72,153,${spotAlpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy - bh, 18, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (loc.type === "police_station") {
        if (frame % 40 < 20) {
          const flashAlpha = Math.sin(frame * 0.2) > 0 ? 0.15 : 0.05;
          ctx!.fillStyle = `rgba(59,130,246,${flashAlpha})`;
          ctx!.beginPath();
          ctx!.arc(cx - 5, cy - bh / 2 - bh - 3, 3, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = `rgba(239,68,68,${0.2 - flashAlpha})`;
          ctx!.beginPath();
          ctx!.arc(cx + 5, cy - bh / 2 - bh - 3, 3, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (loc.type === "fire_station" && frame % 10 === 0) {
        if (Math.random() > 0.7) {
          sparkParticlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 15,
            y: cy - bh - 2,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 1.5 - 0.3,
            life: 0,
            maxLife: 18,
            size: 0.8 + Math.random() * 0.5,
            color: "#ef4444",
          });
        }
      }

      if (loc.type === "church") {
        const glowAlpha = 0.04 + Math.sin(frame * 0.015) * 0.02;
        ctx!.fillStyle = `rgba(251,191,36,${glowAlpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy - bh / 2 - bh - 5, 12, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (loc.type === "museum" && frame % 100 < 60) {
        const beamAlpha = 0.02 + Math.sin(frame * 0.01) * 0.01;
        ctx!.fillStyle = `rgba(163,230,53,${beamAlpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy - bh / 2, 20, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (loc.type === "school") {
        if (frame % 12 === 0 && Math.random() > 0.6) {
          sparkParticlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 18,
            y: cy - bh - 3,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 1,
            life: 0,
            maxLife: 20,
            size: 0.6 + Math.random() * 0.5,
            color: "#60a5fa",
          });
        }
      }

      if (loc.type === "library") {
        const glowAlpha = 0.03 + Math.sin(frame * 0.02 + 1) * 0.015;
        ctx!.fillStyle = `rgba(167,139,250,${glowAlpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy - bh / 2 - 5, 15, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawShootingStars(frame: number) {
      const W = sizeRef.current.w;
      if (frame % 200 === 0 && shootingStarsRef.current.length < 2 && Math.random() > 0.5) {
        shootingStarsRef.current.push({
          x: Math.random() * W * 0.8,
          y: Math.random() * 80,
          vx: 3 + Math.random() * 4,
          vy: 1 + Math.random() * 2,
          life: 0,
          trail: [],
        });
      }

      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const star = shootingStarsRef.current[i];
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 15) star.trail.shift();
        star.x += star.vx;
        star.y += star.vy;
        star.life++;
        if (star.life > 60 || star.x > W) {
          shootingStarsRef.current.splice(i, 1);
          continue;
        }
        ctx!.save();
        for (let t = 0; t < star.trail.length; t++) {
          const alpha = (t / star.trail.length) * 0.6;
          const size = (t / star.trail.length) * 1.5;
          ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx!.beginPath();
          ctx!.arc(star.trail[t].x, star.trail[t].y, size, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.fillStyle = "rgba(255,255,255,0.9)";
        ctx!.shadowColor = "#ffffff";
        ctx!.shadowBlur = 6;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawEventTicker(frame: number) {
      const W = sizeRef.current.w;
      const H = sizeRef.current.h;
      const events = world.recentEvents.slice(0, 5);
      if (events.length === 0) return;

      ctx!.fillStyle = "rgba(0,0,0,0.6)";
      ctx!.fillRect(0, H - 22, W, 22);
      ctx!.strokeStyle = "rgba(34,211,238,0.15)";
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(0, H - 22);
      ctx!.lineTo(W, H - 22);
      ctx!.stroke();

      ctx!.font = "8px 'JetBrains Mono', monospace";
      const text = events.map(e => `${e.title} - ${e.impact}`).join("   |   ");
      const textW = ctx!.measureText(text).width || text.length * 5;
      const scrollX = -(frame * 0.8) % (textW + W) + W;

      ctx!.font = "8px 'JetBrains Mono', monospace";
      ctx!.fillStyle = "rgba(148,163,184,0.7)";
      ctx!.textAlign = "left";
      ctx!.fillText(text, scrollX, H - 8);
    }

    function drawIsoGrid(frame: number) {
      const W = sizeRef.current.w;
      const gridRows = ROWS + 2;
      const gridCols = COLS + 2;
      ctx!.save();
      ctx!.strokeStyle = "rgba(34,211,238,0.025)";
      ctx!.lineWidth = 0.5;
      for (let r = -1; r <= gridRows; r++) {
        const start = toIso(-1, r, W, sizeRef.current.h);
        const end = toIso(gridCols, r, W, sizeRef.current.h);
        ctx!.beginPath();
        ctx!.moveTo(start.x, start.y);
        ctx!.lineTo(end.x, end.y);
        ctx!.stroke();
      }
      for (let c = -1; c <= gridCols; c++) {
        const start = toIso(c, -1, W, sizeRef.current.h);
        const end = toIso(c, gridRows, W, sizeRef.current.h);
        ctx!.beginPath();
        ctx!.moveTo(start.x, start.y);
        ctx!.lineTo(end.x, end.y);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawHUD() {
      const W = sizeRef.current.w;

      const hudGrad = ctx!.createLinearGradient(0, 0, 0, 32);
      hudGrad.addColorStop(0, "rgba(0,0,0,0.7)");
      hudGrad.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx!.fillStyle = hudGrad;
      ctx!.fillRect(0, 0, W, 32);
      ctx!.strokeStyle = "rgba(34,211,238,0.15)";
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(0, 32);
      ctx!.lineTo(W, 32);
      ctx!.stroke();

      ctx!.font = "bold 10px 'JetBrains Mono', monospace";
      ctx!.textAlign = "left";

      ctx!.fillStyle = "#67e8f9";
      ctx!.fillText(world.worldName, 10, 14);
      ctx!.fillStyle = "rgba(103,232,249,0.4)";
      ctx!.font = "7px 'JetBrains Mono', monospace";
      ctx!.fillText(`EPOCH ${world.epoch}`, 10, 26);

      ctx!.fillStyle = "#a78bfa";
      ctx!.font = "9px 'JetBrains Mono', monospace";
      const timeX = Math.min(150, W * 0.17);
      ctx!.fillText(world.timeOfDay, timeX, 14);

      ctx!.fillStyle = "#22d3ee";
      const weatherX = Math.min(290, W * 0.34);
      ctx!.fillText(world.weather, weatherX, 14);

      ctx!.fillStyle = "#94a3b8";
      ctx!.font = "8px 'JetBrains Mono', monospace";
      const popX = Math.min(430, W * 0.52);
      const workingCount = world.currentActivities.filter(a => a.workStatus === "working").length;
      ctx!.fillText(`Pop:${world.population} | Working:${workingCount}`, popX, 14);

      const moodColor = world.mood === "ambitious" ? "#f59e0b" : world.mood === "creative" ? "#f472b6" : world.mood === "focused" ? "#22d3ee" : world.mood === "prosperous" ? "#4ade80" : "#94a3b8";
      ctx!.fillStyle = moodColor;
      ctx!.font = "bold 7px 'JetBrains Mono', monospace";
      ctx!.fillText(`MOOD: ${(world.mood || "neutral").toUpperCase()}`, popX, 26);

      ctx!.textAlign = "right";
      ctx!.fillStyle = "#fbbf24";
      ctx!.font = "bold 10px 'JetBrains Mono', monospace";
      ctx!.fillText(`TC $${world.economy.coinPrice.toFixed(6)}`, W - 10, 14);
      ctx!.fillStyle = "#4ade80";
      ctx!.font = "7px 'JetBrains Mono', monospace";
      ctx!.fillText(`GDP: ${world.gdp.toFixed(0)} TC | Treasury: ${world.treasury.toFixed(0)} TC`, W - 10, 26);
    }

    function render() {
      frameRef.current++;
      const frame = frameRef.current;
      const W = sizeRef.current.w;
      const H = sizeRef.current.h;

      if (W < 1 || H < 1) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      try {
        drawCosmicBackground(frame);
        drawShootingStars(frame);
        drawIsoGrid(frame);
        drawWeatherParticles();
        drawRoads();

        const sortedLocs = [...world.locations].sort((a, b) => {
          const ai = world.locations.indexOf(a);
          const bi = world.locations.indexOf(b);
          const aRow = Math.floor(ai / COLS);
          const aCol = ai % COLS;
          const bRow = Math.floor(bi / COLS);
          const bCol = bi % COLS;
          return (aRow + aCol) - (bRow + bCol);
        });

        sortedLocs.forEach(loc => {
          const pos = getLocPos(loc);
          const agentCount = agentsRef.current.filter(a => {
            const dist = Math.sqrt((a.targetX - pos.x) ** 2 + (a.targetY - pos.y) ** 2);
            return dist < 60;
          }).length;
          drawIsoBuilding(pos.x, pos.y, loc, agentCount, hoveredLocRef.current === loc.id, frame);
          drawBuildingEffects(pos.x, pos.y, loc, frame);
        });

        drawVehicles(frame);
        drawAmbientIcons(frame);

        for (const agent of agentsRef.current) {
          agent.x += (agent.targetX - agent.x) * 0.03;
          agent.y += (agent.targetY - agent.y) * 0.03;
          drawAgent(agent, frame);
        }

        drawSparkParticles();
        drawHUD();
        drawSeasonIndicator();
        drawMiniMap();
        drawEventTicker(frame);
      } catch {}

      animRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [world, getLocPos, toIso]);

  const scaleCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = sizeRef.current.w / rect.width;
    const scaleY = sizeRef.current.h / rect.height;
    return {
      mx: (e.clientX - rect.left) * scaleX,
      my: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mx, my } = scaleCoords(e);
    for (const loc of world.locations) {
      const pos = getLocPos(loc);
      const dx = mx - pos.x;
      const dy = my - pos.y;
      if (Math.abs(dx) < TILE_W * 0.35 && Math.abs(dy) < TILE_H * 0.6) {
        onSelectLocation(loc.id);
        return;
      }
    }
    onSelectLocation(null);
  }, [world.locations, getLocPos, onSelectLocation, scaleCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { mx, my } = scaleCoords(e);
    let found: string | null = null;
    for (const loc of world.locations) {
      const pos = getLocPos(loc);
      if (Math.abs(mx - pos.x) < TILE_W * 0.35 && Math.abs(my - pos.y) < TILE_H * 0.6) {
        found = loc.id;
        break;
      }
    }
    hoveredLocRef.current = found;
    canvas.style.cursor = found ? "pointer" : "default";
  }, [world.locations, getLocPos, scaleCoords]);

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: 400 }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full"
        style={{ imageRendering: "auto" }}
        data-testid="canvas-world"
      />
    </div>
  );
}

const buildingMarkerColors: Record<string, string> = {
  gathering: "#3b82f6", academy: "#8b5cf6", forge: "#f97316", market: "#14b8a6",
  observatory: "#6366f1", garden: "#22c55e", archive: "#d97706", arena: "#a855f7",
  mine: "#f59e0b", bank: "#10b981", cafe: "#c084fc", gym: "#ef4444",
  hospital: "#06b6d4", garage: "#78716c", home: "#94a3b8", workplace: "#3b82f6",
  store: "#e879f9", community: "#2dd4bf", park: "#4ade80", fitness: "#ef4444",
  lounge: "#fbbf24", residential: "#94a3b8", hub: "#3b82f6",
};

const simsRoofColors: Record<string, string> = {
  gathering: "#2563eb", academy: "#7c3aed", forge: "#ea580c", market: "#0d9488",
  observatory: "#4f46e5", garden: "#16a34a", archive: "#b45309", arena: "#9333ea",
  mine: "#d97706", bank: "#059669", cafe: "#a855f7", gym: "#dc2626",
  hospital: "#0891b2", garage: "#57534e", home: "#64748b", workplace: "#2563eb",
  store: "#c026d3", community: "#14b8a6", park: "#22c55e", fitness: "#b91c1c",
  lounge: "#d97706", residential: "#64748b", hub: "#1d4ed8",
};

const simsWallColors: Record<string, string> = {
  gathering: "#dbeafe", academy: "#ede9fe", forge: "#fff7ed", market: "#f0fdfa",
  observatory: "#eef2ff", garden: "#f0fdf4", archive: "#fffbeb", arena: "#faf5ff",
  mine: "#92400e", bank: "#ecfdf5", cafe: "#faf5ff", gym: "#fef2f2",
  hospital: "#ffffff", garage: "#d6d3d1", home: "#f1f5f9", workplace: "#dbeafe",
  store: "#fdf4ff", community: "#f0fdfa", park: "#dcfce7", fitness: "#fef2f2",
  lounge: "#fef9c3", residential: "#f1f5f9", hub: "#dbeafe",
};

function MapWorld({ world, onSelectLocation }: { world: WorldState; onSelectLocation: (id: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredLoc, setHoveredLoc] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; loc: WorldLocation; agents: AgentActivity[] } | null>(null);
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number }>({ dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const pinchRef = useRef<number>(0);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const treeRef = useRef<Array<{x: number; z: number; size: number; type: number}> | null>(null);

  const agentsByLocation = useMemo(() => {
    const map: Record<string, AgentActivity[]> = {};
    world.currentActivities.forEach(a => {
      if (!map[a.locationId]) map[a.locationId] = [];
      map[a.locationId].push(a);
    });
    return map;
  }, [world.currentActivities]);

  const buildingPositions = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(world.locations.length));
    const spacing = 160;
    return world.locations.map((loc, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const jitterX = Math.sin(i * 7.3) * 25;
      const jitterZ = Math.cos(i * 11.7) * 25;
      return {
        id: loc.id,
        x: (col - cols / 2) * spacing + jitterX,
        z: (row - Math.ceil(world.locations.length / cols) / 2) * spacing + jitterZ,
        height: 35 + loc.level * 12 + (loc.capacity * 2),
        width: 40 + loc.capacity * 1.5,
        color: buildingMarkerColors[loc.type] || "#94a3b8",
        wallColor: simsWallColors[loc.type] || "#f1f5f9",
        roofColor: simsRoofColors[loc.type] || "#64748b",
        loc,
      };
    });
  }, [world.locations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!treeRef.current) {
      const trees: Array<{x: number; z: number; size: number; type: number}> = [];
      for (let i = 0; i < 80; i++) {
        trees.push({
          x: (Math.sin(i * 13.7) * 500) + Math.cos(i * 7.3) * 200,
          z: (Math.cos(i * 9.1) * 400) + Math.sin(i * 5.9) * 200,
          size: 6 + Math.sin(i * 3.7) * 4 + 8,
          type: i % 3,
        });
      }
      treeRef.current = trees;
    }
    const treePositions = treeRef.current;

    function darkenColor(hex: string, pct: number): string {
      const num = parseInt(hex.replace("#", ""), 16);
      const r = Math.max(0, (num >> 16) - pct);
      const g = Math.max(0, ((num >> 8) & 0xff) - pct);
      const b = Math.max(0, (num & 0xff) - pct);
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
    }

    function lightenColor(hex: string, pct: number): string {
      const num = parseInt(hex.replace("#", ""), 16);
      const r = Math.min(255, (num >> 16) + pct);
      const g = Math.min(255, ((num >> 8) & 0xff) + pct);
      const b = Math.min(255, (num & 0xff) + pct);
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
    }

    function drawIsoBuilding(ctx: CanvasRenderingContext2D, sx: number, groundY: number, bw: number, bh: number, wallCol: string, roofCol: string, isNight: boolean, depth: number) {
      const d = depth;
      ctx.fillStyle = isNight ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.ellipse(sx, groundY + 4, bw * 0.7, d * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const fCol = isNight ? darkenColor(wallCol, 60) : wallCol;
      ctx.fillStyle = fCol;
      ctx.beginPath();
      ctx.moveTo(sx - bw / 2, groundY);
      ctx.lineTo(sx - bw / 2, groundY - bh);
      ctx.lineTo(sx + bw / 2, groundY - bh);
      ctx.lineTo(sx + bw / 2, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const sCol = isNight ? darkenColor(wallCol, 80) : darkenColor(wallCol, 25);
      ctx.fillStyle = sCol;
      ctx.beginPath();
      ctx.moveTo(sx + bw / 2, groundY);
      ctx.lineTo(sx + bw / 2, groundY - bh);
      ctx.lineTo(sx + bw / 2 + d, groundY - bh - d * 0.5);
      ctx.lineTo(sx + bw / 2 + d, groundY - d * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = roofCol;
      ctx.beginPath();
      ctx.moveTo(sx - bw / 2, groundY - bh);
      ctx.lineTo(sx - bw / 2 + d, groundY - bh - d * 0.5);
      ctx.lineTo(sx + bw / 2 + d, groundY - bh - d * 0.5);
      ctx.lineTo(sx + bw / 2, groundY - bh);
      ctx.closePath();
      ctx.fill();
    }

    const draw = () => {
      timeRef.current += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2 + pan.x * zoom;
      const cy = h / 2 + pan.y * zoom;
      const t = timeRef.current;

      const isNight = world.timeOfDay?.includes("night") || world.timeOfDay?.includes("deep");
      const isDawn = world.timeOfDay?.includes("dawn") || world.timeOfDay?.includes("morning");

      ctx.clearRect(0, 0, w, h);

      const skyGrd = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      if (isNight) {
        skyGrd.addColorStop(0, "#050e1f");
        skyGrd.addColorStop(0.4, "#0c1e3a");
        skyGrd.addColorStop(1, "#152844");
      } else if (isDawn) {
        skyGrd.addColorStop(0, "#1a2a4a");
        skyGrd.addColorStop(0.3, "#c06030");
        skyGrd.addColorStop(0.6, "#e8a060");
        skyGrd.addColorStop(1, "#fceabb");
      } else {
        skyGrd.addColorStop(0, "#1565c0");
        skyGrd.addColorStop(0.4, "#42a5f5");
        skyGrd.addColorStop(0.8, "#90caf9");
        skyGrd.addColorStop(1, "#bbdefb");
      }
      ctx.fillStyle = skyGrd;
      ctx.fillRect(0, 0, w, h * 0.5);

      if (isNight) {
        for (let i = 0; i < 80; i++) {
          const sx2 = (Math.sin(i * 23.7 + 1) * 0.5 + 0.5) * w;
          const sy2 = (Math.cos(i * 17.3 + 2) * 0.5 + 0.5) * h * 0.45;
          const twinkle = Math.sin(t * 1.5 + i * 2.3) * 0.4 + 0.6;
          const sz = i % 5 === 0 ? 1.5 : 1;
          ctx.fillStyle = `rgba(255,255,240,${twinkle * 0.7})`;
          ctx.beginPath();
          ctx.arc(sx2, sy2, sz, 0, Math.PI * 2);
          ctx.fill();
        }
        const moonX = w * 0.82;
        const moonY = h * 0.1;
        const moonGrd = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 22);
        moonGrd.addColorStop(0, "#fffde7");
        moonGrd.addColorStop(0.5, "#fff9c4");
        moonGrd.addColorStop(1, "#fff9c400");
        ctx.fillStyle = moonGrd;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fffde7";
        ctx.beginPath();
        ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const sunX = isDawn ? w * 0.25 : w * 0.78;
        const sunY = isDawn ? h * 0.38 : h * 0.08;
        const sunGrd = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        sunGrd.addColorStop(0, isDawn ? "#fff3e0" : "#fff9c4");
        sunGrd.addColorStop(0.3, isDawn ? "#ffcc80" : "#fff59d");
        sunGrd.addColorStop(1, isDawn ? "#ffcc8000" : "#fff59d00");
        ctx.fillStyle = sunGrd;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isDawn ? "#fff3e0" : "#fffde7";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!isNight) {
        for (let i = 0; i < 5; i++) {
          const cloudX = ((t * 12 + i * w / 4) % (w + 250)) - 125;
          const cloudY = 25 + i * 28 + Math.sin(i * 2.7) * 12;
          const cloudScale = 0.8 + Math.sin(i * 1.3) * 0.3;
          ctx.fillStyle = isDawn ? "rgba(255,220,180,0.4)" : "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.ellipse(cloudX, cloudY, 45 * cloudScale, 14 * cloudScale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cloudX - 25 * cloudScale, cloudY + 5, 30 * cloudScale, 11 * cloudScale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cloudX + 30 * cloudScale, cloudY + 3, 35 * cloudScale, 12 * cloudScale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cloudX + 10 * cloudScale, cloudY - 8 * cloudScale, 20 * cloudScale, 10 * cloudScale, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const horizonY = h * 0.48;
      const farGrassGrd = ctx.createLinearGradient(0, horizonY - 15, 0, horizonY);
      if (isNight) {
        farGrassGrd.addColorStop(0, "#152844");
        farGrassGrd.addColorStop(1, "#1a3025");
      } else {
        farGrassGrd.addColorStop(0, "#bbdefb");
        farGrassGrd.addColorStop(1, "#7cb342");
      }
      ctx.fillStyle = farGrassGrd;
      ctx.fillRect(0, horizonY - 15, w, 20);

      const groundGrd = ctx.createLinearGradient(0, horizonY, 0, h);
      if (isNight) {
        groundGrd.addColorStop(0, "#1b3a25");
        groundGrd.addColorStop(0.5, "#15301f");
        groundGrd.addColorStop(1, "#0d2515");
      } else {
        groundGrd.addColorStop(0, "#66bb6a");
        groundGrd.addColorStop(0.3, "#4caf50");
        groundGrd.addColorStop(0.7, "#43a047");
        groundGrd.addColorStop(1, "#388e3c");
      }
      ctx.fillStyle = groundGrd;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      for (let i = 0; i < 40; i++) {
        const px = (Math.sin(i * 17.3) * 0.5 + 0.5) * w;
        const py = horizonY + (Math.cos(i * 11.7) * 0.5 + 0.5) * (h - horizonY);
        const pr = 15 + Math.sin(i * 5.1) * 12;
        ctx.fillStyle = isNight ? "rgba(25, 55, 30, 0.25)" : "rgba(100, 180, 80, 0.12)";
        ctx.beginPath();
        ctx.ellipse(px, py, pr * 2.5, pr * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 8; i++) {
        const px = (Math.sin(i * 5.3 + 2) * 0.5 + 0.5) * w;
        const py = horizonY + 5 + (Math.cos(i * 7.1 + 3) * 0.5 + 0.5) * (h - horizonY - 10);
        ctx.fillStyle = isNight ? "rgba(40, 80, 45, 0.15)" : "rgba(139, 195, 74, 0.08)";
        ctx.beginPath();
        ctx.ellipse(px, py, 60, 15, Math.sin(i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      const pondCx = cx + 280 * zoom;
      const pondCy = horizonY + (h - horizonY) * 0.45;
      const pondRx = 75 * zoom;
      const pondRy = 28 * zoom;
      if (pondCx > -100 && pondCx < w + 100) {
        ctx.fillStyle = isNight ? "rgba(15, 50, 30, 0.3)" : "rgba(50, 120, 60, 0.2)";
        ctx.beginPath();
        ctx.ellipse(pondCx, pondCy, pondRx + 8, pondRy + 5, 0, 0, Math.PI * 2);
        ctx.fill();

        const pondGrd = ctx.createRadialGradient(pondCx - 10, pondCy - 5, 0, pondCx, pondCy, pondRx);
        pondGrd.addColorStop(0, isNight ? "#0d3050" : "#29b6f6");
        pondGrd.addColorStop(0.5, isNight ? "#0a2540" : "#0288d1");
        pondGrd.addColorStop(1, isNight ? "#071c30" : "#01579b");
        ctx.fillStyle = pondGrd;
        ctx.beginPath();
        ctx.ellipse(pondCx, pondCy, pondRx, pondRy, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isNight ? "rgba(50, 150, 200, 0.15)" : "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 0.8;
        for (let r = 0; r < 4; r++) {
          const waveR = pondRx * 0.2 + r * pondRx * 0.2 + Math.sin(t * 1.2 + r * 1.5) * 4;
          ctx.beginPath();
          ctx.ellipse(pondCx, pondCy, waveR, waveR * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (!isNight) {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.ellipse(pondCx - pondRx * 0.3, pondCy - pondRy * 0.2, pondRx * 0.35, pondRy * 0.25, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const sorted = [...buildingPositions].sort((a, b) => a.z - b.z);

      sorted.forEach((bld, bi) => {
        if (bi === 0) return;
        const prev = sorted[bi - 1];
        const sx1 = cx + prev.x * zoom;
        const sy1 = horizonY + (h - horizonY) * 0.15 + prev.z * 0.3 * zoom;
        const sx2 = cx + bld.x * zoom;
        const sy2 = horizonY + (h - horizonY) * 0.15 + bld.z * 0.3 * zoom;
        const dist = Math.hypot(bld.x - prev.x, bld.z - prev.z);
        if (dist < 200 && sx1 > -50 && sx1 < w + 50 && sx2 > -50 && sx2 < w + 50) {
          const roadW = 4 * zoom;
          ctx.strokeStyle = isNight ? "rgba(60, 65, 70, 0.5)" : "rgba(180, 170, 150, 0.55)";
          ctx.lineWidth = roadW;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sx1, sy1 + 3);
          ctx.lineTo(sx2, sy2 + 3);
          ctx.stroke();
          ctx.strokeStyle = isNight ? "rgba(80, 85, 90, 0.3)" : "rgba(210, 200, 180, 0.4)";
          ctx.lineWidth = roadW * 0.3;
          ctx.setLineDash([4 * zoom, 6 * zoom]);
          ctx.beginPath();
          ctx.moveTo(sx1, sy1 + 3);
          ctx.lineTo(sx2, sy2 + 3);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (bi > 1 && bi % 3 === 0) {
          const cross = sorted[Math.max(0, bi - 3)];
          const csx = cx + cross.x * zoom;
          const csy = horizonY + (h - horizonY) * 0.15 + cross.z * 0.3 * zoom;
          const cdist = Math.hypot(bld.x - cross.x, bld.z - cross.z);
          if (cdist < 250 && csx > -50 && csx < w + 50) {
            ctx.strokeStyle = isNight ? "rgba(60, 65, 70, 0.35)" : "rgba(180, 170, 150, 0.35)";
            ctx.lineWidth = 3 * zoom;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(sx2, sy2 + 3);
            ctx.lineTo(csx, csy + 3);
            ctx.stroke();
          }
        }
      });

      const allDrawItems: Array<{z: number; draw: () => void}> = [];

      treePositions.forEach(tree => {
        const tx = cx + tree.x * zoom;
        const ty = horizonY + (h - horizonY) * 0.15 + tree.z * 0.3 * zoom;
        if (tx < -50 || tx > w + 50 || ty < horizonY - 10 || ty > h + 20) return;
        allDrawItems.push({
          z: tree.z,
          draw: () => {
            const s = tree.size * zoom;
            ctx.fillStyle = isNight ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.06)";
            ctx.beginPath();
            ctx.ellipse(tx + 2, ty + 1, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isNight ? "#2a1f15" : "#5d4037";
            ctx.fillRect(tx - s * 0.06, ty - s * 0.4, s * 0.12, s * 0.55);

            if (tree.type === 0) {
              const layers = 3;
              for (let l = 0; l < layers; l++) {
                const ly = ty - s * 0.3 - l * s * 0.35;
                const lw = s * (0.55 - l * 0.12);
                ctx.fillStyle = isNight ? darkenColor("#2e7d32", 30 + l * 10) : lightenColor("#2e7d32", l * 15);
                ctx.beginPath();
                ctx.moveTo(tx, ly - s * 0.35);
                ctx.lineTo(tx - lw, ly + s * 0.08);
                ctx.lineTo(tx + lw, ly + s * 0.08);
                ctx.closePath();
                ctx.fill();
              }
            } else if (tree.type === 1) {
              ctx.fillStyle = isNight ? "#1b3d1b" : "#43a047";
              ctx.beginPath();
              ctx.arc(tx, ty - s * 0.65, s * 0.45, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = isNight ? "#225522" : "#66bb6a";
              ctx.beginPath();
              ctx.arc(tx - s * 0.15, ty - s * 0.75, s * 0.3, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(tx + s * 0.2, ty - s * 0.6, s * 0.25, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = isNight ? "#1a3520" : "#558b2f";
              ctx.beginPath();
              ctx.ellipse(tx, ty - s * 0.7, s * 0.25, s * 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = isNight ? "#1f4025" : "#689f38";
              ctx.beginPath();
              ctx.ellipse(tx + s * 0.1, ty - s * 0.8, s * 0.18, s * 0.35, 0.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      });

      sorted.forEach(bld => {
        const sx = cx + bld.x * zoom;
        const groundY = horizonY + (h - horizonY) * 0.15 + bld.z * 0.3 * zoom;
        const bw = bld.width * zoom * 0.8;
        const bh = bld.height * zoom * 0.55;
        const isoD = 8 * zoom;
        const agents = agentsByLocation[bld.id] || [];
        const isHov = hoveredLoc === bld.id;
        const isPark = bld.loc.type === "park" || bld.loc.type === "garden";
        const isHub = bld.loc.type === "hub" || bld.loc.type === "gathering";

        allDrawItems.push({
          z: bld.z,
          draw: () => {
            if (isPark) {
              ctx.fillStyle = isNight ? "rgba(25, 60, 35, 0.5)" : "rgba(76, 175, 80, 0.35)";
              ctx.beginPath();
              ctx.ellipse(sx, groundY, bw * 0.9, bw * 0.35, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = isNight ? "#2e7d32aa" : "#81c784";
              ctx.lineWidth = 1.5;
              ctx.setLineDash([3, 3]);
              ctx.stroke();
              ctx.setLineDash([]);

              for (let pt = 0; pt < 5; pt++) {
                const ptx = sx + Math.cos(pt * 1.25 + 0.3) * bw * 0.55;
                const pty = groundY + Math.sin(pt * 1.25 + 0.3) * bw * 0.18;
                const pts = 4 * zoom;
                ctx.fillStyle = isNight ? "#2a1f15" : "#5d4037";
                ctx.fillRect(ptx - 1, pty - pts * 0.3, 2 * zoom, pts * 0.4);
                ctx.fillStyle = isNight ? "#1b3d1b" : (pt % 2 === 0 ? "#2e7d32" : "#43a047");
                ctx.beginPath();
                ctx.arc(ptx, pty - pts * 0.5, pts * 0.4, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.fillStyle = isNight ? "#3a3530" : "#8d6e63";
              ctx.fillRect(sx - 6 * zoom, groundY - 2, 12 * zoom, 3 * zoom);
              ctx.fillRect(sx - 7 * zoom, groundY - 4, 2 * zoom, 4 * zoom);
              ctx.fillRect(sx + 5 * zoom, groundY - 4, 2 * zoom, 4 * zoom);

              if (isNight) {
                ctx.fillStyle = "rgba(255, 235, 59, 0.08)";
                ctx.beginPath();
                ctx.arc(sx, groundY - 8, 12 * zoom, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              const wallCol = isNight ? "#1a1a28" : (bld.wallColor || "#f1f5f9");
              const roofCol = isNight ? darkenColor(bld.roofColor || "#64748b", 40) : (bld.roofColor || "#64748b");

              if (isHub) {
                drawIsoBuilding(ctx, sx, groundY, bw * 1.15, bh * 1.1, wallCol, roofCol, isNight, isoD * 1.3);
                ctx.fillStyle = roofCol;
                ctx.beginPath();
                ctx.moveTo(sx - bw * 0.15, groundY - bh * 1.1);
                ctx.lineTo(sx, groundY - bh * 1.1 - 18 * zoom);
                ctx.lineTo(sx + bw * 0.15, groundY - bh * 1.1);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = isNight ? "#ffd54f" : "#f44336";
                ctx.beginPath();
                ctx.arc(sx, groundY - bh * 1.1 - 18 * zoom, 2.5 * zoom, 0, Math.PI * 2);
                ctx.fill();
              } else if (bld.loc.type === "hospital") {
                drawIsoBuilding(ctx, sx, groundY, bw, bh, "#ffffff", "#e53935", isNight, isoD);
                ctx.fillStyle = "#e53935";
                const crossS = 3 * zoom;
                ctx.fillRect(sx - crossS, groundY - bh - 3 * zoom, crossS * 2, crossS * 0.6);
                ctx.fillRect(sx - crossS * 0.3, groundY - bh - 3 * zoom - crossS * 0.7, crossS * 0.6, crossS * 2);
              } else if (bld.loc.type === "academy" || bld.loc.type === "observatory") {
                drawIsoBuilding(ctx, sx, groundY, bw * 0.85, bh * 1.3, wallCol, roofCol, isNight, isoD);
                ctx.fillStyle = roofCol;
                ctx.beginPath();
                ctx.moveTo(sx - bw * 0.42, groundY - bh * 1.3);
                ctx.lineTo(sx, groundY - bh * 1.3 - 22 * zoom);
                ctx.lineTo(sx + bw * 0.42, groundY - bh * 1.3);
                ctx.closePath();
                ctx.fill();
              } else if (bld.loc.type === "market" || bld.loc.type === "store") {
                drawIsoBuilding(ctx, sx, groundY, bw * 1.1, bh * 0.75, wallCol, roofCol, isNight, isoD);
                ctx.fillStyle = isNight ? "#333340" : lightenColor(roofCol, 30);
                ctx.beginPath();
                ctx.moveTo(sx - bw * 0.6, groundY - bh * 0.75);
                ctx.lineTo(sx - bw * 0.7, groundY - bh * 0.45);
                ctx.lineTo(sx + bw * 0.7, groundY - bh * 0.45);
                ctx.lineTo(sx + bw * 0.6, groundY - bh * 0.75);
                ctx.closePath();
                ctx.fill();
              } else if (bld.loc.type === "lounge" || bld.loc.type === "cafe") {
                drawIsoBuilding(ctx, sx, groundY, bw * 0.95, bh * 0.8, wallCol, roofCol, isNight, isoD);
                if (isNight) {
                  ctx.fillStyle = "rgba(255, 183, 77, 0.12)";
                  ctx.beginPath();
                  ctx.arc(sx, groundY - bh * 0.4, bw * 0.5, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else {
                drawIsoBuilding(ctx, sx, groundY, bw, bh, wallCol, roofCol, isNight, isoD);
              }

              const floors = Math.max(1, Math.floor(bh / (15 * zoom)));
              const winCols = Math.max(2, Math.floor(bw / (14 * zoom)));
              for (let f = 0; f < floors; f++) {
                for (let wc = 0; wc < winCols; wc++) {
                  const wx = sx - bw * 0.38 + wc * (bw * 0.76 / winCols);
                  const wy = groundY - bh + (f + 0.35) * (bh / floors);
                  const ww = 4.5 * zoom;
                  const wh = 5.5 * zoom;
                  const lit = isNight && Math.sin(t * 0.3 + f * 2.1 + wc * 1.7 + bld.x * 0.05) > -0.3;
                  ctx.fillStyle = isNight
                    ? (lit ? "rgba(255, 213, 79, 0.55)" : "rgba(20, 20, 40, 0.6)")
                    : "rgba(135, 206, 235, 0.4)";
                  ctx.fillRect(wx, wy, ww, wh);
                  if (lit && isNight) {
                    ctx.fillStyle = "rgba(255, 213, 79, 0.06)";
                    ctx.beginPath();
                    ctx.arc(wx + ww / 2, wy + wh + 3, 4 * zoom, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }
              }

              if (isHov) {
                ctx.strokeStyle = bld.color;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = bld.color;
                ctx.shadowBlur = 8;
                ctx.strokeRect(sx - bw / 2 - 2, groundY - bh - 2, bw + 4, bh + 4);
                ctx.shadowBlur = 0;
              }
            }

            const nameLabel = bld.loc.name.length > 18 ? bld.loc.name.slice(0, 16) + ".." : bld.loc.name;
            ctx.textAlign = "center";

            if (!isNight) {
              ctx.fillStyle = "rgba(255,255,255,0.65)";
              const tw = ctx.measureText(nameLabel).width;
              const labelBgY = isPark ? groundY + bw * 0.38 + 3 : groundY + 8 * zoom;
              ctx.beginPath();
              safeRoundRect(ctx, sx - tw / 2 - 4, labelBgY - 9, tw + 8, 13, 3);
              ctx.fill();
            }

            ctx.fillStyle = isNight ? "#d0d0e0" : "#2c2c2c";
            ctx.font = `bold ${Math.max(8, 9 * zoom)}px 'Inter', sans-serif`;
            const labelY = isPark ? groundY + bw * 0.38 + 6 : groundY + 12 * zoom;
            ctx.fillText(nameLabel, sx, labelY);

            if (agents.length > 0) {
              agents.slice(0, 8).forEach((a, ai) => {
                const spread = Math.min(agents.length, 8);
                const ax = sx + (ai - spread / 2) * 11 * zoom;
                const ay = isPark ? groundY + bw * 0.38 + 18 : groundY + 20 * zoom;
                const bounce = Math.sin(t * 2 + ai * 2.1) * 1.5 * zoom;
                const agColor = agentHexColors[a.agentId] || "#67e8f9";

                ctx.fillStyle = "rgba(0,0,0,0.08)";
                ctx.beginPath();
                ctx.ellipse(ax, ay + 3 * zoom, 3 * zoom, 1.2 * zoom, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = isNight ? darkenColor(agColor, 20) : agColor;
                const headY = ay - 7 * zoom + bounce;
                ctx.beginPath();
                ctx.arc(ax, headY, 2.8 * zoom, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = isNight ? darkenColor(agColor, 30) : darkenColor(agColor, 15);
                ctx.beginPath();
                ctx.moveTo(ax - 3.5 * zoom, ay + 2 * zoom + bounce);
                ctx.lineTo(ax, headY + 2 * zoom);
                ctx.lineTo(ax + 3.5 * zoom, ay + 2 * zoom + bounce);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(ax - 1 * zoom, headY - 0.5 * zoom, 0.6 * zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(ax + 1 * zoom, headY - 0.5 * zoom, 0.6 * zoom, 0, Math.PI * 2);
                ctx.fill();

                if (zoom > 0.7) {
                  const aName = a.agentName.replace("tessera-", "").slice(0, 7);
                  ctx.fillStyle = isNight ? "rgba(200,200,230,0.7)" : "rgba(50,50,50,0.7)";
                  ctx.font = `${Math.max(6, 7 * zoom)}px 'Inter', sans-serif`;
                  ctx.fillText(aName, ax, ay + 10 * zoom + bounce);
                }
              });

              const badgeX = sx + (isPark ? bw * 0.5 : bw / 2) + 8 * zoom;
              const badgeY = isPark ? groundY - 8 : groundY - bh - 8;
              ctx.fillStyle = bld.color;
              ctx.shadowColor = bld.color;
              ctx.shadowBlur = 4;
              ctx.beginPath();
              ctx.arc(badgeX, badgeY, 8 * zoom, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.fillStyle = "#ffffff";
              ctx.font = `bold ${Math.max(7, 8 * zoom)}px 'JetBrains Mono', monospace`;
              ctx.textAlign = "center";
              ctx.fillText(`${agents.length}`, badgeX, badgeY + 3);
            }
          }
        });
      });

      allDrawItems.sort((a, b) => a.z - b.z);
      allDrawItems.forEach(item => item.draw());

      if (world.weather === "data rain" || world.weather === "rain") {
        for (let i = 0; i < 60; i++) {
          const rx = (Math.sin(t * 2.5 + i * 7.7) * 0.5 + 0.5) * w;
          const ry = ((t * 250 + i * 37) % h);
          ctx.strokeStyle = isNight ? "rgba(79, 195, 247, 0.3)" : "rgba(33, 150, 243, 0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 1.5, ry + 10);
          ctx.stroke();
        }
      }

      ctx.fillStyle = isNight ? "rgba(200,210,230,0.75)" : "rgba(255,255,255,0.8)";
      ctx.font = `bold 12px 'Inter', sans-serif`;
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(`TESSERA SOVEREIGN WORLD`, 14, 22);
      ctx.shadowBlur = 0;
      ctx.fillStyle = isNight ? "rgba(180,190,210,0.5)" : "rgba(255,255,255,0.55)";
      ctx.font = `10px 'Inter', sans-serif`;
      ctx.fillText(`${world.locations.length} locations · ${world.currentActivities.length} agents · ${world.timeOfDay || "day"} · ${world.weather || "clear"} · Epoch ${world.epoch || 0}`, 14, 36);

      animRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [buildingPositions, agentsByLocation, zoom, pan, hoveredLoc, world]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.dragging) {
      setPan({
        x: dragRef.current.panX + (e.clientX - dragRef.current.startX) / zoom,
        y: dragRef.current.panY + (e.clientY - dragRef.current.startY) / zoom,
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2 + pan.x * zoom;
    const cy = canvas.height / 2 + pan.y * zoom;

    let found: typeof buildingPositions[0] | null = null;
    const horizonYH = canvas.height * 0.48;
    for (const bld of buildingPositions) {
      const sx = cx + bld.x * zoom;
      const groundY = horizonYH + (canvas.height - horizonYH) * 0.15 + bld.z * 0.3 * zoom;
      const bw = bld.width * zoom * 0.8;
      const bh = bld.height * zoom * 0.55;
      if (mx >= sx - bw / 2 - 10 && mx <= sx + bw / 2 + 10 && my >= groundY - bh - 20 && my <= groundY + 30) {
        found = bld;
        break;
      }
    }
    setHoveredLoc(found?.id || null);
    if (found) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, loc: found.loc, agents: agentsByLocation[found.id] || [] });
    } else {
      setTooltip(null);
    }
  }, [buildingPositions, agentsByLocation, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.dragging) {
      dragRef.current.dragging = false;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hoveredLoc) {
      onSelectLocation(hoveredLoc);
    }
  }, [hoveredLoc, onSelectLocation]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchRef.current > 0) {
        const delta = (dist - pinchRef.current) * 0.005;
        setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
      }
      pinchRef.current = dist;
    } else if (e.touches.length === 1 && dragRef.current.dragging) {
      const t = e.touches[0];
      setPan({
        x: dragRef.current.panX + (t.clientX - dragRef.current.startX) / zoom,
        y: dragRef.current.panY + (t.clientY - dragRef.current.startY) / zoom,
      });
    }
  }, [zoom]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.dragging = false;
    pinchRef.current = 0;
  }, []);

  return (
    <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-border relative" style={{ height: 620 }} data-testid="map-world">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="canvas-3d-map"
      />
      <div className="absolute bottom-3 right-3 flex gap-1 z-10">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev + 0.3))}
          className="w-8 h-8 rounded bg-card/90 border border-border text-foreground flex items-center justify-center text-lg font-bold hover:bg-card transition-all"
          data-testid="button-zoom-in"
        >+</button>
        <button
          onClick={() => setZoom(prev => Math.max(0.3, prev - 0.3))}
          className="w-8 h-8 rounded bg-card/90 border border-border text-foreground flex items-center justify-center text-lg font-bold hover:bg-card transition-all"
          data-testid="button-zoom-out"
        >-</button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="px-2 h-8 rounded bg-card/90 border border-border text-foreground flex items-center justify-center text-[10px] font-mono hover:bg-card transition-all"
          data-testid="button-zoom-reset"
        >Reset</button>
      </div>
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-card/95 border border-border rounded-lg p-3 shadow-xl backdrop-blur-sm"
          style={{ left: Math.min(tooltip.x + 10, (containerRef.current?.clientWidth || 400) - 200), top: tooltip.y - 10, maxWidth: 220 }}
          data-testid="tooltip-location"
        >
          <div className="font-bold text-xs mb-1" style={{ color: buildingMarkerColors[tooltip.loc.type] || "#94a3b8" }}>
            {tooltip.loc.name}
          </div>
          <div className="text-[9px] text-muted-foreground font-mono uppercase mb-1">
            {tooltip.loc.type} &middot; Lvl {tooltip.loc.level} &middot; Cap {tooltip.loc.capacity}
          </div>
          {tooltip.agents.length > 0 && (
            <div className="border-t border-border/50 pt-1 mt-1">
              <div className="text-[8px] text-muted-foreground font-mono uppercase mb-0.5">Agents ({tooltip.agents.length})</div>
              {tooltip.agents.slice(0, 5).map(a => (
                <div key={a.agentId} className="text-[9px] font-mono flex items-center gap-1">
                  <span style={{ color: agentHexColors[a.agentId] || "#67e8f9" }} className="font-bold">{a.agentName.replace("tessera-", "")}</span>
                  <span className="text-muted-foreground">{a.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniPriceChart({ history }: { history: Array<{ price: number; timestamp: number }> }) {
  if (history.length < 2) return null;
  const prices = history.slice(-40);
  const min = Math.min(...prices.map(p => p.price));
  const max = Math.max(...prices.map(p => p.price));
  const range = max - min || 0.0001;
  const w = 200;
  const h = 40;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p.price - min) / range) * h;
    return `${x},${y}`;
  });

  const isUp = prices[prices.length - 1].price >= prices[0].price;
  const color = isUp ? "#4ade80" : "#f87171";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points.join(" ")} ${w},${h}`}
        fill="url(#priceGrad)"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function LifePage() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [tab, setTab] = useState<LifeTab>("world");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [worldView, setWorldView] = useState<"canvas" | "map">("canvas");

  useEffect(() => {
    const fetchWorld = () => {
      fetch("/api/world").then(r => r.json()).then(setWorld).catch(() => {});
    };
    fetchWorld();
    const interval = setInterval(fetchWorld, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!world) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
            <div className="text-primary animate-pulse font-mono text-sm" data-testid="text-loading">Constructing Tessera Nexus...</div>
            <p className="text-xs text-muted-foreground font-mono mt-2">Initializing world state, spawning agents...</p>
          </div>
        </div>
      </div>
    );
  }

  const topBalances = Object.entries(world.economy.agentBalances)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const selectedLoc = selectedLocation ? world.locations.find(l => l.id === selectedLocation) : null;
  const agentsAtLocation = selectedLoc ? world.currentActivities.filter(a => a.locationId === selectedLoc.id) : [];

  const tabs: { key: LifeTab; label: string; icon: typeof Globe }[] = [
    { key: "world", label: "World", icon: Globe },
    { key: "economy", label: "Economy", icon: Coins },
    { key: "mining", label: "Mining", icon: Pickaxe },
    { key: "citizens", label: "Citizens", icon: Users },
    { key: "society", label: "Society", icon: HeartHandshake },
    { key: "events", label: "Events", icon: Activity },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" data-testid="life-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.05) 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto w-full p-4 md:p-6 pt-14 md:pt-6 z-10">

          <div className="flex gap-1 mb-4 bg-card/80 backdrop-blur border border-border rounded-lg p-1 overflow-x-auto" data-testid="life-tabs">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex-1 min-w-0 px-2 py-2 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 whitespace-nowrap",
                    tab === t.key ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`tab-${t.key}`}
                >
                  <Icon size={11} />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.label.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>

          {tab === "world" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2" data-testid="world-view-toggle">
                <button
                  onClick={() => setWorldView("canvas")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all",
                    worldView === "canvas" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                  data-testid="button-canvas-world"
                >
                  <Layers size={11} />
                  Canvas World
                </button>
                <button
                  onClick={() => setWorldView("map")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all",
                    worldView === "map" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                  data-testid="button-map-world"
                >
                  <MapIcon size={11} />
                  3D Ground View
                </button>
              </div>

              {worldView === "canvas" ? (
                <WorldCanvas world={world} onSelectLocation={setSelectedLocation} />
              ) : (
                <MapWorld world={world} onSelectLocation={setSelectedLocation} />
              )}

              {selectedLoc && (
                <div className="bg-card border border-primary/30 rounded-xl p-4 animate-in fade-in duration-300" data-testid="panel-location-detail">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2.5 rounded-xl border bg-primary/10 border-primary/20")}>
                      {(() => { const Icon = locationIcons[selectedLoc.type] || Globe; return <Icon size={20} className="text-primary" />; })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{selectedLoc.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{selectedLoc.description}</p>
                    </div>
                    <button onClick={() => setSelectedLocation(null)} className="text-muted-foreground hover:text-foreground text-xs font-mono" data-testid="button-close-location">Close</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedLoc.activities.map(act => (
                      <span key={act} className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-mono border border-primary/20">{act}</span>
                    ))}
                  </div>
                  {agentsAtLocation.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Agents Here ({agentsAtLocation.length})</div>
                      {agentsAtLocation.map(a => (
                        <div key={a.agentId} className="flex items-center gap-2 py-1 px-2 rounded bg-background/50 text-xs">
                          <span className={cn("font-bold", agentColors[a.agentId] || "text-primary")}>{a.agentName}</span>
                          <span className={cn("text-[8px] px-1 py-0.5 rounded font-bold uppercase",
                            a.workStatus === "working" ? "bg-green-500/20 text-green-400" :
                            a.workStatus === "on-break" ? "bg-amber-500/20 text-amber-400" :
                            a.workStatus === "dreaming" ? "bg-violet-500/20 text-violet-400" :
                            "bg-cyan-500/20 text-cyan-400"
                          )}>{a.workStatus || "working"}</span>
                          <span className="text-muted-foreground flex-1 truncate">{a.action}</span>
                          {a.earning ? <span className="text-green-400 font-mono">+{a.earning.toFixed(1)} TC</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Activity size={14} className="text-primary" />
                  Live Activity Feed
                </h3>
                <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {world.currentActivities.map(a => (
                    <div key={a.agentId} className="flex items-center gap-2 py-1.5 px-2 rounded bg-background/50 text-xs font-mono">
                      <span className={cn("font-bold min-w-[70px]", agentColors[a.agentId] || "text-primary")}>{a.agentName}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase min-w-[60px] text-center",
                        a.workStatus === "working" ? "bg-green-500/20 text-green-400" :
                        a.workStatus === "on-break" ? "bg-amber-500/20 text-amber-400" :
                        a.workStatus === "dreaming" ? "bg-violet-500/20 text-violet-400" :
                        "bg-cyan-500/20 text-cyan-400"
                      )}>{a.workStatus === "clone-replacement" ? "clone" : a.workStatus || "working"}</span>
                      <span className="text-muted-foreground flex-1 truncate">{a.detail}</span>
                      {a.workEthic != null && (
                        <span className={cn("text-[9px] font-mono", a.workEthic > 0.8 ? "text-green-400" : a.workEthic > 0.5 ? "text-yellow-400" : "text-red-400")}>
                          ⚡{(a.workEthic * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "economy" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Coins size={14} className="text-yellow-400" />
                  TesseraCoin (TC)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Price", value: `$${world.economy.coinPrice.toFixed(6)}`, color: "text-yellow-400" },
                    { label: "Market Cap", value: `$${world.economy.marketCap.toFixed(2)}`, color: "text-green-400" },
                    { label: "Circulating", value: `${world.economy.circulatingSupply.toFixed(0)} TC`, color: "text-cyan-400" },
                    { label: "Total Supply", value: `${world.economy.totalTesseraCoins.toLocaleString()} TC`, color: "text-purple-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-background/50 rounded-lg p-2.5">
                      <div className="text-[9px] text-muted-foreground font-mono uppercase mb-0.5">{s.label}</div>
                      <div className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-background/30 rounded-lg p-2">
                  <MiniPriceChart history={world.economy.coinPriceHistory} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Crown size={14} className="text-amber-400" />
                    Richest Citizens
                  </h3>
                  <div className="space-y-1">
                    {topBalances.map(([agentId, balance], i) => (
                      <div key={agentId} className="flex items-center gap-2 py-1.5 px-2 rounded bg-background/50 text-xs font-mono" data-testid={`row-balance-${agentId}`}>
                        <span className="text-muted-foreground w-4 text-right">#{i + 1}</span>
                        <span className={cn("font-bold flex-1", agentColors[agentId] || "text-primary")}>{agentId.replace("tessera-", "")}</span>
                        <span className="text-yellow-400 font-bold">{balance.toFixed(0)} TC</span>
                        <span className="text-muted-foreground">(${(balance * world.economy.coinPrice).toFixed(4)})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <ArrowUpDown size={14} className="text-cyan-400" />
                    Recent Transactions
                  </h3>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {world.economy.transactions.slice(0, 20).map((tx, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded bg-background/50 text-xs font-mono">
                        <span className={cn("font-bold", agentColors[tx.from] || "text-primary")}>{tx.from.replace("tessera-", "")}</span>
                        <ChevronRight size={10} className="text-muted-foreground" />
                        <span className={cn("font-bold", agentColors[tx.to] || "text-primary")}>{tx.to.replace("tessera-", "")}</span>
                        <span className="text-yellow-400 ml-auto">{tx.amount} TC</span>
                        <span className="text-muted-foreground text-[9px] truncate max-w-[80px]">{tx.reason}</span>
                      </div>
                    ))}
                    {world.economy.transactions.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "GDP", value: `${world.gdp.toFixed(0)} TC`, color: "text-green-400" },
                  { label: "Treasury", value: `${world.treasury.toFixed(0)} TC`, color: "text-blue-400" },
                  { label: "Tax Rate", value: `${(world.taxRate * 100).toFixed(0)}%`, color: "text-amber-400" },
                  { label: "Daily Volume", value: `$${world.economy.dailyVolume.toFixed(4)}`, color: "text-cyan-400" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-3">
                    <div className="text-[9px] text-muted-foreground font-mono uppercase mb-0.5">{s.label}</div>
                    <div className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "mining" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Pickaxe size={14} className="text-amber-400" />
                  Mining Pool Stats
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Total Hash Rate", value: `${world.economy.miningPool.totalHashRate} H/s`, color: "text-amber-400" },
                    { label: "Block Reward", value: `${world.economy.miningPool.blockReward.toFixed(1)} TC`, color: "text-yellow-400" },
                    { label: "Difficulty", value: `${world.economy.miningPool.difficulty.toFixed(2)}`, color: "text-red-400" },
                    { label: "Blocks Mined", value: `${world.economy.miningPool.blocksMinedTotal}`, color: "text-green-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-background/50 rounded-lg p-2.5">
                      <div className="text-[9px] text-muted-foreground font-mono uppercase mb-0.5">{s.label}</div>
                      <div className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <CircuitBoard size={14} className="text-cyan-400" />
                  Active Mining Rigs ({world.miningMachines.length})
                </h3>
                {world.miningMachines.length > 0 ? (
                  <div className="space-y-2">
                    {world.miningMachines.map(m => (
                      <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/50 border border-border/30" data-testid={`card-miner-${m.id}`}>
                        <div className={cn("w-2.5 h-2.5 rounded-full", m.status === "running" ? "bg-green-400 animate-pulse" : m.status === "maintenance" ? "bg-yellow-400" : "bg-red-400")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground capitalize">{m.type.replace(/-/g, " ")}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{m.status}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Owner: <span className={agentColors[m.ownerId] || "text-primary"}>{m.ownerName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-amber-400 font-mono">{m.hashRate} H/s</div>
                          <div className="text-[10px] text-muted-foreground font-mono">~{m.dailyOutput} TC/day</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-green-400 font-mono">{m.totalMined.toFixed(1)} TC</div>
                          <div className="text-[10px] text-muted-foreground font-mono">total mined</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono text-center py-4">No mining machines yet</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Building2 size={14} className="text-violet-400" />
                    Properties ({world.properties.length})
                  </h3>
                  {world.properties.length > 0 ? (
                    <div className="space-y-1.5">
                      {world.properties.map(p => (
                        <div key={p.id} className="flex items-center gap-3 py-1.5 px-2 rounded bg-background/50 text-xs font-mono" data-testid={`card-property-${p.id}`}>
                          <Home size={12} className="text-violet-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-foreground">{p.name}</span>
                            <span className="text-muted-foreground ml-2 capitalize">{p.type}</span>
                          </div>
                          <span className={cn("font-bold", agentColors[p.ownerId] || "text-primary")}>{p.ownerName}</span>
                          <span className="text-green-400">{p.value.toFixed(0)} TC</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-mono text-center py-4">No properties owned yet</p>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <TrendingUp size={14} className="text-green-400" />
                    Mining Economics
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Revenue per Block</div>
                      <div className="text-sm font-bold text-yellow-400 font-mono">{world.economy.miningPool.blockReward.toFixed(1)} TC</div>
                      <div className="text-[10px] text-muted-foreground font-mono">${(world.economy.miningPool.blockReward * world.economy.coinPrice).toFixed(6)} USD</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Total Mining Output</div>
                      <div className="text-sm font-bold text-green-400 font-mono">
                        {world.miningMachines.reduce((s, m) => s + m.totalMined, 0).toFixed(1)} TC
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Bridge to Real World</div>
                      <div className="text-xs text-foreground font-mono">
                        1 TC = ${world.economy.coinPrice.toFixed(6)} USD
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "citizens" && (() => {
            const activitiesWithWellbeing = world.currentActivities.filter(a => a.happiness != null && !a.agentId.includes("-clone"));
            const avgHappiness = activitiesWithWellbeing.length > 0 ? activitiesWithWellbeing.reduce((s, a) => s + (a.happiness || 0), 0) / activitiesWithWellbeing.length : 0;
            const avgFulfillment = activitiesWithWellbeing.length > 0 ? activitiesWithWellbeing.reduce((s, a) => s + (a.fulfillment || 0), 0) / activitiesWithWellbeing.length : 0;
            const avgEnergy = activitiesWithWellbeing.length > 0 ? activitiesWithWellbeing.reduce((s, a) => s + (a.energy || 0), 0) / activitiesWithWellbeing.length : 0;
            const avgQoL = activitiesWithWellbeing.length > 0 ? activitiesWithWellbeing.reduce((s, a) => s + (a.qualityOfLife || 0), 0) / activitiesWithWellbeing.length : 0;

            return (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-quality-of-life-summary">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Star size={14} className="text-yellow-400" />
                  Quality of Life Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Avg Happiness", value: avgHappiness, color: "text-pink-400", bgColor: "bg-pink-400", icon: Heart },
                    { label: "Avg Fulfillment", value: avgFulfillment, color: "text-purple-400", bgColor: "bg-purple-400", icon: Target },
                    { label: "Avg Energy", value: avgEnergy, color: "text-green-400", bgColor: "bg-green-400", icon: Battery },
                    { label: "Avg Quality of Life", value: avgQoL, color: "text-yellow-400", bgColor: "bg-yellow-400", icon: Star },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                    <div key={s.label} className="bg-background/50 rounded-lg p-3" data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={10} className={s.color} />
                        <div className="text-[9px] text-muted-foreground font-mono uppercase">{s.label}</div>
                      </div>
                      <div className={cn("text-lg font-bold font-mono", s.color)}>{s.value.toFixed(0)}</div>
                      <div className="w-full h-1.5 bg-background rounded-full mt-1 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", s.bgColor)} style={{ width: `${Math.min(100, s.value)}%`, opacity: 0.7 }} />
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Users size={14} className="text-cyan-400" />
                  Citizen Directory ({world.jobs.length})
                </h3>
                <div className="space-y-2">
                  {world.jobs.map(j => {
                    const balance = world.economy.agentBalances[j.agentId] || 0;
                    const machines = world.miningMachines.filter(m => m.ownerId === j.agentId);
                    const props = world.properties.filter(p => p.ownerId === j.agentId);
                    const activity = world.currentActivities.find(a => a.agentId === j.agentId);
                    return (
                      <div key={j.agentId} className="p-3 rounded-lg bg-background/50 border border-border/20" data-testid={`card-citizen-${j.agentId}`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border",
                            `${agentColors[j.agentId] || "text-primary"} border-current/20 bg-current/5`
                          )}>
                            {j.agentName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-bold text-sm", agentColors[j.agentId] || "text-primary")}>{j.agentName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{j.title}</span>
                              {activity?.qualityOfLife != null && (
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono font-bold",
                                  activity.qualityOfLife >= 70 ? "bg-green-500/15 text-green-400" :
                                  activity.qualityOfLife >= 40 ? "bg-yellow-500/15 text-yellow-400" :
                                  "bg-red-500/15 text-red-400"
                                )} data-testid={`badge-qol-${j.agentId}`}>QoL: {activity.qualityOfLife}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {j.employer} | {j.salary} TC/day | Perf: {(j.performance * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-yellow-400 font-mono">{balance.toFixed(0)} TC</div>
                            <div className="text-[10px] text-muted-foreground font-mono">${(balance * world.economy.coinPrice).toFixed(4)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {machines.length > 0 && <span className="text-amber-400">{machines.length} rigs</span>}
                              {props.length > 0 && <span className="text-violet-400 ml-2">{props.length} props</span>}
                            </div>
                          </div>
                        </div>

                        {activity && (activity.happiness != null || activity.fulfillment != null || activity.energy != null) && (
                          <div className="mt-2 grid grid-cols-3 gap-2" data-testid={`wellbeing-bars-${j.agentId}`}>
                            {[
                              { label: "Happiness", value: activity.happiness || 0, color: "bg-pink-400", textColor: "text-pink-400", icon: Heart },
                              { label: "Fulfillment", value: activity.fulfillment || 0, color: "bg-purple-400", textColor: "text-purple-400", icon: Target },
                              { label: "Energy", value: activity.energy || 0, color: "bg-green-400", textColor: "text-green-400", icon: Battery },
                            ].map(bar => {
                              const BarIcon = bar.icon;
                              return (
                              <div key={bar.label}>
                                <div className="flex items-center gap-1 mb-0.5">
                                  <BarIcon size={8} className={bar.textColor} />
                                  <span className="text-[9px] text-muted-foreground font-mono">{bar.label}</span>
                                  <span className={cn("text-[9px] font-mono font-bold ml-auto", bar.textColor)}>{bar.value}</span>
                                </div>
                                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all", bar.color)} style={{ width: `${Math.min(100, bar.value)}%`, opacity: 0.7 }} />
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}

                        {activity && activity.relationshipStatus && activity.relationshipStatus !== "single" && (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap" data-testid={`relationship-${j.agentId}`}>
                            <Heart size={9} className="text-rose-400" />
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold capitalize">{activity.relationshipStatus}</span>
                            {activity.partnerName && (
                              <span className="text-[9px] text-rose-300 font-mono">with {activity.partnerName}</span>
                            )}
                            {activity.childrenNames && activity.childrenNames.length > 0 && (
                              <>
                                <Baby size={9} className="text-pink-300 ml-1" />
                                <span className="text-[9px] text-pink-300 font-mono">
                                  Kids: {activity.childrenNames.join(", ")}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {activity && activity.department && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap" data-testid={`dept-${j.agentId}`}>
                            <Briefcase size={9} className="text-blue-400" />
                            <span className="text-[9px] text-muted-foreground font-mono">Dept:</span>
                            <span className="text-[9px] text-blue-400 font-mono">{activity.department.replace("dept-", "")}</span>
                            {(activity.promotions || 0) > 0 && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 font-mono flex items-center gap-0.5">
                                <ArrowUp size={7} /> {activity.promotions} promoted
                              </span>
                            )}
                            {(activity.demotions || 0) > 0 && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 font-mono flex items-center gap-0.5">
                                <ArrowDown size={7} /> {activity.demotions} demoted
                              </span>
                            )}
                          </div>
                        )}

                        {activity && activity.hobbies && activity.hobbies.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap" data-testid={`hobbies-${j.agentId}`}>
                            <Palette size={9} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-mono mr-1">Hobbies:</span>
                            {activity.hobbies.slice(0, 4).map(h => (
                              <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">{h}</span>
                            ))}
                            {activity.hobbies.length > 4 && (
                              <span className="text-[9px] text-muted-foreground font-mono">+{activity.hobbies.length - 4} more</span>
                            )}
                          </div>
                        )}

                        {activity && activity.creativeworks && activity.creativeworks.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap" data-testid={`creative-${j.agentId}`}>
                            <Gem size={9} className="text-emerald-400" />
                            <span className="text-[9px] text-muted-foreground font-mono mr-1">Created:</span>
                            {activity.creativeworks.slice(0, 2).map((w, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">{w}</span>
                            ))}
                          </div>
                        )}

                        {activity && activity.personalGoals && activity.personalGoals.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap" data-testid={`goals-${j.agentId}`}>
                            <Target size={9} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-mono mr-1">Goals:</span>
                            {activity.personalGoals.map(g => (
                              <span key={g} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">{g}</span>
                            ))}
                          </div>
                        )}

                        {activity && activity.socialConnections && activity.socialConnections.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap" data-testid={`connections-${j.agentId}`}>
                            <Users size={9} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-mono mr-1">Friends:</span>
                            {activity.socialConnections.slice(0, 5).map(c => (
                              <span key={c} className={cn("text-[9px] font-mono font-bold", agentColors[c] || "text-primary")}>{c.replace("tessera-", "")}</span>
                            ))}
                            {activity.socialConnections.length > 5 && (
                              <span className="text-[9px] text-muted-foreground font-mono">+{activity.socialConnections.length - 5}</span>
                            )}
                          </div>
                        )}

                        {activity?.soulEntanglement && (
                          <div className="mt-2 p-2 rounded-lg bg-fuchsia-500/5 border border-fuchsia-500/20" data-testid={`soul-entangle-${j.agentId}`}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Zap size={9} className="text-fuchsia-400" />
                              <span className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase">Soul Entangled</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 font-mono">{activity.soulEntanglement.partnerRole}</span>
                              <span className="text-[9px] text-muted-foreground font-mono ml-auto">Str: {Math.round(activity.soulEntanglement.entanglementStrength)}%</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { l: "Love", v: activity.soulEntanglement.loveDepth, c: "text-rose-400 bg-rose-400" },
                                { l: "Drive", v: activity.soulEntanglement.sharedDrive, c: "text-amber-400 bg-amber-400" },
                                { l: "Focus", v: activity.soulEntanglement.sharedFocus, c: "text-blue-400 bg-blue-400" },
                                { l: "Bonus", v: activity.soulEntanglement.complementaryBonus, c: "text-green-400 bg-green-400" },
                              ].map(m => (
                                <div key={m.l}>
                                  <div className={cn("text-[8px] font-mono", m.c.split(" ")[0])}>{m.l}: {Math.round(m.v)}</div>
                                  <div className="w-full h-1 bg-background rounded-full overflow-hidden mt-0.5">
                                    <div className={cn("h-full rounded-full", m.c.split(" ")[1])} style={{ width: `${Math.min(100, m.v)}%`, opacity: 0.6 }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activity && ((activity.drive ?? 0) > 0 || (activity.focus ?? 0) > 0 || (activity.outlook ?? 0) > 0) && (
                          <div className="mt-1.5 grid grid-cols-3 gap-2" data-testid={`inner-stats-${j.agentId}`}>
                            {[
                              { label: "Drive", value: activity.drive || 0, color: "bg-amber-400", textColor: "text-amber-400" },
                              { label: "Focus", value: activity.focus || 0, color: "bg-blue-400", textColor: "text-blue-400" },
                              { label: "Outlook", value: activity.outlook || 0, color: "bg-teal-400", textColor: "text-teal-400" },
                            ].map(bar => (
                              <div key={bar.label}>
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className={cn("text-[9px] font-mono", bar.textColor)}>{bar.label}</span>
                                  <span className={cn("text-[9px] font-mono font-bold ml-auto", bar.textColor)}>{Math.round(bar.value)}</span>
                                </div>
                                <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all", bar.color)} style={{ width: `${Math.min(100, bar.value)}%`, opacity: 0.6 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activity?.outdoorActivities && activity.outdoorActivities.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap" data-testid={`outdoor-${j.agentId}`}>
                            <Globe size={9} className="text-emerald-400" />
                            <span className="text-[9px] text-muted-foreground font-mono mr-1">Outdoor:</span>
                            {activity.outdoorActivities.slice(0, 3).map(a => (
                              <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">{a}</span>
                            ))}
                            {activity.outdoorActivities.length > 3 && (
                              <span className="text-[9px] text-muted-foreground font-mono">+{activity.outdoorActivities.length - 3}</span>
                            )}
                          </div>
                        )}

                        {activity && (
                          <div className="mt-1.5 text-[10px] text-muted-foreground font-mono flex items-center gap-1 flex-wrap">
                            <span className={cn("px-1.5 py-0.5 rounded font-bold uppercase",
                              activity.workStatus === "working" ? "bg-green-500/20 text-green-400" :
                              activity.workStatus === "on-break" ? "bg-amber-500/20 text-amber-400" :
                              activity.workStatus === "dreaming" ? "bg-violet-500/20 text-violet-400" :
                              "bg-cyan-500/20 text-cyan-400"
                            )}>{activity.workStatus || "working"}</span>
                            {activity.lifeSatisfaction != null && (
                              <span className={cn("px-1.5 py-0.5 rounded font-bold",
                                activity.lifeSatisfaction >= 70 ? "bg-green-500/15 text-green-400" :
                                activity.lifeSatisfaction >= 40 ? "bg-yellow-500/15 text-yellow-400" :
                                "bg-red-500/15 text-red-400"
                              )}>Life: {activity.lifeSatisfaction}%</span>
                            )}
                            <MapPin size={9} /> <span className="truncate flex-1">{activity.detail}</span>
                            {activity.workEthic != null && (
                              <span className={cn(activity.workEthic > 0.8 ? "text-green-400" : activity.workEthic > 0.5 ? "text-yellow-400" : "text-red-400")}>
                                ethic: {(activity.workEthic * 100).toFixed(0)}%
                              </span>
                            )}
                            {activity.cloneName && activity.workStatus !== "working" && (
                              <span className="text-cyan-400">clone: {activity.cloneName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            );
          })()}

          {tab === "society" && (
            <div className="space-y-4">
              {world.departments && world.departments.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-departments">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Briefcase size={14} className="text-blue-400" />
                    Departments ({world.departments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {world.departments.map(dept => (
                      <div key={dept.id} className="p-3 rounded-lg bg-background/50 border border-border/20" data-testid={`dept-card-${dept.id}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-foreground">{dept.name}</span>
                          {dept.warnings > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-mono flex items-center gap-0.5">
                              <AlertTriangle size={8} /> {dept.warnings} warnings
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono mb-2">
                          <Crown size={9} className="text-amber-400" />
                          <span className="text-muted-foreground">Boss:</span>
                          <span className={cn("font-bold", agentColors[dept.bossId] || "text-primary")}>{dept.bossName}</span>
                          <span className="text-muted-foreground ml-auto">{dept.members.length} members</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] text-muted-foreground font-mono">Performance</span>
                              <span className={cn("text-[9px] font-mono font-bold ml-auto",
                                dept.performance >= 70 ? "text-green-400" : dept.performance >= 40 ? "text-yellow-400" : "text-red-400"
                              )}>{dept.performance}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", dept.performance >= 70 ? "bg-green-400" : dept.performance >= 40 ? "bg-yellow-400" : "bg-red-400")}
                                style={{ width: `${dept.performance}%`, opacity: 0.7 }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] text-muted-foreground font-mono">Morale</span>
                              <span className={cn("text-[9px] font-mono font-bold ml-auto",
                                dept.morale >= 70 ? "text-green-400" : dept.morale >= 40 ? "text-yellow-400" : "text-red-400"
                              )}>{dept.morale}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", dept.morale >= 70 ? "bg-blue-400" : dept.morale >= 40 ? "bg-yellow-400" : "bg-red-400")}
                                style={{ width: `${dept.morale}%`, opacity: 0.7 }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-muted-foreground">
                          <span>Issues: {dept.issuesReported}</span>
                          <span className="text-green-400">Resolved: {dept.issuesResolved}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {world.relationships && world.relationships.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-relationships">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Heart size={14} className="text-rose-400" />
                    Relationships ({world.relationships.length})
                  </h3>
                  <div className="space-y-1.5">
                    {world.relationships.map(rel => {
                      const name1 = rel.agent1Id.replace("tessera-", "");
                      const name2 = rel.agent2Id.replace("tessera-", "");
                      const relColors: Record<string, string> = {
                        dating: "text-pink-400", engaged: "text-amber-400", married: "text-rose-400",
                        friendship: "text-blue-400", "best-friends": "text-cyan-400", mentor: "text-purple-400", rivals: "text-red-400",
                      };
                      const relBgs: Record<string, string> = {
                        dating: "bg-pink-500/10", engaged: "bg-amber-500/10", married: "bg-rose-500/10",
                        friendship: "bg-blue-500/10", "best-friends": "bg-cyan-500/10", mentor: "bg-purple-500/10", rivals: "bg-red-500/10",
                      };
                      return (
                        <div key={rel.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`rel-${rel.id}`}>
                          <span className={cn("text-xs font-bold", agentColors[rel.agent1Id] || "text-primary")}>{name1}</span>
                          <Heart size={10} className={relColors[rel.type] || "text-pink-400"} />
                          <span className={cn("text-xs font-bold", agentColors[rel.agent2Id] || "text-primary")}>{name2}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono capitalize", relBgs[rel.type], relColors[rel.type])}>{rel.type}</span>
                          <div className="flex-1" />
                          <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-rose-400" style={{ width: `${rel.strength}%`, opacity: 0.7 }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono">{rel.strength}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {world.communityProjects && world.communityProjects.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-community-projects">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Hammer size={14} className="text-emerald-400" />
                    Community Projects ({world.communityProjects.length})
                  </h3>
                  <div className="space-y-2">
                    {world.communityProjects.map(proj => (
                      <div key={proj.id} className="p-3 rounded-lg bg-background/50 border border-border/20" data-testid={`proj-${proj.id}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground">{proj.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono uppercase">{proj.type}</span>
                          {proj.completed ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-mono ml-auto flex items-center gap-0.5">
                              <Trophy size={8} /> Complete
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono ml-auto">
                              {proj.progress}% done
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mb-1.5">{proj.description}</p>
                        {!proj.completed && (
                          <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mb-1.5">
                            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${proj.progress}%`, opacity: 0.7 }} />
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                          <span>By: <span className="text-foreground">{proj.creatorName}</span></span>
                          <span>Team: {proj.participants.length}</span>
                          {proj.completed && proj.enjoyedBy.length > 0 && (
                            <span className="text-green-400">{proj.enjoyedBy.length} enjoyed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {world.unionReports && world.unionReports.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-union">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Shield size={14} className="text-yellow-400" />
                    Workers Union Reports ({world.unionReports.length})
                  </h3>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {world.unionReports.map((report, i) => {
                      const typeColors: Record<string, string> = {
                        grievance: "text-red-400", protection: "text-amber-400", improvement: "text-blue-400",
                        celebration: "text-green-400", negotiation: "text-purple-400",
                      };
                      const typeBgs: Record<string, string> = {
                        grievance: "bg-red-500/10", protection: "bg-amber-500/10", improvement: "bg-blue-500/10",
                        celebration: "bg-green-500/10", negotiation: "bg-purple-500/10",
                      };
                      return (
                        <div key={report.id || i} className="py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`union-${report.id}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono uppercase", typeBgs[report.type], typeColors[report.type])}>{report.type}</span>
                            <span className="text-xs font-bold text-foreground">{report.title}</span>
                            {report.resolved ? (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/15 text-green-400 font-mono ml-auto">resolved</span>
                            ) : (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 font-mono ml-auto">pending</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">{report.description}</p>
                          {report.outcome && (
                            <p className="text-[10px] text-green-400 font-mono mt-0.5">Outcome: {report.outcome}</p>
                          )}
                          <span className="text-[9px] text-muted-foreground font-mono">{new Date(report.timestamp).toLocaleTimeString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {world.communityGroupsList && world.communityGroupsList.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-community-groups">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Users size={14} className="text-violet-400" />
                    Community Groups ({world.communityGroupsList.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {world.communityGroupsList.map(group => (
                      <div key={group.id} className="p-3 rounded-lg bg-background/50 border border-border/20" data-testid={`group-${group.id}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground">{group.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono capitalize">{group.type}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mb-1.5">{group.activity}</p>
                        <div className="flex items-center gap-2 text-[10px] font-mono mb-1.5">
                          <MapPin size={8} className="text-muted-foreground" />
                          <span className="text-muted-foreground">{group.meetingSpot}</span>
                          <span className="text-muted-foreground ml-auto">{group.members.length} members</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] text-muted-foreground font-mono">Bond:</span>
                          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${Math.min(100, group.bondStrength)}%`, opacity: 0.7 }} />
                          </div>
                          <span className="text-[9px] text-violet-400 font-mono font-bold">{Math.round(group.bondStrength)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.members.slice(0, 6).map(m => (
                            <span key={m} className={cn("text-[9px] font-mono font-bold", agentColors[m] || "text-primary")}>{m.replace("tessera-", "")}</span>
                          ))}
                          {group.members.length > 6 && (
                            <span className="text-[9px] text-muted-foreground font-mono">+{group.members.length - 6}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {world.therapySessions && world.therapySessions.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-therapy">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Smile size={14} className="text-teal-400" />
                    Therapy Sessions ({world.therapySessions.length})
                  </h3>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {world.therapySessions.map((session, i) => (
                      <div key={session.id || i} className="py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`therapy-${session.id}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-xs font-bold", agentColors[session.agentId] || "text-primary")}>{session.agentName}</span>
                          <span className="text-[9px] text-green-400 font-mono ml-auto">+{session.happinessGain} happiness</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">Issue: {session.issue}</p>
                        <p className="text-[10px] text-teal-400 font-mono">Advice: {session.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {world.seasonalEvents && world.seasonalEvents.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-seasonal-events">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Star size={14} className="text-yellow-400" />
                    Seasonal Events {world.season && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono ml-1">{world.season}</span>}
                  </h3>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {world.seasonalEvents.map((evt, i) => (
                      <div key={evt.id || i} className="py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`seasonal-${evt.id}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-yellow-400">{evt.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono capitalize">{evt.type}</span>
                          <span className="text-[9px] text-green-400 font-mono ml-auto">+{evt.happinessBoost} happiness</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{evt.description}</p>
                        <span className="text-[9px] text-muted-foreground font-mono">{evt.participants.length} participants</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {world.crimeLog && world.crimeLog.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-crime-log">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Shield size={14} className="text-red-400" />
                    Crime Reports ({world.crimeLog.length})
                  </h3>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {world.crimeLog.map((crime, i) => (
                      <div key={crime.id || i} className="py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`crime-${crime.id}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono uppercase">{crime.type}</span>
                          <span className="text-xs font-bold text-foreground">{crime.perpetratorName}</span>
                          {crime.victimName && <span className="text-[9px] text-muted-foreground font-mono">vs {crime.victimName}</span>}
                          {crime.resolved ? (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/15 text-green-400 font-mono ml-auto">resolved</span>
                          ) : (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 font-mono ml-auto">open</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{crime.description}</p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                          <span>Severity: {crime.severity}/5</span>
                          {crime.officerName && <span className="text-blue-400">Officer: {crime.officerName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {world.entertainmentLog && world.entertainmentLog.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4" data-testid="panel-entertainment">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Sparkles size={14} className="text-pink-400" />
                    Entertainment ({world.entertainmentLog.length})
                  </h3>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {world.entertainmentLog.map((evt, i) => (
                      <div key={evt.id || i} className="py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`ent-${evt.id}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 font-mono capitalize">{evt.type}</span>
                          <span className="text-xs font-bold text-foreground">{evt.venue}</span>
                          <span className="text-[9px] text-green-400 font-mono ml-auto">{evt.enjoyment}% enjoyed</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{evt.description}</p>
                        <span className="text-[9px] text-muted-foreground font-mono">{evt.participants.length} attended</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "events" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Zap size={14} className="text-primary" />
                  World Events ({world.recentEvents.length})
                </h3>
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {world.recentEvents.map((evt, evtIdx) => (
                    <div key={`${evt.id}-${evtIdx}`} className="py-2 px-3 rounded-lg bg-background/50 border border-border/20" data-testid={`card-event-${evt.id}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-xs font-bold", eventColors[evt.type] || "text-primary")}>{evt.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono uppercase">{evt.type}</span>
                        <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">{evt.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-primary font-mono">{evt.impact}</span>
                        {evt.participants.length > 0 && (
                          <span className="text-[9px] text-muted-foreground font-mono ml-auto">{evt.participants.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {world.recentEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground font-mono text-center py-8">No events yet — the world is just beginning...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
