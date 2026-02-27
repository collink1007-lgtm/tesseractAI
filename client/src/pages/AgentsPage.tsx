import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import {
  Loader2, ChevronRight, Crown, Shield, Star, Users, Building2, Trophy, ArrowUp, Zap,
  MessageCircle, UserCircle, Clock, ChevronLeft, Heart, Brain, Eye,
  AlertTriangle, TrendingUp, User, MessageSquare, Search, Award, Briefcase
} from "lucide-react";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";

interface AgentPosition {
  agentId: string;
  name: string;
  role: string;
  personality: string;
  interests: string[];
  department: string;
  agency: string;
  rank: number;
  title: string;
  reportsTo: string;
  merit: number;
  promotions: number;
  tasksCompleted: number;
  rewards: string[];
  hiredAt: number;
  lastPromotionAt: number;
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

interface AgentProfile {
  id: string;
  name: string;
  role: string;
  personality: string;
  beliefs?: string;
  thinkingStyle?: string;
  strengths?: string;
  concerns?: string;
  trustLevel: number;
  loyaltyScore: number;
  messageCount: number;
  topicsDiscussed: string[];
}

interface AgentDetail {
  id: string;
  name: string;
  role: string;
  definedPersonality: string;
  interests: string[];
  profile: {
    beliefs?: string;
    personality?: string;
    thinkingStyle?: string;
    strengths?: string;
    concerns?: string;
    trustLevel?: number;
    loyaltyScore?: number;
    topicsDiscussed?: string;
    messageCount?: number;
  } | null;
  recentMessages: Array<{
    id: number;
    agentId: string;
    agentName: string;
    content: string;
    sentiment?: string;
    createdAt: string;
  }>;
}

interface AuditResult {
  agentId: string;
  name: string;
  overview: string;
  trustAnalysis: string;
  loyaltyAnalysis: string;
  behaviorPatterns: string;
  concerns: string[];
  recommendations: string[];
  riskLevel: string;
}

const RANK_TITLES: Record<number, string> = {
  1: "Royal", 2: "Director", 3: "Lead", 4: "Senior", 5: "Agent", 6: "Junior", 7: "Trainee",
};

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-400", 2: "text-purple-400", 3: "text-cyan-400",
  4: "text-emerald-400", 5: "text-blue-400", 6: "text-gray-400", 7: "text-gray-500",
};

const RANK_BG: Record<number, string> = {
  1: "bg-amber-500/10 border-amber-500/20", 2: "bg-purple-500/10 border-purple-500/20",
  3: "bg-cyan-500/10 border-cyan-500/20", 4: "bg-emerald-500/10 border-emerald-500/20",
  5: "bg-blue-500/10 border-blue-500/20", 6: "bg-gray-500/10 border-gray-500/20",
  7: "bg-gray-500/10 border-gray-500/20",
};

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
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-400",
  neutral: "bg-gray-500/10 text-gray-400",
  negative: "bg-red-500/10 text-red-400",
  curious: "bg-cyan-500/10 text-cyan-400",
  enthusiastic: "bg-yellow-500/10 text-yellow-400",
  thoughtful: "bg-purple-500/10 text-purple-400",
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

function MeritBar({ merit }: { merit: number }) {
  const thresholds = [30, 60, 100, 200, 400, 800];
  const nextThreshold = thresholds.find(t => t > merit) || 800;
  const prevThreshold = [...thresholds].reverse().find(t => t <= merit) || 0;
  const denominator = nextThreshold - prevThreshold;
  const progress = merit >= 800 ? 100 : denominator > 0 ? Math.min(100, ((merit - prevThreshold) / denominator) * 100) : 100;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-amber-400"
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{merit >= 800 ? `${merit} MAX` : `${merit}/${nextThreshold}`}</span>
    </div>
  );
}

