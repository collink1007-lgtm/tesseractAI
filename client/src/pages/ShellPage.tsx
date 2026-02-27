import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button, Input, cn } from "@/components/ui-elements";
import { Terminal, Play, Trash2, Shield, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShellLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export default function ShellPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ShellLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isExecuting) return;

    const command = input.trim();
    setInput("");
    setHistory(prev => [...prev, { type: 'input', content: command, timestamp: Date.now() }]);
    setIsExecuting(true);

    try {
      const res = await apiRequest("POST", "/api/code-builder/run", {
        language: "bash",
        code: command
      });
      const data = await res.json();

      if (data.output) {
        setHistory(prev => [...prev, { type: 'output', content: data.output, timestamp: Date.now() }]);
      }
      if (data.error) {
        setHistory(prev => [...prev, { type: 'error', content: data.error, timestamp: Date.now() }]);
      }
      if (!data.output && !data.error) {
        setHistory(prev => [...prev, { type: 'system', content: "(Command executed with no output)", timestamp: Date.now() }]);
      }
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'error', content: err.message || "Execution failed", timestamp: Date.now() }]);
      toast({
        title: "Execution Error",
        description: "Failed to communicate with the sovereign environment.",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const clearShell = () => setHistory([]);

  return (
    <div className="flex h-dvh w-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Shield className="text-primary w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-foreground">Secure Sovereign Shell</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Environment: Tessera-v4-Sandbox</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearShell}
              className="h-8 gap-2 border-primary/20 hover:bg-primary/5"
            >
              <Trash2 size={14} /> Clear
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-black/40 border border-primary/20 rounded-xl backdrop-blur-md overflow-hidden relative z-10 shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-black/20">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">tessera@sovereign:~$</span>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar"
          >
            <div className="space-y-2">
              <div className="text-primary/60 mb-4 italic">
                # Tessera Secure Shell Initialized.
                <br /># All commands executed in isolated container.
                <br /># Restricted access to Father Protocol assets.
              </div>
              
              {history.map((line, i) => (
                <div key={i} className={cn(
                  "whitespace-pre-wrap break-all",
                  line.type === 'input' ? "text-cyan-400" : 
                  line.type === 'error' ? "text-red-400" : 
                  line.type === 'system' ? "text-muted-foreground italic" :
                  "text-zinc-300"
                )}>
                  {line.type === 'input' && <span className="text-primary/40 mr-2">❯</span>}
                  {line.content}
                </div>
              ))}
              
              {isExecuting && (
                <div className="flex items-center gap-2 text-primary animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Processing quantum request...</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={executeCommand} className="p-4 border-t border-primary/10 bg-black/20 flex gap-2">
            <div className="relative flex-1 group">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter sovereign command (bash, python, node...)"
                className="pl-10 bg-black/40 border-primary/20 focus:border-primary/50 font-mono text-sm h-11"
                disabled={isExecuting}
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              disabled={isExecuting || !input.trim()}
              className="px-6 h-11"
            >
              {isExecuting ? <Loader2 className="animate-spin" /> : <Play size={18} />}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
