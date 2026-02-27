import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button, Input } from "@/components/ui-elements";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Inbox, StickyNote, Lightbulb, AlertTriangle, Bell, Target, Trophy,
  Plus, Send, Trash2, Eye, Check
} from "lucide-react";
import { cn } from "@/components/ui-elements";
import { motion, AnimatePresence } from "framer-motion";

type NoteType = "note" | "idea" | "alert" | "reminder" | "goal";
type NotePriority = "low" | "normal" | "high" | "critical";

interface TesseraNote {
  id: number;
  type: string;
  title: string;
  content: string;
  priority: string;
  status: string;
  createdAt: string;
}

const typeConfig: Record<NoteType, { icon: typeof StickyNote; label: string; color: string }> = {
  note: { icon: StickyNote, label: "Note", color: "text-cyan-400" },
  idea: { icon: Lightbulb, label: "Idea", color: "text-yellow-400" },
  alert: { icon: AlertTriangle, label: "Alert", color: "text-red-400" },
  reminder: { icon: Bell, label: "Reminder", color: "text-purple-400" },
  goal: { icon: Target, label: "Goal", color: "text-emerald-400" },
};

const priorityColors: Record<NotePriority, string> = {
  low: "border-l-gray-500",
  normal: "border-l-cyan-500",
  high: "border-l-yellow-500",
  critical: "border-l-red-500",
};

