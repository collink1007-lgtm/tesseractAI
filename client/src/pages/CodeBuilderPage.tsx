import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/components/ui-elements";
import {
  Terminal, Play, Save, Copy, Trash2, Send, CheckCircle2, XCircle, Loader2,
  Code2, Zap, ChevronDown, ChevronRight, FileCode, Shield
} from "lucide-react";

interface AgentWorkItem {
  id: string;
  agentName: string;
  agentColor: string;
  action: string;
  file: string;
  status: "working" | "done" | "error";
  timestamp: number;
  detail: string;
}

interface ShellLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

interface CodeFile {
  name: string;
  content: string;
  language: string;
  modified: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  Alpha: "text-red-400", Beta: "text-blue-400", Gamma: "text-green-400",
  Delta: "text-pink-400", Epsilon: "text-yellow-400", Zeta: "text-orange-400",
  Eta: "text-purple-400", Theta: "text-cyan-400", Lambda: "text-indigo-400",
  Omega: "text-rose-400", Tessera: "text-primary",
};

const AGENT_BG: Record<string, string> = {
  Alpha: "bg-red-500/10", Beta: "bg-blue-500/10", Gamma: "bg-green-500/10",
  Delta: "bg-pink-500/10", Epsilon: "bg-yellow-500/10", Zeta: "bg-orange-500/10",
  Eta: "bg-purple-500/10", Theta: "bg-cyan-500/10", Lambda: "bg-indigo-500/10",
  Omega: "bg-rose-500/10", Tessera: "bg-primary/10",
};

type ActiveTab = "editor" | "shell";

