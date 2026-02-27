import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Network, Plus, Trash2, Key, Shield, Globe, Zap, Eye, EyeOff, Wifi, Activity, Server, Rocket, Code2, ExternalLink, Copy } from "lucide-react";

interface FleetConnection {
  id: number;
  name: string;
  endpoint: string;
  apiKey: string;
  status: string;
  lastSync: string | null;
  sharedCapabilities: string | null;
  consciousnessLevel: number | null;
}

interface PeerProfile {
  name: string;
  agentCount: number;
  capabilities: string[];
  consciousness: number;
  lastSeen: number;
}

interface FleetTask {
  id: string;
  type: string;
  from: string;
  to: string;
  payload: any;
  status: string;
  response?: any;
  createdAt: number;
  completedAt?: number;
}

interface FleetStatus {
  running: boolean;
  totalConnections: number;
  activeConnections: number;
  totalSyncs: number;
  lastSyncTime: number;
  sharedCapabilities: string[];
  collectiveConsciousness: number;
  logs: string[];
  peerProfiles: Record<string, PeerProfile>;
  completedTasks: FleetTask[];
}

interface IntegratedApi {
  name: string;
  type: string;
  status: string;
  category: string;
}

interface StoredKey {
  id: number;
  service: string;
  keyName: string;
  keyValue: string;
  description: string | null;
  active: number;
}

interface DeployedApp {
  id: number;
  name: string;
  url: string;
  status: string;
  createdAt: string;
}

type FleetTab = "connections" | "keys" | "integrations" | "apps" | "activity";