export default function AgentBoardPage() {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("note");
  const [notePriority, setNotePriority] = useState<NotePriority>("normal");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalContent, setGoalContent] = useState("");
  const [goalPriority, setGoalPriority] = useState<NotePriority>("high");
  const [noteFilter, setNoteFilter] = useState<string>("all");

  const { data: notes, isLoading: notesLoading } = useQuery<TesseraNote[]>({
    queryKey: ["/api/notes"],
    refetchInterval: 15000,
  });

  const createNote = useMutation({
    mutationFn: async (data: { type: string; title: string; content: string; priority: string }) => {
      await apiRequest("POST", "/api/notes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNoteTitle(""); setNoteContent(""); setShowNoteForm(false);
      setGoalTitle(""); setGoalContent(""); setShowGoalForm(false);
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => { await apiRequest("PATCH", `/api/notes/${id}`, { status: "read" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
  });

  const markComplete = useMutation({
    mutationFn: async (id: number) => { await apiRequest("PATCH", `/api/notes/${id}`, { status: "complete" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
  });

  const markIncomplete = useMutation({
    mutationFn: async (id: number) => { await apiRequest("PATCH", `/api/notes/${id}`, { status: "unread" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/notes/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] }),
  });

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    createNote.mutate({ type: noteType, title: noteTitle.trim(), content: noteContent.trim(), priority: notePriority });
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalContent.trim()) return;
    createNote.mutate({ type: "goal", title: goalTitle.trim(), content: goalContent.trim(), priority: goalPriority });
  };

  const goals = notes?.filter(n => n.type === "goal") || [];
  const completedGoals = goals.filter(g => g.status === "complete").length;
  const totalGoals = goals.length;
  const goalProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const nonGoalNotes = notes?.filter(n => n.type !== "goal") || [];
  const filteredNotes = nonGoalNotes.filter(n => noteFilter === "all" || n.type === noteFilter || (noteFilter === "unread" && n.status === "unread"));
  const unreadCount = nonGoalNotes.filter(n => n.status === "unread").length;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" data-testid="agent-board-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pt-14 md:pt-8 z-10">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-3">
              <Inbox size={16} />
              Agent Board
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full" data-testid="text-board-unread">{unreadCount}</span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }} data-testid="text-board-title">
              Agent Board
            </h1>
            <p className="text-muted-foreground font-mono text-sm max-w-2xl">
              Your agents post updates, discoveries, concerns, and ideas here. Set goals and communicate directives back to them.
            </p>
          </header>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Trophy size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" data-testid="text-goals-title">Goals</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    {completedGoals}/{totalGoals} complete ({goalProgress}%)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm transition-colors"
                data-testid="button-add-goal"
              >
                <Plus size={14} />
                Add Goal
              </button>
            </div>

            {totalGoals > 0 && (
              <div className="w-full h-2 bg-card rounded-full border border-border mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${goalProgress}%` }}
                  data-testid="progress-goals"
                />
              </div>
            )}

            <AnimatePresence>
              {showGoalForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleGoalSubmit}
                  className="p-4 rounded-xl bg-card border border-emerald-500/30 mb-4 space-y-3 overflow-hidden"
                  data-testid="form-new-goal"
                >
                  <div className="text-sm font-semibold text-emerald-400 mb-1">Add a New Goal</div>
                  <div className="flex gap-3">
                    {(["normal", "high", "critical"] as NotePriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setGoalPriority(p)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-mono uppercase border transition-all",
                          goalPriority === p ? "text-foreground border-emerald-500 bg-emerald-500/10" : "text-muted-foreground border-transparent"
                        )}
                        data-testid={`button-goal-priority-${p}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <Input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="Goal title" className="font-mono" data-testid="input-goal-title" />
                  <textarea
                    value={goalContent}
                    onChange={e => setGoalContent(e.target.value)}
                    placeholder="Describe this goal..."
                    rows={2}
                    className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
                    data-testid="input-goal-content"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowGoalForm(false)}>Cancel</Button>
                    <Button type="submit" isLoading={createNote.isPending} disabled={!goalTitle.trim() || !goalContent.trim()} className="bg-emerald-600" data-testid="button-submit-goal">
                      Add Goal
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {goals.length > 0 && (
              <div className="space-y-2 mb-6">
                <AnimatePresence>
                  {goals.map(goal => {
                    const isComplete = goal.status === "complete";
                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={cn(
                          "p-3 rounded-xl border transition-all duration-500 flex items-start gap-3",
                          isComplete
                            ? "bg-emerald-500/10 border-emerald-500/40"
                            : "bg-card border-border"
                        )}
                        data-testid={`card-goal-${goal.id}`}
                      >
                        <button
                          onClick={() => isComplete ? markIncomplete.mutate(goal.id) : markComplete.mutate(goal.id)}
                          className={cn(
                            "mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                            isComplete
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-muted-foreground/40"
                          )}
                          data-testid={`button-toggle-goal-${goal.id}`}
                        >
                          {isComplete && <Check size={12} strokeWidth={3} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn("font-semibold text-sm", isComplete ? "text-emerald-400 line-through opacity-80" : "text-foreground")}>
                              {goal.title}
                            </span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider",
                              goal.priority === "critical" ? "bg-red-500/10 text-red-400" :
                              goal.priority === "high" ? "bg-yellow-500/10 text-yellow-400" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {goal.priority}
                            </span>
                          </div>
                          <p className={cn("text-xs font-mono", isComplete ? "text-emerald-400/60" : "text-muted-foreground")}>
                            {goal.content}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNote.mutate(goal.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          data-testid={`button-delete-goal-${goal.id}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 pt-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Inbox size={16} className="text-primary" />
                <h2 className="text-lg font-bold">Agent Communications</h2>
              </div>
              <div className="flex flex-wrap gap-1 ml-4">
                {["all", "unread", "note", "idea", "alert", "reminder"].map(f => (
                  <button
                    key={f}
                    onClick={() => setNoteFilter(f)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all",
                      noteFilter === f ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"
                    )}
                    data-testid={`button-filter-${f}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm transition-colors"
                  data-testid="button-new-note"
                >
                  <Plus size={14} /> Reply to Agents
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showNoteForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleNoteSubmit}
                  className="p-4 rounded-xl bg-card border border-primary/30 mb-4 space-y-3 overflow-hidden"
                  data-testid="form-new-note"
                >
                  <div className="text-sm font-semibold text-primary mb-1">Send Message to Agents</div>
                  <div className="flex gap-2">
                    {(Object.keys(typeConfig) as NoteType[]).filter(t => t !== "goal").map(t => {
                      const cfg = typeConfig[t];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNoteType(t)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono uppercase border transition-all",
                            noteType === t ? `${cfg.color} border-current bg-white/5` : "text-muted-foreground border-transparent"
                          )}
                          data-testid={`button-type-${t}`}
                        >
                          <Icon size={12} /> {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    {(["low", "normal", "high", "critical"] as NotePriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNotePriority(p)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-mono uppercase border transition-all",
                          notePriority === p ? "text-foreground border-primary bg-primary/10" : "text-muted-foreground border-transparent"
                        )}
                        data-testid={`button-priority-${p}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <Input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Subject..." className="font-mono text-sm" data-testid="input-note-title" />
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Your message to the agents..."
                    rows={3}
                    className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                    data-testid="input-note-content"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowNoteForm(false)}>Cancel</Button>
                    <Button type="submit" isLoading={createNote.isPending} disabled={!noteTitle.trim() || !noteContent.trim()} data-testid="button-submit-note">
                      <Send size={14} className="mr-1" /> Send
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border/50" />)}
              </div>
            ) : filteredNotes?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
                <Inbox size={32} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm font-medium text-foreground">No Messages Yet</p>
                <p className="text-muted-foreground font-mono text-xs">Agents will post updates, questions, concerns, and ideas here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredNotes?.map(note => {
                    const cfg = typeConfig[note.type as NoteType] || typeConfig.note;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={cn(
                          "bg-card border border-border p-4 rounded-xl transition-all duration-300 relative overflow-hidden border-l-4",
                          priorityColors[note.priority as NotePriority] || priorityColors.normal,
                          note.status === "unread" && "ring-1 ring-primary/20"
                        )}
                        data-testid={`card-note-${note.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-1.5 rounded-lg bg-white/5 mt-0.5", cfg.color)}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={cn("text-[10px] font-mono uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
                              {note.status === "unread" && (
                                <span className="text-[9px] font-mono uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded">new</span>
                              )}
                              <span className="text-[9px] font-mono text-muted-foreground ml-auto">{new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                            <h3 className="font-semibold text-foreground text-sm mb-0.5">{note.title}</h3>
                            <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{note.content}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {note.status === "unread" && (
                              <button
                                onClick={() => markRead.mutate(note.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                title="Mark as read"
                                data-testid={`button-read-note-${note.id}`}
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNote.mutate(note.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
