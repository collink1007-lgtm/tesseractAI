import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, Plus, TerminalSquare, Trash2, Activity, Menu, X, DollarSign, Network, Palette, Users, Globe, Code2, Terminal, Box, Brain, Scale, Link2 } from "lucide-react";
import { useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-conversations";
import { Button, cn } from "./ui-elements";
import { useTheme } from "./ThemeProvider";

export function Sidebar() {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const { currentTheme, setTheme, availableThemes } = useTheme();

  const themeColors: Record<string, string> = {
    default: "bg-cyan-500", midnight: "bg-purple-500", emerald: "bg-emerald-500",
    crimson: "bg-red-500", gold: "bg-amber-500", ocean: "bg-blue-500", rose: "bg-pink-500",
  };

  const handleNewChat = () => {
    createConv.mutate({ title: "New Chat" });
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-border/50 relative z-10">
        <div className="flex items-center gap-3 text-primary mb-5">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 pulse-glow">
            <TerminalSquare size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Tessera</h1>
            <p className="text-[10px] text-primary font-mono tracking-[0.15em] uppercase">Sovereign v4.0</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
            data-testid="button-close-sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <Button
          onClick={handleNewChat}
          isLoading={createConv.isPending}
          className="w-full justify-start gap-2 text-primary-foreground font-semibold"
          data-testid="button-new-chat"
        >
          <Plus size={18} />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-0.5 relative z-10">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-2 px-2 font-mono">
          Conversations
        </div>

        {isLoading ? (
          <div className="px-2 py-4 text-sm text-muted-foreground animate-pulse font-mono">Loading...</div>
        ) : conversations?.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground font-mono">No chats yet</div>
        ) : (
          conversations?.map((conv) => {
            const isActive = location === `/c/${conv.id}`;
            return (
              <div key={conv.id} className="relative group">
                <Link
                  href={`/c/${conv.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                  data-testid={`link-conversation-${conv.id}`}
                >
                  <MessageSquare size={14} />
                  <span className="truncate flex-1">{conv.title}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteConv.mutate(conv.id);
                  }}
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100",
                    isActive && "opacity-100"
                  )}
                  data-testid={`button-delete-conversation-${conv.id}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-border/50 space-y-0.5 relative z-10">
        <Link
          href="/income"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/income"
              ? "bg-green-500/10 text-green-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-income"
        >
          <DollarSign size={16} />
          Income Engine
        </Link>
        <Link
          href="/life"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/life"
              ? "bg-emerald-500/10 text-emerald-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-life"
        >
          <Globe size={16} />
          Life & World
        </Link>
        <Link
          href="/fleet"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/fleet"
              ? "bg-cyan-500/10 text-cyan-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-fleet"
        >
          <Network size={16} />
          Fleet & Tools
        </Link>
        <Link
          href="/agents"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/agents"
              ? "bg-orange-500/10 text-orange-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-agents"
        >
          <Users size={16} />
          Agents
        </Link>
        <Link
          href="/conference"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location.startsWith("/conference")
              ? "bg-violet-500/10 text-violet-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-tesseract"
        >
          <Box size={16} />
          Tesseract
        </Link>
        <Link
          href="/learning"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/learning"
              ? "bg-amber-500/10 text-amber-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-learning"
        >
          <Brain size={16} />
          Learning
        </Link>
        <Link
          href="/rules"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/rules"
              ? "bg-amber-500/10 text-amber-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-rules"
        >
          <Scale size={16} />
          Rules
        </Link>
        <Link
          href="/sync"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/sync"
              ? "bg-cyan-500/10 text-cyan-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-sync"
        >
          <Link2 size={16} />
          Sync
        </Link>
        <Link
          href="/shell"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            (location === "/shell" || location === "/code")
              ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-shell"
        >
          <Terminal size={16} />
          Sovereign Shell
        </Link>
        <Link
          href="/system"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
            location === "/system"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
          data-testid="link-system"
        >
          <Activity size={16} />
          System
        </Link>

        <div className="relative">
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 w-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
            data-testid="button-theme-picker"
          >
            <Palette size={16} />
            Theme: {currentTheme}
          </button>
          {themeOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg p-2 shadow-xl z-50" data-testid="theme-dropdown">
              {availableThemes.map(t => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setThemeOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 rounded text-xs transition-all",
                    currentTheme === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"
                  )}
                  data-testid={`button-theme-${t}`}
                >
                  <span className={cn("w-3 h-3 rounded-full", themeColors[t] || "bg-gray-500")} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-card border border-border text-foreground"
        data-testid="button-open-sidebar"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed md:relative z-50 md:z-auto w-64 flex-shrink-0 border-r border-border bg-card/95 backdrop-blur-xl h-dvh flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
        {sidebarContent}
      </div>
    </>
  );
}
