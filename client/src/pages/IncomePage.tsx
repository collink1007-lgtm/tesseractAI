import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DollarSign, Wallet, Activity, TrendingUp, Shield, Clock, ExternalLink, Coins } from "lucide-react";

interface IncomeProcess {
  id: string;
  type: string;
  name: string;
  category: string;
  status: string;
  method: string;
  details: string;
  estimatedRevenue: number;
  actualRevenue: number;
  walletAddress: string;
  lastCheckedAt: number;
}

interface IncomeStats {
  totalProcesses: number;
  active: number;
  totalEstimated: number;
  totalActual: number;
  byCategory: Record<string, number>;
}

interface WalletData {
  address: string;
  chain: string;
  balance: number;
  usdValue: number;
  lastChecked: number;
}

interface EngineData {
  running: boolean;
  totalChecks: number;
  lastCheckTime: number;
  methodCount: number;
  activeMethodCount: number;
}

type TabType = "overview" | "wallets" | "activity";

const chainColors: Record<string, string> = {
  SOL: "text-purple-400",
  ETH: "text-blue-400",
  BTC: "text-orange-400",
};

const chainBgColors: Record<string, string> = {
  SOL: "bg-purple-500/10 border-purple-500/20",
  ETH: "bg-blue-500/10 border-blue-500/20",
  BTC: "bg-orange-500/10 border-orange-500/20",
};

const explorerUrls: Record<string, (addr: string) => string> = {
  SOL: (addr) => `https://solscan.io/account/${addr}`,
  ETH: (addr) => `https://etherscan.io/address/${addr}`,
  BTC: (addr) => `https://blockchain.info/address/${addr}`,
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  scanning: "bg-yellow-500/10 text-yellow-400",
  pending: "bg-gray-500/10 text-gray-400",
  disabled: "bg-red-500/10 text-red-400",
};