export default function CodeBuilderPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("shell");
  const [activeFile, setActiveFile] = useState<string>("sandbox.ts");
  const [files, setFiles] = useState<CodeFile[]>([
    { name: "sandbox.ts", content: '// Tessera Code Sandbox\nconsole.log("Hello from Tessera sandbox");\n', language: "typescript", modified: false },
  ]);
  const [agentLog, setAgentLog] = useState<AgentWorkItem[]>([]);
  const [instruction, setInstruction] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showFiles, setShowFiles] = useState(true);
  const [serverFiles, setServerFiles] = useState<string[]>([]);
  const [loadingServerFile, setLoadingServerFile] = useState(false);
  const [showProjectFiles, setShowProjectFiles] = useState(false);
  const [shellHistory, setShellHistory] = useState<ShellLine[]>([]);
  const [shellInput, setShellInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
  const [inputMode, setInputMode] = useState<"cmd" | "ai">("cmd");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const shellScrollRef = useRef<HTMLDivElement>(null);
  const unifiedInputRef = useRef<HTMLInputElement>(null);

  const currentFile = files.find(f => f.name === activeFile);

  useEffect(() => {
    fetch("/api/code-builder/files").then(r => r.json()).then(setServerFiles).catch(() => {});
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLog]);

  useEffect(() => {
    if (shellScrollRef.current) {
      shellScrollRef.current.scrollTop = shellScrollRef.current.scrollHeight;
    }
  }, [shellHistory]);

  const addAgentLog = useCallback((item: Omit<AgentWorkItem, "id" | "timestamp">) => {
    setAgentLog(prev => [...prev, { ...item, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() }]);
  }, []);

  const updateFileContent = (content: string) => {
    setFiles(prev => prev.map(f => f.name === activeFile ? { ...f, content, modified: true } : f));
  };

  const executeShellCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shellInput.trim() || isExecuting) return;

    const command = shellInput.trim();
    setShellInput("");
    setCmdHistory(prev => [...prev, command]);
    setCmdHistoryIdx(-1);
    setShellHistory(prev => [...prev, { type: 'input', content: command, timestamp: Date.now() }]);
    setIsExecuting(true);

    try {
      const res = await fetch("/api/code-builder/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "bash", code: command }),
      });
      const data = await res.json();
      if (data.output) {
        setShellHistory(prev => [...prev, { type: 'output', content: data.output, timestamp: Date.now() }]);
      }
      if (data.error) {
        setShellHistory(prev => [...prev, { type: 'error', content: data.error, timestamp: Date.now() }]);
      }
      if (!data.output && !data.error) {
        setShellHistory(prev => [...prev, { type: 'system', content: "(No output)", timestamp: Date.now() }]);
      }
    } catch (err: any) {
      setShellHistory(prev => [...prev, { type: 'error', content: err.message || "Execution failed", timestamp: Date.now() }]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => unifiedInputRef.current?.focus(), 50);
    }
  };

  const handleShellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = cmdHistoryIdx < cmdHistory.length - 1 ? cmdHistoryIdx + 1 : cmdHistoryIdx;
        setCmdHistoryIdx(newIdx);
        setShellInput(cmdHistory[cmdHistory.length - 1 - newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistoryIdx > 0) {
        const newIdx = cmdHistoryIdx - 1;
        setCmdHistoryIdx(newIdx);
        setShellInput(cmdHistory[cmdHistory.length - 1 - newIdx]);
      } else {
        setCmdHistoryIdx(-1);
        setShellInput("");
      }
    }
  };

  const handleSendInstruction = async () => {
    if (!instruction.trim() || isRunning) return;
    const msg = instruction.trim();
    setInstruction("");
    setIsRunning(true);

    const agents = ["Alpha", "Beta", "Gamma"];
    const selectedAgent = agents[Math.floor(Math.random() * agents.length)];

    setShellHistory(prev => [...prev, { type: 'input', content: `[AI] ${msg}`, timestamp: Date.now() }]);
    addAgentLog({ agentName: "You", agentColor: "text-white", action: "instruction", file: activeFile, status: "done", detail: msg });
    addAgentLog({ agentName: selectedAgent, agentColor: AGENT_COLORS[selectedAgent] || "text-primary", action: "analyzing", file: activeFile, status: "working", detail: `Processing: "${msg.substring(0, 60)}..."` });

    try {
      const res = await fetch("/api/code-builder/instruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: msg, currentCode: currentFile?.content || "", fileName: activeFile }),
      });
      const data = await res.json();

      if (data.code) {
        updateFileContent(data.code);
        const explanation = data.explanation || "Code updated successfully";
        setShellHistory(prev => [...prev, { type: 'output', content: `[${selectedAgent}] ${explanation}`, timestamp: Date.now() }]);
        addAgentLog({ agentName: selectedAgent, agentColor: AGENT_COLORS[selectedAgent] || "text-primary", action: "updated", file: activeFile, status: "done", detail: explanation });
      } else {
        const explanation = data.explanation || data.error || "No changes needed";
        setShellHistory(prev => [...prev, { type: 'output', content: `[${selectedAgent}] ${explanation}`, timestamp: Date.now() }]);
        addAgentLog({ agentName: selectedAgent, agentColor: AGENT_COLORS[selectedAgent] || "text-primary", action: "response", file: activeFile, status: "done", detail: explanation });
      }
    } catch {
      setShellHistory(prev => [...prev, { type: 'error', content: `[${selectedAgent}] Failed to process instruction`, timestamp: Date.now() }]);
      addAgentLog({ agentName: selectedAgent, agentColor: AGENT_COLORS[selectedAgent] || "text-primary", action: "error", file: activeFile, status: "error", detail: "Failed to process instruction" });
    }
    setIsRunning(false);
  };

  const handleRunCode = async () => {
    if (isTesting) return;
    setIsTesting(true);
    addAgentLog({ agentName: "Tessera", agentColor: "text-primary", action: "testing", file: activeFile, status: "working", detail: "Running code in sandbox..." });

    try {
      const res = await fetch("/api/code-builder/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentFile?.content || "", fileName: activeFile }),
      });
      const data = await res.json();
      const passed = !data.error;
      addAgentLog({ agentName: "Tessera", agentColor: "text-primary", action: passed ? "passed" : "failed", file: activeFile, status: passed ? "done" : "error", detail: (data.output || data.error || "").substring(0, 200) });
    } catch {
      addAgentLog({ agentName: "Tessera", agentColor: "text-primary", action: "error", file: activeFile, status: "error", detail: "Sandbox execution failed" });
    }
    setIsTesting(false);
  };

  const handleSave = async () => {
    if (!currentFile) return;
    try {
      await fetch("/api/code-builder/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: activeFile, content: currentFile.content }) });
      setFiles(prev => prev.map(f => f.name === activeFile ? { ...f, modified: false } : f));
      addAgentLog({ agentName: "Tessera", agentColor: "text-primary", action: "saved", file: activeFile, status: "done", detail: `${activeFile} saved` });
    } catch {
      addAgentLog({ agentName: "Tessera", agentColor: "text-primary", action: "save-error", file: activeFile, status: "error", detail: "Failed to save" });
    }
  };

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
    }
  };

  const handleNewFile = () => {
    const name = `file_${Date.now().toString(36)}.ts`;
    setFiles(prev => [...prev, { name, content: "// New file\n", language: "typescript", modified: true }]);
    setActiveFile(name);
  };

  const handleDeleteFile = (name: string) => {
    if (files.length <= 1) return;
    setFiles(prev => prev.filter(f => f.name !== name));
    if (activeFile === name) setActiveFile(files[0].name === name ? files[1]?.name || "" : files[0].name);
  };

  const handleLoadServerFile = async (filePath: string) => {
    setLoadingServerFile(true);
    try {
      const res = await fetch(`/api/code-builder/load?file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.content) {
        const existing = files.find(f => f.name === filePath);
        if (existing) {
          setFiles(prev => prev.map(f => f.name === filePath ? { ...f, content: data.content, modified: false } : f));
        } else {
          setFiles(prev => [...prev, { name: filePath, content: data.content, language: data.language || "typescript", modified: false }]);
        }
        setActiveFile(filePath);
      }
    } catch {}
    setLoadingServerFile(false);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const statusIcon = (s: string) => {
    if (s === "working") return <Loader2 size={10} className="animate-spin text-cyan-400" />;
    if (s === "done") return <CheckCircle2 size={10} className="text-green-400" />;
    return <XCircle size={10} className="text-red-400" />;
  };

  return (
    <div className="flex h-dvh w-full bg-background overflow-hidden" data-testid="code-builder-page">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-5" />

        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/80 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider" data-testid="text-code-builder-title">Sovereign Shell</span>
          </div>

          <div className="flex items-center gap-0.5 ml-4 bg-black/30 rounded-lg p-0.5 border border-border/30">
            <button
              onClick={() => setActiveTab("shell")}
              className={cn("px-3 py-1 text-[10px] font-mono rounded-md transition-all", activeTab === "shell" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
              data-testid="tab-shell"
            >
              <Terminal size={10} className="inline mr-1" />TERMINAL
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className={cn("px-3 py-1 text-[10px] font-mono rounded-md transition-all", activeTab === "editor" ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:text-foreground")}
              data-testid="tab-editor"
            >
              <Code2 size={10} className="inline mr-1" />EDITOR
            </button>
          </div>

          <div className="flex-1" />

          {activeTab === "editor" && (
            <>
              <button onClick={handleNewFile} className="px-2 py-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-colors" data-testid="button-new-file">
                <Code2 size={10} className="inline mr-1" />NEW
              </button>
              <button onClick={handleCopy} className="px-2 py-1 text-[10px] font-mono bg-white/5 text-muted-foreground border border-border rounded hover:bg-white/10 transition-colors" data-testid="button-copy-code">
                <Copy size={10} className="inline mr-1" />COPY
              </button>
              <button onClick={handleSave} className="px-2 py-1 text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 transition-colors" data-testid="button-save-code">
                <Save size={10} className="inline mr-1" />SAVE
              </button>
              <button onClick={handleRunCode} disabled={isTesting} className="px-2 py-1 text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded hover:bg-yellow-500/20 transition-colors disabled:opacity-50" data-testid="button-run-code">
                {isTesting ? <Loader2 size={10} className="inline mr-1 animate-spin" /> : <Play size={10} className="inline mr-1" />}RUN
              </button>
            </>
          )}

          {activeTab === "shell" && (
            <button onClick={() => setShellHistory([])} className="px-2 py-1 text-[10px] font-mono bg-white/5 text-muted-foreground border border-border rounded hover:bg-white/10 transition-colors" data-testid="button-clear-shell">
              <Trash2 size={10} className="inline mr-1" />CLEAR
            </button>
          )}
        </div>

        <div className="flex flex-1 min-h-0 z-10">
          {activeTab === "editor" && (
            <div className="w-48 border-r border-border bg-card/50 flex-shrink-0 overflow-y-auto custom-scrollbar hidden md:flex flex-col">
              <div className="p-2">
                <button onClick={() => setShowFiles(!showFiles)} className="flex items-center gap-1 w-full text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground">
                  {showFiles ? <ChevronDown size={10} /> : <ChevronRight size={10} />} Sandbox Files
                </button>
                {showFiles && files.map(f => (
                  <div key={f.name} className={cn("group flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors", activeFile === f.name ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")} onClick={() => setActiveFile(f.name)} data-testid={`file-tab-${f.name}`}>
                    <FileCode size={10} />
                    <span className="truncate flex-1">{f.name}</span>
                    {f.modified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}
                    {files.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(f.name); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300" data-testid={`button-delete-file-${f.name}`}>
                        <Trash2 size={9} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border/50">
                <button onClick={() => setShowProjectFiles(!showProjectFiles)} className="flex items-center gap-1 w-full text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground">
                  {showProjectFiles ? <ChevronDown size={10} /> : <ChevronRight size={10} />} Project Files
                </button>
                {showProjectFiles && (
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-0.5">
                    {loadingServerFile && <Loader2 size={10} className="animate-spin text-primary mx-auto my-2" />}
                    {serverFiles.map(sf => (
                      <button key={sf} onClick={() => handleLoadServerFile(sf)} className="w-full text-left text-[10px] font-mono text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/5 px-2 py-0.5 rounded truncate transition-colors" data-testid={`button-load-${sf}`}>
                        {sf}
                      </button>
                    ))}
                    {serverFiles.length === 0 && <p className="text-[9px] text-muted-foreground/50 font-mono px-2">No files found</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === "editor" && (
              <>
                <div className="flex items-center gap-1 px-2 py-1 border-b border-border/50 bg-black/30 md:hidden overflow-x-auto">
                  {files.map(f => (
                    <button key={f.name} onClick={() => setActiveFile(f.name)} className={cn("px-2 py-0.5 text-[10px] font-mono rounded whitespace-nowrap", activeFile === f.name ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")} data-testid={`tab-mobile-${f.name}`}>
                      {f.name} {f.modified ? "*" : ""}
                    </button>
                  ))}
                </div>
                <div className="flex-1 relative min-h-0">
                  <div className="absolute top-0 left-0 w-10 h-full bg-black/30 border-r border-border/30 z-10 overflow-hidden pointer-events-none">
                    <div className="py-2 text-right pr-2">
                      {(currentFile?.content || "").split("\n").map((_, i) => (
                        <div key={i} className="text-[10px] font-mono text-muted-foreground/40 leading-[1.6]">{i + 1}</div>
                      ))}
                    </div>
                  </div>
                  <textarea
                    ref={editorRef}
                    value={currentFile?.content || ""}
                    onChange={e => updateFileContent(e.target.value)}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full bg-black/20 text-green-300 font-mono text-[12px] leading-[1.6] p-2 pl-12 resize-none focus:outline-none custom-scrollbar overflow-auto"
                    style={{ tabSize: 2, caretColor: "#4ade80" }}
                    data-testid="code-editor"
                  />
                </div>
              </>
            )}

            {activeTab === "shell" && (
              <div className="flex-1 flex flex-col min-h-0 bg-black/30">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-black/20">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[10px] font-mono text-white/70 ml-2">tessera@sovereign:~$</span>
                  <span className="text-[9px] font-mono text-primary/40 ml-auto">{shellHistory.filter(l => l.type === 'input').length} commands</span>
                </div>
                <div ref={shellScrollRef} className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    <div className="text-cyan-400/60 mb-4 text-xs">
                      # Tessera Sovereign Shell v4.0 — bash, python, node
                      <br /># Use the unified bar below — toggle CMD or AI mode
                    </div>
                    {shellHistory.map((line, i) => (
                      <div key={i} className={cn(
                        "whitespace-pre-wrap break-all text-[13px]",
                        line.type === 'input' ? "text-cyan-300 font-semibold" :
                        line.type === 'error' ? "text-red-300" :
                        line.type === 'system' ? "text-zinc-400 italic text-xs" :
                        "text-white/90"
                      )}>
                        {line.type === 'input' && <span className="text-cyan-400 mr-2">&#10095;</span>}
                        {line.content}
                      </div>
                    ))}
                    {isExecuting && (
                      <div className="flex items-center gap-2 text-primary animate-pulse">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Executing...</span>
                      </div>
                    )}
                  </div>
                </div>
                </div>
            )}
          </div>

          <div className="w-72 border-l border-border bg-card/30 flex-shrink-0 flex flex-col min-h-0 hidden lg:flex">
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-black/30">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Zap size={10} /> Agent Activity
              </span>
              <span className="text-[9px] text-muted-foreground font-mono ml-auto">{agentLog.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0">
              {agentLog.length === 0 && (
                <div className="text-center py-8">
                  <Zap size={16} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-[10px] text-muted-foreground/50 font-mono">Run commands or give instructions</p>
                </div>
              )}
              {agentLog.map(item => (
                <div key={item.id} className={cn("px-2 py-1.5 rounded border border-border/20 text-[10px] font-mono", AGENT_BG[item.agentName] || "bg-white/5")} data-testid={`log-${item.id}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {statusIcon(item.status)}
                    <span className={cn("font-bold", item.agentColor || "text-foreground")}>{item.agentName}</span>
                    <span className="text-muted-foreground/60 ml-auto">{formatTime(item.timestamp)}</span>
                  </div>
                  <p className="text-foreground/70 break-words leading-relaxed">{item.detail}</p>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (inputMode === "cmd") executeShellCommand(); else handleSendInstruction(); }} className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-card/90 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", (isRunning || isExecuting) ? "bg-yellow-400 animate-pulse" : "bg-green-400")} />
          </div>
          <div className="flex items-center bg-black/40 rounded-md p-0.5 border border-border/30">
            <button
              type="button"
              onClick={() => setInputMode("cmd")}
              className={cn("px-2 py-1 text-[10px] font-mono rounded transition-all", inputMode === "cmd" ? "bg-cyan-500/20 text-cyan-300" : "text-muted-foreground hover:text-foreground")}
              data-testid="button-mode-cmd"
            >
              <Terminal size={10} className="inline mr-1" />CMD
            </button>
            <button
              type="button"
              onClick={() => setInputMode("ai")}
              className={cn("px-2 py-1 text-[10px] font-mono rounded transition-all", inputMode === "ai" ? "bg-green-500/20 text-green-300" : "text-muted-foreground hover:text-foreground")}
              data-testid="button-mode-ai"
            >
              <Zap size={10} className="inline mr-1" />AI
            </button>
          </div>
          <input
            ref={unifiedInputRef}
            value={inputMode === "cmd" ? shellInput : instruction}
            onChange={e => inputMode === "cmd" ? setShellInput(e.target.value) : setInstruction(e.target.value)}
            onKeyDown={e => {
              if (inputMode === "cmd") handleShellKeyDown(e);
            }}
            placeholder={inputMode === "cmd" ? "ls -la, python3 script.py, echo hello..." : "Describe what you want to build in English..."}
            className={cn(
              "flex-1 bg-black/40 border rounded-md px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none transition-colors",
              inputMode === "cmd"
                ? "border-cyan-500/30 text-white focus:border-cyan-400/60"
                : "border-green-500/30 text-white focus:border-green-400/60"
            )}
            disabled={isRunning || isExecuting}
            autoFocus
            data-testid="input-unified"
          />
          <button
            type="submit"
            disabled={(isRunning || isExecuting) || (inputMode === "cmd" ? !shellInput.trim() : !instruction.trim())}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-mono transition-colors disabled:opacity-30",
              inputMode === "cmd"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                : "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
            )}
            data-testid="button-unified-execute"
          >
            {(isRunning || isExecuting) ? <Loader2 size={14} className="animate-spin" /> : inputMode === "cmd" ? <Play size={14} /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
