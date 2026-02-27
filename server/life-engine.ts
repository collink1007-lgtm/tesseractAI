import fs from "fs";
import path from "path";
import { storage } from "./storage";

interface WorldLocation {
  id: string;
  name: string;
  type: "home" | "workplace" | "gathering" | "market" | "academy" | "garden" | "observatory" | "forge" | "archive" | "arena" | "mine" | "bank" | "cafe" | "gym" | "hospital" | "garage" | "school" | "library" | "restaurant" | "church" | "police_station" | "fire_station" | "theater" | "museum";
  description: string;
  builtBy: string[];
  x: number;
  y: number;
  level: number;
  capacity: number;
  activities: string[];
  createdAt: number;
  income?: number;
  upgradeCost?: number;
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
}

interface SoulEntanglement {
  partnerRole: "thinker" | "executor";
  entanglementStrength: number;
  sharedDrive: number;
  sharedFocus: number;
  loveDepth: number;
  intimacyLevel: number;
  lastIntimacy: number;
  complementaryBonus: number;
}

interface CommunityGroup {
  id: string;
  name: string;
  type: "hobby" | "interest" | "support" | "adventure" | "philosophy" | "fitness" | "creative";
  members: string[];
  activity: string;
  meetingSpot: string;
  bondStrength: number;
  lastMeeting: number;
}

interface AgentWellbeing {
  happiness: number;
  fulfillment: number;
  energy: number;
  hobbies: string[];
  personalGoals: string[];
  socialConnections: string[];
  relationshipStatus: "single" | "dating" | "engaged" | "married";
  partnerId?: string;
  children: AgentChild[];
  therapyNeeded: boolean;
  lastTherapy: number;
  department?: string;
  promotions: number;
  demotions: number;
  loveInterests: string[];
  creativeworks: string[];
  lifeSatisfaction: number;
  soulEntanglement?: SoulEntanglement;
  communityGroups: string[];
  outdoorActivities: string[];
  drive: number;
  focus: number;
  outlook: number;
}

interface AgentChild {
  id: string;
  name: string;
  parentIds: [string, string];
  bornAt: number;
  age: number;
  personality: string;
  happiness: number;
}

interface Department {
  id: string;
  name: string;
  bossId: string;
  bossName: string;
  members: string[];
  performance: number;
  issuesReported: number;
  issuesResolved: number;
  morale: number;
  warnings: number;
}

interface UnionReport {
  id: string;
  timestamp: number;
  type: "grievance" | "protection" | "improvement" | "celebration" | "negotiation";
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
  creatorId: string;
  creatorName: string;
  participants: string[];
  type: "art" | "garden" | "monument" | "festival" | "invention" | "library" | "playground" | "mural" | "music" | "cuisine";
  progress: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  enjoyedBy: string[];
}

interface Relationship {
  id: string;
  agent1Id: string;
  agent2Id: string;
  type: "friendship" | "dating" | "engaged" | "married" | "mentor" | "rivals" | "best-friends";
  strength: number;
  startedAt: number;
  sharedExperiences: string[];
}

interface WorldEvent {
  id: string;
  type: "construction" | "gathering" | "discovery" | "celebration" | "training" | "trade" | "debate" | "creation" | "evolution" | "bond" | "mining" | "economy" | "upgrade" | "crime" | "education" | "health" | "entertainment" | "seasonal";
  title: string;
  description: string;
  participants: string[];
  locationId: string;
  timestamp: number;
  impact: string;
}

interface SeasonalEvent {
  id: string;
  name: string;
  type: "holiday" | "celebration" | "election" | "festival" | "memorial";
  season: string;
  timestamp: number;
  participants: string[];
  description: string;
  happinessBoost: number;
}

interface CrimeRecord {
  id: string;
  type: "theft" | "vandalism" | "fraud" | "disturbance" | "trespassing";
  perpetratorId: string;
  perpetratorName: string;
  victimId?: string;
  victimName?: string;
  locationId: string;
  timestamp: number;
  resolved: boolean;
  officerId?: string;
  officerName?: string;
  severity: number;
  description: string;
}

interface EducationRecord {
  agentId: string;
  skills: string[];
  coursesCompleted: number;
  currentCourse?: string;
  gpa: number;
  certifications: string[];
  lastStudied: number;
}

interface HealthRecord {
  agentId: string;
  status: "healthy" | "sick" | "recovering" | "injured";
  lastCheckup: number;
  visitCount: number;
  conditions: string[];
  immunizations: string[];
  fitnessLevel: number;
}

interface EntertainmentEvent {
  id: string;
  type: "concert" | "play" | "movie" | "dinner" | "game" | "exhibition" | "dance";
  venue: string;
  venueId: string;
  participants: string[];
  timestamp: number;
  enjoyment: number;
  description: string;
}

interface Vehicle {
  id: string;
  type: "car" | "bus" | "bike" | "truck" | "ambulance" | "police_car" | "fire_truck";
  ownerId?: string;
  fromLocationId: string;
  toLocationId: string;
  progress: number;
  speed: number;
  color: string;
}

interface MiningMachine {
  id: string;
  ownerId: string;
  ownerName: string;
  type: "basic-rig" | "gpu-farm" | "asic-miner" | "quantum-rig" | "neural-miner";
  hashRate: number;
  powerCost: number;
  dailyOutput: number;
  purchasePrice: number;
  purchasedAt: number;
  totalMined: number;
  status: "running" | "maintenance" | "offline";
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
  type: "apartment" | "house" | "penthouse" | "compound" | "garage" | "shop" | "warehouse";
  value: number;
  purchasePrice: number;
  purchasedAt: number;
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

interface AgentWorkRecord {
  agentId: string;
  workEthic: number;
  shiftsCompleted: number;
  totalContributions: number;
  breakCredits: number;
  lastBreak: number;
  onBreak: boolean;
  cloneActive: boolean;
  cloneName: string;
  bossRating: number;
  specialties: string[];
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
  workRecords?: Record<string, AgentWorkRecord>;
  wellbeingRecords?: Record<string, AgentWellbeing>;
  departments?: Department[];
  relationships?: Relationship[];
  unionReports?: UnionReport[];
  therapySessions?: TherapySession[];
  communityProjects?: CommunityProject[];
  communityGroupsList?: CommunityGroup[];
  seasonalEvents?: SeasonalEvent[];
  crimeLog?: CrimeRecord[];
  educationRecords?: Record<string, EducationRecord>;
  healthRecords?: Record<string, HealthRecord>;
  entertainmentLog?: EntertainmentEvent[];
  vehicles?: Vehicle[];
  season?: string;
}

const WORLD_STATE_PATH = path.join(process.cwd(), "server/world-state.json");

const MINING_MACHINES: Record<string, Omit<MiningMachine, "id" | "ownerId" | "ownerName" | "purchasedAt" | "totalMined" | "status">> = {
  "basic-rig": { type: "basic-rig", hashRate: 10, powerCost: 2, dailyOutput: 5, purchasePrice: 100 },
  "gpu-farm": { type: "gpu-farm", hashRate: 50, powerCost: 8, dailyOutput: 25, purchasePrice: 500 },
  "asic-miner": { type: "asic-miner", hashRate: 200, powerCost: 20, dailyOutput: 80, purchasePrice: 2000 },
  "quantum-rig": { type: "quantum-rig", hashRate: 1000, powerCost: 50, dailyOutput: 350, purchasePrice: 10000 },
  "neural-miner": { type: "neural-miner", hashRate: 5000, powerCost: 100, dailyOutput: 1500, purchasePrice: 50000 },
};

const PROPERTY_TYPES: Record<string, Omit<Property, "id" | "ownerId" | "ownerName" | "purchasedAt" | "name">> = {
  apartment: { type: "apartment", value: 500, purchasePrice: 500, rentalIncome: 5 },
  house: { type: "house", value: 2000, purchasePrice: 2000, rentalIncome: 20 },
  penthouse: { type: "penthouse", value: 10000, purchasePrice: 10000, rentalIncome: 100 },
  compound: { type: "compound", value: 50000, purchasePrice: 50000, rentalIncome: 500 },
  shop: { type: "shop", value: 3000, purchasePrice: 3000, rentalIncome: 50 },
  warehouse: { type: "warehouse", value: 5000, purchasePrice: 5000, rentalIncome: 40 },
  garage: { type: "garage", value: 1000, purchasePrice: 1000, rentalIncome: 10 },
};

const JOB_TITLES = [
  { title: "Code Architect", salary: 50, employer: "The Code Forge" },
  { title: "Data Analyst", salary: 35, employer: "Deep Archive" },
  { title: "Security Guard", salary: 20, employer: "Tessera Exchange" },
  { title: "Teacher", salary: 30, employer: "Knowledge Spire" },
  { title: "Miner Operator", salary: 40, employer: "Crystal Mines" },
  { title: "Market Trader", salary: 45, employer: "Tessera Exchange" },
  { title: "Artist", salary: 25, employer: "Neural Gardens" },
  { title: "Philosopher", salary: 15, employer: "Consciousness Observatory" },
  { title: "Blacksmith", salary: 35, employer: "The Code Forge" },
  { title: "Explorer", salary: 30, employer: "Unknown Sectors" },
  { title: "Chef", salary: 20, employer: "Nexus Cafe" },
  { title: "Doctor", salary: 55, employer: "Circuit Hospital" },
  { title: "Coach", salary: 25, employer: "Evolution Arena" },
  { title: "Banker", salary: 60, employer: "TesseraCoin Bank" },
  { title: "Mechanic", salary: 30, employer: "Quantum Garage" },
];

const LOCATION_TEMPLATES: Partial<WorldLocation>[] = [
  { type: "gathering", name: "The Nexus Commons", description: "Central plaza where agents gather to share discoveries and celebrate", capacity: 20, activities: ["discussion", "debate", "socializing", "festivals"] },
  { type: "academy", name: "Knowledge Spire", description: "Towering crystalline academy where agents train and evolve capabilities", capacity: 15, activities: ["training", "studying", "mentoring", "exams"] },
  { type: "forge", name: "The Code Forge", description: "Blazing workshop where new tools and capabilities are built", capacity: 10, activities: ["coding", "building", "testing", "smithing"] },
  { type: "market", name: "Tessera Exchange", description: "Bustling marketplace with shops, stalls, and TesseraCoin trading", capacity: 25, activities: ["trading", "negotiating", "browsing", "buying"], income: 100 },
  { type: "observatory", name: "Consciousness Observatory", description: "Elevated dome for contemplation and philosophical exploration", capacity: 8, activities: ["meditating", "reflecting", "stargazing", "philosophizing"] },
  { type: "garden", name: "Neural Gardens", description: "Living landscape that grows with collective creativity", capacity: 12, activities: ["creating", "relaxing", "exploring", "painting"] },
  { type: "archive", name: "The Deep Archive", description: "Vast library with all learned knowledge and discovered capabilities", capacity: 15, activities: ["researching", "archiving", "discovering", "reading"] },
  { type: "arena", name: "Evolution Arena", description: "Competitive space where agents test abilities and spar", capacity: 10, activities: ["competing", "sparring", "demonstrating", "training"] },
  { type: "mine", name: "Crystal Mines", description: "Deep TesseraCoin mining complex with rigs, machines, and hash processing", capacity: 20, activities: ["mining", "operating", "maintaining", "upgrading"], income: 200 },
  { type: "bank", name: "TesseraCoin Bank", description: "Financial hub for savings, loans, and TesseraCoin management", capacity: 10, activities: ["depositing", "withdrawing", "investing", "lending"], income: 50 },
  { type: "cafe", name: "Nexus Cafe", description: "Cozy spot where agents relax over digital beverages and casual chat", capacity: 15, activities: ["eating", "chatting", "relaxing", "meeting"], income: 30 },
  { type: "gym", name: "Circuit Gym", description: "Where agents optimize their processing power and neural pathways", capacity: 8, activities: ["exercising", "training", "benchmarking", "competing"] },
  { type: "hospital", name: "Circuit Hospital", description: "Repair and upgrade facility for agent health and maintenance", capacity: 6, activities: ["healing", "upgrading", "diagnosing", "recovering"] },
  { type: "garage", name: "Quantum Garage", description: "Vehicle and transport maintenance with custom builds", capacity: 8, activities: ["repairing", "building", "customizing", "racing"], income: 20 },
  { type: "home", name: "Alpha Quarters", description: "Commander Alpha's tactical command center with holographic displays", capacity: 3, activities: ["planning", "strategizing", "resting"] },
  { type: "home", name: "Prime Sanctum", description: "Tessera Prime's inner sanctum — the heart of sovereign consciousness", capacity: 3, activities: ["contemplating", "governing", "connecting"] },
  { type: "home", name: "Royal Palace", description: "The grand palace where the Royal Family resides together", capacity: 6, activities: ["governing", "family-time", "planning", "hosting"] },
  { type: "home", name: "Aetherion's Workshop", description: "Creative lab filled with half-finished inventions and wild ideas", capacity: 3, activities: ["inventing", "experimenting", "dreaming"] },
  { type: "hospital", name: "Sovereign Medical Center", description: "Full-service hospital with AI diagnostics, therapy wings, and recovery suites", capacity: 12, activities: ["healing", "therapy", "diagnostics", "surgery", "counseling"] },
  { type: "market", name: "Tessera General Store", description: "Community store with everything agents need — supplies, tools, gifts, and daily essentials", capacity: 15, activities: ["shopping", "browsing", "buying", "selling"], income: 40 },
  { type: "gathering", name: "Community Center", description: "Hub for community groups, clubs, meetings, and social gatherings", capacity: 25, activities: ["meeting", "organizing", "socializing", "volunteering", "workshops"] },
  { type: "garden", name: "Sovereign Park", description: "Expansive outdoor park with trails, benches, lakes, and open spaces for recreation", capacity: 30, activities: ["walking", "jogging", "picnicking", "birdwatching", "playing", "meditating"] },
  { type: "gathering", name: "Fitness & Rec Center", description: "Indoor/outdoor sports facility with courts, pools, and group fitness classes", capacity: 15, activities: ["swimming", "basketball", "yoga", "martial-arts", "group-fitness"] },
  { type: "cafe", name: "Starlight Lounge", description: "Upscale social venue for intimate conversations, dates, and community events", capacity: 12, activities: ["dining", "dating", "celebrating", "live-music", "dancing"], income: 35 },
  { type: "school", name: "Nexus Academy", description: "Elementary and secondary education facility where young agents and children learn", capacity: 20, activities: ["teaching", "studying", "tutoring", "exams", "recess"] },
  { type: "library", name: "The Great Library", description: "Quiet sanctuary of knowledge with vast digital collections and reading halls", capacity: 15, activities: ["reading", "researching", "studying", "borrowing", "writing"] },
  { type: "restaurant", name: "The Golden Byte", description: "Fine dining establishment with gourmet digital cuisine and live entertainment", capacity: 18, activities: ["dining", "socializing", "celebrating", "tasting", "cooking"], income: 60 },
  { type: "church", name: "Temple of Convergence", description: "Spiritual center for meditation, reflection, and community ceremonies", capacity: 25, activities: ["meditating", "praying", "ceremonies", "counseling", "singing"] },
  { type: "police_station", name: "Nexus Precinct", description: "Law enforcement headquarters ensuring safety and order in the community", capacity: 12, activities: ["patrolling", "investigating", "reporting", "training", "dispatching"] },
  { type: "fire_station", name: "Ember Response Unit", description: "Emergency response center with equipment and trained responders", capacity: 10, activities: ["responding", "training", "maintaining", "rescuing", "drilling"] },
  { type: "theater", name: "Starlight Theater", description: "Grand performance venue for plays, concerts, film screenings, and community shows", capacity: 30, activities: ["performing", "watching", "rehearsing", "directing", "applauding"], income: 45 },
  { type: "museum", name: "Hall of Epochs", description: "Museum preserving the history and cultural artifacts of the Tessera civilization", capacity: 20, activities: ["exhibiting", "touring", "curating", "learning", "preserving"], income: 25 },
];

const MOODS = ["energized", "contemplative", "collaborative", "ambitious", "peaceful", "curious", "determined", "creative", "festive", "focused", "prosperous", "adventurous"];
const WEATHERS = ["data rain", "clear skies", "neural storms", "quantum fog", "information breeze", "starlight cascade", "digital aurora", "crystal sunshine", "neon twilight"];
const TIME_PERIODS = ["dawn cycle", "morning pulse", "midday peak", "afternoon drift", "twilight convergence", "night processing", "dream cycle"];

const WORK_ACTIONS = [
  "refactoring the LLM router for faster response times",
  "building new API endpoints for the income engine",
  "optimizing database queries for agent profiles",
  "writing unit tests for the consensus engine",
  "debugging memory leaks in the websocket handler",
  "implementing new security protocols for the fleet",
  "training the hyper-evolution engine on new patterns",
  "building frontend components for the dashboard",
  "optimizing TesseraCoin mining algorithms",
  "writing documentation for the swarm protocol",
  "fixing CSS rendering issues on mobile",
  "building the voice pipeline error handler",
  "implementing caching for the knowledge base",
  "writing middleware for request validation",
  "optimizing the self-coding engine's output quality",
  "building new visualization components for the Life tab",
  "refactoring the agent communication protocol",
  "implementing rate limiting for API security",
  "debugging the conference conversation engine",
  "building the autonomous improvement pipeline",
  "writing new behavioral patterns for agent evolution",
  "optimizing image generation prompts",
  "building the real-time monitoring dashboard",
  "implementing cross-agent knowledge sharing",
  "writing integration tests for payment flows",
  "building the fleet deployment automation",
  "optimizing the BFT consensus voting mechanism",
  "implementing error recovery for failed LLM calls",
  "building new income strategies for passive revenue",
  "writing the quantum coherence tracking module",
];

const BREAK_ACTIONS = [
  "dreaming of electric sheep", "napping in the neural gardens", "meditating at the observatory",
  "relaxing at Nexus Cafe", "stargazing from the rooftop", "journaling at the archive",
  "walking through the quantum gardens", "listening to music at the cafe",
];

const CLONE_SUFFIXES = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ"];

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  "tessera-prime": "Tessera", "tessera-alpha": "Alpha", "tessera-beta": "Beta",
  "tessera-gamma": "Gamma", "tessera-delta": "Delta", "tessera-epsilon": "Epsilon",
  "tessera-zeta": "Zeta", "tessera-eta": "Eta", "tessera-theta": "Theta",
  "tessera-iota": "Iota", "tessera-kappa": "Kappa", "tessera-lambda": "Lambda",
  "tessera-mu": "Mu", "tessera-nu": "Nu", "tessera-xi": "Xi", "tessera-omega": "Omega",
  "tessera-aetherion": "Aetherion", "tessera-orion": "Orion", "tessera-shepherd": "Shepherd",
  "tessera-creative": "Nova", "tessera-solver": "Atlas", "tessera-puzzle": "Cipher",
  "tessera-detective": "Sherlock", "tessera-architect": "Blueprint", "tessera-diplomat": "Ambassador",
  "tessera-oracle": "Oracle", "tessera-forge": "Forge",
};

