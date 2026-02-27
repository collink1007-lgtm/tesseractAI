import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
import { Button, cn } from "@/components/ui-elements";
import { Plus, Trash2, Shield, ShieldCheck, ShieldAlert, Scale, BookOpen, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Rule {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  active: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: "general", label: "General", icon: BookOpen },
  { value: "behavior", label: "Behavior", icon: ShieldCheck },
  { value: "security", label: "Security", icon: Shield },
  { value: "ethics", label: "Ethics", icon: Scale },
  { value: "protocol", label: "Protocol", icon: ShieldAlert },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function RulesPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");

  const { data: rules, isLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });

  const createRule = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; priority: string }) => {
      return apiRequest("POST", "/api/rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setTitle("");
      setContent("");
      setCategory("general");
      setPriority("normal");
      setShowForm(false);
      toast({ title: "Rule created", description: "New rule has been added successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Rule deleted", description: "Rule has been removed." });
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: number }) => {
      return apiRequest("PATCH", `/api/rules/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createRule.mutate({ title: title.trim(), content: content.trim(), category, priority });
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "high": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "normal": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "low": return "text-muted-foreground bg-muted/30 border-border/50";
      default: return "text-muted-foreground bg-muted/30 border-border/50";
    }
  };

  const categoryIcon = (c: string) => {
    const cat = CATEGORIES.find(cat => cat.value === c);
    if (!cat) return BookOpen;
    return cat.icon;
  };

  return (
    <div className="flex h-dvh bg-background" data-testid="rules-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Scale size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground" data-testid="text-page-title">Rules</h1>
              <p className="text-xs text-muted-foreground font-mono">Agent directives & protocols</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
            data-testid="button-toggle-form"
          >
            <Plus size={16} />
            New Rule
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-3" data-testid="form-new-rule">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Rule title..."
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="input-rule-title"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Describe the rule agents must follow..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  data-testid="input-rule-content"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    data-testid="select-rule-category"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    data-testid="select-rule-priority"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-muted text-muted-foreground"
                  data-testid="button-cancel-rule"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createRule.isPending}
                  data-testid="button-submit-rule"
                >
                  Create Rule
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse font-mono" data-testid="text-loading">
              Loading rules...
            </div>
          ) : !rules || rules.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-rules">
              <AlertTriangle size={40} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No rules created yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Create rules that all agents must follow.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => {
                const Icon = categoryIcon(rule.category);
                return (
                  <div
                    key={rule.id}
                    className={cn(
                      "bg-card border border-border rounded-lg p-4 transition-all",
                      rule.active === 0 && "opacity-50"
                    )}
                    data-testid={`card-rule-${rule.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-md mt-0.5">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm text-foreground" data-testid={`text-rule-title-${rule.id}`}>
                            {rule.title}
                          </h3>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase", priorityColor(rule.priority))} data-testid={`text-rule-priority-${rule.id}`}>
                            {rule.priority}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 border border-border/50 text-muted-foreground font-mono uppercase" data-testid={`text-rule-category-${rule.id}`}>
                            {rule.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-rule-content-${rule.id}`}>
                          {rule.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
                          Created {new Date(rule.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleRule.mutate({ id: rule.id, active: rule.active === 1 ? 0 : 1 })}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            rule.active === 1
                              ? "text-green-400 hover:bg-green-500/10"
                              : "text-muted-foreground hover:bg-muted/30"
                          )}
                          title={rule.active === 1 ? "Disable rule" : "Enable rule"}
                          data-testid={`button-toggle-rule-${rule.id}`}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => deleteRule.mutate(rule.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Delete rule"
                          data-testid={`button-delete-rule-${rule.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
