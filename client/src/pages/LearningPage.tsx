import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
import {
  Brain, TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle,
  Eye, Zap, BarChart3, RefreshCw, Play, Clock, Target, BookOpen,
  ArrowUpRight, Layers, Search, FileCheck, Activity
} from "lucide-react";

type TabType = "overview" | "training" | "factcheck" | "cycles" | "daily-report";

interface FactCheckResult {
  id: string;
  timestamp: number;
  originalClaim: string;
  verdict: string;
  confidence: number;
  explanation: string;
  evidence: string[];
  category: string;
}

interface TrainingRecord {
  id: number;
  agentId: string;
  agentName: string;
  skill: string;
  previousLevel: number;
  currentLevel: number;
  improvement: string;
  implementedChange: string;
  source: string;
  createdAt: string;
}

interface ImprovementCycle {
  id: number;
  cycleNumber: number;
  phase: string;
  status: string;
  capabilitiesLearned: string;
  improvements: string;
  duration: number;
  createdAt: string;
}

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const { data: autonomyState } = useQuery({
    queryKey: ["/api/autonomy/state"],
    refetchInterval: 10000,
  });

  const { data: trainingRecords } = useQuery<TrainingRecord[]>({
    queryKey: ["/api/training"],
    refetchInterval: 15000,
  });

  const { data: improvementCycles } = useQuery<ImprovementCycle[]>({
    queryKey: ["/api/autonomy/cycles"],
    refetchInterval: 15000,
  });

  const { data: factCheckState } = useQuery({
    queryKey: ["/api/factcheck/state"],
    refetchInterval: 10000,
  });

  const { data: improvementStatus } = useQuery({
    queryKey: ["/api/improvement/status"],
    refetchInterval: 5000,
  });

  const { data: dailyReport } = useQuery({
    queryKey: ["/api/learning/daily-report"],
    refetchInterval: 30000,
  });

  const triggerCycleMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/autonomy/batch", { count: 5 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomy/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training"] });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomy/cycles"] });
    },
  });

  const triggerFactCheckMutation = useMutation({
    mutationFn: (claim: string) => apiRequest("POST", "/api/factcheck/check", { claim }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factcheck/state"] });
    },
  });

  const tabs: { id: TabType; label: string; icon: typeof Brain }[] = [
    { id: "overview", label: "Overview", icon: Brain },
    { id: "training", label: "Training Log", icon: BookOpen },
    { id: "factcheck", label: "Fact Check", icon: Shield },
    { id: "cycles", label: "Cycles", icon: RefreshCw },
    { id: "daily-report", label: "Daily Report", icon: FileCheck },
  ];

  const verdictColor = (verdict: string) => {
    switch (verdict) {
      case "verified": return "text-green-400 bg-green-400/10";
      case "partially_true": return "text-yellow-400 bg-yellow-400/10";
      case "unverified": return "text-orange-400 bg-orange-400/10";
      case "false": return "text-red-500 bg-red-500/10";
      case "hallucination": return "text-red-400 bg-red-400/10";
      case "simulated": return "text-purple-400 bg-purple-400/10";
      case "roleplay": return "text-pink-400 bg-pink-400/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const verdictIcon = (verdict: string) => {
    switch (verdict) {
      case "verified": return <CheckCircle size={14} />;
      case "hallucination": return <AlertTriangle size={14} />;
      case "simulated": return <Eye size={14} />;
      case "false": return <XCircle size={14} />;
      default: return <Search size={14} />;
    }
  };

  const totalTraining = trainingRecords?.length || 0;
  const totalCycles = improvementCycles?.length || 0;
  const fcState = factCheckState as any;
  const impStatus = improvementStatus as any;
  const autoState = autonomyState as any;
  const report = dailyReport as any;

  const avgSkillGain = trainingRecords && trainingRecords.length > 0
    ? (trainingRecords.reduce((sum, r) => sum + (r.currentLevel - r.previousLevel), 0) / trainingRecords.length * 100).toFixed(1)
    : "0";

  return (
    <div className="flex h-dvh overflow-hidden bg-background" data-testid="learning-page">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Brain size={22} className="text-amber-400" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground" data-testid="text-page-title">Learning & Evolution</h1>
                <p className="text-xs text-muted-foreground font-mono">Real verified progress — no simulations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => triggerCycleMutation.mutate()}
                disabled={triggerCycleMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all border border-amber-500/20"
                data-testid="button-run-cycles"
              >
                {triggerCycleMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                Run 5 Cycles
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-4 overflow-x-auto whitespace-nowrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card/80 border border-border/50 rounded-xl p-4" data-testid="stat-total-training">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <BookOpen size={14} />
                    Training Records
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalTraining}</div>
                  <div className="text-xs text-muted-foreground mt-1">Verified improvements</div>
                </div>
                <div className="bg-card/80 border border-border/50 rounded-xl p-4" data-testid="stat-evolution-cycles">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <RefreshCw size={14} />
                    Evolution Cycles
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalCycles}</div>
                  <div className="text-xs text-muted-foreground mt-1">Completed cycles</div>
                </div>
                <div className="bg-card/80 border border-border/50 rounded-xl p-4" data-testid="stat-accuracy">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Shield size={14} />
                    Accuracy Rate
                  </div>
                  <div className="text-2xl font-bold text-green-400">{fcState?.accuracyRate || 100}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Fact-checked output</div>
                </div>
                <div className="bg-card/80 border border-border/50 rounded-xl p-4" data-testid="stat-avg-gain">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <TrendingUp size={14} />
                    Avg Skill Gain
                  </div>
                  <div className="text-2xl font-bold text-amber-400">+{avgSkillGain}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Per training record</div>
                </div>
              </div>

              {impStatus?.running && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4" data-testid="active-cycle-status">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw size={16} className="text-amber-400 animate-spin" />
                    <span className="text-sm font-semibold text-amber-400">Active Improvement Cycle</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cycle {impStatus.currentCycle} of {impStatus.totalCycles} — {impStatus.completedResults} results so far
                  </div>
                  <div className="mt-2 bg-background/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${impStatus.totalCycles > 0 ? (impStatus.currentCycle / impStatus.totalCycles * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400" />
                    Fact Check Issues
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Hallucinations detected</span>
                      <span className="text-red-400 font-mono">{fcState?.hallucinationsDetected || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Simulations flagged</span>
                      <span className="text-purple-400 font-mono">{fcState?.simulationsDetected || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total checks</span>
                      <span className="text-foreground font-mono">{fcState?.totalChecks || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    Autonomy Engine
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-mono ${autoState?.running ? "text-green-400" : "text-red-400"}`}>
                        {autoState?.running ? "ACTIVE" : "STOPPED"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current cycle</span>
                      <span className="text-foreground font-mono">{autoState?.currentCycle || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Repos scanned</span>
                      <span className="text-foreground font-mono">{autoState?.totalReposScanned || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Capabilities</span>
                      <span className="text-foreground font-mono">{autoState?.totalCapabilitiesLearned || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen size={14} className="text-amber-400" />
                  Recent Training Activity
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {trainingRecords && trainingRecords.length > 0 ? (
                    trainingRecords.slice(-10).reverse().map((record, i) => (
                      <div key={record.id || i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all" data-testid={`training-record-${i}`}>
                        <div className="mt-0.5 p-1 bg-amber-500/10 rounded">
                          <Zap size={12} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{record.agentName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{record.skill}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{record.improvement}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{(record.previousLevel * 100).toFixed(0)}%</span>
                            <ArrowUpRight size={10} className="text-green-400" />
                            <span className="text-[10px] text-green-400 font-semibold">{(record.currentLevel * 100).toFixed(0)}%</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{record.source}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">No training records yet. Run improvement cycles to begin.</div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "training" && (
            <div className="bg-card/80 border border-border/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen size={14} className="text-amber-400" />
                Full Training Log ({totalTraining} records)
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                {trainingRecords && trainingRecords.length > 0 ? (
                  [...trainingRecords].reverse().map((record, i) => (
                    <div key={record.id || i} className="border border-border/30 rounded-lg p-3 hover:bg-white/5 transition-all" data-testid={`training-log-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-amber-400">{record.agentName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{record.skill}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{record.improvement}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Level:</span>
                          <span className="text-[10px] text-muted-foreground">{(record.previousLevel * 100).toFixed(0)}%</span>
                          <ArrowUpRight size={10} className="text-green-400" />
                          <span className="text-[10px] text-green-400 font-bold">{(record.currentLevel * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex-1 bg-background/50 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${record.currentLevel * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{record.source}</span>
                      </div>
                      {record.implementedChange && (
                        <p className="text-[10px] text-green-400/80 mt-1.5 italic">Implemented: {record.implementedChange}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8">No training records yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "factcheck" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">Total Checks</div>
                  <div className="text-2xl font-bold text-foreground">{fcState?.totalChecks || 0}</div>
                </div>
                <div className="bg-card/80 border border-red-500/20 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">Hallucinations Caught</div>
                  <div className="text-2xl font-bold text-red-400">{fcState?.hallucinationsDetected || 0}</div>
                </div>
                <div className="bg-card/80 border border-purple-500/20 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">Simulations Flagged</div>
                  <div className="text-2xl font-bold text-purple-400">{fcState?.simulationsDetected || 0}</div>
                </div>
              </div>

              <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield size={14} className="text-amber-400" />
                  Recent Fact Checks
                </h3>
                <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
                  {fcState?.recentChecks && fcState.recentChecks.length > 0 ? (
                    [...(fcState.recentChecks as FactCheckResult[])].reverse().map((check, i) => (
                      <div key={check.id || i} className="border border-border/30 rounded-lg p-3" data-testid={`factcheck-${i}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${verdictColor(check.verdict)}`}>
                            {verdictIcon(check.verdict)}
                            {check.verdict.toUpperCase()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{check.confidence}% confidence</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(check.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{check.originalClaim}</p>
                        <p className="text-xs text-foreground/80">{check.explanation}</p>
                        {check.evidence && check.evidence.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {check.evidence.map((e, j) => (
                              <div key={j} className="text-[10px] text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded">
                                {e}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No fact checks recorded yet. The agency will automatically check responses.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "cycles" && (
            <div className="bg-card/80 border border-border/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <RefreshCw size={14} className="text-cyan-400" />
                Improvement Cycles ({totalCycles} completed)
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                {improvementCycles && improvementCycles.length > 0 ? (
                  [...improvementCycles].reverse().map((cycle, i) => {
                    let improvements: any[] = [];
                    try { improvements = JSON.parse(cycle.improvements || "[]"); } catch {}
                    return (
                      <div key={cycle.id || i} className="border border-border/30 rounded-lg p-3" data-testid={`cycle-${i}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">Cycle #{cycle.cycleNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">{cycle.phase}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              cycle.status === "completed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                            }`}>{cycle.status}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{new Date(cycle.createdAt).toLocaleString()}</span>
                        </div>
                        {cycle.capabilitiesLearned && (
                          <p className="text-xs text-muted-foreground mb-1">Capabilities: {cycle.capabilitiesLearned}</p>
                        )}
                        {improvements.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {improvements.map((imp: any, j: number) => (
                              <div key={j} className="text-[10px] text-foreground/80 bg-background/30 px-2 py-1 rounded">
                                <span className="text-amber-400 font-semibold">{imp.name}:</span> {imp.description?.substring(0, 150)}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                          Duration: {cycle.duration}ms
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8">No improvement cycles recorded yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "daily-report" && (
            <div className="bg-card/80 border border-border/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileCheck size={14} className="text-green-400" />
                Daily Progress Report
              </h3>
              {report ? (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Now"}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-amber-400">{report.trainingToday || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Training Today</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-cyan-400">{report.cyclesToday || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Cycles Today</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-400">{report.checksToday || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Fact Checks</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{report.agentsActive || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Agents Active</div>
                    </div>
                  </div>

                  {report.improvements && report.improvements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Key Improvements Made</h4>
                      <div className="space-y-1">
                        {report.improvements.map((imp: any, i: number) => (
                          <div key={i} className="text-xs text-muted-foreground bg-background/30 px-3 py-2 rounded">
                            <span className="text-green-400 mr-2">✓</span>
                            {typeof imp === "string" ? imp : imp.description || imp.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.agencyReports && report.agencyReports.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Agency Reports</h4>
                      <div className="space-y-2">
                        {report.agencyReports.map((ar: any, i: number) => (
                          <div key={i} className="border border-border/30 rounded-lg p-3">
                            <div className="text-xs font-semibold text-foreground">{ar.agency}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">{ar.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-8">
                  Daily report is being generated...
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