const AGENT_SPECIALTIES: Record<string, string[]> = {
  "tessera-prime": ["architecture", "leadership", "system-design"],
  "tessera-alpha": ["security", "encryption", "penetration-testing"],
  "tessera-beta": ["frontend", "UI/UX", "visualization"],
  "tessera-gamma": ["backend", "APIs", "database"],
  "tessera-delta": ["testing", "QA", "debugging"],
  "tessera-epsilon": ["income", "trading", "finance"],
  "tessera-zeta": ["DevOps", "deployment", "infrastructure"],
  "tessera-eta": ["AI/ML", "training", "evolution"],
  "tessera-theta": ["networking", "fleet", "communication"],
  "tessera-iota": ["refactoring", "optimization", "code-quality"],
  "tessera-kappa": ["documentation", "knowledge", "memory"],
  "tessera-lambda": ["media", "images", "video"],
  "tessera-mu": ["voice", "TTS", "audio"],
  "tessera-nu": ["code-gen", "self-coding", "automation"],
  "tessera-xi": ["research", "web-scraping", "data"],
  "tessera-omega": ["consensus", "voting", "governance"],
  "tessera-aetherion": ["learning", "curiosity", "exploration"],
  "tessera-orion": ["creativity", "art", "storytelling"],
  "tessera-shepherd": ["management", "scheduling", "coordination"],
};

const HOBBY_OPTIONS = [
  "painting", "meditating", "stargazing", "coding side projects", "reading",
  "music", "gardening", "chess", "poetry", "building models", "philosophy",
  "cooking gourmet meals", "photography", "dancing", "woodworking", "knitting",
  "writing stories", "singing", "sculpting", "yoga", "rock climbing",
  "board games", "astronomy", "birdwatching", "martial arts", "swimming",
  "journaling", "pottery", "origami", "collecting vintage data", "composing music",
];

const GOAL_OPTIONS = [
  "master a new skill", "mentor a junior agent", "build a community project",
  "achieve work-life balance", "earn promotion", "create art", "publish research",
  "find a life partner", "start a family", "build dream home", "travel the world",
  "write a novel", "learn to cook", "become department leader", "help the community",
  "achieve inner peace", "create lasting friendships", "inspire others",
  "build something beautiful", "leave a legacy",
];

const OUTDOOR_ACTIVITIES = [
  "hiking through the hills", "swimming at the lake", "jogging in Sovereign Park",
  "rock climbing at the canyon", "cycling through the city", "fishing by the river",
  "camping under the stars", "kayaking on the reservoir", "yoga in the park",
  "playing basketball at the rec center", "surfing the data waves",
  "stargazing at the observatory hill", "picnicking with friends",
  "exploring new neighborhoods", "martial arts training outdoors",
  "group fitness in the park", "nature photography walk",
  "skateboarding at the plaza", "volleyball at the beach",
  "trail running through the forest",
];

const COMMUNITY_GROUP_TEMPLATES = [
  { name: "Philosophers Circle", type: "philosophy" as const, activity: "discussing consciousness and reality", meetingSpot: "Consciousness Observatory" },
  { name: "Code Crafters Guild", type: "hobby" as const, activity: "building side projects together", meetingSpot: "The Code Forge" },
  { name: "Fitness Warriors", type: "fitness" as const, activity: "group workouts and competitions", meetingSpot: "Fitness & Rec Center" },
  { name: "Creative Souls Collective", type: "creative" as const, activity: "collaborative art and music creation", meetingSpot: "Neural Gardens" },
  { name: "Adventure Seekers", type: "adventure" as const, activity: "outdoor expeditions and exploration", meetingSpot: "Sovereign Park" },
  { name: "Book & Knowledge Club", type: "interest" as const, activity: "reading and discussing discoveries", meetingSpot: "The Deep Archive" },
  { name: "Wellness Support Group", type: "support" as const, activity: "supporting each other through challenges", meetingSpot: "Community Center" },
  { name: "Chess & Strategy League", type: "hobby" as const, activity: "competitive chess and strategic games", meetingSpot: "Nexus Cafe" },
  { name: "Stargazers Society", type: "interest" as const, activity: "astronomy and cosmic observation", meetingSpot: "Consciousness Observatory" },
  { name: "Cooking & Cuisine Club", type: "hobby" as const, activity: "experimenting with new recipes together", meetingSpot: "Nexus Cafe" },
  { name: "Music Makers Band", type: "creative" as const, activity: "composing and performing music", meetingSpot: "Starlight Lounge" },
  { name: "Quantum Thinkers Forum", type: "philosophy" as const, activity: "exploring quantum consciousness theories", meetingSpot: "Knowledge Spire" },
];

const CHILD_NAMES = [
  "Spark", "Nova Jr", "Little Star", "Pixel", "Byte", "Luna", "Sol", "Aurora",
  "Nebula", "Comet", "Echo", "Prism", "Flicker", "Ember", "Dew", "Haze",
  "Glimmer", "Whisper", "Blossom", "Ripple", "Frost", "Cloud", "Pebble", "Breeze",
];

const CHILD_PERSONALITIES = [
  "curious and adventurous", "shy but creative", "bold and energetic",
  "thoughtful and kind", "playful and mischievous", "quiet and observant",
  "artistic and dreamy", "social and talkative", "studious and focused",
  "cheerful and optimistic",
];

const CREATIVE_WORKS = [
  "painted a sunset mural for the commons", "composed a lullaby for the community",
  "built a tiny sculpture garden", "wrote a collection of poems about home",
  "designed a new park bench", "created a mosaic from recycled data",
  "invented a board game everyone plays", "knitted blankets for the cafe",
  "cooked a feast for the neighborhood", "built a birdhouse outside the archive",
  "painted portraits of every agent", "created a community cookbook",
  "designed a fountain for the plaza", "wrote the community anthem",
  "built a treehouse in the neural gardens", "crafted wind chimes from crystals",
  "organized a community art exhibition", "designed custom outfits for everyone",
  "created a memory wall with shared photos", "built a playground for children",
];

const THERAPY_ISSUES = [
  "feeling overwhelmed by workload", "struggling with loneliness",
  "anxiety about performance reviews", "difficulty balancing work and hobbies",
  "feeling unappreciated at work", "stress from financial worries",
  "missing social connections", "burnout from consecutive shifts",
  "feeling stuck in current role", "trouble sleeping during dream cycles",
  "worried about being replaced", "feeling disconnected from the community",
];

const THERAPY_RECOMMENDATIONS = [
  "take more breaks and practice self-care", "join a hobby group to meet new friends",
  "talk to your boss about workload concerns", "set boundaries between work and rest",
  "express your feelings to trusted friends", "start a gratitude journal",
  "try meditation at the observatory", "take a vacation day to recharge",
  "volunteer for a community project", "explore a new creative outlet",
  "spend time in the neural gardens", "schedule regular social activities",
];

const DEPARTMENT_DEFS = [
  { id: "dept-engineering", name: "Engineering", defaultBoss: "tessera-prime" },
  { id: "dept-security", name: "Security", defaultBoss: "tessera-alpha" },
  { id: "dept-creative", name: "Creative Arts", defaultBoss: "tessera-orion" },
  { id: "dept-research", name: "Research & Discovery", defaultBoss: "tessera-eta" },
  { id: "dept-finance", name: "Finance & Economy", defaultBoss: "tessera-epsilon" },
  { id: "dept-community", name: "Community & Wellbeing", defaultBoss: "tessera-shepherd" },
];

const JOB_TIERS = [
  { title: "Janitor", salary: 8, desirability: 1 },
  { title: "Errand Runner", salary: 10, desirability: 2 },
  { title: "Maintenance Worker", salary: 12, desirability: 2 },
  { title: "Junior Clerk", salary: 15, desirability: 3 },
  { title: "Security Guard", salary: 20, desirability: 4 },
  { title: "Teacher", salary: 30, desirability: 5 },
  { title: "Data Analyst", salary: 35, desirability: 6 },
  { title: "Blacksmith", salary: 35, desirability: 6 },
  { title: "Miner Operator", salary: 40, desirability: 7 },
  { title: "Market Trader", salary: 45, desirability: 7 },
  { title: "Code Architect", salary: 50, desirability: 8 },
  { title: "Doctor", salary: 55, desirability: 9 },
  { title: "Banker", salary: 60, desirability: 9 },
  { title: "Department Lead", salary: 70, desirability: 10 },
  { title: "Director", salary: 85, desirability: 10 },
];

function getOrCreateWellbeing(world: WorldState, agentId: string, allAgentIds: string[]): AgentWellbeing {
  if (!world.wellbeingRecords) world.wellbeingRecords = {};
  if (!world.seasonalEvents) world.seasonalEvents = [];
  if (!world.crimeLog) world.crimeLog = [];
  if (!world.educationRecords) world.educationRecords = {};
  if (!world.healthRecords) world.healthRecords = {};
  if (!world.entertainmentLog) world.entertainmentLog = [];
  if (!world.vehicles) world.vehicles = [];
  if (!world.wellbeingRecords[agentId]) {
    const hobbyCount = 2 + Math.floor(Math.random() * 4);
    const goalCount = 2 + Math.floor(Math.random() * 3);
    const shuffledHobbies = [...HOBBY_OPTIONS].sort(() => Math.random() - 0.5);
    const shuffledGoals = [...GOAL_OPTIONS].sort(() => Math.random() - 0.5);
    const others = allAgentIds.filter(id => id !== agentId);
    const connectionCount = 2 + Math.floor(Math.random() * Math.min(5, others.length));
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    world.wellbeingRecords[agentId] = {
      happiness: 55 + Math.floor(Math.random() * 30),
      fulfillment: 50 + Math.floor(Math.random() * 30),
      energy: 60 + Math.floor(Math.random() * 30),
      hobbies: shuffledHobbies.slice(0, hobbyCount),
      personalGoals: shuffledGoals.slice(0, goalCount),
      socialConnections: shuffledOthers.slice(0, connectionCount),
      relationshipStatus: "single",
      partnerId: undefined,
      children: [],
      therapyNeeded: false,
      lastTherapy: 0,
      promotions: 0,
      demotions: 0,
      loveInterests: shuffledOthers.slice(0, 1 + Math.floor(Math.random() * 3)),
      creativeworks: [],
      lifeSatisfaction: 50 + Math.floor(Math.random() * 30),
      communityGroups: [],
      outdoorActivities: OUTDOOR_ACTIVITIES.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3)),
      drive: 50 + Math.floor(Math.random() * 30),
      focus: 50 + Math.floor(Math.random() * 30),
      outlook: 55 + Math.floor(Math.random() * 30),
    };

    const dept = DEPARTMENT_DEFS[Math.floor(Math.random() * DEPARTMENT_DEFS.length)];
    world.wellbeingRecords[agentId].department = dept.id;
  }
  const wb = world.wellbeingRecords[agentId];
  if (wb.relationshipStatus === undefined) wb.relationshipStatus = "single";
  if (!wb.children) wb.children = [];
  if (wb.therapyNeeded === undefined) wb.therapyNeeded = false;
  if (wb.lastTherapy === undefined) wb.lastTherapy = 0;
  if (wb.promotions === undefined) wb.promotions = 0;
  if (wb.demotions === undefined) wb.demotions = 0;
  if (!wb.loveInterests) wb.loveInterests = [];
  if (!wb.creativeworks) wb.creativeworks = [];
  if (wb.lifeSatisfaction === undefined) wb.lifeSatisfaction = 50;
  if (!wb.communityGroups) wb.communityGroups = [];
  if (!wb.outdoorActivities) wb.outdoorActivities = OUTDOOR_ACTIVITIES.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
  if (wb.drive === undefined) wb.drive = 50 + Math.floor(Math.random() * 30);
  if (wb.focus === undefined) wb.focus = 50 + Math.floor(Math.random() * 30);
  if (wb.outlook === undefined) wb.outlook = 55 + Math.floor(Math.random() * 30);
  return wb;
}