export default function IncomePage() {
  const [processes, setProcesses] = useState<IncomeProcess[]>([]);
  const [stats, setStats] = useState<IncomeStats | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [engine, setEngine] = useState<EngineData | null>(null);
  const [tab, setTab] = useState<TabType>("overview");

  const fetchAll = () => {
    fetch("/api/income/processes").then(r => r.json()).then(setProcesses).catch(() => {});
    fetch("/api/income/stats").then(r => r.json()).then(setStats).catch(() => {});
    fetch("/api/income/wallets").then(r => r.json()).then(setWallets).catch(() => {});
    fetch("/api/income/engine").then(r => r.json()).then(setEngine).catch(() => {});
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ts: number) => {
    if (!ts) return "Never";
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr || "N/A";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const totalPortfolioValue = wallets.reduce((sum, w) => sum + (w.usdValue || 0), 0);

  const completedProcesses = processes.filter(p => p.actualRevenue > 0);

  if (!stats && !engine) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-primary animate-pulse font-mono text-sm">Initializing income engine...</div>
        </div>
      </div>
    );
  }

  const tabConfig: { key: TabType; label: string; icon: typeof DollarSign }[] = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "wallets", label: "Wallets", icon: Wallet },
    { key: "activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" data-testid="income-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />

        <div className="max-w-6xl mx-auto w-full p-4 md:p-8 z-10">
          <header className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                <DollarSign size={14} className="animate-pulse" />
                Income Dashboard
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${engine?.running ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                <Activity size={12} />
                Engine: {engine?.running ? "ACTIVE" : "STOPPED"}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-income-title">
              Tessera Income Engine
            </h1>
          </header>

          <div className="flex gap-1 mb-4 bg-card border border-border rounded-lg p-1">
            {tabConfig.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 px-2 py-2 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${tab === t.key ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-${t.key}`}
                >
                  <Icon size={11} className="inline mr-1" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Portfolio Value", value: `$${totalPortfolioValue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
                  { label: "Completed Tasks", value: `${completedProcesses.length}`, icon: Activity, color: "text-cyan-400" },
                  { label: "Total Revenue", value: `$${(stats?.totalActual || 0).toFixed(2)}`, icon: TrendingUp, color: "text-yellow-400" },
                ].map(m => (
                  <div key={m.label} className="bg-card border border-border rounded-lg p-2.5" data-testid={`card-stat-${m.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <m.icon size={12} className={m.color} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">{m.label}</span>
                    </div>
                    <p className="text-sm font-bold font-mono text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Wallet size={14} className="text-primary" />
                  Wallet Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {wallets.map(w => (
                    <div key={w.address} className={`rounded-lg p-2.5 border ${chainBgColors[w.chain] || "bg-background/50 border-border/50"}`} data-testid={`card-wallet-summary-${w.chain.toLowerCase()}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Coins size={14} className={chainColors[w.chain] || "text-foreground"} />
                        <span className={`text-xs font-bold font-mono ${chainColors[w.chain] || "text-foreground"}`}>{w.chain}</span>
                      </div>
                      <p className="text-sm font-bold font-mono text-foreground">{w.balance} {w.chain}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">${w.usdValue?.toFixed(2)}</p>
                    </div>
                  ))}
                  {wallets.length === 0 && (
                    <p className="text-xs text-muted-foreground font-mono col-span-3 text-center py-4">No wallets configured</p>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <TrendingUp size={14} className="text-primary" />
                  Category Breakdown
                </h3>
                {stats?.byCategory && Object.keys(stats.byCategory).length > 0 ? (
                  <div className="space-y-1.5">
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 text-xs font-mono">
                        <span className="text-foreground capitalize">{cat}</span>
                        <span className="text-primary font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono text-center py-4">No categories yet</p>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Shield size={14} className="text-primary" />
                  Income Engine Status
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className={`text-lg font-bold font-mono ${engine?.running ? "text-green-400" : "text-red-400"}`}>{engine?.running ? "ON" : "OFF"}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Status</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-cyan-400 font-mono">{engine?.totalChecks || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Checks</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-purple-400 font-mono">{completedProcesses.length}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Completed</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-yellow-400 font-mono">${(stats?.totalActual || 0).toFixed(2)}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Revenue</p>
                  </div>
                </div>
                {engine?.lastCheckTime ? (
                  <p className="text-[10px] text-muted-foreground font-mono mt-2 flex items-center gap-1">
                    <Clock size={10} /> Last check: {formatTime(engine.lastCheckTime)}
                  </p>
                ) : null}
              </div>
            </>
          )}

          {tab === "wallets" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {wallets.map(w => {
                  const explorer = explorerUrls[w.chain];
                  return (
                    <div key={w.address} className={`bg-card border border-border rounded-xl p-4`} data-testid={`card-wallet-${w.chain.toLowerCase()}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg border ${chainBgColors[w.chain] || "bg-background/50 border-border/50"}`}>
                            <Coins size={18} className={chainColors[w.chain] || "text-foreground"} />
                          </div>
                          <div>
                            <h3 className={`text-sm font-bold font-mono ${chainColors[w.chain] || "text-foreground"}`}>{w.chain}</h3>
                            <p className="text-[10px] text-muted-foreground font-mono">{truncateAddress(w.address)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-lg font-bold font-mono text-foreground">{w.balance} {w.chain}</p>
                        <p className="text-sm text-muted-foreground font-mono">${w.usdValue?.toFixed(2)} USD</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(w.lastChecked)}
                        </p>
                        {explorer && (
                          <a
                            href={explorer(w.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
                            data-testid={`link-explorer-${w.chain.toLowerCase()}`}
                          >
                            <ExternalLink size={10} />
                            Check in explorer
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                {wallets.length === 0 && (
                  <div className="col-span-3 bg-card border border-border rounded-xl p-8 text-center">
                    <Wallet size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-mono">No wallets configured yet</p>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "activity" && (
            <>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Activity size={14} className="text-primary" />
                  Activity Log ({completedProcesses.length})
                </h3>
                {completedProcesses.length > 0 ? (
                  <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {completedProcesses.map(p => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-2.5 rounded bg-background/50 text-xs font-mono" data-testid={`row-activity-${p.id}`}>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${statusColors[p.status] || "bg-gray-500/10 text-gray-400"}`}>
                          {p.status}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary capitalize">
                          {p.category}
                        </span>
                        <span className="text-foreground font-semibold min-w-[120px]">{p.name}</span>
                        <span className="text-muted-foreground truncate flex-1">{p.details}</span>
                        <span className="text-cyan-400 whitespace-nowrap">${p.actualRevenue?.toFixed(2) || "0.00"}</span>
                        <span className="text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(p.lastCheckedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono text-center py-8">No completed tasks with revenue yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}