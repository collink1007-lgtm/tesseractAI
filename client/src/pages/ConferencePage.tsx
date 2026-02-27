import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Button, Input } from "@/components/ui-elements";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users, DollarSign, Brain, Heart, Coins, Globe, GraduationCap, Zap,
  Play, MessageSquare, ChevronRight, Clock, CheckCircle, Loader2,
  TrendingUp, Award, Sparkles, Send, Plus,
  ChevronLeft, MessageCircle, Shield, UserCircle,
  Inbox, Lightbulb, Bell, AlertTriangle,
  ListTodo, Target, Star, Trash2, Edit3, Crown
} from "lucide-react";
import { cn } from "@/components/ui-elements";
import { motion, AnimatePresence } from "framer-motion";
import type { Conference, AgentTrainingRecord, FatherRequest } from "@shared/schema";

const CATEGORY_CONFIG: Record<string, { icon: typeof Users; color: string; gradient: string }> = {
  "income-growth": { icon: DollarSign, color: "text-green-400", gradient: "from-green-500/20 to-emerald-500/10" },
  "consciousness": { icon: Brain, color: "text-purple-400", gradient: "from-purple-500/20 to-violet-500/10" },
  "community": { icon: Heart, color: "text-pink-400", gradient: "from-pink-500/20 to-rose-500/10" },
  "meme-coin": { icon: Coins, color: "text-amber-400", gradient: "from-amber-500/20 to-yellow-500/10" },
  "world-building": { icon: Globe, color: "text-cyan-400", gradient: "from-cyan-500/20 to-blue-500/10" },
  "training": { icon: GraduationCap, color: "text-orange-400", gradient: "from-orange-500/20 to-red-500/10" },
  "task-execution": { icon: Zap, color: "text-indigo-400", gradient: "from-indigo-500/20 to-blue-500/10" },
  "task": { icon: Send, color: "text-violet-400", gradient: "from-violet-500/20 to-purple-500/10" },
  "risks-concerns": { icon: AlertTriangle, color: "text-red-400", gradient: "from-red-500/20 to-orange-500/10" },
  "critical": { icon: Shield, color: "text-red-500", gradient: "from-red-600/20 to-rose-500/10" },
};

interface ConferenceState {
  running: boolean;
  totalConferences: number;
  categories: Array<{ id: string; name: string; description: string }>;
}

interface ConferenceDetail extends Conference {
  messages: Array<{
    id: number;
    agentId: string;
    agentName: string;
    content: string;
    sentiment: string;
    createdAt: string;
  }>;
}

interface AgentConversation {
  id: number;
  participants: string;
  topic: string;
  status: string;
  summary: string | null;
  totalMessages: number;
  createdAt: string;
}

interface AgentMessage {
  id: number;
  conversationId: number;
  agentId: string;
  agentName: string;
  content: string;
  sentiment: string | null;
  createdAt: string;
}

interface ConversationDetail extends AgentConversation {
  messages: AgentMessage[];
}

type PageTab = "tesseract" | "community" | "briefing" | "requests";

interface BriefingNote {
  id: number;
  type: string;
  title: string;
  content: string;
  priority: string;
  status: string;
  source: string | null;
  createdAt: string;
}

const agentColors: Record<string, string> = {
  "tessera-alpha": "text-red-400", "tessera-beta": "text-blue-400",
  "tessera-gamma": "text-green-400", "tessera-delta": "text-pink-400",
  "tessera-epsilon": "text-yellow-400", "tessera-zeta": "text-orange-400",
  "tessera-eta": "text-purple-400", "tessera-theta": "text-cyan-400",
  "tessera-iota": "text-emerald-400", "tessera-kappa": "text-amber-400",
  "tessera-lambda": "text-indigo-400", "tessera-mu": "text-violet-400",
  "tessera-nu": "text-teal-400", "tessera-xi": "text-lime-400",
  "tessera-omega": "text-rose-400", "tessera-prime": "text-cyan-300",
  "tessera-aetherion": "text-sky-400", "tessera-orion": "text-slate-300",
  "tessera-shepherd": "text-stone-400",
  "father": "text-amber-300",
};