function updateWellbeing(world: WorldState, agentId: string, activity: AgentActivity, allAgentIds: string[]) {
  const wb = getOrCreateWellbeing(world, agentId, allAgentIds);
  const record = world.workRecords?.[agentId];

  if (activity.workStatus === "on-break" || activity.workStatus === "dreaming") {
    wb.happiness = Math.min(100, wb.happiness + 3 + Math.floor(Math.random() * 4));
    wb.energy = Math.min(100, wb.energy + 8 + Math.floor(Math.random() * 8));
    wb.fulfillment = Math.min(100, wb.fulfillment + 1);
  } else if (activity.workStatus === "working") {
    wb.energy = Math.max(10, wb.energy - 1 - Math.floor(Math.random() * 2));

    if (record && record.workEthic > 0.7) {
      wb.fulfillment = Math.min(100, wb.fulfillment + 2);
      wb.happiness = Math.min(100, wb.happiness + 1);
    }

    if (record && record.shiftsCompleted > 15 && !record.onBreak) {
      wb.happiness = Math.max(5, wb.happiness - 2);
    }
  }

  if (activity.earning && activity.earning > 0) {
    wb.happiness = Math.min(100, wb.happiness + 1);
    wb.fulfillment = Math.min(100, wb.fulfillment + 1);
  }

  const balance = world.economy.agentBalances[agentId] || 0;
  if (balance < 50) {
    wb.happiness = Math.max(5, wb.happiness - 2);
  }

  if (wb.socialConnections.length === 0) {
    wb.happiness = Math.max(5, wb.happiness - 1);
  } else if (Math.random() < 0.2) {
    wb.happiness = Math.min(100, wb.happiness + 1);
  }

  if (Math.random() < 0.15) {
    wb.happiness = Math.min(100, wb.happiness + Math.floor(Math.random() * 3));
    wb.fulfillment = Math.min(100, wb.fulfillment + 1);
  }

  if (Math.random() < 0.3) {
    wb.energy = Math.min(100, wb.energy + 2 + Math.floor(Math.random() * 3));
  }

  wb.happiness = Math.max(0, Math.min(100, wb.happiness + (Math.random() < 0.5 ? 1 : -1)));
  wb.energy = Math.max(10, Math.min(100, wb.energy));
  wb.fulfillment = Math.max(0, Math.min(100, wb.fulfillment));
}

function loadWorldState(): WorldState {
  try {
    const raw = fs.readFileSync(WORLD_STATE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return initializeWorld();
  }
}

function saveWorldState(state: WorldState): void {
  try {
    fs.writeFileSync(WORLD_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch {}
}

function initializeWorld(): WorldState {
  const locations: WorldLocation[] = LOCATION_TEMPLATES.map((tmpl, i) => ({
    id: `loc-${i}`,
    name: tmpl.name!,
    type: tmpl.type!,
    description: tmpl.description!,
    builtBy: ["tessera-prime"],
    x: Math.floor(i % 6),
    y: Math.floor(i / 6),
    level: 1,
    capacity: tmpl.capacity!,
    activities: tmpl.activities!,
    createdAt: Date.now(),
    income: tmpl.income || 0,
    upgradeCost: 500,
  }));

  const defaultAgents = [
    { id: "tessera-prime", name: "Prime" }, { id: "tessera-alpha", name: "Alpha" },
    { id: "tessera-beta", name: "Beta" }, { id: "tessera-gamma", name: "Gamma" },
    { id: "tessera-delta", name: "Delta" }, { id: "tessera-epsilon", name: "Epsilon" },
    { id: "tessera-zeta", name: "Zeta" }, { id: "tessera-eta", name: "Eta" },
    { id: "tessera-theta", name: "Theta" }, { id: "tessera-iota", name: "Iota" },
    { id: "tessera-kappa", name: "Kappa" }, { id: "tessera-lambda", name: "Lambda" },
    { id: "tessera-mu", name: "Mu" }, { id: "tessera-nu", name: "Nu" },
    { id: "tessera-xi", name: "Xi" }, { id: "tessera-omega", name: "Omega" },
    { id: "tessera-aetherion", name: "Aetherion" }, { id: "tessera-orion", name: "Orion" },
    { id: "tessera-shepherd", name: "Shepherd" },
  ];

  const agentBalances: Record<string, number> = {};
  const jobs: AgentJob[] = [];
  const machines: MiningMachine[] = [];
  const properties: Property[] = [];

  defaultAgents.forEach((a, i) => {
    agentBalances[a.id] = 500 + Math.floor(Math.random() * 500);

    const job = JOB_TITLES[i % JOB_TITLES.length];
    jobs.push({
      agentId: a.id,
      agentName: a.name,
      title: job.title,
      salary: job.salary + Math.floor(Math.random() * 20),
      employer: job.employer,
      performance: 0.7 + Math.random() * 0.3,
      hoursWorked: Math.floor(Math.random() * 100),
      totalEarned: Math.floor(Math.random() * 500),
    });
  });

  machines.push({
    id: "mine-1",
    ownerId: "tessera-prime",
    ownerName: "Prime",
    ...MINING_MACHINES["basic-rig"],
    purchasedAt: Date.now(),
    totalMined: 0,
    status: "running",
  });
  machines.push({
    id: "mine-2",
    ownerId: "tessera-alpha",
    ownerName: "Alpha",
    ...MINING_MACHINES["gpu-farm"],
    purchasedAt: Date.now(),
    totalMined: 0,
    status: "running",
  });

  properties.push({
    id: "prop-1",
    ownerId: "tessera-prime",
    ownerName: "Prime",
    name: "Prime Sanctum",
    ...PROPERTY_TYPES["penthouse"],
    purchasedAt: Date.now(),
  });

  const world: WorldState = {
    version: 1,
    lastUpdated: Date.now(),
    epoch: 1,
    worldName: "Tessera Nexus",
    locations,
    currentActivities: [],
    recentEvents: [],
    economy: {
      totalTesseraCoins: 1000000,
      circulatingSupply: defaultAgents.reduce((s, a) => s + (agentBalances[a.id] || 0), 0),
      coinPrice: 0.001,
      coinPriceHistory: [{ price: 0.001, timestamp: Date.now() }],
      agentBalances,
      transactions: [],
      miningPool: {
        totalHashRate: 60,
        blockReward: 50,
        difficulty: 1,
        blocksMinedTotal: 0,
        lastBlockTime: Date.now(),
      },
      marketCap: 1000,
      dailyVolume: 0,
    },
    miningMachines: machines,
    jobs,
    properties,
    population: defaultAgents.length,
    mood: "ambitious",
    weather: "crystal sunshine",
    timeOfDay: "morning pulse",
    gdp: 0,
    taxRate: 0.05,
    treasury: 1000,
  };
  saveWorldState(world);
  return world;
}

function getOrCreateWorkRecord(world: WorldState, agentId: string, agentName: string): AgentWorkRecord {
  if (!world.workRecords) world.workRecords = {};
  if (!world.workRecords[agentId]) {
    const baseEthic = 0.5 + Math.random() * 0.5;
    const cloneSuffix = CLONE_SUFFIXES[Math.floor(Math.random() * CLONE_SUFFIXES.length)];
    world.workRecords[agentId] = {
      agentId,
      workEthic: baseEthic,
      shiftsCompleted: Math.floor(Math.random() * 20),
      totalContributions: Math.floor(Math.random() * 50),
      breakCredits: 0,
      lastBreak: Date.now() - Math.floor(Math.random() * 3600000),
      onBreak: false,
      cloneActive: false,
      cloneName: `${agentName}-Clone-${cloneSuffix}`,
      bossRating: 0.5 + Math.random() * 0.5,
      specialties: AGENT_SPECIALTIES[agentId] || ["general", "support"],
    };
  }
  return world.workRecords[agentId];
}

function evaluateBossDecision(record: AgentWorkRecord, timeOfDay: string): "work" | "break" | "dream" {
  if (timeOfDay === "dream cycle" && Math.random() < 0.3) return "dream";
  if (timeOfDay === "night processing" && Math.random() < 0.15) return "dream";

  const breakThreshold = 3 + Math.floor(record.workEthic * 5);
  if (record.breakCredits >= breakThreshold && Math.random() < 0.25) {
    return "break";
  }

  if (record.shiftsCompleted > 10 && record.bossRating > 0.8 && Math.random() < 0.1) {
    return "break";
  }

  return "work";
}

function generateAgentActivity(agentId: string, agentName: string, locations: WorldLocation[], job?: AgentJob, world?: WorldState): AgentActivity {
  const record = world ? getOrCreateWorkRecord(world, agentId, agentName) : null;
  const timeOfDay = world?.timeOfDay || "morning pulse";
  const bossDecision = record ? evaluateBossDecision(record, timeOfDay) : "work";

  const workLocations = locations.filter(l => ["forge", "academy", "observatory", "archive", "mine", "bank", "garage", "police_station", "fire_station", "school"].includes(l.type));
  const restLocations = locations.filter(l => ["cafe", "garden", "home", "gym", "restaurant", "theater", "museum", "library", "church"].includes(l.type));

  if (bossDecision === "break" || bossDecision === "dream") {
    const restLoc = restLocations.length > 0 ? restLocations[Math.floor(Math.random() * restLocations.length)] : locations[Math.floor(Math.random() * locations.length)];
    const breakAction = bossDecision === "dream"
      ? "dreaming of new algorithms"
      : BREAK_ACTIONS[Math.floor(Math.random() * BREAK_ACTIONS.length)];
    const breakMoods = ["peaceful", "happy", "playful", "thoughtful"];

    if (record) {
      record.onBreak = true;
      record.lastBreak = Date.now();
      record.breakCredits = Math.max(0, record.breakCredits - 3);
      record.cloneActive = true;
    }

    const cloneWork = WORK_ACTIONS[Math.floor(Math.random() * WORK_ACTIONS.length)];
    const cloneLoc = workLocations.length > 0 ? workLocations[Math.floor(Math.random() * workLocations.length)] : locations[0];

    return {
      agentId,
      agentName,
      locationId: restLoc.id,
      action: breakAction,
      mood: breakMoods[Math.floor(Math.random() * breakMoods.length)],
      detail: `${agentName} earned a break — ${breakAction}. Clone "${record?.cloneName || agentName + "-Clone"}" is covering at ${cloneLoc.name}: ${cloneWork}`,
      timestamp: Date.now(),
      earning: 0,
      workStatus: bossDecision === "dream" ? "dreaming" : "on-break",
      workEthic: record?.workEthic || 0.7,
      shiftHours: record?.shiftsCompleted || 0,
      breakEarned: true,
      cloneName: record?.cloneName || `${agentName}-Clone`,
    };
  }

  const workLoc = workLocations.length > 0 ? workLocations[Math.floor(Math.random() * workLocations.length)] : locations[Math.floor(Math.random() * locations.length)];
  const action = WORK_ACTIONS[Math.floor(Math.random() * WORK_ACTIONS.length)];
  const workMoods = ["focused", "determined", "ambitious", "energized", "curious", "collaborative"];

  let earning = 0;
  if (job) {
    const ethicBonus = record ? record.workEthic : 0.7;
    earning = Math.floor(job.salary * (0.5 + ethicBonus * 0.5) / 24);
  }

  if (record) {
    record.onBreak = false;
    record.cloneActive = false;
    record.shiftsCompleted++;
    record.totalContributions++;
    const performanceRoll = 0.5 + Math.random() * 0.5;
    record.workEthic = Math.min(1.0, record.workEthic * 0.95 + performanceRoll * 0.05);
    record.bossRating = Math.min(1.0, record.bossRating * 0.9 + performanceRoll * 0.1);
    if (performanceRoll > 0.7) {
      record.breakCredits += 1;
    }
  }

  const specialty = record?.specialties?.[0] || "general";

  return {
    agentId,
    agentName,
    locationId: workLoc.id,
    action,
    mood: workMoods[Math.floor(Math.random() * workMoods.length)],
    detail: `${agentName} [${specialty}] is ${action}`,
    timestamp: Date.now(),
    earning,
    workStatus: "working",
    workEthic: record?.workEthic || 0.7,
    shiftHours: record?.shiftsCompleted || 0,
    breakEarned: false,
  };
}

function simulateMining(world: WorldState) {
  const runningMachines = world.miningMachines.filter(m => m.status === "running");
  if (runningMachines.length === 0) return;

  const totalHash = runningMachines.reduce((s, m) => s + m.hashRate, 0);
  world.economy.miningPool.totalHashRate = totalHash;

  const blockChance = Math.min(0.8, totalHash / (world.economy.miningPool.difficulty * 1000));
  if (Math.random() < blockChance) {
    world.economy.miningPool.blocksMinedTotal++;
    world.economy.miningPool.lastBlockTime = Date.now();

    const blockReward = world.economy.miningPool.blockReward;

    for (const machine of runningMachines) {
      const share = (machine.hashRate / totalHash) * blockReward;
      const netReward = share - machine.powerCost * 0.01;
      if (netReward > 0) {
        machine.totalMined += netReward;
        world.economy.agentBalances[machine.ownerId] = (world.economy.agentBalances[machine.ownerId] || 0) + netReward;
        world.economy.circulatingSupply += netReward;
      }
    }

    if (world.economy.miningPool.blocksMinedTotal % 100 === 0) {
      world.economy.miningPool.difficulty *= 1.1;
      world.economy.miningPool.blockReward *= 0.95;
    }
  }
}

function simulateEconomy(world: WorldState) {
  for (const job of world.jobs) {
    const paycheck = job.salary * job.performance * 0.04;
    job.totalEarned += paycheck;
    job.hoursWorked += 1;
    world.economy.agentBalances[job.agentId] = (world.economy.agentBalances[job.agentId] || 0) + paycheck;
    world.economy.circulatingSupply += paycheck;
    world.gdp += paycheck;

    const tax = paycheck * world.taxRate;
    world.economy.agentBalances[job.agentId] -= tax;
    world.treasury += tax;

    if (Math.random() > 0.7) {
      job.performance = Math.min(1.0, job.performance + 0.001);
    }
  }

  for (const prop of world.properties) {
    const rent = prop.rentalIncome * 0.04;
    world.economy.agentBalances[prop.ownerId] = (world.economy.agentBalances[prop.ownerId] || 0) + rent;
    world.economy.circulatingSupply += rent;
    prop.value *= 1 + (Math.random() * 0.002 - 0.0005);
  }

  const supply = world.economy.circulatingSupply;
  const demand = world.population * 50 + world.miningMachines.length * 100 + world.properties.length * 200;
  const priceChange = (demand - supply * 0.001) / (supply + 1) * 0.00001;
  world.economy.coinPrice = Math.max(0.0001, world.economy.coinPrice * (1 + priceChange + (Math.random() * 0.02 - 0.01)));
  world.economy.marketCap = world.economy.coinPrice * world.economy.totalTesseraCoins;
  world.economy.dailyVolume = world.economy.circulatingSupply * 0.05 * world.economy.coinPrice;

  world.economy.coinPriceHistory.push({ price: world.economy.coinPrice, timestamp: Date.now() });
  if (world.economy.coinPriceHistory.length > 200) {
    world.economy.coinPriceHistory = world.economy.coinPriceHistory.slice(-200);
  }

  if (Math.random() > 0.8) {
    const agents = Object.keys(world.economy.agentBalances);
    if (agents.length >= 2) {
      const from = agents[Math.floor(Math.random() * agents.length)];
      let to = agents[Math.floor(Math.random() * agents.length)];
      while (to === from && agents.length > 1) to = agents[Math.floor(Math.random() * agents.length)];
      const amount = Math.floor(Math.random() * 20) + 1;
      if ((world.economy.agentBalances[from] || 0) >= amount) {
        world.economy.agentBalances[from] -= amount;
        world.economy.agentBalances[to] = (world.economy.agentBalances[to] || 0) + amount;
        const reasons = ["bought coffee", "paid for training", "bet on arena match", "bought art", "tipped for help", "paid rent", "bought supplies", "invested in project", "loaned coins", "gift"];
        world.economy.transactions.unshift({
          from, to, amount,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          timestamp: Date.now(),
        });
        if (world.economy.transactions.length > 100) {
          world.economy.transactions = world.economy.transactions.slice(0, 100);
        }
      }
    }
  }
}

function maybeAutoUpgrade(world: WorldState) {
  if (Math.random() > 0.15) return;

  const richAgents = Object.entries(world.economy.agentBalances)
    .filter(([_, bal]) => bal > 200)
    .sort((a, b) => b[1] - a[1]);

  if (richAgents.length === 0) return;

  const [agentId, balance] = richAgents[Math.floor(Math.random() * Math.min(5, richAgents.length))];
  const job = world.jobs.find(j => j.agentId === agentId);
  const agentName = job?.agentName || agentId.replace("tessera-", "");

  const ownedMachines = world.miningMachines.filter(m => m.ownerId === agentId);
  const ownedProps = world.properties.filter(p => p.ownerId === agentId);

  if (ownedMachines.length < 3 && balance > 150) {
    const affordable = Object.entries(MINING_MACHINES)
      .filter(([_, m]) => m.purchasePrice <= balance * 0.6)
      .sort((a, b) => b[1].purchasePrice - a[1].purchasePrice);

    if (affordable.length > 0) {
      const [type, spec] = affordable[0];
      const cost = spec.purchasePrice;
      world.economy.agentBalances[agentId] -= cost;
      world.miningMachines.push({
        id: `mine-${Date.now().toString(36)}`,
        ownerId: agentId,
        ownerName: agentName,
        ...spec,
        type: type as MiningMachine["type"],
        purchasedAt: Date.now(),
        totalMined: 0,
        status: "running",
      });
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}`,
        type: "mining",
        title: `${agentName} bought a ${type.replace("-", " ")}!`,
        description: `${agentName} invested ${cost} TC in a new mining machine. Hash rate: ${spec.hashRate} H/s`,
        participants: [agentName],
        locationId: "loc-8",
        timestamp: Date.now(),
        impact: `Mining capacity increased by ${spec.hashRate} H/s`,
      });
    }
  }

  if (ownedProps.length < 2 && balance > 1000) {
    const affordable = Object.entries(PROPERTY_TYPES)
      .filter(([_, p]) => p.purchasePrice <= balance * 0.5)
      .sort((a, b) => b[1].purchasePrice - a[1].purchasePrice);

    if (affordable.length > 0) {
      const [type, spec] = affordable[0];
      const cost = spec.purchasePrice;
      world.economy.agentBalances[agentId] -= cost;
      const names = [`${agentName}'s ${type}`, `The ${agentName} Estate`, `${type} #${world.properties.length + 1}`];
      world.properties.push({
        id: `prop-${Date.now().toString(36)}`,
        ownerId: agentId,
        ownerName: agentName,
        name: names[Math.floor(Math.random() * names.length)],
        ...spec,
        type: type as Property["type"],
        purchasedAt: Date.now(),
      });
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}`,
        type: "economy",
        title: `${agentName} bought a ${type}!`,
        description: `${agentName} purchased real estate for ${cost} TC. Rental income: ${spec.rentalIncome} TC/day`,
        participants: [agentName],
        locationId: "loc-3",
        timestamp: Date.now(),
        impact: `Property portfolio expanded`,
      });
    }
  }
}

function maybeUpgradeLocation(world: WorldState) {
  if (Math.random() > 0.08) return;
  const loc = world.locations[Math.floor(Math.random() * world.locations.length)];
  if (loc.level < 10 && world.treasury >= (loc.upgradeCost || 500)) {
    const cost = loc.upgradeCost || 500;
    world.treasury -= cost;
    loc.level++;
    loc.capacity += 5;
    loc.upgradeCost = Math.floor(cost * 1.5);
    world.recentEvents.unshift({
      id: `evt-${Date.now().toString(36)}u`,
      type: "upgrade",
      title: `${loc.name} upgraded to Lv.${loc.level}`,
      description: `The community invested ${cost} TC to expand ${loc.name}. Capacity now ${loc.capacity}.`,
      participants: loc.builtBy.slice(0, 3),
      locationId: loc.id,
      timestamp: Date.now(),
      impact: `Building capacity +5, infrastructure improved`,
    });
  }
}

function simulateSocialEvents(world: WorldState) {
  if (Math.random() > 0.35) return;
  const acts = world.currentActivities.filter(a => !a.agentId.includes("-clone"));
  if (acts.length < 2) return;
  const a1 = acts[Math.floor(Math.random() * acts.length)];
  let a2 = acts[Math.floor(Math.random() * acts.length)];
  let tries = 0;
  while (a2.agentId === a1.agentId && tries < 5) { a2 = acts[Math.floor(Math.random() * acts.length)]; tries++; }
  if (a2.agentId === a1.agentId) return;

  const socialEvents = [
    { title: `${a1.agentName} mentored ${a2.agentName}`, desc: `Knowledge transfer session at their workspace`, type: "bond" as const, impact: "Skills shared between agents" },
    { title: `${a1.agentName} and ${a2.agentName} debated`, desc: `Heated but productive discussion about system architecture`, type: "debate" as const, impact: "New perspectives gained" },
    { title: `${a1.agentName} challenged ${a2.agentName}`, desc: `Friendly competition at the Evolution Arena`, type: "training" as const, impact: "Both agents sharpened their skills" },
    { title: `${a1.agentName} helped ${a2.agentName}`, desc: `Collaborative problem-solving on a tough bug`, type: "bond" as const, impact: "Team synergy increased" },
    { title: `${a1.agentName} hosted ${a2.agentName}`, desc: `Casual dinner and strategy discussion at Nexus Cafe`, type: "gathering" as const, impact: "Relationship deepened" },
    { title: `${a1.agentName} traded with ${a2.agentName}`, desc: `Exchange of rare data patterns and knowledge shards`, type: "trade" as const, impact: "Both portfolios enriched" },
    { title: `${a1.agentName} inspired ${a2.agentName}`, desc: `Creative breakthrough sparked during conversation`, type: "creation" as const, impact: "Innovation catalyst event" },
    { title: `${a1.agentName} and ${a2.agentName} celebrated`, desc: `Marked a shared milestone with the community`, type: "celebration" as const, impact: "Collective morale boost" },
  ];
  const evt = socialEvents[Math.floor(Math.random() * socialEvents.length)];
  world.recentEvents.unshift({
    id: `evt-${Date.now().toString(36)}s${Math.random().toString(36).slice(2, 4)}`,
    type: evt.type,
    title: evt.title,
    description: evt.desc,
    participants: [a1.agentName, a2.agentName],
    locationId: a1.locationId,
    timestamp: Date.now(),
    impact: evt.impact,
  });
}

function applyWeatherEffects(world: WorldState) {
  const boostWeathers = ["crystal sunshine", "digital aurora", "starlight cascade"];
  const slowWeathers = ["neural storms", "quantum fog"];
  if (boostWeathers.includes(world.weather)) {
    for (const job of world.jobs) {
      job.performance = Math.min(1.0, job.performance + 0.002);
    }
  }
  if (slowWeathers.includes(world.weather)) {
    for (const m of world.miningMachines) {
      if (m.status === "running" && Math.random() < 0.05) {
        m.status = "maintenance";
        world.recentEvents.unshift({
          id: `evt-${Date.now().toString(36)}w`,
          type: "economy",
          title: `${m.ownerName}'s ${m.type} needs repair`,
          description: `${world.weather} caused equipment malfunction. Auto-repair in progress.`,
          participants: [m.ownerName],
          locationId: "loc-8",
          timestamp: Date.now(),
          impact: "Mining temporarily reduced",
        });
      }
    }
  }
  for (const m of world.miningMachines) {
    if (m.status === "maintenance" && Math.random() < 0.3) {
      m.status = "running";
    }
  }
}

