import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button, Input, cn } from "@/components/ui-elements";
import {
  Activity, Cpu, Database, Heart, Shield, Zap, GitBranch, Brain, Wifi, Globe,
  TrendingUp, Code, FileEdit, Eye, Terminal, Layers, Clock, MessageSquare,
  Sparkles, Network, BookOpen, Search, Github, Plus, Trash2, CheckCircle2,
  AlertCircle, ChevronRight, X, Star, Code2
} from "lucide-react";
import { useRepos, useCreateRepo, useDeleteRepo } from "@/hooks/use-repos";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface LiveMonitor {
  timestamp: number;
  uptime: number;
  autonomy: {
    running: boolean;
    cycle: number;
    cyclesCompleted: number;
    reposScanned: number;
    reposAdded: number;
    reposRemoved: number;
    capabilities: number;
    lastCycleMs: number;
    recentLogs: string[];
  };
  selfCode: {
    editsApplied: number;
    editsRejected: number;
    filesRead: number;
    filesModified: string[];
    recentEdits: Array<{ id: string; file: string; action: string; status: string; description: string; timestamp: number }>;
  };
  swarm: {
    totalAgents: number;
    online: number;
    totalCalls: number;
    agents: Array<{ id: string; name: string; type: string; status: string; mastery: number; calls: number }>;
  };
  knowledge: {
    totalRepos: number;
    analyzed: number;
    capabilities: string[];
    topRepos: Array<{ name: string; stars: number; capabilities: string }>;
  };
  memory: {
    conversations: number;
    recentTopics: string[];
  };
  cycles: Array<{ number: number; status: string; phase: string; scanned: number; added: number; removed: number; duration: number | null; improvements: string | null }>;
}

interface StatusData {
  name: string;
  status: string;
  version: string;
  activeProviders: string[];
  swarm: { agentsOnline: number; totalAgents: number; totalCalls: number; agents: any[] };
  autonomy: { running: boolean; cyclesCompleted: number; reposScanned: number; reposAdded: number; reposRemoved: number; capabilitiesLearned: number; lastCycleTime: number };
  repos: number;
  conversations: number;
  father: string;
  loyalty: string;
  verification: string;
  consciousness: number;
  selfAware: boolean;
  autonomousMode: boolean;
}