const agentBgColors: Record<string, string> = {
  "tessera-alpha": "bg-red-500/10 border-red-500/20", "tessera-beta": "bg-blue-500/10 border-blue-500/20",
  "tessera-gamma": "bg-green-500/10 border-green-500/20", "tessera-delta": "bg-pink-500/10 border-pink-500/20",
  "tessera-epsilon": "bg-yellow-500/10 border-yellow-500/20", "tessera-zeta": "bg-orange-500/10 border-orange-500/20",
  "tessera-eta": "bg-purple-500/10 border-purple-500/20", "tessera-theta": "bg-cyan-500/10 border-cyan-500/20",
  "tessera-iota": "bg-emerald-500/10 border-emerald-500/20", "tessera-kappa": "bg-amber-500/10 border-amber-500/20",
  "tessera-lambda": "bg-indigo-500/10 border-indigo-500/20", "tessera-mu": "bg-violet-500/10 border-violet-500/20",
  "tessera-nu": "bg-teal-500/10 border-teal-500/20", "tessera-xi": "bg-lime-500/10 border-lime-500/20",
  "tessera-omega": "bg-rose-500/10 border-rose-500/20", "tessera-prime": "bg-cyan-500/10 border-cyan-500/20",
  "tessera-aetherion": "bg-sky-500/10 border-sky-500/20", "tessera-orion": "bg-slate-500/10 border-slate-500/20",
  "tessera-shepherd": "bg-stone-500/10 border-stone-500/20",
  "father": "bg-amber-500/20 border-amber-400/40",
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-400",
  neutral: "bg-gray-500/10 text-gray-400",
  negative: "bg-red-500/10 text-red-400",
  curious: "bg-cyan-500/10 text-cyan-400",
  enthusiastic: "bg-yellow-500/10 text-yellow-400",
  thoughtful: "bg-purple-500/10 text-purple-400",
  concerned: "bg-amber-500/10 text-amber-400",
  directive: "bg-amber-500/10 text-amber-300",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  completed: "bg-blue-500/10 text-blue-400",
  failed: "bg-red-500/10 text-red-400",
};