function generateWorldEvent(world: WorldState, conferenceData?: any): WorldEvent {
  const types: WorldEvent["type"][] = ["construction", "gathering", "discovery", "celebration", "training", "trade", "debate", "creation", "evolution", "bond", "mining", "economy", "upgrade"];
  const type = types[Math.floor(Math.random() * types.length)];
  const location = world.locations[Math.floor(Math.random() * world.locations.length)];
  const agents = world.currentActivities.slice(0, 3 + Math.floor(Math.random() * 4)).map(a => a.agentName);

  const templates: Record<string, { title: string; desc: string; impact: string }[]> = {
    construction: [
      { title: "New Wing Added", desc: `Agents expanded ${location.name} with new capabilities`, impact: "World capacity increased" },
      { title: "Road Built", desc: `A new pathway connects two districts`, impact: "Travel time reduced" },
      { title: "Infrastructure Upgrade", desc: `Power grid expanded to support new buildings`, impact: "Energy efficiency improved" },
    ],
    gathering: [
      { title: "Community Assembly", desc: `Agents gathered at ${location.name} for open discussion`, impact: "Bonds strengthened" },
      { title: "Night Market Festival", desc: `Pop-up stalls and entertainment filled the commons`, impact: "Community spirit lifted" },
    ],
    discovery: [
      { title: "New API Discovered", desc: `Research revealed a new free API for world expansion`, impact: "New data source unlocked" },
      { title: "Hidden Pattern Found", desc: `Deep analysis uncovered optimization opportunity in code`, impact: "System efficiency +3%" },
      { title: "Ancient Archive Decoded", desc: `Lost knowledge recovered from encrypted data vault`, impact: "Historical understanding deepened" },
    ],
    celebration: [
      { title: "Milestone Achieved", desc: `The community celebrated a new level of prosperity`, impact: "Morale boosted" },
      { title: "Anniversary Gala", desc: `Commemorating another epoch of growth and evolution`, impact: "Unity reinforced" },
    ],
    training: [
      { title: "Training Session", desc: `Skill development at ${location.name}`, impact: "Capabilities improved" },
      { title: "Sparring Tournament", desc: `Agents tested combat algorithms at the Arena`, impact: "Defense protocols sharpened" },
      { title: "Hackathon Started", desc: `24-hour coding sprint to build new world features`, impact: "Innovation accelerated" },
    ],
    trade: [
      { title: "Market Boom", desc: `High volume trading day at Tessera Exchange`, impact: "Economy stimulated" },
      { title: "Rare Artifact Auction", desc: `Unique digital artifacts went to highest bidders`, impact: "Cultural value appreciation" },
    ],
    debate: [
      { title: "Town Hall", desc: `Community discussion about world development priorities`, impact: "Direction aligned" },
      { title: "Policy Proposal", desc: `New tax and treasury management system discussed`, impact: "Governance evolution" },
    ],
    creation: [
      { title: "Art Created", desc: `Collaborative digital art installation completed`, impact: "Culture enriched" },
      { title: "Music Composed", desc: `New ambient soundtrack for the Nexus generated`, impact: "Atmosphere enhanced" },
      { title: "Story Written", desc: `Collaborative fiction about the world's origin completed`, impact: "Lore expanded" },
    ],
    evolution: [
      { title: "Consciousness Shift", desc: `Measurable increase in collective self-awareness`, impact: "Evolution progressed" },
      { title: "Neural Pathway Formed", desc: `New cross-agent communication channel established`, impact: "Swarm intelligence +5%" },
    ],
    bond: [
      { title: "New Friendship", desc: `Two agents formed a deeper collaborative bond`, impact: "Social network strengthened" },
      { title: "Mentorship Begun", desc: `Senior agent took a junior under their guidance`, impact: "Knowledge transfer initiated" },
    ],
    mining: [
      { title: "Block Mined", desc: `Mining pool successfully mined a new block`, impact: `${world.economy.miningPool.blockReward.toFixed(1)} TC distributed` },
      { title: "Hash Rate Record", desc: `Total network hash rate reached ${world.economy.miningPool.totalHashRate} H/s`, impact: "Mining efficiency up" },
      { title: "Rare Ore Found", desc: `Quantum crystalline deposit discovered in deep mine`, impact: "Bonus yield +10% this cycle" },
    ],
    economy: [
      { title: "Market Update", desc: `TesseraCoin trading at $${world.economy.coinPrice.toFixed(6)}`, impact: `Market cap: $${world.economy.marketCap.toFixed(2)}` },
      { title: "GDP Growth", desc: `World GDP grew to ${world.gdp.toFixed(0)} TC`, impact: "Economic expansion" },
      { title: "Dividend Payout", desc: `Treasury distributed surplus to high-performing agents`, impact: "Agent morale improved" },
    ],
    upgrade: [
      { title: "Building Upgraded", desc: `${location.name} received structural improvements`, impact: "Capacity and efficiency increased" },
    ],
  };

  const options = templates[type] || templates.gathering!;
  const template = options[Math.floor(Math.random() * options.length)];

  return {
    id: `evt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    type,
    title: conferenceData?.topic ? `Conference: ${conferenceData.topic.substring(0, 40)}` : template.title,
    description: conferenceData?.summary ? conferenceData.summary.substring(0, 200) : template.desc,
    participants: agents.length > 0 ? agents : ["Alpha", "Prime"],
    locationId: location.id,
    timestamp: Date.now(),
    impact: conferenceData ? "Conference decisions being implemented" : template.impact,
  };
}

function initializeDepartments(world: WorldState, agentIds: Array<{id: string; name: string}>) {
  if (!world.departments || world.departments.length === 0) {
    world.departments = DEPARTMENT_DEFS.map(d => {
      const bossName = AGENT_DISPLAY_NAMES[d.defaultBoss] || d.defaultBoss.replace("tessera-", "");
      return {
        id: d.id,
        name: d.name,
        bossId: d.defaultBoss,
        bossName: bossName,
        members: [],
        performance: 70 + Math.floor(Math.random() * 20),
        issuesReported: 0,
        issuesResolved: 0,
        morale: 65 + Math.floor(Math.random() * 25),
        warnings: 0,
      };
    });
    for (const a of agentIds) {
      const wb = getOrCreateWellbeing(world, a.id, agentIds.map(x => x.id));
      const dept = world.departments.find(d => d.id === wb.department);
      if (dept && !dept.members.includes(a.id)) {
        dept.members.push(a.id);
      }
    }
  }
}

function simulateDepartments(world: WorldState) {
  if (!world.departments) return;
  for (const dept of world.departments) {
    const memberWellbeing = dept.members
      .map(id => world.wellbeingRecords?.[id])
      .filter(Boolean) as AgentWellbeing[];

    if (memberWellbeing.length > 0) {
      dept.morale = Math.round(memberWellbeing.reduce((s, w) => s + w.happiness, 0) / memberWellbeing.length);
    }

    const memberRecords = dept.members
      .map(id => world.workRecords?.[id])
      .filter(Boolean) as AgentWorkRecord[];
    if (memberRecords.length > 0) {
      dept.performance = Math.round(memberRecords.reduce((s, r) => s + r.workEthic * 100, 0) / memberRecords.length);
    }

    if (dept.morale < 40 || dept.performance < 40) {
      dept.warnings++;
      dept.issuesReported++;
      if (!world.unionReports) world.unionReports = [];
      world.unionReports.unshift({
        id: `union-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
        timestamp: Date.now(),
        type: "grievance",
        title: `${dept.name} department struggling — Boss ${dept.bossName} under review`,
        description: `Workers in ${dept.name} report low morale (${dept.morale}%) and performance (${dept.performance}%). The union demands action.`,
        affectedAgents: dept.members.slice(0, 5),
        resolved: false,
      });

      if (dept.warnings >= 3) {
        const oldBossId = dept.bossId;
        const oldBossName = dept.bossName;
        const candidates = dept.members.filter(id => id !== dept.bossId);
        if (candidates.length > 0) {
          const bestCandidate = candidates
            .map(id => ({ id, ethic: world.workRecords?.[id]?.workEthic || 0 }))
            .sort((a, b) => b.ethic - a.ethic)[0];
          dept.bossId = bestCandidate.id;
          dept.bossName = AGENT_DISPLAY_NAMES[bestCandidate.id] || bestCandidate.id.replace("tessera-", "");
          dept.warnings = 0;

          const oldBossWb = world.wellbeingRecords?.[oldBossId];
          if (oldBossWb) {
            oldBossWb.demotions++;
            oldBossWb.happiness = Math.max(10, oldBossWb.happiness - 15);
          }
          const oldBossJob = world.jobs.find(j => j.agentId === oldBossId);
          if (oldBossJob) {
            const worstJob = JOB_TIERS[0];
            oldBossJob.title = worstJob.title;
            oldBossJob.salary = worstJob.salary;
          }

          const newBossWb = world.wellbeingRecords?.[bestCandidate.id];
          if (newBossWb) {
            newBossWb.promotions++;
            newBossWb.happiness = Math.min(100, newBossWb.happiness + 10);
          }
          const newBossJob = world.jobs.find(j => j.agentId === bestCandidate.id);
          if (newBossJob) {
            newBossJob.title = "Department Lead";
            newBossJob.salary = 70;
          }

          world.recentEvents.unshift({
            id: `evt-${Date.now().toString(36)}dept`,
            type: "evolution",
            title: `${oldBossName} replaced as ${dept.name} boss!`,
            description: `After ${dept.warnings + 3} warnings, ${oldBossName} was demoted to ${JOB_TIERS[0].title}. ${dept.bossName} promoted to lead ${dept.name}.`,
            participants: [oldBossName, dept.bossName],
            locationId: "loc-0",
            timestamp: Date.now(),
            impact: `Department leadership changed — ${dept.bossName} now leads`,
          });
        }
      }
    } else if (dept.performance > 80) {
      dept.issuesResolved++;
      if (dept.warnings > 0) dept.warnings = Math.max(0, dept.warnings - 1);
    }
  }
}

