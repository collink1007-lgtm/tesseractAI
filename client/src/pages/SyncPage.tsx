import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
import {
  Link2, Plus, Trash2, Play, MessageSquare, Send,
  Globe, GitBranch, Code2, Radio, RefreshCw, Zap, ClipboardCopy,
  Target, X, Square, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SyncURL {
  id: string;
  url: string;
  label: string;
  type: string;
  lastScraped: number;
  capabilities: string[];
  addedAt: number;
}

interface SyncMessage {
  id: string;
  sessionId: string;
  sender: string;
  senderUrl: string;
  content: string;
  timestamp: number;
  type: string;
}

interface SyncSession {
  id: string;
  urls: SyncURL[];
  messages: SyncMessage[];
  status: string;
  topic: string;
  createdAt: number;
}

type TabType = "urls" | "session";

const SENDER_COLORS = [
  { text: "text-cyan-400", border: "border-l-cyan-400", bg: "bg-cyan-500/10" },
  { text: "text-violet-400", border: "border-l-violet-400", bg: "bg-violet-500/10" },
  { text: "text-emerald-400", border: "border-l-emerald-400", bg: "bg-emerald-500/10" },
  { text: "text-rose-400", border: "border-l-rose-400", bg: "bg-rose-500/10" },
  { text: "text-orange-400", border: "border-l-orange-400", bg: "bg-orange-500/10" },
  { text: "text-sky-400", border: "border-l-sky-400", bg: "bg-sky-500/10" },
  { text: "text-pink-400", border: "border-l-pink-400", bg: "bg-pink-500/10" },
  { text: "text-teal-400", border: "border-l-teal-400", bg: "bg-teal-500/10" },
];

export default function SyncPage() {
  const [activeTab, setActiveTab] = useState<TabType>("urls");
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
  const senderColorMap = useRef<Map<string, number>>(new Map());
  const { toast } = useToast();

  const { data: urls, isLoading: urlsLoading } = useQuery<SyncURL[]>({
    queryKey: ["/api/sync/urls"],
    refetchInterval: 10000,
  });

  const { data: sessions } = useQuery({
    queryKey: ["/api/sync/sessions"],
    refetchInterval: 5000,
  });

  const { data: activeSession, refetch: refetchSession } = useQuery({
    queryKey: ["/api/sync/session", activeSessionId],
    enabled: !!activeSessionId,
    refetchInterval: 2000,
  });

  const session = activeSession as SyncSession | undefined;

  useEffect(() => {
    const msgCount = session?.messages?.length || 0;
    if (msgCount > prevMessageCount.current) {
      prevMessageCount.current = msgCount;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.messages?.length]);

  useEffect(() => {
    if (activeSessionId) {
      apiRequest("GET", `/api/sync/session/${activeSessionId}/auto-status`)
        .then(r => r.json())
        .then(d => setIsAutoRunning(d.running))
        .catch(() => {});
    }
  }, [activeSessionId]);

  const getSenderColor = (sender: string) => {
    if (!senderColorMap.current.has(sender)) {
      senderColorMap.current.set(sender, senderColorMap.current.size % SENDER_COLORS.length);
    }
    return SENDER_COLORS[senderColorMap.current.get(sender)!];
  };

  const addUrlMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync/urls", { url: urlInput, label: labelInput || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync/urls"] });
      setUrlInput("");
      setLabelInput("");
      toast({ title: "URL Added", description: "URL scraped and stored successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeUrlMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sync/urls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync/urls"] });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync/sessions", { urlIds: selectedUrls, topic: topicInput || undefined }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      setActiveSessionId(data.id);
      setActiveTab("session");
      setSelectedUrls([]);
      setTopicInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/sync/sessions"] });
      toast({ title: "Session Created", description: "Auto-running conversation started" });

      try {
        await apiRequest("POST", `/api/sync/session/${data.id}/start-auto`);
        setIsAutoRunning(true);
      } catch {}
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sync/session/${activeSessionId}/stop`),
    onSuccess: () => {
      setIsAutoRunning(false);
      refetchSession();
      toast({ title: "Session Stopped", description: "Conversation paused" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sync/session/${activeSessionId}/input`, { message: userMessage }),
    onSuccess: () => {
      setUserMessage("");
      refetchSession();
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sync/session/${activeSessionId}/task`, { task: taskInput }),
    onSuccess: () => {
      setTaskInput("");
      refetchSession();
      toast({ title: "Task Assigned", description: "Task sent to all URLs in session" });
    },
  });

  const toggleUrlSelection = (id: string) => {
    setSelectedUrls(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "repo": return <GitBranch size={14} className="text-green-400" />;
      case "api": return <Code2 size={14} className="text-blue-400" />;
      case "conversation": return <MessageSquare size={14} className="text-purple-400" />;
      case "program": return <Zap size={14} className="text-amber-400" />;
      default: return <Globe size={14} className="text-cyan-400" />;
    }
  };

  const getMessageStyle = (msg: SyncMessage) => {
    switch (msg.type) {
      case "user_input": return { border: "border-l-amber-400", text: "text-amber-400" };
      case "system": return { border: "border-l-muted-foreground", text: "text-muted-foreground" };
      case "summary": return { border: "border-l-green-400", text: "text-green-400" };
      case "task": return { border: "border-l-red-400", text: "text-red-400" };
      default: {
        const color = getSenderColor(msg.sender);
        return { border: color.border, text: color.text };
      }
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background" data-testid="sync-page">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Link2 size={22} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground" data-testid="text-sync-title">URL Sync</h1>
                <p className="text-xs text-muted-foreground font-mono">Cross-URL communication & knowledge extraction</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 mt-4 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab("urls")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "urls" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "text-muted-foreground hover:bg-white/5"
              }`}
              data-testid="tab-urls"
            >
              <Globe size={13} />
              URLs & Sessions
            </button>
            <button
              onClick={() => setActiveTab("session")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "session" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "text-muted-foreground hover:bg-white/5"
              }`}
              data-testid="tab-session"
            >
              <Radio size={13} />
              Live Session
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === "urls" && (
            <>
              <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Add URL</h3>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://github.com/user/repo or any URL..."
                    className="flex-1 min-w-[200px] bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    data-testid="input-url"
                  />
                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    placeholder="Label (optional)"
                    className="w-40 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    data-testid="input-url-label"
                  />
                  <button
                    onClick={() => addUrlMutation.mutate()}
                    disabled={!urlInput || addUrlMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-all border border-cyan-500/20 disabled:opacity-50"
                    data-testid="button-add-url"
                  >
                    {addUrlMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                    {addUrlMutation.isPending ? "Scraping..." : "Add & Scrape"}
                  </button>
                </div>
              </div>

              <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Stored URLs ({urls?.length || 0})</h3>
                  {selectedUrls.length >= 2 && (
                    <div className="flex gap-2 items-center flex-wrap">
                      <input
                        type="text"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        placeholder="Session topic..."
                        className="w-48 bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                        data-testid="input-session-topic"
                      />
                      <button
                        onClick={() => createSessionMutation.mutate()}
                        disabled={createSessionMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium border border-green-500/20"
                        data-testid="button-start-session"
                      >
                        <Play size={12} />
                        Start Session ({selectedUrls.length} URLs)
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {urlsLoading ? (
                    <div className="text-xs text-muted-foreground text-center py-4">Loading URLs...</div>
                  ) : urls && urls.length > 0 ? (
                    urls.map((url) => (
                      <div
                        key={url.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedUrls.includes(url.id)
                            ? "border-cyan-500/50 bg-cyan-500/5"
                            : "border-border/30 hover:bg-white/5"
                        }`}
                        onClick={() => toggleUrlSelection(url.id)}
                        data-testid={`url-item-${url.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUrls.includes(url.id)}
                          readOnly
                          className="accent-cyan-400"
                        />
                        {typeIcon(url.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{url.label}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{url.url}</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {url.capabilities.slice(0, 4).map((cap, i) => (
                              <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{cap}</span>
                            ))}
                            <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">{url.type}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeUrlMutation.mutate(url.id); }}
                          className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                          data-testid={`button-remove-url-${url.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No URLs stored. Add URLs above to start syncing.
                    </div>
                  )}
                </div>
              </div>

              {(sessions as SyncSession[] || []).length > 0 && (
                <div className="bg-card/80 border border-border/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Previous Sessions</h3>
                  <div className="space-y-2">
                    {(sessions as SyncSession[]).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setActiveSessionId(s.id); setActiveTab("session"); }}
                        className="w-full text-left p-3 rounded-lg border border-border/30 hover:bg-white/5 transition-all"
                        data-testid={`session-${s.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-foreground">{s.topic}</div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            s.status === "active" ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {s.urls?.length || 0} URLs — {s.messages?.length || 0} messages
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "session" && (
            <>
              {!activeSessionId ? (
                <div className="text-center py-12">
                  <Radio size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No active session. Select URLs and start a session.</p>
                  <button
                    onClick={() => setActiveTab("urls")}
                    className="mt-3 text-xs text-cyan-400 hover:underline"
                    data-testid="button-go-to-urls"
                  >
                    Go to URLs tab
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{session?.topic || "Session"}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {session?.urls?.map(u => {
                          const favicon = getFaviconUrl(u.url);
                          return (
                            <span key={u.id} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-card border border-border/30 rounded px-1.5 py-0.5">
                              {favicon && <img src={favicon} alt="" className="w-3 h-3" />}
                              {typeIcon(u.type)}
                              {u.label}
                            </span>
                          );
                        })}
                        <span className="text-[10px] text-muted-foreground">— {session?.messages?.length || 0} messages</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {isAutoRunning && (
                        <span className="flex items-center gap-1 text-[10px] text-green-400">
                          <Loader2 size={11} className="animate-spin" />
                          Auto-running
                        </span>
                      )}
                      {session?.status === "active" && (
                        <button
                          onClick={() => stopSessionMutation.mutate()}
                          disabled={stopSessionMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium border border-red-500/20"
                          data-testid="button-stop-session"
                        >
                          <Square size={12} />
                          Stop
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-card/80 border border-border/50 rounded-xl p-4 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                      {session?.messages?.map((msg, i) => {
                        const style = getMessageStyle(msg);
                        const favicon = msg.senderUrl ? getFaviconUrl(msg.senderUrl) : null;
                        return (
                          <div
                            key={msg.id || i}
                            className={`border-l-2 pl-3 py-2 ${style.border} group`}
                            data-testid={`sync-message-${i}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {favicon && <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />}
                                {!favicon && msg.type === "url_response" && typeIcon(
                                  session?.urls?.find(u => u.url === msg.senderUrl)?.type || "website"
                                )}
                                <span className={`text-xs font-semibold ${style.text}`}>
                                  {msg.sender}
                                </span>
                                {msg.senderUrl && (
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{msg.senderUrl}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                                <button
                                  onClick={() => copyMessage(msg.content)}
                                  className="invisible group-hover:visible p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                                  data-testid={`button-copy-${i}`}
                                >
                                  <ClipboardCopy size={11} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-foreground/90 mt-1 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {session?.status === "active" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && userMessage) sendMessageMutation.mutate(); }}
                          placeholder="Type your message to the conversation..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                          data-testid="input-user-message"
                        />
                        <button
                          onClick={() => sendMessageMutation.mutate()}
                          disabled={!userMessage || sendMessageMutation.isPending}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium border border-amber-500/20 disabled:opacity-50"
                          data-testid="button-send-message"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={taskInput}
                          onChange={(e) => setTaskInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && taskInput) assignTaskMutation.mutate(); }}
                          placeholder="Assign a task for URLs to work on together..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500/50"
                          data-testid="input-task"
                        />
                        <button
                          onClick={() => assignTaskMutation.mutate()}
                          disabled={!taskInput || assignTaskMutation.isPending}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium border border-red-500/20 disabled:opacity-50"
                          data-testid="button-assign-task"
                        >
                          <Target size={13} />
                          Task
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