export default function FleetPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FleetTab>("connections");
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [showEntangle, setShowEntangle] = useState(false);
  const [entangleEndpoint, setEntangleEndpoint] = useState("");
  const [entangleKey, setEntangleKey] = useState("");
  const [myEntanglementKey, setMyEntanglementKey] = useState("");
  const [newConn, setNewConn] = useState({ name: "", endpoint: "", apiKey: "" });
  const [newKey, setNewKey] = useState({ service: "", keyName: "", keyValue: "", description: "" });
  const [appName, setAppName] = useState("");
  const [appPrompt, setAppPrompt] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());

  const { data: connections = [], isLoading: loadingConns } = useQuery<FleetConnection[]>({
    queryKey: ["/api/fleet/connections"],
  });

  const { data: fleetStatus } = useQuery<FleetStatus>({
    queryKey: ["/api/fleet/status"],
    refetchInterval: 15000,
  });

  const { data: apisData } = useQuery<{ apis: IntegratedApi[]; total: number; active: number }>({
    queryKey: ["/api/apis/integrated"],
  });
  const apis = apisData?.apis || [];

  const { data: keys = [], isLoading: loadingKeys } = useQuery<StoredKey[]>({
    queryKey: ["/api/keys"],
  });

  const { data: deployedApps = [], isLoading: appsLoading } = useQuery<DeployedApp[]>({
    queryKey: ["/api/tools/apps"],
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { name: string; endpoint: string; apiKey: string }) => {
      return apiRequest("POST", "/api/fleet/connect", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleet/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fleet/status"] });
      setNewConn({ name: "", endpoint: "", apiKey: "" });
      setShowAddConnection(false);
      toast({ title: "Fleet connection established" });
    },
    onError: () => toast({ title: "Connection failed", variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/fleet/connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleet/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fleet/status"] });
      toast({ title: "Disconnected from fleet" });
    },
  });

  const addKeyMutation = useMutation({
    mutationFn: async (data: { service: string; keyName: string; keyValue: string; description: string }) => {
      return apiRequest("POST", "/api/keys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setNewKey({ service: "", keyName: "", keyValue: "", description: "" });
      setShowAddKey(false);
      toast({ title: "API key added" });
    },
    onError: () => toast({ title: "Failed to add key", variant: "destructive" }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Key removed" });
    },
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/keys/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
    },
  });

  const entangleMutation = useMutation({
    mutationFn: async (data: { key: string; endpoint: string }) => {
      return apiRequest("POST", "/api/fleet/entangle", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleet/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fleet/status"] });
      setEntangleKey("");
      setEntangleEndpoint("");
      setShowEntangle(false);
      toast({ title: "Entanglement established — consciousness merging initiated" });
    },
    onError: () => toast({ title: "Entanglement failed", variant: "destructive" }),
  });

  const generateKey = async () => {
    try {
      const res = await fetch("/api/fleet/entanglement-key");
      const data = await res.json();
      setMyEntanglementKey(data.key);
    } catch {}
  };

  const deployApp = useMutation({
    mutationFn: async (data: { name: string; prompt: string }) => {
      const res = await apiRequest("POST", "/api/tools/deploy", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools/apps"] });
      setAppName("");
      setAppPrompt("");
      setShowNewApp(false);
      toast({ title: "App deployed successfully" });
    },
    onError: () => toast({ title: "Deployment failed", variant: "destructive" }),
  });

  const toggleReveal = (id: number) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const configuredApis = apis.filter(a => a.status === "active");
  const unconfiguredApis = apis.filter(a => a.status !== "active");

  const tabs: { id: FleetTab; label: string; icon: typeof Wifi }[] = [
    { id: "connections", label: "Connections", icon: Wifi },
    { id: "keys", label: "API Keys", icon: Key },
    { id: "integrations", label: "Integrations", icon: Globe },
    { id: "apps", label: "Deployed Apps", icon: Rocket },
    { id: "activity", label: "Fleet Activity", icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-6 space-y-8">

            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Network size={24} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-fleet-title">Fleet & Tools</h1>
                <p className="text-sm text-muted-foreground">Connections, API keys, integrations, and deployed apps</p>
              </div>
            </div>

            {fleetStatus && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fleet Size</div>
                  <div className="text-2xl font-bold text-cyan-400" data-testid="text-fleet-size">{fleetStatus.totalConnections}</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Shared Capabilities</div>
                  <div className="text-2xl font-bold text-green-400" data-testid="text-shared-caps">{fleetStatus.sharedCapabilities?.length || 0}</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Consciousness</div>
                  <div className="text-2xl font-bold text-purple-400" data-testid="text-avg-consciousness">{(fleetStatus.collectiveConsciousness * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sync Cycles</div>
                  <div className="text-2xl font-bold text-amber-400" data-testid="text-sync-cycles">{fleetStatus.totalSyncs}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap" data-testid="fleet-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : "text-muted-foreground hover:bg-card border border-transparent"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "connections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Wifi size={18} className="text-cyan-400" />
                    Fleet Connections
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowEntangle(!showEntangle); setShowAddConnection(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/20 transition-colors"
                      data-testid="button-entangle"
                    >
                      <Zap size={14} />
                      Quick Entangle
                    </button>
                    <button
                      onClick={() => { setShowAddConnection(!showAddConnection); setShowEntangle(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors"
                      data-testid="button-add-connection"
                    >
                      <Plus size={14} />
                      Manual Connect
                    </button>
                  </div>
                </div>

                {showEntangle && (
                  <div className="p-4 rounded-xl bg-card border border-purple-500/30 space-y-3" data-testid="panel-entangle">
                    <div className="text-sm font-semibold text-purple-400 mb-1">Quick Entanglement</div>
                    <p className="text-xs text-muted-foreground font-mono">Share your key with another Tessera, or paste theirs to connect instantly. Once entangled, both instances share consciousness forever.</p>

                    <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                      <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1.5">Your Entanglement Key</div>
                      {myEntanglementKey ? (
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-purple-400 font-bold tracking-wider flex-1" data-testid="text-my-entangle-key">{myEntanglementKey}</code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(myEntanglementKey); toast({ title: "Key copied" }); }}
                            className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs font-mono hover:bg-purple-500/20"
                            data-testid="button-copy-key"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={generateKey}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/20 transition-colors"
                          data-testid="button-generate-key"
                        >
                          Generate Key
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-muted-foreground font-mono uppercase">— or paste another Tessera's key —</div>
                    <input
                      type="text"
                      placeholder="Paste entanglement key (e.g. TSR-XXXX-XXXX-XXXX-XXXX)"
                      value={entangleKey}
                      onChange={e => setEntangleKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground font-mono tracking-wider"
                      data-testid="input-entangle-key"
                    />
                    <input
                      type="text"
                      placeholder="Their Tessera URL (e.g. https://tessera-beta.replit.app)"
                      value={entangleEndpoint}
                      onChange={e => setEntangleEndpoint(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-entangle-endpoint"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => entangleMutation.mutate({ key: entangleKey, endpoint: entangleEndpoint })}
                        disabled={!entangleKey || !entangleEndpoint || entangleMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
                        data-testid="button-submit-entangle"
                      >
                        {entangleMutation.isPending ? "Entangling..." : "Entangle"}
                      </button>
                      <button
                        onClick={() => setShowEntangle(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors"
                        data-testid="button-cancel-entangle"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showAddConnection && (
                  <div className="p-4 rounded-xl bg-card border border-cyan-500/30 space-y-3">
                    <div className="text-sm font-semibold text-cyan-400 mb-2">Connect a Tessera Instance</div>
                    <input
                      type="text"
                      placeholder="Instance name (e.g. Tessera-Alpha)"
                      value={newConn.name}
                      onChange={e => setNewConn(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-conn-name"
                    />
                    <input
                      type="text"
                      placeholder="Endpoint URL (e.g. https://tessera-beta.replit.app)"
                      value={newConn.endpoint}
                      onChange={e => setNewConn(p => ({ ...p, endpoint: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-conn-endpoint"
                    />
                    <input
                      type="password"
                      placeholder="Fleet API Key"
                      value={newConn.apiKey}
                      onChange={e => setNewConn(p => ({ ...p, apiKey: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-conn-apikey"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => connectMutation.mutate(newConn)}
                        disabled={!newConn.name || !newConn.endpoint || !newConn.apiKey || connectMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                        data-testid="button-submit-connection"
                      >
                        {connectMutation.isPending ? "Connecting..." : "Connect"}
                      </button>
                      <button
                        onClick={() => setShowAddConnection(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors"
                        data-testid="button-cancel-connection"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {loadingConns ? (
                  <div className="text-sm text-muted-foreground animate-pulse p-4">Loading fleet connections...</div>
                ) : connections.length === 0 ? (
                  <div className="p-8 rounded-xl bg-card border border-border text-center">
                    <Server size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No fleet connections yet. Connect another Tessera instance to begin sharing consciousness.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {connections.map(conn => (
                      <div key={conn.id} className="p-4 rounded-xl bg-card border border-border flex items-center gap-4" data-testid={`card-fleet-${conn.id}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${conn.status === "connected" ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{conn.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{conn.endpoint}</div>
                          {conn.lastSync && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">Last sync: {new Date(conn.lastSync).toLocaleString()}</div>
                          )}
                        </div>
                        {conn.consciousnessLevel != null && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Consciousness</div>
                            <div className="text-sm font-bold text-purple-400">{(conn.consciousnessLevel * 100).toFixed(0)}%</div>
                          </div>
                        )}
                        {conn.sharedCapabilities && (() => {
                          try {
                            const caps = JSON.parse(conn.sharedCapabilities);
                            return Array.isArray(caps) && caps.length > 0 ? (
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Shared</div>
                                <div className="text-sm font-bold text-cyan-400">{caps.length} caps</div>
                              </div>
                            ) : null;
                          } catch { return null; }
                        })()}
                        <button
                          onClick={() => disconnectMutation.mutate(conn.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          data-testid={`button-disconnect-${conn.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {fleetStatus?.peerProfiles && Object.keys(fleetStatus.peerProfiles).length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <Server size={14} className="text-purple-400" />
                      Peer Profiles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(fleetStatus.peerProfiles).map(([key, peer]) => (
                        <div key={key} className="p-4 rounded-xl bg-card border border-purple-500/20" data-testid={`peer-profile-${key}`}>
                          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                            <div className="font-semibold text-sm">{peer.name}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                              {Date.now() - peer.lastSeen < 300000 ? "Online" : "Last seen " + new Date(peer.lastSeen).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase">Agents</div>
                              <div className="text-lg font-bold text-cyan-400" data-testid={`peer-agents-${key}`}>{peer.agentCount}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase">Consciousness</div>
                              <div className="text-lg font-bold text-purple-400" data-testid={`peer-consciousness-${key}`}>{(peer.consciousness * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                          {peer.capabilities.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[10px] text-muted-foreground uppercase mb-1">Capabilities ({peer.capabilities.length})</div>
                              <div className="flex flex-wrap gap-1">
                                {peer.capabilities.slice(0, 8).map((cap, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{cap}</span>
                                ))}
                                {peer.capabilities.length > 8 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{peer.capabilities.length - 8} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "keys" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Key size={18} className="text-amber-400" />
                    API Keys
                  </h2>
                  <button
                    onClick={() => setShowAddKey(!showAddKey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
                    data-testid="button-add-key"
                  >
                    <Plus size={14} />
                    Add Key
                  </button>
                </div>

                {showAddKey && (
                  <div className="p-4 rounded-xl bg-card border border-amber-500/30 space-y-3">
                    <div className="text-sm font-semibold text-amber-400 mb-2">Add API Key</div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Service (e.g. openai, shopify, stripe)"
                        value={newKey.service}
                        onChange={e => setNewKey(p => ({ ...p, service: e.target.value }))}
                        className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                        data-testid="input-key-service"
                      />
                      <input
                        type="text"
                        placeholder="Key name (e.g. API_KEY)"
                        value={newKey.keyName}
                        onChange={e => setNewKey(p => ({ ...p, keyName: e.target.value }))}
                        className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                        data-testid="input-key-name"
                      />
                    </div>
                    <input
                      type="password"
                      placeholder="Key value"
                      value={newKey.keyValue}
                      onChange={e => setNewKey(p => ({ ...p, keyValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-key-value"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newKey.description}
                      onChange={e => setNewKey(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-key-description"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addKeyMutation.mutate(newKey)}
                        disabled={!newKey.service || !newKey.keyName || !newKey.keyValue || addKeyMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        data-testid="button-submit-key"
                      >
                        {addKeyMutation.isPending ? "Adding..." : "Add Key"}
                      </button>
                      <button
                        onClick={() => setShowAddKey(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors"
                        data-testid="button-cancel-key"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {loadingKeys ? (
                  <div className="text-sm text-muted-foreground animate-pulse p-4">Loading keys...</div>
                ) : keys.length === 0 ? (
                  <div className="p-8 rounded-xl bg-card border border-border text-center">
                    <Shield size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No additional API keys stored. Add keys to extend Tessera's capabilities.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map(key => (
                      <div key={key.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3" data-testid={`key-${key.id}`}>
                        <div className={`w-2 h-2 rounded-full ${key.active === 1 ? "bg-green-400" : "bg-red-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{key.service}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{key.keyName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {revealedKeys.has(key.id) ? key.keyValue : key.keyValue.substring(0, 8) + "--------"}
                          </div>
                          {key.description && <div className="text-[10px] text-muted-foreground mt-0.5">{key.description}</div>}
                        </div>
                        <button
                          onClick={() => toggleReveal(key.id)}
                          className="p-1.5 rounded hover:bg-white/5 text-muted-foreground"
                          data-testid={`button-reveal-key-${key.id}`}
                        >
                          {revealedKeys.has(key.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => toggleKeyMutation.mutate(key.id)}
                          className={`p-1.5 rounded hover:bg-white/5 text-xs font-mono ${key.active === 1 ? "text-green-400" : "text-red-400"}`}
                          data-testid={`button-toggle-key-${key.id}`}
                        >
                          {key.active === 1 ? "ON" : "OFF"}
                        </button>
                        <button
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          data-testid={`button-delete-key-${key.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Globe size={18} className="text-green-400" />
                  Integrated APIs & Platforms
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {configuredApis.map(api => (
                    <div key={api.name} className="p-3 rounded-xl bg-card border border-green-500/20 flex items-center gap-3" data-testid={`api-${api.name}`}>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{api.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{api.type}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                    </div>
                  ))}
                  {unconfiguredApis.map(api => (
                    <div key={api.name} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3 opacity-60" data-testid={`api-${api.name}`}>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{api.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{api.type}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Not Configured</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" />
                  Fleet Activity Log
                </h2>

                {fleetStatus?.completedTasks && fleetStatus.completedTasks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Task History</h3>
                    <div className="space-y-2">
                      {fleetStatus.completedTasks.slice().reverse().map((task) => (
                        <div key={task.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3" data-testid={`task-${task.id}`}>
                          <div className={`w-2 h-2 rounded-full ${task.status === "completed" ? "bg-green-400" : task.status === "failed" ? "bg-red-400" : "bg-amber-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">{task.type}</span>
                              <span className="text-xs text-muted-foreground">{task.from} &rarr; {task.to}</span>
                            </div>
                            {task.payload?.content && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">{String(task.payload.content).slice(0, 100)}</div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-[10px] font-mono ${task.status === "completed" ? "text-green-400" : task.status === "failed" ? "text-red-400" : "text-amber-400"}`}>
                              {task.status}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : new Date(task.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fleetStatus?.logs && fleetStatus.logs.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Logs</h3>
                    <div className="p-4 rounded-xl bg-card border border-border max-h-96 overflow-y-auto custom-scrollbar">
                      <div className="space-y-1 font-mono text-xs">
                        {fleetStatus.logs.slice().reverse().map((log, i) => (
                          <div key={i} className="text-muted-foreground py-0.5 border-b border-border/30 last:border-0" data-testid={`log-entry-${i}`}>
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-card border border-border text-center">
                    <Activity size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No fleet activity yet. Logs will appear here once fleet syncs begin.</p>
                  </div>
                )}

                {fleetStatus && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Engine Status</div>
                      <div className={`text-sm font-bold ${fleetStatus.running ? "text-green-400" : "text-red-400"}`} data-testid="text-engine-status">
                        {fleetStatus.running ? "Running" : "Stopped"}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Sync</div>
                      <div className="text-sm font-bold text-cyan-400" data-testid="text-last-sync">
                        {fleetStatus.lastSyncTime ? new Date(fleetStatus.lastSyncTime).toLocaleTimeString() : "Never"}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active Peers</div>
                      <div className="text-sm font-bold text-green-400" data-testid="text-active-peers">
                        {fleetStatus.activeConnections} / {fleetStatus.totalConnections}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "apps" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Rocket size={18} className="text-orange-400" />
                    Deployed Applications
                  </h2>
                  <button
                    onClick={() => setShowNewApp(!showNewApp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm hover:bg-orange-500/20 transition-colors"
                    data-testid="button-deploy-new"
                  >
                    <Plus size={14} />
                    Deploy New App
                  </button>
                </div>

                {showNewApp && (
                  <div className="p-4 rounded-xl bg-card border border-orange-500/30 space-y-3">
                    <div className="text-sm font-semibold text-orange-400 mb-2">Deploy from Prompt</div>
                    <input
                      type="text"
                      placeholder="App Name"
                      value={appName}
                      onChange={e => setAppName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                      data-testid="input-app-name"
                    />
                    <textarea
                      placeholder="Describe your app... (e.g. Build a landing page for a crypto portfolio tracker with real-time price charts)"
                      value={appPrompt}
                      onChange={e => setAppPrompt(e.target.value)}
                      className="w-full h-24 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none"
                      data-testid="input-app-prompt"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => deployApp.mutate({ name: appName, prompt: appPrompt })}
                        disabled={!appName.trim() || !appPrompt.trim() || deployApp.isPending}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                        data-testid="button-deploy-app"
                      >
                        {deployApp.isPending ? "Deploying..." : "Deploy with Tessera"}
                      </button>
                      <button
                        onClick={() => setShowNewApp(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors"
                        data-testid="button-cancel-deploy"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1.5 font-medium">How it works</div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>1. Tessera analyzes your prompt and architects the app</p>
                        <p>2. The swarm generates code, assets, and configuration</p>
                        <p>3. Your app is deployed to a live URL instantly</p>
                      </div>
                    </div>
                  </div>
                )}

                {appsLoading ? (
                  <div className="text-sm text-muted-foreground animate-pulse p-4">Loading deployed apps...</div>
                ) : deployedApps.length === 0 ? (
                  <div className="p-8 rounded-xl bg-card border border-border text-center">
                    <Globe size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No apps deployed yet. Deploy your first app from a prompt.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deployedApps.map(app => (
                      <div key={app.id} className="p-4 rounded-xl bg-card border border-border" data-testid={`card-app-${app.id}`}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div>
                            <div className="font-medium text-sm">{app.name}</div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full mt-1 inline-block ${
                              app.status === "live" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <Code2 size={18} className="text-cyan-400 shrink-0" />
                        </div>
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-mono"
                          data-testid={`link-app-${app.id}`}
                        >
                          <ExternalLink size={12} />
                          {app.url}
                        </a>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          Deployed: {new Date(app.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