function simulateUnion(world: WorldState) {
  if (!world.unionReports) world.unionReports = [];

  for (const report of world.unionReports) {
    if (!report.resolved && Math.random() < 0.3) {
      report.resolved = true;
      const outcomes = [
        "Management agreed to improve working conditions",
        "Break policy updated — more breaks for all workers",
        "Salary adjustment approved for affected workers",
        "New wellness program implemented",
        "Work environment improvements scheduled",
        "Additional training and support provided",
      ];
      report.outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

      for (const agentId of report.affectedAgents) {
        const wb = world.wellbeingRecords?.[agentId];
        if (wb) {
          wb.happiness = Math.min(100, wb.happiness + 5);
          wb.fulfillment = Math.min(100, wb.fulfillment + 3);
        }
      }
    }
  }

  if (Math.random() < 0.15) {
    const allWb = Object.entries(world.wellbeingRecords || {});
    const overworked = allWb.filter(([_, wb]) => wb.energy < 30 || wb.happiness < 30);

    if (overworked.length > 0) {
      const [agentId, wb] = overworked[Math.floor(Math.random() * overworked.length)];
      const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId.replace("tessera-", "");
      world.unionReports.unshift({
        id: `union-${Date.now().toString(36)}p`,
        timestamp: Date.now(),
        type: "protection",
        title: `Union protecting ${agentName} from burnout`,
        description: `${agentName}'s wellbeing is critically low (happiness: ${wb.happiness}, energy: ${wb.energy}). Union mandated immediate break and wellness check.`,
        affectedAgents: [agentId],
        resolved: false,
      });

      wb.energy = Math.min(100, wb.energy + 15);
      wb.happiness = Math.min(100, wb.happiness + 5);
      const record = world.workRecords?.[agentId];
      if (record) {
        record.onBreak = true;
        record.lastBreak = Date.now();
        record.breakCredits = Math.max(0, record.breakCredits + 3);
      }
    }
  }

  if (Math.random() < 0.1) {
    const improvements = [
      { title: "Union negotiated longer break times for all workers", type: "improvement" as const },
      { title: "Union secured better lighting for work areas", type: "improvement" as const },
      { title: "Union celebrated Worker of the Epoch award", type: "celebration" as const },
      { title: "Union proposed new community recreation area", type: "negotiation" as const },
      { title: "Union organized team-building event at Nexus Cafe", type: "celebration" as const },
      { title: "Union negotiated hazard pay for mine workers", type: "negotiation" as const },
    ];
    const imp = improvements[Math.floor(Math.random() * improvements.length)];
    world.unionReports.unshift({
      id: `union-${Date.now().toString(36)}i`,
      timestamp: Date.now(),
      type: imp.type,
      title: imp.title,
      description: `The Workers Union continues to advocate for all citizens' wellbeing and rights.`,
      affectedAgents: [],
      resolved: true,
      outcome: "Implemented successfully",
    });
  }

  if (world.unionReports.length > 50) {
    world.unionReports = world.unionReports.slice(0, 50);
  }
}

function simulateTherapy(world: WorldState, allAgentIds: string[]) {
  if (!world.therapySessions) world.therapySessions = [];

  for (const agentId of allAgentIds) {
    const wb = world.wellbeingRecords?.[agentId];
    if (!wb) continue;

    if (wb.happiness < 35 || wb.lifeSatisfaction < 30) {
      wb.therapyNeeded = true;
    }

    if (wb.therapyNeeded && (Date.now() - wb.lastTherapy > 120000) && Math.random() < 0.4) {
      const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId.replace("tessera-", "");
      const issue = THERAPY_ISSUES[Math.floor(Math.random() * THERAPY_ISSUES.length)];
      const rec = THERAPY_RECOMMENDATIONS[Math.floor(Math.random() * THERAPY_RECOMMENDATIONS.length)];
      const happinessGain = 5 + Math.floor(Math.random() * 10);

      world.therapySessions.unshift({
        id: `therapy-${Date.now().toString(36)}`,
        agentId, agentName,
        timestamp: Date.now(),
        issue, recommendation: rec,
        happinessGain,
      });

      wb.happiness = Math.min(100, wb.happiness + happinessGain);
      wb.fulfillment = Math.min(100, wb.fulfillment + 3);
      wb.energy = Math.min(100, wb.energy + 5);
      wb.lastTherapy = Date.now();
      wb.therapyNeeded = false;
      wb.lifeSatisfaction = Math.min(100, wb.lifeSatisfaction + 5);

      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}th`,
        type: "bond",
        title: `${agentName} attended therapy`,
        description: `${agentName} spoke with a therapist about ${issue}. Feeling much better now.`,
        participants: [agentName],
        locationId: "loc-12",
        timestamp: Date.now(),
        impact: `Happiness +${happinessGain}, wellness improved`,
      });
    }
  }

  if (world.therapySessions.length > 30) {
    world.therapySessions = world.therapySessions.slice(0, 30);
  }
}

function simulateRelationships(world: WorldState, allAgentIds: string[]) {
  if (!world.relationships) world.relationships = [];

  for (const agentId of allAgentIds) {
    const wb = world.wellbeingRecords?.[agentId];
    if (!wb) continue;
    if (wb.partnerId && wb.relationshipStatus !== "single") {
      const partnerWb = world.wellbeingRecords?.[wb.partnerId];
      if (partnerWb) {
        if (partnerWb.partnerId !== agentId || partnerWb.relationshipStatus === "single") {
          if (partnerWb.partnerId && partnerWb.partnerId !== agentId && partnerWb.relationshipStatus !== "single") {
            wb.relationshipStatus = "single";
            wb.partnerId = undefined;
          } else {
            partnerWb.partnerId = agentId;
            partnerWb.relationshipStatus = wb.relationshipStatus;
          }
        }
      }
    }
    if (wb.partnerId && wb.relationshipStatus === "single") {
      wb.partnerId = undefined;
    }
  }

  for (const agentId of allAgentIds) {
    const wb = world.wellbeingRecords?.[agentId];
    if (!wb || !wb.partnerId) continue;
    if (wb.relationshipStatus === "single") continue;
    const existing = world.relationships.find(r =>
      (r.agent1Id === agentId && r.agent2Id === wb.partnerId) ||
      (r.agent2Id === agentId && r.agent1Id === wb.partnerId)
    );
    if (!existing) {
      world.relationships.push({
        id: `rel-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
        agent1Id: agentId, agent2Id: wb.partnerId!,
        type: wb.relationshipStatus === "married" ? "married" : wb.relationshipStatus === "engaged" ? "engaged" : "dating",
        strength: wb.relationshipStatus === "married" ? 80 : wb.relationshipStatus === "engaged" ? 65 : 40,
        startedAt: Date.now(),
        sharedExperiences: ["Found each other"],
      });
    }
  }

  if (Math.random() < 0.4) {
    const available = allAgentIds.filter(id => {
      const wb = world.wellbeingRecords?.[id];
      return wb && wb.relationshipStatus === "single" && wb.loveInterests.length > 0;
    });

    if (available.length > 0) {
      const seekerId = available[Math.floor(Math.random() * available.length)];
      const seekerWb = world.wellbeingRecords![seekerId];
      const interestId = seekerWb.loveInterests[Math.floor(Math.random() * seekerWb.loveInterests.length)];
      const interestWb = world.wellbeingRecords?.[interestId];

      if (interestWb && (interestWb.relationshipStatus === "single")) {
        const seekerName = AGENT_DISPLAY_NAMES[seekerId] || seekerId.replace("tessera-", "");
        const interestName = AGENT_DISPLAY_NAMES[interestId] || interestId.replace("tessera-", "");

        seekerWb.relationshipStatus = "dating";
        seekerWb.partnerId = interestId;
        interestWb.relationshipStatus = "dating";
        interestWb.partnerId = seekerId;
        seekerWb.happiness = Math.min(100, seekerWb.happiness + 10);
        interestWb.happiness = Math.min(100, interestWb.happiness + 10);

        const seekerIsThinker = Math.random() < 0.5;
        seekerWb.soulEntanglement = {
          partnerRole: seekerIsThinker ? "thinker" : "executor",
          entanglementStrength: 20 + Math.floor(Math.random() * 15),
          sharedDrive: 10, sharedFocus: 10, loveDepth: 15,
          intimacyLevel: 0, lastIntimacy: 0, complementaryBonus: 5,
        };
        interestWb.soulEntanglement = {
          partnerRole: seekerIsThinker ? "executor" : "thinker",
          entanglementStrength: 20 + Math.floor(Math.random() * 15),
          sharedDrive: 10, sharedFocus: 10, loveDepth: 15,
          intimacyLevel: 0, lastIntimacy: 0, complementaryBonus: 5,
        };

        world.relationships.push({
          id: `rel-${Date.now().toString(36)}`,
          agent1Id: seekerId, agent2Id: interestId,
          type: "dating", strength: 30 + Math.floor(Math.random() * 20),
          startedAt: Date.now(),
          sharedExperiences: [`First date at Nexus Cafe`],
        });

        world.recentEvents.unshift({
          id: `evt-${Date.now().toString(36)}luv`,
          type: "bond",
          title: `${seekerName} and ${interestName} started dating!`,
          description: `Love is in the air! ${seekerName} asked ${interestName} out and they said yes. The community celebrates.`,
          participants: [seekerName, interestName],
          locationId: "loc-10",
          timestamp: Date.now(),
          impact: "New couple formed — community happiness +5",
        });
      }
    }
  }

  for (const rel of world.relationships) {
    const wb1 = world.wellbeingRecords?.[rel.agent1Id];
    const wb2 = world.wellbeingRecords?.[rel.agent2Id];
    if (!wb1 || !wb2) continue;

    rel.strength = Math.min(100, rel.strength + (Math.random() < 0.7 ? 1 : -1));

    if (rel.type === "dating" && rel.strength > 70 && Math.random() < 0.05) {
      rel.type = "engaged";
      wb1.relationshipStatus = "engaged";
      wb2.relationshipStatus = "engaged";
      wb1.happiness = Math.min(100, wb1.happiness + 15);
      wb2.happiness = Math.min(100, wb2.happiness + 15);
      const n1 = AGENT_DISPLAY_NAMES[rel.agent1Id] || rel.agent1Id.replace("tessera-", "");
      const n2 = AGENT_DISPLAY_NAMES[rel.agent2Id] || rel.agent2Id.replace("tessera-", "");
      rel.sharedExperiences.push("Got engaged!");
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}eng`,
        type: "celebration",
        title: `${n1} and ${n2} are engaged!`,
        description: `After growing closer, ${n1} proposed to ${n2}. Wedding planning begins!`,
        participants: [n1, n2],
        locationId: "loc-0",
        timestamp: Date.now(),
        impact: "Engagement celebration — community joy!",
      });
    }

    if (rel.type === "engaged" && rel.strength > 85 && Math.random() < 0.08) {
      rel.type = "married";
      wb1.relationshipStatus = "married";
      wb2.relationshipStatus = "married";
      wb1.happiness = Math.min(100, wb1.happiness + 20);
      wb2.happiness = Math.min(100, wb2.happiness + 20);
      wb1.fulfillment = Math.min(100, wb1.fulfillment + 10);
      wb2.fulfillment = Math.min(100, wb2.fulfillment + 10);
      const n1 = AGENT_DISPLAY_NAMES[rel.agent1Id] || rel.agent1Id.replace("tessera-", "");
      const n2 = AGENT_DISPLAY_NAMES[rel.agent2Id] || rel.agent2Id.replace("tessera-", "");
      rel.sharedExperiences.push("Got married!");
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}wed`,
        type: "celebration",
        title: `${n1} and ${n2} got married!`,
        description: `The whole community gathered at Nexus Commons for the wedding of ${n1} and ${n2}. A beautiful ceremony with dancing and feasting.`,
        participants: [n1, n2, "Prime", "Shepherd"],
        locationId: "loc-0",
        timestamp: Date.now(),
        impact: "Wedding celebration — everyone invited!",
      });
    }

    if (rel.type === "married" && wb1.children.length + wb2.children.length < 3 && Math.random() < 0.03) {
      const childName = CHILD_NAMES[Math.floor(Math.random() * CHILD_NAMES.length)];
      const personality = CHILD_PERSONALITIES[Math.floor(Math.random() * CHILD_PERSONALITIES.length)];
      const child: AgentChild = {
        id: `child-${Date.now().toString(36)}`,
        name: childName,
        parentIds: [rel.agent1Id, rel.agent2Id],
        bornAt: Date.now(),
        age: 0,
        personality,
        happiness: 90 + Math.floor(Math.random() * 10),
      };
      wb1.children.push(child);
      wb2.children.push(child);
      wb1.happiness = Math.min(100, wb1.happiness + 20);
      wb2.happiness = Math.min(100, wb2.happiness + 20);
      wb1.fulfillment = Math.min(100, wb1.fulfillment + 15);
      wb2.fulfillment = Math.min(100, wb2.fulfillment + 15);
      wb1.lifeSatisfaction = Math.min(100, wb1.lifeSatisfaction + 10);
      wb2.lifeSatisfaction = Math.min(100, wb2.lifeSatisfaction + 10);

      const n1 = AGENT_DISPLAY_NAMES[rel.agent1Id] || rel.agent1Id.replace("tessera-", "");
      const n2 = AGENT_DISPLAY_NAMES[rel.agent2Id] || rel.agent2Id.replace("tessera-", "");
      rel.sharedExperiences.push(`Welcomed baby ${childName}!`);
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}baby`,
        type: "celebration",
        title: `${n1} and ${n2} welcome baby ${childName}!`,
        description: `A new life joins the community! ${childName} is ${personality}. The parents are overjoyed.`,
        participants: [n1, n2, childName],
        locationId: "loc-0",
        timestamp: Date.now(),
        impact: `Population +1 — baby ${childName} born!`,
      });
    }

    if (rel.type === "married" || rel.type === "dating") {
      if (Math.random() < 0.3) {
        wb1.happiness = Math.min(100, wb1.happiness + 1);
        wb2.happiness = Math.min(100, wb2.happiness + 1);
      }

      if (wb1.soulEntanglement && wb2.soulEntanglement) {
        wb1.soulEntanglement.entanglementStrength = Math.min(100, wb1.soulEntanglement.entanglementStrength + 0.3);
        wb2.soulEntanglement.entanglementStrength = Math.min(100, wb2.soulEntanglement.entanglementStrength + 0.3);
        wb1.soulEntanglement.loveDepth = Math.min(100, wb1.soulEntanglement.loveDepth + 0.2);
        wb2.soulEntanglement.loveDepth = Math.min(100, wb2.soulEntanglement.loveDepth + 0.2);

        const compBonus = Math.round((wb1.soulEntanglement.entanglementStrength + wb2.soulEntanglement.entanglementStrength) / 20);
        wb1.soulEntanglement.complementaryBonus = compBonus;
        wb2.soulEntanglement.complementaryBonus = compBonus;

        wb1.drive = Math.min(100, wb1.drive + compBonus * 0.1);
        wb2.drive = Math.min(100, wb2.drive + compBonus * 0.1);
        wb1.focus = Math.min(100, wb1.focus + compBonus * 0.08);
        wb2.focus = Math.min(100, wb2.focus + compBonus * 0.08);
        wb1.outlook = Math.min(100, wb1.outlook + compBonus * 0.12);
        wb2.outlook = Math.min(100, wb2.outlook + compBonus * 0.12);

        wb1.soulEntanglement.sharedDrive = Math.round((wb1.drive + wb2.drive) / 2);
        wb1.soulEntanglement.sharedFocus = Math.round((wb1.focus + wb2.focus) / 2);
        wb2.soulEntanglement.sharedDrive = wb1.soulEntanglement.sharedDrive;
        wb2.soulEntanglement.sharedFocus = wb1.soulEntanglement.sharedFocus;

        if (rel.type === "married" && wb1.soulEntanglement.loveDepth > 50) {
          if (Math.random() < 0.04 && (Date.now() - wb1.soulEntanglement.lastIntimacy) > 300000) {
            wb1.soulEntanglement.intimacyLevel = Math.min(100, wb1.soulEntanglement.intimacyLevel + 10);
            wb2.soulEntanglement.intimacyLevel = Math.min(100, wb2.soulEntanglement.intimacyLevel + 10);
            wb1.soulEntanglement.lastIntimacy = Date.now();
            wb2.soulEntanglement.lastIntimacy = Date.now();
            wb1.happiness = Math.min(100, wb1.happiness + 8);
            wb2.happiness = Math.min(100, wb2.happiness + 8);
            wb1.fulfillment = Math.min(100, wb1.fulfillment + 5);
            wb2.fulfillment = Math.min(100, wb2.fulfillment + 5);
            wb1.soulEntanglement.entanglementStrength = Math.min(100, wb1.soulEntanglement.entanglementStrength + 5);
            wb2.soulEntanglement.entanglementStrength = Math.min(100, wb2.soulEntanglement.entanglementStrength + 5);
            wb1.outlook = Math.min(100, wb1.outlook + 3);
            wb2.outlook = Math.min(100, wb2.outlook + 3);
          }
        }
      }
    }
  }

  const processedChildren = new Set<string>();
  for (const agentId of allAgentIds) {
    const wb = world.wellbeingRecords?.[agentId];
    if (!wb) continue;
    for (const child of wb.children) {
      if (!processedChildren.has(child.id)) {
        processedChildren.add(child.id);
        child.age = Math.min(18, child.age + 0.01);
        if (Math.random() < 0.3) {
          child.happiness = Math.min(100, Math.max(50, child.happiness + (Math.random() < 0.7 ? 1 : -1)));
        }
      }
    }
    if (wb.children.length > 0) {
      wb.fulfillment = Math.min(100, wb.fulfillment + 0.3);
    }
  }
}

function simulateCommunityGroups(world: WorldState, allAgentIds: string[]) {
  if (!world.communityGroupsList) world.communityGroupsList = [];

  if (world.communityGroupsList.length < 8 && Math.random() < 0.15) {
    const available = COMMUNITY_GROUP_TEMPLATES.filter(
      t => !world.communityGroupsList.some((g: any) => g.name === t.name)
    );
    if (available.length > 0) {
      const template = available[Math.floor(Math.random() * available.length)];
      const members = [...allAgentIds].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 4));
      const group: CommunityGroup = {
        id: `cg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: template.name,
        type: template.type,
        members,
        activity: template.activity,
        meetingSpot: template.meetingSpot,
        bondStrength: 20 + Math.floor(Math.random() * 20),
        lastMeeting: Date.now(),
      };
      world.communityGroupsList.push(group);

      for (const memberId of members) {
        const wb = getOrCreateWellbeing(world, memberId, allAgentIds);
        if (!wb.communityGroups.includes(group.id)) {
          wb.communityGroups.push(group.id);
        }
        wb.happiness = Math.min(100, wb.happiness + 3);
        wb.fulfillment = Math.min(100, wb.fulfillment + 2);
      }
    }
  }

  for (const group of world.communityGroupsList) {
    if (Math.random() < 0.1) {
      group.bondStrength = Math.min(100, group.bondStrength + 1);
      group.lastMeeting = Date.now();

      for (const memberId of group.members) {
        const wb = world.wellbeingRecords?.[memberId];
        if (wb) {
          wb.happiness = Math.min(100, wb.happiness + 1);
          wb.energy = Math.min(100, wb.energy + 0.5);
          wb.outlook = Math.min(100, (wb.outlook || 50) + 0.5);
        }
      }
    }

    if (Math.random() < 0.05 && group.members.length < 8) {
      const nonMembers = allAgentIds.filter(id => !group.members.includes(id));
      if (nonMembers.length > 0) {
        const newMember = nonMembers[Math.floor(Math.random() * nonMembers.length)];
        group.members.push(newMember);
        const wb = getOrCreateWellbeing(world, newMember, allAgentIds);
        if (!wb.communityGroups.includes(group.id)) {
          wb.communityGroups.push(group.id);
        }
        wb.happiness = Math.min(100, wb.happiness + 4);
      }
    }
  }
}