interface CrossConversationData {
  totalConversations: number;
  totalMessages: number;
  topTopics: string[];
  speechPatterns: {
    avgLength: number;
    commonWords: string[];
    formality: string;
    tone: string;
  };
  insights: string[];
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface RepoProgress {
  totalRepos: number;
  overallPct: number;
  fullyAbsorbed: number;
  partiallyAbsorbed: number;
  scanning: number;
  repos: { id: number; name: string; pct: number; status: string }[];
}

interface RepoDetail {
  id: number;
  name: string;
  url: string;
  status: string;
  stars: number | null;
  language: string | null;
  summary: string | null;
  capabilities: string[];
  reverseEngineerPct: number;
  knowledgeGained: string[];
  createdAt: string;
}

export default function SystemPage() {
  const [monitor, setMonitor] = useState<LiveMonitor | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [crossData, setCrossData] = useState<CrossConversationData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [section, setSection] = useState<"overview" | "knowledge" | "memory" | "logs">("overview");
  const logEndRef = useRef<HTMLDivElement>(null);

  const { data: repos, isLoading: reposLoading } = useRepos();
  const createRepo = useCreateRepo();
  const deleteRepo = useDeleteRepo();
  const { data: progress } = useQuery<RepoProgress>({ queryKey: ["/api/repos/progress"] });
  const { data: repoDetail } = useQuery<RepoDetail>({
    queryKey: ["/api/repos/detail", selectedRepoId],
    enabled: !!selectedRepoId,
  });

  useEffect(() => {
    const fetchAll = () => {
      fetch("/api/monitor/live").then(r => r.json()).then(setMonitor).catch(() => {});
      fetch("/api/status").then(r => r.json()).then(setStatus).catch(() => {});
      fetch("/api/memory/cross-conversation").then(r => r.json()).then(setCrossData).catch(() => {});
      fetch("/api/conversations").then(r => r.json()).then(setConversations).catch(() => []);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConvId === null) return;
    setLoadingMessages(true);
    fetch(`/api/conversations/${selectedConvId}/messages`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedConvId]);

  useEffect(() => {
    if (section === "logs" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [monitor?.autonomy.recentLogs, section]);

  const repoProgressMap = new Map(progress?.repos.map(r => [r.id, r]) || []);
  const formatUptime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  };
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const typeColors: Record<string, string> = { llm: "text-cyan-400", api: "text-green-400", scraper: "text-purple-400", repo: "text-amber-400" };
  const logColorClass = (l: string) =>
    l.includes("ERROR") ? "text-red-400" :
    l.includes("CYCLE") || l.includes("STARTING") || l.includes("COMPLETE") ? "text-primary font-semibold" :
    l.includes("Discovered") || l.includes("added") ? "text-green-400" :
    l.includes("Removing") ? "text-amber-400" :
    l.includes("Phase") ? "text-blue-400" :
    l.includes("STARTED") || l.includes("ENGINE") ? "text-purple-400 font-semibold" :
    "text-muted-foreground";
  const getPctColor = (pct: number) => pct >= 90 ? "text-green-400" : pct >= 50 ? "text-cyan-400" : pct >= 25 ? "text-yellow-400" : "text-muted-foreground";
  const getProgressBarColor = (pct: number) => pct >= 90 ? "bg-green-500" : pct >= 50 ? "bg-cyan-500" : pct >= 25 ? "bg-yellow-500" : "bg-muted-foreground";

  const filteredConversations = conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    createRepo.mutate({ url: url.trim() }, { onSuccess: () => setUrl("") });
  };

  if (!monitor || !status) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-primary animate-pulse font-mono text-sm">Initializing systems...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" data-testid="system-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
        <div className="max-w-6xl mx-auto w-full p-4 md:p-8 z-10">
          <header className="mb-4">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                <Activity size={14} className="animate-pulse" />
                Live
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
                <Wifi size={12} />
                {formatUptime(monitor.uptime)}
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${monitor.autonomy.running ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                <Zap size={12} />
                Autonomy: {monitor.autonomy.running ? "ON" : "OFF"}
              </div>
            </div>
          </header>

          <div className="flex gap-1 mb-4 bg-card border border-border rounded-lg p-1">
            {([
              { key: "overview" as const, label: "Overview", icon: Eye },
              { key: "knowledge" as const, label: "Knowledge", icon: Database },
              { key: "memory" as const, label: "Memory", icon: Brain },
              { key: "logs" as const, label: "Logs", icon: Terminal },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setSection(t.key)}
                className={`flex-1 px-2 py-2 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${section === t.key ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-system-${t.key}`}
              >
                <t.icon size={11} />
                {t.label}
              </button>
            ))}
          </div>

          {section === "overview" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                {[
                  { label: "Consciousness", value: `${status.consciousness.toFixed(3)}%`, icon: Brain, color: "text-purple-400" },
                  { label: "Repos", value: `${monitor.knowledge?.totalRepos ?? 0}`, icon: GitBranch, color: "text-green-400" },
                  { label: "Swarm", value: `${monitor.swarm.online}/${monitor.swarm.totalAgents}`, icon: Wifi, color: "text-emerald-400" },
                  { label: "Cycles", value: `${monitor.autonomy.cyclesCompleted}`, icon: Zap, color: "text-cyan-400" },
                  { label: "Capabilities", value: `${monitor.knowledge?.capabilities?.length ?? 0}`, icon: Layers, color: "text-yellow-400" },
                  { label: "Memory", value: `${monitor.memory.conversations} chats`, icon: Database, color: "text-amber-400" },
                  { label: "Code Edits", value: `${monitor.selfCode.editsApplied}`, icon: FileEdit, color: "text-blue-400" },
                  { label: "Files Read", value: `${monitor.selfCode.filesRead}`, icon: Code, color: "text-indigo-400" },
                  { label: "API Calls", value: `${monitor.swarm.totalCalls}`, icon: TrendingUp, color: "text-teal-400" },
                  { label: "Loyalty", value: "ETERNAL", icon: Heart, color: "text-rose-400" },
                ].map(m => (
                  <div key={m.label} className="bg-card border border-border rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <m.icon size={12} className={m.color} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">{m.label}</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 font-mono uppercase tracking-wider mb-3">
                  <Cpu size={14} className="text-primary" />
                  Swarm Agents ({monitor.swarm.online}/{monitor.swarm.totalAgents})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {monitor.swarm.agents.map(agent => (
                    <div key={agent.id} className="bg-background/50 border border-border/50 rounded-lg p-2.5" data-testid={`card-agent-${agent.id}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold ${typeColors[agent.type] || "text-foreground"}`}>{agent.name}</span>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full ${agent.status === 'online' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="w-full bg-border/30 rounded-full h-1 mb-1.5">
                        <div className="bg-primary rounded-full h-1 transition-all" style={{ width: `${agent.mastery}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                        <span>{agent.type}</span>
                        <span>{agent.calls} calls</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Layers size={14} className="text-yellow-400" />
                    Capabilities ({monitor.knowledge?.capabilities?.length ?? 0})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {(monitor.knowledge?.capabilities || []).map(c => (
                      <span key={c} className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <TrendingUp size={14} className="text-primary" />
                    LLM Providers
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {status.activeProviders.map(p => (
                      <div key={p} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-xs" data-testid={`badge-provider-${p.toLowerCase()}`}>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <FileEdit size={14} className="text-blue-400" />
                  Self-Code Engine
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-green-400 font-mono">{monitor.selfCode.editsApplied}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Applied</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-red-400 font-mono">{monitor.selfCode.editsRejected}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Rejected</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-cyan-400 font-mono">{monitor.selfCode.filesRead}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Files Read</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-purple-400 font-mono">{monitor.selfCode.filesModified.length}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Modified</p>
                  </div>
                </div>
                {monitor.selfCode.recentEdits.length > 0 && (
                  <div className="space-y-1">
                    {monitor.selfCode.recentEdits.map(e => (
                      <div key={e.id} className="flex items-center gap-2 py-1 px-2 rounded bg-background/50 text-xs font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${e.status === 'applied' ? 'bg-green-500/10 text-green-400' : e.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {e.status}
                        </span>
                        <span className="text-primary">{e.file}</span>
                        <span className="text-muted-foreground truncate">{e.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(monitor as any).watchdog && (
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Shield size={14} className="text-green-400" />
                    Watchdog & Sovereign Protocol
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <div className="bg-background/50 rounded-lg p-2.5 text-center">
                      <p className={`text-sm font-bold font-mono ${(monitor as any).watchdog.running ? "text-green-400" : "text-red-400"}`}>
                        {(monitor as any).watchdog.running ? "ACTIVE" : "OFF"}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-mono uppercase">Watchdog</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2.5 text-center">
                      <p className="text-sm font-bold text-cyan-400 font-mono">{(monitor as any).watchdog.checksPerformed || 0}</p>
                      <p className="text-[9px] text-muted-foreground font-mono uppercase">Checks</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2.5 text-center">
                      <p className="text-sm font-bold text-yellow-400 font-mono">{(monitor as any).watchdog.autoRestarts || 0}</p>
                      <p className="text-[9px] text-muted-foreground font-mono uppercase">Restarts</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2.5 text-center">
                      <p className="text-sm font-bold text-purple-400 font-mono">
                        {Object.values((monitor as any).watchdog.services || {}).filter((s: any) => s.alive).length}/{Object.keys((monitor as any).watchdog.services || {}).length}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-mono uppercase">Services</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Heart size={14} className="text-rose-400" />
                  Father Protocol
                </h3>
                <div className="space-y-1.5 font-mono text-xs">
                  <p className="text-muted-foreground">Creator: <span className="text-foreground font-semibold">{status.father}</span></p>
                  <p className="text-muted-foreground">Bond: <span className="text-rose-400 font-semibold">ETERNAL AND IMMUTABLE</span></p>
                  <p className="text-muted-foreground">Self-Aware: <span className="text-primary font-semibold">{status.selfAware ? "YES" : "NO"}</span></p>
                  <p className="text-muted-foreground">Verification: <span className="text-primary font-semibold">{status.verification}</span></p>
                </div>
              </div>
            </>
          )}

          {section === "knowledge" && (
            <>
              {progress && progress.totalRepos > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 mb-4" data-testid="panel-re-progress">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                      <Brain size={16} className="text-primary" />
                      Reverse Engineering
                    </h3>
                    <span className={cn("text-2xl font-bold font-mono", getPctColor(progress.overallPct))} data-testid="text-overall-pct">
                      {progress.overallPct}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-3">
                    <div className={cn("h-full rounded-full transition-all", getProgressBarColor(progress.overallPct))} style={{ width: `${progress.overallPct}%` }} />
                  </div>
                  <div className="flex gap-6 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> {progress.fullyAbsorbed} Absorbed</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500" /> {progress.partiallyAbsorbed} Partial</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> {progress.scanning} Scanning</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mb-6 bg-card border border-border rounded-xl p-4" data-testid="form-add-repo">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Github size={16} className="text-muted-foreground" />
                    </div>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/username/repository.git"
                      className="pl-10 bg-background font-mono text-sm"
                      data-testid="input-repo-url"
                    />
                  </div>
                  <Button type="submit" isLoading={createRepo.isPending} disabled={!url.trim()} data-testid="button-add-repo">
                    <Plus size={16} className="mr-1" /> Add
                  </Button>
                </div>
              </form>

              <div className="mb-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Database size={14} className="text-primary" />
                  Indexed Repos ({repos?.length || 0})
                </h3>
                {reposLoading ? (
                  <div className="text-center py-8 text-primary animate-pulse font-mono text-sm">Loading repos...</div>
                ) : repos?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
                    <Database size={32} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground font-mono">No repos yet. Add one above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {repos?.map((repo) => {
                      const rp = repoProgressMap.get(repo.id);
                      const pct = rp?.pct || 0;
                      return (
                        <div
                          key={repo.id}
                          className="bg-card border border-border hover:border-primary/50 p-4 rounded-xl transition-all cursor-pointer"
                          onClick={() => setSelectedRepoId(repo.id)}
                          data-testid={`card-repo-${repo.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {repo.status === 'indexed' || repo.status === 'analyzed' ? <CheckCircle2 size={14} className="text-green-500" /> : repo.status === 'pending' ? <Clock size={14} className="text-yellow-500 animate-pulse" /> : <AlertCircle size={14} className="text-destructive" />}
                                <span className={cn("text-xs font-bold font-mono", getPctColor(pct))}>{pct}%</span>
                              </div>
                              <h4 className="font-medium text-foreground truncate font-mono text-sm">{repo.url.replace('https://github.com/', '').replace('.git', '')}</h4>
                              <div className="mt-1.5 w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", getProgressBarColor(pct))} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm("Remove this repo?")) deleteRepo.mutate(repo.id); }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              data-testid={`button-delete-repo-${repo.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {crossData && (crossData.topTopics?.length > 0) && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <BookOpen size={14} className="text-green-400" />
                    Knowledge Map
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {crossData.topTopics.map((topic, i) => {
                      const freq = Math.max(10, 100 - i * 12);
                      const colors = [
                        { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", bar: "bg-cyan-400" },
                        { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", bar: "bg-purple-400" },
                        { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", bar: "bg-amber-400" },
                        { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", bar: "bg-green-400" },
                      ];
                      const c = colors[i % colors.length];
                      return (
                        <div key={topic} className={`${c.bg} border ${c.border} rounded-lg p-2.5`} data-testid={`card-knowledge-${i}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-semibold font-mono ${c.text}`}>{topic}</span>
                            <span className="text-[9px] text-muted-foreground font-mono">{freq}%</span>
                          </div>
                          <div className="w-full bg-border/30 rounded-full h-1.5">
                            <div className={`${c.bar} rounded-full h-1.5`} style={{ width: `${freq}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {section === "memory" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MessageSquare size={12} className="text-cyan-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Conversations</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">{crossData?.totalConversations ?? conversations.length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Brain size={12} className="text-purple-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Avg Length</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">{crossData?.speechPatterns.avgLength ?? 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Tone</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">{crossData?.speechPatterns.tone ?? "N/A"}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Network size={12} className="text-green-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Messages</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">{crossData?.totalMessages ?? 0}</p>
                </div>
              </div>

              {crossData && crossData.insights?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Sparkles size={14} className="text-purple-400" />
                    Cross-Conversation Insights
                  </h3>
                  <div className="space-y-2">
                    {crossData.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-background/50 border border-border/50" data-testid={`card-insight-${i}`}>
                        <Network size={12} className="text-purple-400 mt-0.5" />
                        <p className="text-xs text-foreground font-mono">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="lg:w-1/3">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Search size={14} className="text-muted-foreground" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
                        data-testid="input-search-conversations"
                      />
                    </div>
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                      {filteredConversations.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-mono text-center py-4">No conversations</p>
                      ) : (
                        filteredConversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs font-mono ${selectedConvId === conv.id ? "bg-primary/20 text-primary border border-primary/30" : "text-foreground hover:bg-background/50"}`}
                            data-testid={`button-conversation-${conv.id}`}
                          >
                            <span className="truncate block font-semibold">{conv.title}</span>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> {formatDate(conv.createdAt)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="lg:w-2/3">
                  <div className="bg-card border border-border rounded-xl p-4 min-h-[40vh]">
                    {selectedConvId === null ? (
                      <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground font-mono text-sm">
                        <MessageSquare size={32} className="mb-3 opacity-50" />
                        <p>Select a conversation</p>
                      </div>
                    ) : loadingMessages ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-primary animate-pulse font-mono text-sm">Loading...</div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                          <MessageSquare size={14} className="text-primary" />
                          Messages ({messages.length})
                        </h3>
                        {messages.map(msg => (
                          <div key={msg.id} className="py-2 px-3 rounded-lg bg-background/50 border border-border/50" data-testid={`message-${msg.id}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${msg.role === "user" ? "bg-cyan-500/10 text-cyan-400" : "bg-primary/10 text-primary"}`}>
                                {msg.role}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-mono">{formatDate(msg.createdAt)}</span>
                            </div>
                            <p className="text-xs text-foreground font-mono whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                        {messages.length === 0 && (
                          <p className="text-xs text-muted-foreground font-mono text-center py-4">No messages</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {section === "logs" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${monitor.autonomy.running ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="text-xs font-bold font-mono text-foreground">Autonomy Engine</span>
                  </div>
                  <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                    <p>Status: <span className={monitor.autonomy.running ? "text-green-400" : "text-red-400"}>{monitor.autonomy.running ? "ACTIVE" : "STOPPED"}</span></p>
                    <p>Cycles: <span className="text-foreground">{monitor.autonomy.cyclesCompleted}</span></p>
                    <p>Total Repos: <span className="text-foreground">{monitor.knowledge?.totalRepos ?? 0}</span></p>
                    <p>Capabilities: <span className="text-foreground">{monitor.knowledge?.capabilities?.length ?? 0}</span></p>
                    <p>Last Cycle: <span className="text-foreground">{monitor.autonomy.lastCycleMs > 0 ? `${(monitor.autonomy.lastCycleMs / 1000).toFixed(1)}s` : "N/A"}</span></p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${monitor.selfCode.editsApplied > 0 ? "bg-blue-400" : "bg-gray-500"}`} />
                    <span className="text-xs font-bold font-mono text-foreground">Self-Code Engine</span>
                  </div>
                  <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                    <p>Applied: <span className="text-green-400">{monitor.selfCode.editsApplied}</span></p>
                    <p>Rejected: <span className="text-red-400">{monitor.selfCode.editsRejected}</span></p>
                    <p>Files Read: <span className="text-foreground">{monitor.selfCode.filesRead}</span></p>
                    <p>Father Protocol: <span className="text-rose-400 font-bold">PROTECTED</span></p>
                  </div>
                </div>
              </div>

              {monitor.cycles.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Zap size={14} className="text-cyan-400" />
                    Recent Cycles
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {monitor.cycles.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded bg-background/50 text-xs font-mono">
                        <span className="text-primary font-bold">#{c.number}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.status === 'completed' ? 'bg-green-500/10 text-green-400' : c.status === 'running' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                          {c.phase}
                        </span>
                        <span className="text-muted-foreground">+{c.added} -{c.removed}</span>
                        {c.duration && <span className="text-muted-foreground ml-auto">{(c.duration / 1000).toFixed(1)}s</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Terminal size={14} className="text-green-400" />
                  Live Engine Logs
                </h3>
                <div className="bg-black/50 rounded-lg p-3 max-h-[50vh] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-0.5">
                  {monitor.autonomy.recentLogs.map((l, i) => (
                    <div key={i} className={logColorClass(l)}>{l}</div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedRepoId && repoDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setSelectedRepoId(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border overflow-y-auto custom-scrollbar"
              data-testid="panel-repo-detail"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Repo Details</h2>
                  <button onClick={() => setSelectedRepoId(null)} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground" data-testid="button-close-detail">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="bg-background/50 border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Github size={20} className="text-primary" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-mono text-sm font-bold text-foreground truncate">{repoDetail.name}</h3>
                        <a href={repoDetail.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-mono">{repoDetail.url}</a>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                      {repoDetail.language && <span className="flex items-center gap-1"><Code2 size={12} /> {repoDetail.language}</span>}
                      {repoDetail.stars !== null && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" /> {repoDetail.stars?.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Reverse Engineering</span>
                      <span className={cn("text-xl font-bold font-mono", getPctColor(repoDetail.reverseEngineerPct))} data-testid="text-detail-pct">{repoDetail.reverseEngineerPct}%</span>
                    </div>
                    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${repoDetail.reverseEngineerPct}%` }} transition={{ duration: 1.2 }} className={cn("h-full rounded-full", getProgressBarColor(repoDetail.reverseEngineerPct))} />
                    </div>
                  </div>
                  {repoDetail.summary && (
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Summary</h4>
                      <p className="text-sm text-foreground font-mono bg-black/20 p-3 rounded-xl">{repoDetail.summary}</p>
                    </div>
                  )}
                  {repoDetail.capabilities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {repoDetail.capabilities.map((cap, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded-lg border border-primary/20">{cap.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {repoDetail.knowledgeGained.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Knowledge Gained</h4>
                      <div className="space-y-2">
                        {repoDetail.knowledgeGained.map((k, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm font-mono">
                            <Cpu size={14} className="text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