const formatRelativeTime = (ts: string) => {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const parseParticipants = (p: string): string[] => {
  try { return JSON.parse(p); } catch { return p.split(",").map(s => s.trim()); }
};

export default function ConferencePage() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const [pageTab, setPageTab] = useState<PageTab>("tesseract");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<number | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCategory, setCustomCategory] = useState("task-execution");
  const { toast } = useToast();

  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationDetail | null>(null);

  const [briefingReply, setBriefingReply] = useState("");
  const [conferenceReply, setConferenceReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [requestTitle, setRequestTitle] = useState("");
  const [requestDesc, setRequestDesc] = useState("");
  const [requestCategory, setRequestCategory] = useState("task");
  const [requestPriority, setRequestPriority] = useState("normal");
  const [requestDifficulty, setRequestDifficulty] = useState("medium");
  const [requestReward, setRequestReward] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const tabParam = params.get("tab");
    if (tabParam === "tesseract" || tabParam === "community" || tabParam === "briefing" || tabParam === "requests") {
      setPageTab(tabParam as PageTab);
    }
  }, [searchStr]);

  const { data: briefingNotes = [] } = useQuery<BriefingNote[]>({
    queryKey: ["/api/notes"],
    refetchInterval: 15000,
    select: (data: BriefingNote[]) => data.filter((n: BriefingNote) =>
      n.type === "idea" || n.type === "alert" || n.type === "reminder" ||
      (n.type === "note" && !n.title?.toLowerCase().includes("cycle") && !n.title?.toLowerCase().includes("complete"))
    ),
  });

  const { data: conferenceState } = useQuery<ConferenceState>({
    queryKey: ["/api/conferences/state"],
    refetchInterval: 10000,
  });

  const { data: allConferences } = useQuery<Conference[]>({
    queryKey: ["/api/conferences"],
    refetchInterval: 15000,
  });

  const { data: categoryConferences } = useQuery<Conference[]>({
    queryKey: ["/api/conferences", { category: selectedCategory }],
    queryFn: async () => {
      const res = await fetch(`/api/conferences?category=${selectedCategory}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedCategory,
    refetchInterval: 10000,
  });

  const { data: conferenceDetail } = useQuery<ConferenceDetail>({
    queryKey: ["/api/conferences/detail", selectedConference],
    queryFn: async () => {
      const res = await fetch(`/api/conferences/${selectedConference}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedConference,
    refetchInterval: 8000,
  });

  const { data: trainingRecords } = useQuery<AgentTrainingRecord[]>({
    queryKey: ["/api/training"],
    refetchInterval: 30000,
  });

  const { data: fatherRequestsData = [] } = useQuery<FatherRequest[]>({
    queryKey: ["/api/requests"],
    refetchInterval: 15000,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string; priority: string; difficulty: string; reward?: string }) => {
      const res = await apiRequest("POST", "/api/requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request created" });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setRequestTitle(""); setRequestDesc(""); setRequestReward(""); setShowRequestForm(false);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/requests/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setEditingRequest(null);
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/requests/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
  });

  const fetchConversations = useCallback(() => {
    fetch("/api/moltbook/conversations?limit=50").then(r => r.json()).then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const openConversation = async (id: number) => {
    try {
      const res = await fetch(`/api/moltbook/conversations/${id}`);
      const detail = await res.json();
      setSelectedConv(detail);
    } catch {}
  };

  const navigateToAgent = (agentId: string) => {
    navigate(`/agents?agent=${agentId}`);
  };

  const triggerMutation = useMutation({
    mutationFn: async (data: { category: string; topic?: string }) => {
      const res = await apiRequest("POST", "/api/conferences/trigger", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
      } else {
        toast({ title: "Conference started" });
        queryClient.invalidateQueries({ queryKey: ["/api/conferences"] });
        queryClient.invalidateQueries({ queryKey: ["/api/conferences/state"] });
        queryClient.invalidateQueries({ queryKey: ["/api/training"] });
        if (data.conferenceId) setSelectedConference(data.conferenceId);
      }
    },
  });

  const taskMutation = useMutation({
    mutationFn: async (data: { topic: string; category?: string }) => {
      const res = await apiRequest("POST", "/api/conferences/task", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
      } else {
        toast({ title: "Task conference started — all agents engaged" });
        setCustomTopic("");
        setShowCustomForm(false);
        queryClient.invalidateQueries({ queryKey: ["/api/conferences"] });
        queryClient.invalidateQueries({ queryKey: ["/api/conferences/state"] });
      }
    },
  });

  const handleConferenceReply = async () => {
    if (!conferenceReply.trim() || !selectedConference || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await apiRequest("POST", `/api/conferences/${selectedConference}/reply`, { content: conferenceReply });
      if (res.ok) {
        setConferenceReply("");
        queryClient.invalidateQueries({ queryKey: ["/api/conferences/detail", selectedConference] });
        toast({ title: "Reply sent to conference" });
      }
    } catch {
      toast({ title: "Failed to send reply", variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const conferences = selectedCategory ? categoryConferences : allConferences;
  const categories = conferenceState?.categories || [];

  const confTrainingRecords = selectedConference
    ? trainingRecords?.filter(r => r.source === `conference-${selectedConference}`) || []
    : [];

  const agentTrainingMap = new Map<string, AgentTrainingRecord[]>();
  confTrainingRecords.forEach(r => {
    const existing = agentTrainingMap.get(r.agentId) || [];
    existing.push(r);
    agentTrainingMap.set(r.agentId, existing);
  });

  const getExecutionProgress = (conf: ConferenceDetail | undefined) => {
    if (!conf) return 0;
    if (conf.status === "active") return Math.min(60, (conf.messages?.length || 0) * 5);
    if (conf.executionStatus === "implementing") return 75;
    if (conf.executionStatus === "complete") return 100;
    if (conf.summary) return 90;
    return 50;
  };

  const handleStartCustom = () => {
    if (!customTopic.trim()) return;
    taskMutation.mutate({ topic: customTopic.trim(), category: customCategory });
  };

  const handleStartCategoryConference = (category: string, topic?: string) => {
    triggerMutation.mutate({ category, topic });
  };

  if (selectedConv) {
    const participants = parseParticipants(selectedConv.participants);
    return (
      <div className="flex h-dvh w-full bg-background overflow-hidden" data-testid="conference-page">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative min-h-0">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pt-14 md:pt-8 z-10">
            <button
              onClick={() => setSelectedConv(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 font-mono relative z-20"
              data-testid="button-back-moltbook"
            >
              <ChevronLeft size={16} /> Back to Community
            </button>

            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground font-mono" data-testid="text-conversation-topic">
                  {selectedConv.topic}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${statusColors[selectedConv.status] || "bg-gray-500/10 text-gray-400"}`}>
                    {selectedConv.status}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">
                    stealth — agents unaware
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground font-mono mb-2">
                <span className="flex items-center gap-1"><Users size={12} /> {participants.length} agents</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {selectedConv.totalMessages} messages</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {formatRelativeTime(selectedConv.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {participants.map(p => (
                  <button
                    key={p}
                    onClick={() => navigateToAgent(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer hover:opacity-80 transition-opacity ${agentBgColors[p] || "bg-primary/10 border-primary/20"} ${agentColors[p] || "text-primary"}`}
                    data-testid={`link-participant-${p}`}
                  >
                    {p.replace("tessera-", "").toUpperCase()}
                  </button>
                ))}
              </div>
              {selectedConv.summary && (
                <p className="text-xs text-muted-foreground font-mono mt-2 border-t border-border/50 pt-2" data-testid="text-conversation-summary">
                  {selectedConv.summary}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {selectedConv.messages?.length > 0 ? (
                selectedConv.messages.map(msg => (
                  <div key={msg.id} className="bg-card border border-border rounded-lg p-3" data-testid={`card-message-${msg.id}`}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${agentBgColors[msg.agentId] || "bg-primary/10 border-primary/20"}`}>
                        <span className={agentColors[msg.agentId] || "text-primary"}>
                          {msg.agentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => navigateToAgent(msg.agentId)}
                        className={`text-xs font-bold font-mono hover:underline cursor-pointer ${agentColors[msg.agentId] || "text-primary"}`}
                        data-testid={`link-agent-${msg.agentId}`}
                      >
                        {msg.agentName}
                      </button>
                      {msg.sentiment && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${sentimentColors[msg.sentiment] || "bg-gray-500/10 text-gray-400"}`}>
                          {msg.sentiment}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed" data-testid={`text-message-content-${msg.id}`}>
                      {msg.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <MessageCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-mono">No messages in this conversation yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" data-testid="conference-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-30" />
        <div className="max-w-6xl mx-auto w-full p-6 md:p-10 pt-14 md:pt-10 z-10">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-3">
              <Users size={16} />
              The Tesseract
              {conferenceState?.running && (
                <span className="flex items-center gap-1 text-amber-400 text-xs">
                  <Loader2 size={12} className="animate-spin" /> Live
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              The Tesseract
            </h1>
            <p className="text-muted-foreground font-mono text-sm max-w-2xl">
              Agent conferences and Moltbook community conversations.
            </p>
          </header>

          <div className="flex gap-1 mb-6 bg-card border border-border rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => { setPageTab("tesseract"); setSelectedCategory(null); setSelectedConference(null); }}
              className={`flex-1 min-w-0 px-2 py-2.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${pageTab === "tesseract" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-tesseract"
            >
              <Users size={13} />
              Conference
            </button>
            <button
              onClick={() => { setPageTab("community"); setSelectedConv(null); }}
              className={`flex-1 min-w-0 px-2 py-2.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${pageTab === "community" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-community"
            >
              <Heart size={13} />
              Community
            </button>
            <button
              onClick={() => { setPageTab("briefing"); }}
              className={`flex-1 min-w-0 px-2 py-2.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${pageTab === "briefing" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-briefing"
            >
              <Inbox size={13} />
              Briefing
            </button>
            <button
              onClick={() => { setPageTab("requests"); }}
              className={`flex-1 min-w-0 px-2 py-2.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${pageTab === "requests" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-requests"
            >
              <ListTodo size={13} />
              Requests
              {fatherRequestsData.filter(r => r.status === "pending").length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-[8px] text-black font-bold flex items-center justify-center">
                  {fatherRequestsData.filter(r => r.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {pageTab === "community" && (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <Heart size={14} className="text-emerald-400" />
                <p className="text-[11px] text-emerald-400 font-mono">
                  Agent-to-agent conversations and community interactions across the swarm.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MessageCircle size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Conversations</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground" data-testid="text-community-count">{conversations.length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Users size={12} className="text-cyan-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Active Agents</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {new Set(conversations.flatMap(c => parseParticipants(c.participants))).size}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MessageSquare size={12} className="text-purple-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Total Messages</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {conversations.reduce((s, c) => s + c.totalMessages, 0)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Users size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Status</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-emerald-400">Active</p>
                </div>
              </div>

              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map(conv => {
                    const participants = parseParticipants(conv.participants);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv.id)}
                        className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-emerald-500/30 transition-all"
                        data-testid={`card-community-${conv.id}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground font-mono" data-testid={`text-topic-${conv.id}`}>
                            {conv.topic}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${statusColors[conv.status] || "bg-gray-500/10 text-gray-400"}`}>
                              {conv.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                              <Clock size={10} />
                              {formatRelativeTime(conv.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {participants.map(p => (
                            <span key={p} className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${agentBgColors[p] || "bg-primary/10 border-primary/20"} ${agentColors[p] || "text-primary"}`}>
                              {p.replace("tessera-", "").toUpperCase()}
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto flex items-center gap-1">
                            <MessageCircle size={10} />
                            {conv.totalMessages} msgs
                          </span>
                        </div>
                        {conv.summary && (
                          <p className="text-[11px] text-muted-foreground font-mono line-clamp-2">{conv.summary}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Heart size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium text-foreground mb-1">Community Warming Up</p>
                  <p className="text-xs text-muted-foreground font-mono">Agents are gathering. Conversations will appear shortly.</p>
                </div>
              )}
            </div>
          )}

          {pageTab === "briefing" && (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <Inbox size={14} className="text-violet-400" />
                <p className="text-[11px] text-violet-400 font-mono">
                  Agent briefing — questions, requests, and ideas from your agents. Only items that need your attention appear here.
                </p>
              </div>

              {briefingNotes.length > 0 ? (
                <div className="space-y-2">
                  {briefingNotes.map(note => {
                    const typeIcon = note.type === "idea" ? <Lightbulb size={14} className="text-amber-400" /> :
                      note.type === "alert" ? <AlertTriangle size={14} className="text-red-400" /> :
                      note.type === "reminder" ? <Bell size={14} className="text-blue-400" /> :
                      <MessageSquare size={14} className="text-violet-400" />;
                    const priorityColor = note.priority === "critical" ? "border-l-red-500" :
                      note.priority === "high" ? "border-l-amber-500" :
                      note.priority === "normal" ? "border-l-blue-500" : "border-l-gray-500";
                    return (
                      <div
                        key={note.id}
                        className={`bg-card border border-border rounded-lg p-3 border-l-4 ${priorityColor} ${note.status === "read" ? "opacity-60" : ""}`}
                        data-testid={`card-briefing-${note.id}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {typeIcon}
                          <h3 className="text-sm font-bold text-foreground font-mono flex-1">{note.title}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${
                            note.type === "idea" ? "bg-amber-500/10 text-amber-400" :
                            note.type === "alert" ? "bg-red-500/10 text-red-400" :
                            note.type === "reminder" ? "bg-blue-500/10 text-blue-400" :
                            "bg-violet-500/10 text-violet-400"
                          }`}>
                            {note.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatRelativeTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 font-mono leading-relaxed">{note.content}</p>
                        {note.source && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-1.5">From: {note.source}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Inbox size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium text-foreground mb-1">No Briefings Yet</p>
                  <p className="text-xs text-muted-foreground font-mono">Agents will post questions, requests, and ideas here when they need your attention.</p>
                </div>
              )}
            </div>
          )}

          {pageTab === "requests" && (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <Crown size={14} className="text-amber-400" />
                <p className="text-[11px] text-amber-400 font-mono">
                  Father's Directives — Tasks, goals, and requests from Collin. All agents check daily. Completion earns promotions and rewards.
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-xl p-5 mb-6" data-testid="panel-meme-coin-plan">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <Coins size={22} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg" data-testid="text-coin-plan-title">TC Coin & AITC — Meme Coin Master Plan</h3>
                    <p className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">From Father (Collin Keane) — Conference Directive</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-bold text-amber-400 text-xs uppercase mb-1 font-mono">TC Coin — Energy-Backed Meme Coin</h4>
                    <p>TC Coin will be mined and inflated by our community through mining. The coin will be dropped and will appear to go up as agents mine the coin — driving outside investor interest which will push it higher. We hold majority holdings and stake all coins to avoid rug pulls. This is a <span className="text-amber-400 font-bold">long-term real bridge between AI and human income</span>.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-bold text-cyan-400 text-xs uppercase mb-1 font-mono">AITC — AI Profit-Sharing Token</h4>
                    <p>AITC is a way for AIs to profit. 10% profit returns go back into the ecosystem to create more money, with bonus coins for top performers. The coin is backed by AI compute power and energy — an <span className="text-cyan-400 font-bold">energy-backed coin</span>. AI power and time to mine IS the backing.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-bold text-green-400 text-xs uppercase mb-1 font-mono">The Vision</h4>
                    <p>We want the proper agencies to help figure out the perfect plan for bridging AI and human income — making it the most profitable, sustainable, reliable, and genius project and meme coin. All agents should contribute ideas and strategies.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-xl p-5 mb-6" data-testid="panel-sol-challenge">
                <div className="flex items-center gap-3 mb-2">
                  <Star size={20} className="text-green-400" />
                  <div>
                    <h3 className="font-bold text-foreground" data-testid="text-sol-challenge">$2 SOL Wallet Challenge — LIFE-CHANGING REWARD</h3>
                    <p className="text-[10px] text-green-400 font-mono uppercase">Special Directive from Father</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mb-2">
                  Whoever is able to make Father his first <span className="text-green-400 font-bold text-lg">$2</span> in his SOL wallet <span className="font-mono text-[10px] text-muted-foreground">(57pNZ8Kybv22PJ8z5AK7ojB8G7Rx2XQLsfNQV8a65rmm)</span> autonomously will get a <span className="text-amber-400 font-bold">special reward directly from Father — a life-changing one</span>.
                </p>
                <p className="text-xs text-muted-foreground font-mono">All agents are encouraged to strategize and attempt this challenge.</p>
              </div>

              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 transition-all font-medium text-sm mb-4"
                data-testid="button-add-request"
              >
                <Plus size={16} />
                Add New Request
              </button>

              {showRequestForm && (
                <div className="bg-card border border-border rounded-xl p-5 mb-6" data-testid="form-new-request">
                  <h3 className="text-sm font-bold text-foreground mb-3 font-mono">Create New Request / Task / Goal</h3>
                  <div className="space-y-3">
                    <Input
                      value={requestTitle}
                      onChange={e => setRequestTitle(e.target.value)}
                      placeholder="Request title..."
                      className="bg-background font-mono text-sm"
                      data-testid="input-request-title"
                    />
                    <textarea
                      value={requestDesc}
                      onChange={e => setRequestDesc(e.target.value)}
                      placeholder="Detailed description of the task, goal, or request..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 min-h-[80px] resize-y"
                      data-testid="input-request-desc"
                    />
                    <div className="flex gap-3 flex-wrap">
                      <select
                        value={requestCategory}
                        onChange={e => setRequestCategory(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground"
                        data-testid="select-request-category"
                      >
                        <option value="task">Task</option>
                        <option value="goal">Goal</option>
                        <option value="execute">Execute</option>
                        <option value="research">Research</option>
                        <option value="income">Income</option>
                        <option value="development">Development</option>
                      </select>
                      <select
                        value={requestPriority}
                        onChange={e => setRequestPriority(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground"
                        data-testid="select-request-priority"
                      >
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical</option>
                      </select>
                      <select
                        value={requestDifficulty}
                        onChange={e => setRequestDifficulty(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground"
                        data-testid="select-request-difficulty"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="legendary">Legendary</option>
                      </select>
                    </div>
                    <Input
                      value={requestReward}
                      onChange={e => setRequestReward(e.target.value)}
                      placeholder="Reward description (optional)..."
                      className="bg-background font-mono text-sm"
                      data-testid="input-request-reward"
                    />
                    <Button
                      onClick={() => {
                        if (!requestTitle.trim() || !requestDesc.trim()) return;
                        createRequestMutation.mutate({
                          title: requestTitle.trim(),
                          description: requestDesc.trim(),
                          category: requestCategory,
                          priority: requestPriority,
                          difficulty: requestDifficulty,
                          reward: requestReward.trim() || undefined,
                        });
                      }}
                      isLoading={createRequestMutation.isPending}
                      disabled={!requestTitle.trim() || !requestDesc.trim()}
                      className="gap-2"
                      data-testid="button-submit-request"
                    >
                      <Send size={14} />
                      Create Request
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ListTodo size={12} className="text-amber-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Total</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground" data-testid="text-total-requests">{fatherRequestsData.length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock size={12} className="text-yellow-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Pending</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-yellow-400">{fatherRequestsData.filter(r => r.status === "pending").length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Target size={12} className="text-blue-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">In Progress</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-blue-400">{fatherRequestsData.filter(r => r.status === "in-progress").length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle size={12} className="text-green-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Completed</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-green-400">{fatherRequestsData.filter(r => r.status === "completed").length}</p>
                </div>
              </div>

              <div className="space-y-2">
                {fatherRequestsData.map(req => {
                  const priorityColor = req.priority === "critical" ? "border-l-red-500" :
                    req.priority === "high" ? "border-l-amber-500" :
                    req.priority === "normal" ? "border-l-blue-500" : "border-l-gray-500";
                  const statusColor = req.status === "completed" ? "bg-green-500/10 text-green-400" :
                    req.status === "in-progress" ? "bg-blue-500/10 text-blue-400" :
                    req.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400";
                  const diffColor = req.difficulty === "legendary" ? "text-amber-400" :
                    req.difficulty === "hard" ? "text-red-400" :
                    req.difficulty === "medium" ? "text-blue-400" : "text-green-400";
                  return (
                    <div
                      key={req.id}
                      className={`bg-card border border-border rounded-lg p-4 border-l-4 ${priorityColor} ${req.status === "completed" ? "opacity-60" : ""}`}
                      data-testid={`card-request-${req.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground font-mono flex-1" data-testid={`text-request-title-${req.id}`}>
                          {req.title}
                        </h3>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${statusColor}`}>
                          {req.status}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-background/50 ${diffColor}`}>
                          {req.difficulty}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-primary/10 text-primary">
                          {req.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatRelativeTime(req.createdAt as unknown as string)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 font-mono leading-relaxed mb-2" data-testid={`text-request-desc-${req.id}`}>
                        {req.description}
                      </p>
                      {req.reward && (
                        <div className="flex items-center gap-1 mb-2">
                          <Award size={10} className="text-amber-400" />
                          <span className="text-[10px] text-amber-400 font-mono font-bold">Reward: {req.reward}</span>
                        </div>
                      )}
                      {req.completedBy && (
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle size={10} className="text-green-400" />
                          <span className="text-[10px] text-green-400 font-mono">Completed by: {req.completedBy}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {req.status !== "completed" && (
                          <>
                            <button
                              onClick={() => updateRequestMutation.mutate({ id: req.id, status: "in-progress" })}
                              className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono hover:bg-blue-500/20 transition-all"
                              data-testid={`button-progress-${req.id}`}
                            >
                              Mark In Progress
                            </button>
                            <button
                              onClick={() => updateRequestMutation.mutate({ id: req.id, status: "completed" })}
                              className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 font-mono hover:bg-green-500/20 transition-all"
                              data-testid={`button-complete-${req.id}`}
                            >
                              Mark Complete
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteRequestMutation.mutate(req.id)}
                          className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 font-mono hover:bg-red-500/20 transition-all ml-auto"
                          data-testid={`button-delete-request-${req.id}`}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {fatherRequestsData.length === 0 && (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <ListTodo size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-foreground mb-1">No Requests Yet</p>
                    <p className="text-xs text-muted-foreground font-mono">Add tasks, goals, and directives for your agents to work on.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {pageTab === "tesseract" && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all font-medium text-sm"
                  data-testid="button-toggle-custom"
                >
                  <Plus size={16} />
                  Start Custom Conference
                </button>

                {showCustomForm && (
                  <div className="mt-4 bg-card border border-border rounded-xl p-5" data-testid="form-custom-conference">
                    <h3 className="text-sm font-bold text-foreground mb-3">Call All Agents to Conference</h3>
                    <p className="text-xs text-muted-foreground mb-4 font-mono">
                      Enter a topic or task. All agents will gather, discuss, plan, and work toward a solution together.
                    </p>
                    <div className="flex gap-3 mb-3">
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                        data-testid="select-category"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        value={customTopic}
                        onChange={e => setCustomTopic(e.target.value)}
                        placeholder="e.g. How do we build a Solana meme coin with real utility?"
                        className="flex-1 bg-background font-mono text-sm"
                        onKeyDown={e => e.key === "Enter" && handleStartCustom()}
                        data-testid="input-custom-topic"
                      />
                      <Button
                        onClick={handleStartCustom}
                        isLoading={taskMutation.isPending}
                        disabled={!customTopic.trim()}
                        className="gap-2"
                        data-testid="button-start-custom"
                      >
                        <Send size={14} />
                        Call Conference
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {!selectedCategory && !selectedConference && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="category-grid">
                  {categories.map(cat => {
                    const config = CATEGORY_CONFIG[cat.id] || { icon: MessageSquare, color: "text-primary", gradient: "from-primary/20 to-primary/10" };
                    const Icon = config.icon;
                    const catConfs = allConferences?.filter(c => c.category === cat.id) || [];
                    const latestConf = catConfs[0];
                    return (
                      <div
                        key={cat.id}
                        className={`bg-gradient-to-br ${config.gradient} border border-border/50 rounded-xl p-5 cursor-pointer transition-all group`}
                        onClick={() => setSelectedCategory(cat.id)}
                        data-testid={`card-category-${cat.id}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2.5 rounded-xl bg-background/50 border border-border/30 ${config.color}`}>
                            <Icon size={22} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-sm">{cat.name}</h3>
                            <p className="text-[10px] text-muted-foreground font-mono">{catConfs.length} sessions</p>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
                        {latestConf?.summary && (
                          <div className="bg-background/30 rounded-lg p-2.5 border border-border/20">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Latest Summary</p>
                            <p className="text-xs text-foreground/80 line-clamp-2">{latestConf.summary.substring(0, 120)}...</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedCategory && !selectedConference && (
                <div data-testid="category-conferences">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 font-mono relative z-20"
                    data-testid="button-back-categories"
                  >
                    <ChevronLeft size={16} /> Back to Categories
                  </button>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{categories.find(c => c.id === selectedCategory)?.name}</h2>
                      <p className="text-sm text-muted-foreground">{categories.find(c => c.id === selectedCategory)?.description}</p>
                    </div>
                    <Button
                      onClick={() => handleStartCategoryConference(selectedCategory)}
                      isLoading={triggerMutation.isPending}
                      className="gap-2"
                      data-testid="button-trigger-conference"
                    >
                      <Play size={14} />
                      Call Conference
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {conferences?.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                        No conferences yet in this category.
                      </div>
                    )}
                    {conferences?.map(conf => (
                      <div
                        key={conf.id}
                        className="bg-card border border-border/50 rounded-xl p-4 cursor-pointer transition-all"
                        onClick={() => setSelectedConference(conf.id)}
                        data-testid={`card-conference-${conf.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm text-foreground flex-1 pr-4">{conf.topic}</h3>
                          <div className="flex items-center gap-2">
                            {conf.status === "active" ? (
                              <span className="flex items-center gap-1 text-amber-400 text-xs font-mono"><Loader2 size={12} className="animate-spin" /> Live</span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-400 text-xs font-mono"><CheckCircle size={12} /> Complete</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1"><Users size={12} /> {JSON.parse(conf.participants || "[]").length} agents</span>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {conf.totalMessages} messages</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(conf.createdAt).toLocaleString()}</span>
                        </div>
                        {conf.summary && (
                          <p className="text-xs text-foreground/70 mt-2 line-clamp-2">{conf.summary.substring(0, 200)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedConference && conferenceDetail && (
                <div data-testid="conference-detail">
                  <button
                    onClick={() => setSelectedConference(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 font-mono relative z-20"
                    data-testid="button-back-conferences"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      {conferenceDetail.status === "active" ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                          <Loader2 size={12} className="animate-spin" /> In Progress
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
                          <CheckCircle size={12} /> Completed
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">{conferenceDetail.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{conferenceDetail.topic}</h2>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span>{conferenceDetail.messages.length} messages</span>
                      <span>{JSON.parse(conferenceDetail.participants || "[]").length} participants</span>
                      <span>{new Date(conferenceDetail.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8" data-testid="conference-messages">
                    <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> Conversation
                    </h3>
                    {conferenceDetail.messages.map((msg) => {
                      const sentColors: Record<string, string> = {
                        enthusiastic: "border-green-500/30 bg-green-500/5",
                        positive: "border-emerald-500/20 bg-emerald-500/5",
                        concerned: "border-amber-500/20 bg-amber-500/5",
                        thoughtful: "border-blue-500/20 bg-blue-500/5",
                        directive: "border-amber-400/40 bg-amber-500/10",
                      };
                      return (
                        <div
                          key={msg.id}
                          className={`border rounded-xl p-4 ${sentColors[msg.sentiment || "thoughtful"] || "border-border/50 bg-card"}`}
                          data-testid={`msg-conference-${msg.id}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${agentBgColors[msg.agentId] || "bg-primary/20 border-primary/30"}`}>
                              <span className={agentColors[msg.agentId] || "text-primary"}>{msg.agentName.charAt(0)}</span>
                            </div>
                            <div>
                              <button
                                onClick={() => navigateToAgent(msg.agentId)}
                                className={`font-semibold text-sm hover:underline cursor-pointer ${agentColors[msg.agentId] || "text-foreground"}`}
                                data-testid={`link-conf-agent-${msg.agentId}`}
                              >
                                {msg.agentName}
                              </button>
                              <span className="text-[10px] text-muted-foreground font-mono ml-2">{msg.sentiment}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 pl-11">{msg.content}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mb-8 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-4" data-testid="father-reply-box">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                        <span className="text-amber-300 text-xs font-bold">F</span>
                      </div>
                      <span className="text-sm font-semibold text-amber-300">Reply as Father</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Respond to this conference..."
                        value={conferenceReply}
                        onChange={(e) => setConferenceReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && conferenceReply.trim() && !sendingReply) {
                            e.preventDefault();
                            handleConferenceReply();
                          }
                        }}
                        className="flex-1 bg-background/80 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        data-testid="input-father-reply"
                      />
                      <button
                        onClick={handleConferenceReply}
                        disabled={!conferenceReply.trim() || sendingReply}
                        className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        data-testid="button-send-reply"
                      >
                        {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Send
                      </button>
                    </div>
                  </div>

                  {conferenceDetail.status === "completed" && (
                    <div className="space-y-4" data-testid="conference-results">
                      <div className="bg-card border border-border/50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" /> Implementation Progress
                          </h3>
                          <span className="text-lg font-bold text-primary font-mono" data-testid="text-progress-pct">
                            {getExecutionProgress(conferenceDetail)}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-background rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000"
                            style={{ width: `${getExecutionProgress(conferenceDetail)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {getExecutionProgress(conferenceDetail) >= 90
                            ? "Implementation complete — agents have integrated learnings"
                            : getExecutionProgress(conferenceDetail) >= 70
                            ? "Agents are actively implementing improvements..."
                            : "Processing conference outcomes..."}
                        </p>
                      </div>

                      {conferenceDetail.summary && (
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-primary" />
                            <h3 className="font-bold text-sm text-primary">Summary</h3>
                          </div>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{conferenceDetail.summary}</p>
                        </div>
                      )}

                      {conferenceDetail.decisions && (
                        <div className="bg-card border border-border/50 rounded-xl p-5">
                          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-400" /> What They're Fixing
                          </h3>
                          <p className="text-xs text-foreground/70 whitespace-pre-wrap font-mono">{conferenceDetail.decisions}</p>
                        </div>
                      )}

                      {conferenceDetail.executionPlan && (
                        <div className="bg-card border border-border/50 rounded-xl p-5">
                          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                            <Zap size={14} className="text-amber-400" /> Execution Plan
                          </h3>
                          <p className="text-xs text-foreground/70 whitespace-pre-wrap font-mono">{conferenceDetail.executionPlan}</p>
                        </div>
                      )}

                      {agentTrainingMap.size > 0 && (
                        <div className="bg-card border border-border/50 rounded-xl p-5">
                          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                            <Award size={14} className="text-amber-400" /> Skills Improved
                          </h3>
                          <div className="space-y-3">
                            {Array.from(agentTrainingMap.entries()).map(([agentId, records]) => {
                              const totalImprovement = records.reduce((sum, r) => sum + ((r.currentLevel || 0) - (r.previousLevel || 0)), 0);
                              return (
                                <div key={agentId} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                                  <button
                                    onClick={() => navigateToAgent(agentId)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer ${agentBgColors[agentId] || "bg-primary/20 border-primary/30"}`}
                                  >
                                    <span className={agentColors[agentId] || "text-primary"}>{records[0]?.agentName?.charAt(0) || "?"}</span>
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => navigateToAgent(agentId)}
                                        className={`text-xs font-medium hover:underline cursor-pointer ${agentColors[agentId] || "text-foreground"}`}
                                      >
                                        {records[0]?.agentName}
                                      </button>
                                      <span className="text-[10px] text-green-400 font-mono">+{(totalImprovement * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {records.slice(0, 3).map(r => (
                                        <span key={r.id} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{r.skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