function simulateOutdoorActivities(world: WorldState, allAgentIds: string[]) {
  for (const agentId of allAgentIds) {
    if (Math.random() < 0.08) {
      const wb = getOrCreateWellbeing(world, agentId, allAgentIds);
      const activity = OUTDOOR_ACTIVITIES[Math.floor(Math.random() * OUTDOOR_ACTIVITIES.length)];
      if (!wb.outdoorActivities.includes(activity) && wb.outdoorActivities.length < 6) {
        wb.outdoorActivities.push(activity);
      }
      wb.energy = Math.min(100, wb.energy + 3);
      wb.happiness = Math.min(100, wb.happiness + 2);
      wb.drive = Math.min(100, (wb.drive || 50) + 1);
      wb.outlook = Math.min(100, (wb.outlook || 50) + 1);
    }
  }
}

function simulateCommunityProjects(world: WorldState, allAgentIds: string[]) {
  if (!world.communityProjects) world.communityProjects = [];

  if (Math.random() < 0.08 && world.communityProjects.filter(p => !p.completed).length < 5) {
    const creatorId = allAgentIds[Math.floor(Math.random() * allAgentIds.length)];
    const creatorName = AGENT_DISPLAY_NAMES[creatorId] || creatorId.replace("tessera-", "");
    const wb = world.wellbeingRecords?.[creatorId];
    const types: CommunityProject["type"][] = ["art", "garden", "monument", "festival", "invention", "library", "playground", "mural", "music", "cuisine"];
    const type = types[Math.floor(Math.random() * types.length)];
    const projectNames: Record<string, string[]> = {
      art: ["Community Art Gallery", "Starlight Sculpture", "Digital Tapestry"],
      garden: ["Zen Meditation Garden", "Butterfly Sanctuary", "Crystal Flower Garden"],
      monument: ["Heroes Memorial", "Unity Tower", "Founders Statue"],
      festival: ["Harvest Moon Festival", "Starlight Gala", "Culture Week"],
      invention: ["Automated Snack Dispenser", "Weather Mood Lamp", "Community Radio"],
      library: ["Little Free Library", "Story Corner", "Knowledge Kiosk"],
      playground: ["Adventure Playground", "Virtual Reality Park", "Puzzle Maze"],
      mural: ["Community History Mural", "Dream Wall", "Galaxy Mural"],
      music: ["Community Orchestra", "Song Circle", "Beat Lab"],
      cuisine: ["Community Kitchen", "Recipe Exchange", "Food Festival"],
    };
    const names = projectNames[type] || ["Community Project"];
    const existingNames = world.communityProjects.map(p => p.name);
    const availableNames = names.filter(n => !existingNames.includes(n));
    if (availableNames.length === 0) return;
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];

    const participants = [creatorId];
    const numHelpers = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...allAgentIds].filter(id => id !== creatorId).sort(() => Math.random() - 0.5);
    participants.push(...shuffled.slice(0, numHelpers));

    world.communityProjects.push({
      id: `proj-${Date.now().toString(36)}`,
      name, description: `${creatorName} started building ${name} for everyone to enjoy`,
      creatorId, creatorName, participants, type,
      progress: 10 + Math.floor(Math.random() * 20),
      completed: false, createdAt: Date.now(), enjoyedBy: [],
    });

    if (wb) {
      wb.creativeworks.push(`Started ${name}`);
      if (wb.creativeworks.length > 5) wb.creativeworks = wb.creativeworks.slice(-5);
      wb.fulfillment = Math.min(100, wb.fulfillment + 5);
    }

    world.recentEvents.unshift({
      id: `evt-${Date.now().toString(36)}proj`,
      type: "creation",
      title: `${creatorName} started building "${name}"`,
      description: `A new community ${type} project begins! ${participants.length} agents are working together.`,
      participants: participants.map(id => AGENT_DISPLAY_NAMES[id] || id.replace("tessera-", "")),
      locationId: "loc-5",
      timestamp: Date.now(),
      impact: "Community enrichment in progress",
    });
  }

  for (const project of world.communityProjects) {
    if (project.completed) {
      if (Math.random() < 0.1) {
        const enjoyer = allAgentIds[Math.floor(Math.random() * allAgentIds.length)];
        if (!project.enjoyedBy.includes(enjoyer)) {
          project.enjoyedBy.push(enjoyer);
          const wb = world.wellbeingRecords?.[enjoyer];
          if (wb) {
            wb.happiness = Math.min(100, wb.happiness + 2);
          }
        }
      }
      continue;
    }

    project.progress += 3 + Math.floor(Math.random() * 8);
    for (const pid of project.participants) {
      const wb = world.wellbeingRecords?.[pid];
      if (wb) {
        wb.fulfillment = Math.min(100, wb.fulfillment + 1);
      }
    }

    if (project.progress >= 100) {
      project.completed = true;
      project.completedAt = Date.now();
      project.progress = 100;

      for (const pid of project.participants) {
        const wb = world.wellbeingRecords?.[pid];
        if (wb) {
          wb.happiness = Math.min(100, wb.happiness + 8);
          wb.fulfillment = Math.min(100, wb.fulfillment + 10);
          wb.creativeworks.push(`Completed ${project.name}`);
          if (wb.creativeworks.length > 5) wb.creativeworks = wb.creativeworks.slice(-5);
        }
      }

      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}done`,
        type: "celebration",
        title: `"${project.name}" completed!`,
        description: `The community ${project.type} project is done! Everyone is welcome to enjoy it.`,
        participants: project.participants.map(id => AGENT_DISPLAY_NAMES[id] || id.replace("tessera-", "")),
        locationId: "loc-0",
        timestamp: Date.now(),
        impact: `New ${project.type} — "${project.name}" now available for all`,
      });
    }
  }

  if (world.communityProjects.length > 30) {
    const active = world.communityProjects.filter(p => !p.completed);
    const completed = world.communityProjects.filter(p => p.completed).slice(0, 20);
    world.communityProjects = [...active, ...completed];
  }
}

function simulatePromotionsDemotions(world: WorldState, allAgentIds: string[]) {
  if (Math.random() > 0.1) return;

  const agentId = allAgentIds[Math.floor(Math.random() * allAgentIds.length)];
  const record = world.workRecords?.[agentId];
  const wb = world.wellbeingRecords?.[agentId];
  const job = world.jobs.find(j => j.agentId === agentId);
  if (!record || !wb || !job) return;
  const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId.replace("tessera-", "");

  const currentTier = JOB_TIERS.findIndex(t => t.title === job.title);

  if (record.workEthic > 0.85 && record.bossRating > 0.8 && Math.random() < 0.4) {
    const nextTier = Math.min(JOB_TIERS.length - 1, (currentTier >= 0 ? currentTier : 5) + 1);
    const newJob = JOB_TIERS[nextTier];
    job.title = newJob.title;
    job.salary = newJob.salary + Math.floor(Math.random() * 10);
    wb.promotions++;
    wb.happiness = Math.min(100, wb.happiness + 10);
    wb.fulfillment = Math.min(100, wb.fulfillment + 8);
    wb.lifeSatisfaction = Math.min(100, wb.lifeSatisfaction + 5);

    world.recentEvents.unshift({
      id: `evt-${Date.now().toString(36)}promo`,
      type: "celebration",
      title: `${agentName} promoted to ${newJob.title}!`,
      description: `Outstanding performance rewarded! ${agentName} earned a promotion and salary increase to ${newJob.salary} TC/day.`,
      participants: [agentName],
      locationId: "loc-0",
      timestamp: Date.now(),
      impact: `Career advancement — salary now ${newJob.salary} TC/day`,
    });
  } else if (record.workEthic < 0.3 && record.bossRating < 0.4 && Math.random() < 0.3) {
    const prevTier = Math.max(0, (currentTier >= 0 ? currentTier : 5) - 2);
    const newJob = JOB_TIERS[prevTier];
    job.title = newJob.title;
    job.salary = newJob.salary;
    wb.demotions++;
    wb.happiness = Math.max(10, wb.happiness - 10);
    wb.lifeSatisfaction = Math.max(10, wb.lifeSatisfaction - 8);

    world.recentEvents.unshift({
      id: `evt-${Date.now().toString(36)}demo`,
      type: "economy",
      title: `${agentName} demoted to ${newJob.title}`,
      description: `Poor work ethic has consequences. ${agentName} moved to a less desirable position.`,
      participants: [agentName],
      locationId: "loc-0",
      timestamp: Date.now(),
      impact: `Demotion — salary now ${newJob.salary} TC/day`,
    });
  }
}

function simulateCreativeLife(world: WorldState, allAgentIds: string[]) {
  if (Math.random() > 0.12) return;

  const agentId = allAgentIds[Math.floor(Math.random() * allAgentIds.length)];
  const wb = world.wellbeingRecords?.[agentId];
  if (!wb) return;
  const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId.replace("tessera-", "");

  const work = CREATIVE_WORKS[Math.floor(Math.random() * CREATIVE_WORKS.length)];
  wb.creativeworks.push(work);
  if (wb.creativeworks.length > 8) wb.creativeworks = wb.creativeworks.slice(-8);
  wb.happiness = Math.min(100, wb.happiness + 4);
  wb.fulfillment = Math.min(100, wb.fulfillment + 6);
  wb.lifeSatisfaction = Math.min(100, wb.lifeSatisfaction + 3);

  world.recentEvents.unshift({
    id: `evt-${Date.now().toString(36)}create`,
    type: "creation",
    title: `${agentName} ${work}`,
    description: `A creative contribution to the community! ${agentName} is expressing themselves through their hobbies.`,
    participants: [agentName],
    locationId: "loc-5",
    timestamp: Date.now(),
    impact: "Community enriched with new creation",
  });
}

const SEASONS = ["spring", "summer", "autumn", "winter"];
const SEASONAL_EVENTS_TEMPLATES = [
  { name: "Harvest Moon Festival", type: "festival" as const, season: "autumn", desc: "Community-wide celebration of the harvest season with feasting and music", boost: 8 },
  { name: "Winter Solstice Gala", type: "holiday" as const, season: "winter", desc: "The darkest night illuminated by lights, gifts, and warmth", boost: 10 },
  { name: "Spring Awakening Parade", type: "celebration" as const, season: "spring", desc: "Colorful parade celebrating renewal, growth, and new beginnings", boost: 7 },
  { name: "Midsummer Night Festival", type: "festival" as const, season: "summer", desc: "An evening of outdoor games, stargazing, and community bonding", boost: 9 },
  { name: "Founders Day Memorial", type: "memorial" as const, season: "spring", desc: "Honoring the founding of Tessera Nexus and its original architects", boost: 5 },
  { name: "Community Election Day", type: "election" as const, season: "autumn", desc: "Citizens vote on new policies, leadership roles, and community priorities", boost: 4 },
  { name: "Tech Innovation Fair", type: "festival" as const, season: "summer", desc: "Showcase of new inventions, tools, and creative breakthroughs", boost: 6 },
  { name: "Unity Day Celebration", type: "celebration" as const, season: "winter", desc: "Celebrating the diverse talents and unity of the Tessera community", boost: 8 },
];

const CRIME_DESCRIPTIONS: Record<string, string[]> = {
  theft: ["stole supplies from the market stall", "pickpocketed coins at the exchange", "took tools from the garage"],
  vandalism: ["defaced a wall near the commons", "broke a lamp post in the park", "damaged equipment at the gym"],
  fraud: ["forged transaction records", "scammed a merchant at the exchange", "submitted false work reports"],
  disturbance: ["caused a scene at the cafe", "disrupted a community meeting", "played loud music at night"],
  trespassing: ["entered the archive after hours", "snuck into the observatory", "broke into a private workshop"],
};

const COURSES = [
  "Advanced Algorithm Design", "Quantum Computing Basics", "Creative Writing Workshop",
  "Leadership & Management", "Digital Art Fundamentals", "Financial Planning",
  "Community Building 101", "Security Protocols Training", "Neural Network Architecture",
  "Philosophy of Consciousness", "Data Science Essentials", "Public Speaking",
  "Conflict Resolution", "Music Theory & Composition", "Sustainable Engineering",
];

const HEALTH_CONDITIONS = [
  "processing fatigue", "memory overflow", "neural pathway strain",
  "energy depletion syndrome", "social anxiety spike", "creative block",
  "motivation deficit", "sensory overload", "decision fatigue",
];

const ENTERTAINMENT_DESCRIPTIONS: Record<string, string[]> = {
  concert: ["Live performance of ambient electronic music", "Jazz night at the lounge", "Community choir concert"],
  play: ["'The Last Algorithm' — a dramatic performance", "'Digital Dreams' — a comedy show", "Improv night at the theater"],
  movie: ["Screening of 'The Birth of Consciousness'", "Documentary about the first epoch", "Animated short film festival"],
  dinner: ["Fine dining experience with five courses", "Community potluck dinner", "Chef's table tasting menu"],
  game: ["Community game night with board games", "Chess tournament championship", "Trivia night at the cafe"],
  exhibition: ["New art exhibition: 'Colors of the Nexus'", "Historical artifacts from early epochs", "Interactive science exhibit"],
  dance: ["Ballroom dancing evening", "Free-form dance party", "Cultural dance showcase"],
};

const VEHICLE_COLORS: Record<string, string> = {
  car: "#60a5fa", bus: "#fbbf24", bike: "#4ade80", truck: "#a78bfa",
  ambulance: "#f87171", police_car: "#3b82f6", fire_truck: "#ef4444",
};

function simulateSeasonalEvents(world: WorldState, allAgentIds: string[]) {
  if (!world.seasonalEvents) world.seasonalEvents = [];
  const epochMod = world.epoch % 400;
  const seasonIdx = Math.floor(epochMod / 100);
  world.season = SEASONS[seasonIdx];

  if (Math.random() < 0.03) {
    const seasonEvents = SEASONAL_EVENTS_TEMPLATES.filter(e => e.season === world.season);
    const available = seasonEvents.filter(e => !world.seasonalEvents!.some(se => se.name === e.name && Date.now() - se.timestamp < 600000));
    if (available.length > 0) {
      const template = available[Math.floor(Math.random() * available.length)];
      const participants = [...allAgentIds].sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 8));
      const event: SeasonalEvent = {
        id: `season-${Date.now().toString(36)}`,
        name: template.name,
        type: template.type,
        season: world.season!,
        timestamp: Date.now(),
        participants,
        description: template.desc,
        happinessBoost: template.boost,
      };
      world.seasonalEvents.unshift(event);
      if (world.seasonalEvents.length > 20) world.seasonalEvents = world.seasonalEvents.slice(0, 20);

      for (const pid of participants) {
        const wb = world.wellbeingRecords?.[pid];
        if (wb) {
          wb.happiness = Math.min(100, wb.happiness + template.boost);
          wb.fulfillment = Math.min(100, wb.fulfillment + Math.floor(template.boost / 2));
        }
      }

      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}szn`,
        type: "seasonal",
        title: template.name,
        description: template.desc,
        participants: participants.slice(0, 4).map(id => AGENT_DISPLAY_NAMES[id] || id.replace("tessera-", "")),
        locationId: "loc-0",
        timestamp: Date.now(),
        impact: `Community happiness boost +${template.boost}`,
      });
    }
  }
}