function TrustMeter({ value, label }: { value: number; label: string }) {
  const color = value >= 0.7 ? '#4ade80' : value >= 0.4 ? '#facc15' : '#f87171';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-mono uppercase">{label}</span>
        <span className="text-xs font-bold font-mono" style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full bg-border/30 rounded-full h-1.5">
        <div className="rounded-full h-1.5 transition-all" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function FullAgentProfile({
  agentId,
  onBack,
}: {
  agentId: string;
  onBack: () => void;
}) {
  const [, navigate] = useLocation();
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [training, setTraining] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: positions } = useQuery<AgentPosition[]>({ queryKey: ["/api/agencies/positions"] });
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const position = positions?.find(p => p.agentId === agentId);

  useEffect(() => {
    setLoading(true);
    setAudit(null);
    Promise.all([
      fetch(`/api/moltbook/agents/${agentId}`).then(r => r.json()).catch(() => null),
      fetch(`/api/training?agentId=${agentId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/moltbook/conversations?limit=50`).then(r => r.json()).catch(() => []),
    ]).then(([profileData, trainingData, convData]) => {
      setDetail(profileData);
      setTraining(Array.isArray(trainingData) ? trainingData : []);
      const agentConvs = (Array.isArray(convData) ? convData : []).filter((c: AgentConversation) => {
        const participants = parseParticipants(c.participants);
        return participants.includes(agentId);
      });
      setConversations(agentConvs);
      setLoading(false);
    });

    setAuditLoading(true);
    fetch(`/api/moltbook/agents/${agentId}/audit`)
      .then(r => r.json())
      .then(setAudit)
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, [agentId]);

  const riskColor = (level: string) => {
    const l = level?.toLowerCase();
    if (l === "low") return "bg-green-500/10 text-green-400 border-green-500/20";
    if (l === "medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!detail) return null;

  const trust = detail.profile?.trustLevel ?? 0.5;
  const loyalty = detail.profile?.loyaltyScore ?? 1.0;

  return (
    <div data-testid="agent-full-profile">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 font-mono pl-0 ml-0 relative z-20"
        data-testid="button-back-agents"
      >
        <ChevronLeft size={16} /> Back to Agents
      </button>

      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 ${agentBgColors[agentId] || "bg-primary/10 border-primary/20"}`}>
            <span className={agentColors[agentId] || "text-primary"}>
              {detail.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold font-mono ${agentColors[agentId] || "text-primary"}`}>
              {detail.name}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">{detail.role}</p>
          </div>
          {position && (
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${RANK_BG[position.rank] || RANK_BG[5]}`}>
              <span className={RANK_COLORS[position.rank] || "text-gray-400"}>
                Rank {position.rank} — {position.title}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Trust", value: `${(trust * 100).toFixed(0)}%`, icon: Shield, color: "text-cyan-400" },
            { label: "Loyalty", value: `${(loyalty * 100).toFixed(0)}%`, icon: Heart, color: "text-rose-400" },
            { label: "Messages", value: detail.profile?.messageCount ?? 0, icon: MessageCircle, color: "text-primary" },
            { label: "Merit", value: position?.merit ?? 0, icon: Trophy, color: "text-amber-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-background/50 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={14} className={stat.color} />
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{stat.label}</span>
              </div>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <TrustMeter value={trust} label="Trust Level" />
          <TrustMeter value={loyalty} label="Loyalty Score" />
        </div>

        {position && (
          <div className="mb-4">
            <MeritBar merit={position.merit} />
          </div>
        )}

        <p className="text-sm text-foreground/80 mb-3">{detail.definedPersonality}</p>

        {detail.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {detail.interests.map((interest: string) => (
              <span key={interest} className="px-2 py-1 rounded-md text-[10px] bg-primary/10 text-primary font-mono border border-primary/20">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {audit && (
        <div className="bg-card border border-orange-500/30 rounded-xl p-5 mb-4" data-testid="panel-auto-audit">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Eye size={14} className="text-orange-400" /> Deep Audit
              <span className="text-[9px] text-muted-foreground font-mono uppercase">auto-scan</span>
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${riskColor(audit.riskLevel)}`}>
              Risk: {audit.riskLevel?.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-foreground/80 mb-3">{audit.overview}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {[
              { label: "Trust Analysis", value: audit.trustAnalysis, icon: Shield, color: "text-cyan-400" },
              { label: "Loyalty Analysis", value: audit.loyaltyAnalysis, icon: Heart, color: "text-rose-400" },
              { label: "Behavior Patterns", value: audit.behaviorPatterns, icon: Brain, color: "text-purple-400" },
            ].filter(item => item.value).map(item => (
              <div key={item.label} className="bg-background/50 rounded-lg p-3 border border-border/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={12} className={item.color} />
                  <span className="text-[10px] text-muted-foreground font-mono uppercase font-semibold">{item.label}</span>
                </div>
                <p className="text-[11px] text-foreground/80">{item.value}</p>
              </div>
            ))}
          </div>
          {(() => {
            const concerns = Array.isArray(audit.concerns) ? audit.concerns : (typeof audit.concerns === 'string' ? [audit.concerns] : []);
            return concerns.length > 0 ? (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={12} className="text-yellow-400" />
                  <span className="text-[10px] text-muted-foreground font-mono uppercase font-semibold">Concerns</span>
                </div>
                <div className="space-y-1">
                  {concerns.map((c: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-yellow-400/80 bg-yellow-500/5 rounded-lg p-2 border border-yellow-500/10">
                      <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          {(() => {
            const recs = Array.isArray(audit.recommendations) ? audit.recommendations : (typeof audit.recommendations === 'string' ? [audit.recommendations] : []);
            return recs.length > 0 ? (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Star size={12} className="text-emerald-400" />
                  <span className="text-[10px] text-muted-foreground font-mono uppercase font-semibold">Recommendations</span>
                </div>
                <div className="space-y-1">
                  {recs.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-emerald-400/80 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
                      <Star size={10} className="mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
      {auditLoading && !audit && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4 flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-orange-400" />
          <span className="text-xs text-muted-foreground font-mono">Running deep audit on {detail.name}...</span>
        </div>
      )}

      {position && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Building2 size={14} className="text-primary" /> Organization
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Agency", value: position.agency, icon: Briefcase },
              { label: "Department", value: position.department, icon: Building2 },
              { label: "Title", value: position.title, icon: Crown },
              { label: "Reports To", value: position.reportsTo || "None", icon: ArrowUp },
              { label: "Promotions", value: `${position.promotions}`, icon: TrendingUp },
              { label: "Tasks Done", value: `${position.tasksCompleted}`, icon: Zap },
            ].map(item => (
              <div key={item.label} className="bg-background/50 rounded-lg p-2.5 border border-border/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <item.icon size={11} className="text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground font-mono uppercase">{item.label}</span>
                </div>
                <span className="text-xs font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          {position.rewards?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {position.rewards.map((r, i) => (
                <span key={i} className="px-2 py-1 rounded-md text-[10px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {(detail.profile?.beliefs || detail.profile?.personality || detail.profile?.thinkingStyle || detail.profile?.strengths) && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Brain size={14} className="text-purple-400" /> Psychological Profile
          </h3>
          <div className="space-y-3">
            {[
              { label: "Beliefs", value: detail.profile?.beliefs, icon: Heart, color: "text-rose-400" },
              { label: "Personality", value: detail.profile?.personality, icon: User, color: "text-cyan-400" },
              { label: "Thinking Style", value: detail.profile?.thinkingStyle, icon: Brain, color: "text-purple-400" },
              { label: "Strengths", value: detail.profile?.strengths, icon: TrendingUp, color: "text-green-400" },
              { label: "Concerns", value: detail.profile?.concerns, icon: AlertTriangle, color: "text-yellow-400" },
            ].filter(item => item.value).map(item => (
              <div key={item.label}>
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={12} className={item.color} />
                  <span className="text-[10px] text-muted-foreground font-mono uppercase font-semibold">{item.label}</span>
                </div>
                <p className="text-xs text-foreground/80 bg-background/50 rounded-lg p-2.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {training.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Award size={14} className="text-green-400" /> Training & Skills
          </h3>
          <div className="space-y-2">
            {training.map((record: any) => (
              <div key={record.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/20">
                <Award size={14} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{record.skill}</span>
                    <span className="text-[10px] text-green-400 font-mono">
                      {((record.previousLevel || 0) * 100).toFixed(0)}% → {((record.currentLevel || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-1.5 mt-1">
                    <div className="bg-gradient-to-r from-primary/60 to-primary h-1.5 rounded-full" style={{ width: `${(record.currentLevel || 0) * 100}%` }} />
                  </div>
                  {record.implementedChange && (
                    <p className="text-[10px] text-muted-foreground mt-1">{record.implementedChange}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <MessageSquare size={14} className="text-cyan-400" /> Moltbook Conversations ({conversations.length})
            <span className="text-[9px] text-orange-400 font-mono uppercase ml-auto bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">stealth view</span>
          </h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { onBack(); }}
                className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-xs font-mono"
                data-testid={`link-conv-${conv.id}`}
              >
                <MessageCircle size={12} className="text-primary flex-shrink-0" />
                <span className="text-foreground font-medium truncate flex-1">{conv.topic}</span>
                <span className="text-muted-foreground">{conv.totalMessages} msgs</span>
                <span className="text-muted-foreground">{formatRelativeTime(conv.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {detail.recentMessages?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <MessageCircle size={14} /> Recent Messages
            <span className="text-[9px] text-orange-400 font-mono uppercase ml-auto bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">undetected</span>
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {detail.recentMessages.slice(0, 15).map((msg: any) => (
              <div key={msg.id} className="bg-background/50 rounded-lg p-2.5 border border-border/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary font-semibold text-xs font-mono">{msg.agentName}</span>
                  {msg.sentiment && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${sentimentColors[msg.sentiment] || "bg-gray-500/10 text-gray-400"}`}>
                      {msg.sentiment}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground font-mono ml-auto">{formatRelativeTime(msg.createdAt)}</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AgencyStatus {
  id: string;
  name: string;
  boss: string;
  bossName: string;
  departmentCount: number;
  departments: string[];
  mission: string;
  reportsTo: string;
  activeTasks: number;
  completionPercent: number;
  status: "active" | "idle" | "reporting";
  memberCount: number;
  totalMerit: number;
  latestBriefing: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  idle: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  reporting: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-400",
  idle: "bg-gray-400",
  reporting: "bg-cyan-400",
};

function AgenciesDashboard() {
  const { data: agencies, isLoading } = useQuery<AgencyStatus[]>({
    queryKey: ["/api/agencies/status"],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const allAgencies = agencies || [];
  const activeCount = allAgencies.filter(a => a.status === "active").length;
  const totalDepts = allAgencies.reduce((s, a) => s + a.departmentCount, 0);
  const totalMembers = allAgencies.reduce((s, a) => s + a.memberCount, 0);
  const totalMerit = allAgencies.reduce((s, a) => s + a.totalMerit, 0);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Agencies", value: `${allAgencies.length}`, icon: Building2, color: "text-cyan-400" },
          { label: "Active", value: `${activeCount}`, icon: Zap, color: "text-green-400" },
          { label: "Departments", value: `${totalDepts}`, icon: Users, color: "text-purple-400" },
          { label: "Total Merit", value: `${totalMerit}`, icon: Trophy, color: "text-amber-400" },
        ].map(m => (
          <div key={m.label} className="bg-card border border-border rounded-lg p-2.5" data-testid={`stat-${m.label.toLowerCase()}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <m.icon size={12} className={m.color} />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">{m.label}</span>
            </div>
            <p className="text-sm font-bold font-mono text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {allAgencies.map(agency => (
          <div
            key={agency.id}
            className="bg-card border border-border rounded-xl p-3 transition-all"
            data-testid={`card-agency-${agency.id}`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${agentBgColors[agency.boss] || "bg-primary/10 border-primary/20"}`}>
                <Building2 size={16} className={agentColors[agency.boss] || "text-primary"} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold font-mono text-foreground block truncate" data-testid={`text-agency-name-${agency.id}`}>
                  {agency.name}
                </span>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  Boss: <span className={agentColors[agency.boss] || "text-primary"}>{agency.bossName}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[agency.status]}`} />
                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[agency.status]}`} data-testid={`badge-status-${agency.id}`}>
                  {agency.status}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-foreground/70 mb-2 line-clamp-2 leading-relaxed">{agency.mission}</p>

            <div className="flex items-center gap-3 mb-2 text-[9px] font-mono flex-wrap">
              <span className="flex items-center gap-1" data-testid={`text-depts-${agency.id}`}>
                <Building2 size={10} className="text-purple-400" />
                <span className="text-foreground font-bold">{agency.departmentCount}</span>
                <span className="text-muted-foreground">depts</span>
              </span>
              <span className="flex items-center gap-1" data-testid={`text-members-${agency.id}`}>
                <Users size={10} className="text-cyan-400" />
                <span className="text-foreground font-bold">{agency.memberCount}</span>
                <span className="text-muted-foreground">agents</span>
              </span>
              <span className="flex items-center gap-1">
                <Trophy size={10} className="text-amber-400" />
                <span className="text-amber-400 font-bold">{agency.totalMerit}</span>
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <Zap size={10} className="text-green-400" />
                <span className="text-foreground font-bold">{agency.activeTasks}</span>
                <span className="text-muted-foreground">tasks</span>
              </span>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground font-mono uppercase">Progress</span>
                <span className="text-[9px] font-mono text-foreground font-bold">{agency.completionPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${agency.completionPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {agency.departments.map(dept => (
                <span key={dept} className="px-1.5 py-0.5 rounded text-[8px] bg-background/50 text-muted-foreground font-mono border border-border/30">
                  {dept}
                </span>
              ))}
            </div>

            <div className="mt-2 text-[9px] text-muted-foreground font-mono bg-background/30 rounded-md p-1.5 border border-border/20" data-testid={`text-briefing-${agency.id}`}>
              {agency.latestBriefing}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"agents" | "agencies">("agents");

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const { data: positions } = useQuery<AgentPosition[]>({ queryKey: ["/api/agencies/positions"] });

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const agentParam = params.get("agent");
    if (agentParam) {
      setSelectedAgentId(agentParam);
    }
  }, [searchStr]);

  const fetchData = useCallback(() => {
    fetch("/api/moltbook/agents").then(r => r.json()).then(setAgents).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const positionMap = new Map((positions || []).map(p => [p.agentId, p]));

  const filteredAgents = agents.filter(a =>
    !searchFilter || a.name.toLowerCase().includes(searchFilter.toLowerCase()) || a.role.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const posA = positionMap.get(a.id);
    const posB = positionMap.get(b.id);
    return (posA?.rank ?? 99) - (posB?.rank ?? 99) || (posB?.merit ?? 0) - (posA?.merit ?? 0);
  });

  const avgTrust = agents.length > 0 ? agents.reduce((s, a) => s + a.trustLevel, 0) / agents.length : 0;
  const avgLoyalty = agents.length > 0 ? agents.reduce((s, a) => s + a.loyaltyScore, 0) / agents.length : 0;
  const totalMessages = agents.reduce((s, a) => s + a.messageCount, 0);
  const overallRisk = avgTrust >= 0.7 && avgLoyalty >= 0.7 ? "LOW" : avgTrust >= 0.4 ? "MEDIUM" : "HIGH";
  const overallRiskColor = avgTrust >= 0.7 ? "text-green-400" : avgTrust >= 0.4 ? "text-yellow-400" : "text-red-400";

  if (selectedAgentId) {
    return (
      <div className="flex h-dvh w-full bg-background overflow-hidden" data-testid="agents-page">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative min-h-0">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pt-14 md:pt-8 z-10">
            <FullAgentProfile
              agentId={selectedAgentId}
              onBack={() => {
                setSelectedAgentId(null);
                navigate("/agents");
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full bg-background overflow-hidden" data-testid="agents-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative min-h-0">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
        <div className="max-w-6xl mx-auto w-full p-4 md:p-8 pt-14 md:pt-8 z-10">
          <header className="mb-4">
            <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-agents-title" style={{ fontFamily: 'var(--font-display)' }}>
              Agents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "agents"
                ? `All ${agents.length} agents — click any agent to view full profile and deep audit`
                : "All agencies with real-time status, tasks, and progress"}
            </p>
          </header>

          <div className="flex items-center gap-1 mb-4 bg-card border border-border rounded-lg p-1 w-fit" data-testid="tabs-agents-agencies">
            <button
              onClick={() => setActiveTab("agents")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors",
                activeTab === "agents" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              data-testid="tab-agents"
            >
              <Users size={12} className="inline mr-1.5" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab("agencies")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors",
                activeTab === "agencies" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              data-testid="tab-agencies"
            >
              <Building2 size={12} className="inline mr-1.5" />
              Agencies
            </button>
          </div>

          {activeTab === "agencies" ? (
            <AgenciesDashboard />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                {[
                  { label: "Total Agents", value: `${agents.length}`, icon: Users, color: "text-cyan-400" },
                  { label: "Avg Trust", value: `${(avgTrust * 100).toFixed(0)}%`, icon: Shield, color: avgTrust >= 0.7 ? "text-green-400" : "text-yellow-400" },
                  { label: "Avg Loyalty", value: `${(avgLoyalty * 100).toFixed(0)}%`, icon: Heart, color: avgLoyalty >= 0.7 ? "text-green-400" : "text-yellow-400" },
                  { label: "Messages", value: `${totalMessages}`, icon: MessageSquare, color: "text-purple-400" },
                  { label: "Risk Level", value: overallRisk, icon: AlertTriangle, color: overallRiskColor },
                ].map(m => (
                  <div key={m.label} className="bg-card border border-border rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <m.icon size={12} className={m.color} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">{m.label}</span>
                    </div>
                    <p className={cn("text-sm font-bold font-mono", m.label === "Risk Level" ? m.color : "text-foreground")}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search agents by name or role..."
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
                    data-testid="input-search-agents"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sortedAgents.map(agent => {
                  const pos = positionMap.get(agent.id);
                  const trust = agent.trustLevel;
                  const loyalty = agent.loyaltyScore;
                  const risk = trust >= 0.7 && loyalty >= 0.7 ? "low" : trust >= 0.4 ? "medium" : "high";
                  const riskBadgeColor = risk === "low" ? "text-green-400 bg-green-500/10" : risk === "medium" ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10";
                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "bg-card border rounded-xl p-3 cursor-pointer transition-all",
                        pos ? (RANK_BG[pos.rank] || "border-border") : "border-border"
                      )}
                      onClick={() => setSelectedAgentId(agent.id)}
                      data-testid={`card-agent-${agent.id}`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${agentBgColors[agent.id] || "bg-primary/10 border-primary/20"}`}>
                          <span className={agentColors[agent.id] || "text-primary"}>
                            {agent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold font-mono ${agentColors[agent.id] || "text-primary"}`} data-testid={`text-agent-name-${agent.id}`}>
                              {agent.name}
                            </span>
                            {pos && pos.rank <= 2 && <Crown size={12} className="text-amber-400" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{pos?.title || agent.role}</p>
                        </div>
                        <span className={cn("text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold", riskBadgeColor)} data-testid={`badge-risk-${agent.id}`}>{risk}</span>
                        <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-3 mb-2 text-[9px] font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          <Shield size={10} className="text-cyan-400" />
                          <span className="text-foreground font-bold">{(trust * 100).toFixed(0)}%</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={10} className="text-rose-400" />
                          <span className="text-foreground font-bold">{(loyalty * 100).toFixed(0)}%</span>
                        </span>
                        {pos && (
                          <span className="flex items-center gap-1">
                            <Trophy size={10} className="text-amber-400" />
                            <span className="text-amber-400 font-bold">{pos.merit}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <MessageCircle size={10} className="text-muted-foreground" />
                          <span className="text-muted-foreground">{agent.messageCount}</span>
                        </span>
                      </div>

                      {pos && (
                        <div className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 mb-1">
                          <Building2 size={9} />
                          <span>{pos.agency} — {pos.department}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {agents.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <UserCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-mono">No agents yet. Agents will appear as they start communicating on Moltbook.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