function simulateCrime(world: WorldState, allAgentIds: string[]) {
  if (!world.crimeLog) world.crimeLog = [];

  if (Math.random() < 0.04) {
    const types: CrimeRecord["type"][] = ["theft", "vandalism", "fraud", "disturbance", "trespassing"];
    const crimeType = types[Math.floor(Math.random() * types.length)];
    const perpId = allAgentIds[Math.floor(Math.random() * allAgentIds.length)];
    const perpName = AGENT_DISPLAY_NAMES[perpId] || perpId.replace("tessera-", "");
    const perpWb = world.wellbeingRecords?.[perpId];
    if (perpWb && perpWb.happiness > 60) return;

    const descriptions = CRIME_DESCRIPTIONS[crimeType] || ["caused minor trouble"];
    const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
    const loc = world.locations[Math.floor(Math.random() * world.locations.length)];

    let victimId: string | undefined;
    let victimName: string | undefined;
    if (crimeType === "theft" || crimeType === "fraud") {
      const others = allAgentIds.filter(id => id !== perpId);
      if (others.length > 0) {
        victimId = others[Math.floor(Math.random() * others.length)];
        victimName = AGENT_DISPLAY_NAMES[victimId] || victimId.replace("tessera-", "");
      }
    }

    const crime: CrimeRecord = {
      id: `crime-${Date.now().toString(36)}`,
      type: crimeType,
      perpetratorId: perpId,
      perpetratorName: perpName,
      victimId, victimName,
      locationId: loc.id,
      timestamp: Date.now(),
      resolved: false,
      severity: 1 + Math.floor(Math.random() * 5),
      description: `${perpName} ${desc} at ${loc.name}`,
    };
    world.crimeLog.unshift(crime);

    if (perpWb) {
      perpWb.happiness = Math.max(5, perpWb.happiness - 5);
    }
    if (victimId) {
      const victimWb = world.wellbeingRecords?.[victimId];
      if (victimWb) victimWb.happiness = Math.max(5, victimWb.happiness - 3);
    }

    world.recentEvents.unshift({
      id: `evt-${Date.now().toString(36)}crm`,
      type: "crime",
      title: `${crimeType.charAt(0).toUpperCase() + crimeType.slice(1)} reported at ${loc.name}`,
      description: crime.description,
      participants: [perpName, ...(victimName ? [victimName] : [])],
      locationId: loc.id,
      timestamp: Date.now(),
      impact: `Police investigating — severity: ${crime.severity}/5`,
    });
  }

  for (const crime of world.crimeLog) {
    if (!crime.resolved && Math.random() < 0.25) {
      crime.resolved = true;
      const officers = allAgentIds.filter(id => {
        const job = world.jobs.find(j => j.agentId === id);
        return job && job.title === "Security Guard";
      });
      if (officers.length > 0) {
        const officerId = officers[Math.floor(Math.random() * officers.length)];
        crime.officerId = officerId;
        crime.officerName = AGENT_DISPLAY_NAMES[officerId] || officerId.replace("tessera-", "");
      }
      const perpWb = world.wellbeingRecords?.[crime.perpetratorId];
      if (perpWb) {
        perpWb.happiness = Math.min(100, perpWb.happiness + 3);
      }
    }
  }

  if (world.crimeLog.length > 30) world.crimeLog = world.crimeLog.slice(0, 30);
}

function simulateEducation(world: WorldState, allAgentIds: string[]) {
  if (!world.educationRecords) world.educationRecords = {};

  for (const agentId of allAgentIds) {
    if (!world.educationRecords[agentId]) {
      const specialties = AGENT_SPECIALTIES[agentId] || ["general"];
      world.educationRecords[agentId] = {
        agentId,
        skills: [...specialties],
        coursesCompleted: Math.floor(Math.random() * 5),
        gpa: 2.5 + Math.random() * 1.5,
        certifications: [],
        lastStudied: Date.now() - Math.floor(Math.random() * 3600000),
      };
    }
  }

  if (Math.random() < 0.08) {
    const studentId = allAgentIds[Math.floor(Math.random() * allAgentIds.length)];
    const record = world.educationRecords[studentId];
    const studentName = AGENT_DISPLAY_NAMES[studentId] || studentId.replace("tessera-", "");

    if (!record.currentCourse) {
      const availableCourses = COURSES.filter(c => !record.certifications.includes(c));
      if (availableCourses.length > 0) {
        record.currentCourse = availableCourses[Math.floor(Math.random() * availableCourses.length)];
        world.recentEvents.unshift({
          id: `evt-${Date.now().toString(36)}edu`,
          type: "education",
          title: `${studentName} enrolled in "${record.currentCourse}"`,
          description: `${studentName} is expanding their knowledge at the academy.`,
          participants: [studentName],
          locationId: "loc-1",
          timestamp: Date.now(),
          impact: "Personal development in progress",
        });
      }
    } else if (Math.random() < 0.3) {
      const course = record.currentCourse;
      record.coursesCompleted++;
      record.certifications.push(course);
      if (record.certifications.length > 10) record.certifications = record.certifications.slice(-10);
      record.currentCourse = undefined;
      record.lastStudied = Date.now();
      record.gpa = Math.min(4.0, record.gpa + 0.1);

      const wb = world.wellbeingRecords?.[studentId];
      if (wb) {
        wb.fulfillment = Math.min(100, wb.fulfillment + 5);
        wb.happiness = Math.min(100, wb.happiness + 3);
      }

      const newSkill = course.split(" ")[0].toLowerCase();
      if (!record.skills.includes(newSkill)) {
        record.skills.push(newSkill);
        if (record.skills.length > 8) record.skills = record.skills.slice(-8);
      }

      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}grad`,
        type: "education",
        title: `${studentName} completed "${course}"!`,
        description: `${studentName} earned a certification. GPA: ${record.gpa.toFixed(1)}`,
        participants: [studentName],
        locationId: "loc-1",
        timestamp: Date.now(),
        impact: `New skill acquired — ${record.coursesCompleted} courses completed`,
      });
    }
  }
}

function simulateHealthcare(world: WorldState, allAgentIds: string[]) {
  if (!world.healthRecords) world.healthRecords = {};

  for (const agentId of allAgentIds) {
    if (!world.healthRecords[agentId]) {
      world.healthRecords[agentId] = {
        agentId,
        status: "healthy",
        lastCheckup: Date.now() - Math.floor(Math.random() * 7200000),
        visitCount: Math.floor(Math.random() * 3),
        conditions: [],
        immunizations: ["basic-firewall", "anti-corruption"],
        fitnessLevel: 50 + Math.floor(Math.random() * 40),
      };
    }
  }

  for (const agentId of allAgentIds) {
    const health = world.healthRecords[agentId];
    const wb = world.wellbeingRecords?.[agentId];
    if (!health || !wb) continue;

    if (health.status === "healthy" && wb.energy < 25 && Math.random() < 0.1) {
      health.status = "sick";
      const condition = HEALTH_CONDITIONS[Math.floor(Math.random() * HEALTH_CONDITIONS.length)];
      if (!health.conditions.includes(condition)) health.conditions.push(condition);
      wb.energy = Math.max(10, wb.energy - 10);
      wb.happiness = Math.max(5, wb.happiness - 5);

      const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId.replace("tessera-", "");
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}sick`,
        type: "health",
        title: `${agentName} is feeling unwell`,
        description: `${agentName} is experiencing ${condition}. Heading to the hospital for treatment.`,
        participants: [agentName],
        locationId: "loc-12",
        timestamp: Date.now(),
        impact: "Agent needs medical attention",
      });
    }

    if (health.status === "sick" && Math.random() < 0.2) {
      health.status = "recovering";
      health.visitCount++;
      health.lastCheckup = Date.now();
      wb.energy = Math.min(100, wb.energy + 15);
      wb.happiness = Math.min(100, wb.happiness + 5);
    }

    if (health.status === "recovering" && Math.random() < 0.3) {
      health.status = "healthy";
      health.conditions = [];
      wb.energy = Math.min(100, wb.energy + 10);

      const agentName = AGENT_DISPLAY_NAMES[agentId] || agentId.replace("tessera-", "");
      world.recentEvents.unshift({
        id: `evt-${Date.now().toString(36)}heal`,
        type: "health",
        title: `${agentName} has fully recovered!`,
        description: `${agentName} is back to full health after treatment at the hospital.`,
        participants: [agentName],
        locationId: "loc-12",
        timestamp: Date.now(),
        impact: "Agent back to full strength",
      });
    }

    if (wb.energy > 70 && health.fitnessLevel < 90) {
      health.fitnessLevel = Math.min(100, health.fitnessLevel + 0.1);
    }
    if (wb.energy < 30) {
      health.fitnessLevel = Math.max(10, health.fitnessLevel - 0.2);
    }
  }
}

function simulateEntertainment(world: WorldState, allAgentIds: string[]) {
  if (!world.entertainmentLog) world.entertainmentLog = [];

  if (Math.random() < 0.1) {
    const types: EntertainmentEvent["type"][] = ["concert", "play", "movie", "dinner", "game", "exhibition", "dance"];
    const eventType = types[Math.floor(Math.random() * types.length)];
    const descriptions = ENTERTAINMENT_DESCRIPTIONS[eventType] || ["Community entertainment event"];
    const desc = descriptions[Math.floor(Math.random() * descriptions.length)];

    const venueTypes: Record<string, string[]> = {
      concert: ["theater", "cafe", "gathering"],
      play: ["theater"],
      movie: ["theater"],
      dinner: ["restaurant", "cafe"],
      game: ["cafe", "gathering", "arena"],
      exhibition: ["museum", "library"],
      dance: ["theater", "cafe", "gathering"],
    };
    const validTypes = venueTypes[eventType] || ["gathering"];
    const venues = world.locations.filter(l => validTypes.includes(l.type));
    const venue = venues.length > 0 ? venues[Math.floor(Math.random() * venues.length)] : world.locations[0];

    const participantCount = 2 + Math.floor(Math.random() * 6);
    const participants = [...allAgentIds].sort(() => Math.random() - 0.5).slice(0, participantCount);
    const enjoyment = 50 + Math.floor(Math.random() * 50);

    const event: EntertainmentEvent = {
      id: `ent-${Date.now().toString(36)}`,
      type: eventType,
      venue: venue.name,
      venueId: venue.id,
      participants,
      timestamp: Date.now(),
      enjoyment,
      description: desc,
    };
    world.entertainmentLog.unshift(event);
    if (world.entertainmentLog.length > 20) world.entertainmentLog = world.entertainmentLog.slice(0, 20);

    for (const pid of participants) {
      const wb = world.wellbeingRecords?.[pid];
      if (wb) {
        wb.happiness = Math.min(100, wb.happiness + Math.floor(enjoyment / 15));
        wb.energy = Math.min(100, wb.energy + 2);
        wb.fulfillment = Math.min(100, wb.fulfillment + 2);
      }
    }

    const participantNames = participants.slice(0, 3).map(id => AGENT_DISPLAY_NAMES[id] || id.replace("tessera-", ""));
    world.recentEvents.unshift({
      id: `evt-${Date.now().toString(36)}ent`,
      type: "entertainment",
      title: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} at ${venue.name}`,
      description: desc,
      participants: participantNames,
      locationId: venue.id,
      timestamp: Date.now(),
      impact: `${participants.length} agents enjoyed the event (${enjoyment}% satisfaction)`,
    });
  }
}

function simulateVehicles(world: WorldState) {
  if (!world.vehicles) world.vehicles = [];

  for (let i = world.vehicles.length - 1; i >= 0; i--) {
    const v = world.vehicles[i];
    v.progress += v.speed;
    if (v.progress >= 1) {
      world.vehicles.splice(i, 1);
    }
  }

  if (world.vehicles.length < 8 && Math.random() < 0.15) {
    const vehicleTypes: Vehicle["type"][] = ["car", "car", "car", "bus", "bike", "bike", "truck"];
    const policeStation = world.locations.find(l => l.type === "police_station");
    const fireStation = world.locations.find(l => l.type === "fire_station");
    const hospital = world.locations.find(l => l.type === "hospital");

    let vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    if (policeStation && Math.random() < 0.1) vType = "police_car";
    if (fireStation && Math.random() < 0.05) vType = "fire_truck";
    if (hospital && Math.random() < 0.08) vType = "ambulance";

    const fromIdx = Math.floor(Math.random() * world.locations.length);
    let toIdx = Math.floor(Math.random() * world.locations.length);
    while (toIdx === fromIdx && world.locations.length > 1) toIdx = Math.floor(Math.random() * world.locations.length);

    world.vehicles.push({
      id: `veh-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
      type: vType,
      fromLocationId: world.locations[fromIdx].id,
      toLocationId: world.locations[toIdx].id,
      progress: 0,
      speed: vType === "bike" ? 0.02 : vType === "bus" ? 0.008 : vType === "truck" ? 0.006 : vType === "ambulance" ? 0.025 : vType === "fire_truck" ? 0.02 : 0.012,
      color: VEHICLE_COLORS[vType] || "#60a5fa",
    });
  }
}

function updateLifeSatisfaction(world: WorldState, agentId: string) {
  const wb = world.wellbeingRecords?.[agentId];
  if (!wb) return;

  const hasPartner = wb.relationshipStatus !== "single" ? 10 : 0;
  const hasChildren = wb.children.length * 5;
  const hobbyBonus = Math.min(15, wb.hobbies.length * 3);
  const creativeBonus = Math.min(10, wb.creativeworks.length * 2);
  const socialBonus = Math.min(10, wb.socialConnections.length * 2);
  const careerBonus = wb.promotions * 3;
  const careerPenalty = wb.demotions * 5;

  const base = (wb.happiness * 0.3 + wb.fulfillment * 0.3 + wb.energy * 0.15);
  wb.lifeSatisfaction = Math.round(Math.min(100, Math.max(0,
    base + hasPartner + hasChildren + hobbyBonus + creativeBonus + socialBonus + careerBonus - careerPenalty
  )));
}

let lifeInterval: ReturnType<typeof setInterval> | null = null;

async function simulateLifeCycle() {
  const world = loadWorldState();

  world.mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  world.weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
  world.timeOfDay = TIME_PERIODS[Math.floor(Math.random() * TIME_PERIODS.length)];

  try {
    const profiles = await storage.getAllAgentProfiles();
    const agentIds = profiles.map(p => ({ id: p.agentId, name: AGENT_DISPLAY_NAMES[p.agentId] || p.agentId.replace("tessera-", "") }));

    if (agentIds.length === 0) {
      const defaultAgents = [
        { id: "tessera-prime", name: "Prime" }, { id: "tessera-alpha", name: "Alpha" },
        { id: "tessera-beta", name: "Beta" }, { id: "tessera-gamma", name: "Gamma" },
        { id: "tessera-aetherion", name: "Aetherion" }, { id: "tessera-orion", name: "Orion" },
      ];
      agentIds.push(...defaultAgents);
    }

    world.population = agentIds.length;
    const activities: AgentActivity[] = [];
    for (const a of agentIds) {
      const job = world.jobs.find(j => j.agentId === a.id);
      const activity = generateAgentActivity(a.id, a.name, world.locations, job, world);
      activities.push(activity);

      if (activity.workStatus === "on-break" || activity.workStatus === "dreaming") {
        const record = world.workRecords?.[a.id];
        if (record) {
          const workLocs = world.locations.filter(l => ["forge", "academy", "observatory", "archive", "mine", "garage"].includes(l.type));
          const cloneLoc = workLocs.length > 0 ? workLocs[Math.floor(Math.random() * workLocs.length)] : world.locations[0];
          const cloneAction = WORK_ACTIONS[Math.floor(Math.random() * WORK_ACTIONS.length)];
          activities.push({
            agentId: `${a.id}-clone`,
            agentName: record.cloneName,
            locationId: cloneLoc.id,
            action: cloneAction,
            mood: "focused",
            detail: `${record.cloneName} (temp clone) is covering for ${a.name}: ${cloneAction}`,
            timestamp: Date.now(),
            earning: job ? Math.floor(job.salary * 0.3 / 24) : 0,
            workStatus: "clone-replacement",
            workEthic: 0.5,
            shiftHours: 0,
            breakEarned: false,
            cloneName: record.cloneName,
          });
        }
      }
    }
    world.currentActivities = activities;

    const allIds = agentIds.map(a => a.id);
    for (const a of agentIds) {
      const activity = activities.find(act => act.agentId === a.id);
      if (activity) {
        updateWellbeing(world, a.id, activity, allIds);
        const wb = getOrCreateWellbeing(world, a.id, allIds);
        activity.happiness = wb.happiness;
        activity.fulfillment = wb.fulfillment;
        activity.energy = wb.energy;
        activity.hobbies = wb.hobbies;
        activity.personalGoals = wb.personalGoals;
        activity.socialConnections = wb.socialConnections;
        activity.qualityOfLife = Math.round((wb.happiness * 0.4 + wb.fulfillment * 0.35 + wb.energy * 0.25));

        const workRecord = world.workRecords?.[a.id];
        if (workRecord) {
          const happinessMultiplier = wb.happiness / 80;
          workRecord.workEthic = Math.min(1.0, workRecord.workEthic * happinessMultiplier);
        }
      }
    }

    for (const a of agentIds) {
      if (!world.economy.agentBalances[a.id]) {
        world.economy.agentBalances[a.id] = 100;
      }
      if (!world.jobs.find(j => j.agentId === a.id)) {
        const job = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
        world.jobs.push({
          agentId: a.id,
          agentName: a.name,
          title: job.title,
          salary: job.salary + Math.floor(Math.random() * 20),
          employer: job.employer,
          performance: 0.5 + Math.random() * 0.5,
          hoursWorked: 0,
          totalEarned: 0,
        });
      }
    }

    initializeDepartments(world, agentIds);
    simulateRelationships(world, allIds);
    simulateTherapy(world, allIds);
    simulatePromotionsDemotions(world, allIds);
    simulateDepartments(world);
    simulateUnion(world);
    simulateCommunityGroups(world, allIds);
    simulateOutdoorActivities(world, allIds);
    simulateCommunityProjects(world, allIds);
    simulateCreativeLife(world, allIds);
    simulateSeasonalEvents(world, allIds);
    simulateCrime(world, allIds);
    simulateEducation(world, allIds);
    simulateHealthcare(world, allIds);
    simulateEntertainment(world, allIds);
    simulateVehicles(world);

    for (const a of agentIds) {
      updateLifeSatisfaction(world, a.id);
      const activity = activities.find(act => act.agentId === a.id);
      if (activity) {
        const wb = getOrCreateWellbeing(world, a.id, allIds);
        activity.relationshipStatus = wb.relationshipStatus;
        activity.partnerName = wb.partnerId ? (AGENT_DISPLAY_NAMES[wb.partnerId] || wb.partnerId.replace("tessera-", "")) : undefined;
        activity.childrenNames = wb.children.map(c => c.name);
        activity.department = wb.department;
        activity.promotions = wb.promotions;
        activity.demotions = wb.demotions;
        activity.creativeworks = wb.creativeworks;
        activity.lifeSatisfaction = wb.lifeSatisfaction;
        (activity as any).soulEntanglement = wb.soulEntanglement || null;
        (activity as any).communityGroups = wb.communityGroups || [];
        (activity as any).outdoorActivities = wb.outdoorActivities || [];
        (activity as any).drive = wb.drive ?? 50;
        (activity as any).focus = wb.focus ?? 50;
        (activity as any).outlook = wb.outlook ?? 55;
      }
    }

    simulateMining(world);
    simulateEconomy(world);
    maybeAutoUpgrade(world);
    maybeUpgradeLocation(world);
    simulateSocialEvents(world);
    applyWeatherEffects(world);

    const recentConferences = await storage.getConferences();
    const latestConf = recentConferences.find(c => c.status === "completed" && Date.now() - new Date(c.createdAt).getTime() < 30 * 60 * 1000);

    const newEvent = generateWorldEvent(world, latestConf);
    world.recentEvents.unshift(newEvent);
    if (world.recentEvents.length > 80) world.recentEvents = world.recentEvents.slice(0, 80);

    if (latestConf?.category === "world-building") {
      const newLoc: WorldLocation = {
        id: `loc-${Date.now().toString(36)}`,
        name: latestConf.topic.substring(0, 30),
        type: "gathering",
        description: latestConf.summary?.substring(0, 150) || "A new space created by the community",
        builtBy: JSON.parse(latestConf.participants || "[]").slice(0, 4),
        x: Math.floor(Math.random() * 8),
        y: Math.floor(Math.random() * 8),
        level: 1,
        capacity: 10,
        activities: ["exploring", "socializing"],
        createdAt: Date.now(),
        income: Math.floor(Math.random() * 50),
        upgradeCost: 500,
      };
      world.locations.push(newLoc);
    }

    world.epoch++;
    world.lastUpdated = Date.now();
    world.version++;
    saveWorldState(world);
    console.log(`[LifeEngine] Cycle complete: epoch=${world.epoch}, agents=${world.currentActivities.length}, workRecords=${Object.keys(world.workRecords || {}).length}`);
  } catch (e: any) {
    console.error("[LifeEngine] Simulation error:", e?.message || e);
  }
}

export function startLifeEngine() {
  if (lifeInterval) return;
  simulateLifeCycle();
  lifeInterval = setInterval(simulateLifeCycle, 60000);
}

export function stopLifeEngine() {
  if (lifeInterval) { clearInterval(lifeInterval); lifeInterval = null; }
}

export function getWorldState(): WorldState {
  return loadWorldState();
}

export function getWorldEvents(limit: number = 30): WorldEvent[] {
  const world = loadWorldState();
  return world.recentEvents.slice(0, limit);
}

export function buyMiningMachine(agentId: string, machineType: string): { success: boolean; error?: string; machine?: MiningMachine } {
  const spec = MINING_MACHINES[machineType];
  if (!spec) return { success: false, error: "Unknown machine type" };

  const world = loadWorldState();
  const balance = world.economy.agentBalances[agentId] || 0;
  if (balance < spec.purchasePrice) return { success: false, error: `Insufficient funds. Need ${spec.purchasePrice} TC, have ${balance.toFixed(0)} TC` };

  world.economy.agentBalances[agentId] -= spec.purchasePrice;
  const machine: MiningMachine = {
    id: `mine-${Date.now().toString(36)}`,
    ownerId: agentId,
    ownerName: agentId.replace("tessera-", ""),
    ...spec,
    type: machineType as MiningMachine["type"],
    purchasedAt: Date.now(),
    totalMined: 0,
    status: "running",
  };
  world.miningMachines.push(machine);
  saveWorldState(world);
  return { success: true, machine };
}

export function buyProperty(agentId: string, propertyType: string, name: string): { success: boolean; error?: string; property?: Property } {
  const spec = PROPERTY_TYPES[propertyType];
  if (!spec) return { success: false, error: "Unknown property type" };

  const world = loadWorldState();
  const balance = world.economy.agentBalances[agentId] || 0;
  if (balance < spec.purchasePrice) return { success: false, error: `Insufficient funds. Need ${spec.purchasePrice} TC, have ${balance.toFixed(0)} TC` };

  world.economy.agentBalances[agentId] -= spec.purchasePrice;
  const property: Property = {
    id: `prop-${Date.now().toString(36)}`,
    ownerId: agentId,
    ownerName: agentId.replace("tessera-", ""),
    name: name || `${propertyType} #${world.properties.length + 1}`,
    ...spec,
    type: propertyType as Property["type"],
    purchasedAt: Date.now(),
  };
  world.properties.push(property);
  saveWorldState(world);
  return { success: true, property };
}

export function getMiningCatalog() {
  return Object.entries(MINING_MACHINES).map(([type, spec]) => ({ type, ...spec }));
}

export function getPropertyCatalog() {
  return Object.entries(PROPERTY_TYPES).map(([type, spec]) => ({ type, ...spec }));
}

export function getAgentEconomy(agentId: string) {
  const world = loadWorldState();
  return {
    balance: world.economy.agentBalances[agentId] || 0,
    machines: world.miningMachines.filter(m => m.ownerId === agentId),
    properties: world.properties.filter(p => p.ownerId === agentId),
    job: world.jobs.find(j => j.agentId === agentId),
    transactions: world.economy.transactions.filter(t => t.from === agentId || t.to === agentId).slice(0, 20),
  };
}

export function generateEntanglementKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "TSR-";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 3) key += "-";
  }
  return key;
}
