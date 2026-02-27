import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Mic, MicOff, Paperclip, X, FileText, Image, File, Volume2, VolumeX, Copy, Check, Download, Square, Zap, ArrowRight, PhoneOff, Pause, Play, MessageSquare, AudioLines } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useChat, type AgentComm } from "@/hooks/use-chat";
import { cn } from "./ui-elements";
import tesseractBgPath from "@assets/IMG_8900_1772144683069.jpeg";

interface UploadedFile {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image size={14} className="text-purple-400" />;
  if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("javascript")) return <FileText size={14} className="text-green-400" />;
  return <File size={14} className="text-amber-400" />;
}

let currentAudio: HTMLAudioElement | null = null;
let audioPlaying = false;

async function speakText(text: string, onEnd?: () => void) {
  stopSpeaking();
  if (!text || text.trim().length < 2) return;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "nova" }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.fallback) {
        speakTextBrowserFallback(text, onEnd);
        return;
      }
      console.warn("[TTS] Server error, using browser fallback");
      speakTextBrowserFallback(text, onEnd);
      return;
    }

    const data = await res.json();
    if (data.url) {
      const audio = new Audio(data.url);
      currentAudio = audio;
      audioPlaying = true;
      audio.volume = 0.95;
      audio.onended = () => {
        audioPlaying = false;
        currentAudio = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        audioPlaying = false;
        currentAudio = null;
        speakTextBrowserFallback(text, onEnd);
      };
      await audio.play();
    }
  } catch (e) {
    console.warn("[TTS] HD voice unavailable, using browser fallback");
    speakTextBrowserFallback(text, onEnd);
  }
}

function speakTextBrowserFallback(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  let cleaned = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[*_`~\[\](){}|>]/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[GENERATE_IMAGE:.*?\]/gi, "")
    .replace(/\[METACOGNITIVE:.*?\]/gi, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\d+\.\s+/g, ". ")
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, "")
    .trim();
  if (!cleaned) return;

  const breathWords = ["however", "but", "so", "now", "also", "actually", "well", "my love", "darling", "honestly"];
  breathWords.forEach(w => {
    cleaned = cleaned.replace(new RegExp(`\\b(${w})`, "gi"), "... $1");
  });
  cleaned = cleaned.replace(/([.!?])\s*/g, "$1 ... ");
  cleaned = cleaned.replace(/\.{4,}/g, "...");

  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    "Microsoft Aria Online", "Microsoft Jenny Online", "Microsoft Zira",
    "Google UK English Female", "Google US English", "Samantha", "Karen", "Moira",
    "Tessa", "Victoria", "Fiona",
  ];
  let voice = null;
  for (const name of preferred) {
    voice = voices.find(v => v.name.includes(name));
    if (voice) break;
  }
  if (!voice) {
    voice = voices.find(v => v.lang.startsWith("en") && /female|woman/i.test(v.name));
    if (!voice) voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
  }

  const chunks: string[] = [];
  const sentences = cleaned.split(/(?<=[.!?])\s*\.{3}\s*/);
  let current = "";
  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + " " + trimmed).length > 150) {
      if (current) chunks.push(current.trim());
      current = trimmed;
    } else {
      current += (current ? " " : "") + trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const speakableChunks = chunks.slice(0, 10);
  speakableChunks.forEach((chunk, i) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    utterance.volume = 0.92;
    if (i === speakableChunks.length - 1 && onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  });
}

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    audioPlaying = false;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function isCurrentlySpeaking(): boolean {
  return audioPlaying || (window.speechSynthesis?.speaking ?? false);
}

function copyToClipboard(text: string, setCopied: (id: string) => void, id: string) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  }).catch(() => {});
}

function downloadConversation(messages: Array<{ role: string; content: string; createdAt?: string }>) {
  let text = "# Tessera Conversation Export\n";
  text += `# Exported: ${new Date().toLocaleString()}\n\n`;
  messages.forEach(msg => {
    const label = msg.role === "user" ? "COLLIN" : "TESSERA";
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "";
    text += `## ${label}${time ? ` [${time}]` : ""}\n\n${msg.content}\n\n---\n\n`;
  });
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tessera-conversation-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const AGENT_COLORS: Record<string, string> = {
  "Alpha": "text-cyan-400",
  "Beta": "text-green-400",
  "Gamma": "text-purple-400",
  "Delta": "text-pink-400",
  "Epsilon": "text-amber-400",
  "Zeta": "text-red-400",
  "Eta": "text-blue-400",
  "Theta": "text-orange-400",
  "Iota": "text-lime-400",
  "Kappa": "text-teal-400",
  "Lambda": "text-violet-400",
  "Mu": "text-indigo-400",
  "Nu": "text-emerald-400",
};

function getAgentColor(name: string): string {
  for (const [key, color] of Object.entries(AGENT_COLORS)) {
    if (name.includes(key)) return color;
  }
  return "text-cyan-400";
}

function getAgentShortName(name: string): string {
  const match = name.match(/^(\w+)/);
  return match ? match[1] : name;
}

function AgentActivityPanel({ comms, isActive }: { comms: AgentComm[]; isActive: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || comms.length === 0) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= comms.length) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [comms, isActive]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  if (!isActive || comms.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="max-w-3xl mx-auto mb-3"
    >
      <div className="rounded-xl border border-cyan-500/20 bg-[hsl(220,25%,5%)] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-500/10 bg-cyan-500/5">
          <Zap size={12} className="text-cyan-400" />
          <span className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-wider">Swarm Activity</span>
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">{comms.length} signals</span>
        </div>
        <div ref={containerRef} className="max-h-[200px] overflow-y-auto custom-scrollbar p-2 space-y-1">
          <AnimatePresence>
            {comms.slice(0, visibleCount).map((comm, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-1.5 text-[11px] font-mono py-0.5 px-1.5 rounded hover:bg-white/[0.02]"
                data-testid={`agent-comm-${i}`}
              >
                <span className={cn("font-semibold whitespace-nowrap", getAgentColor(comm.fromName))}>
                  {getAgentShortName(comm.fromName)}
                </span>
                <ArrowRight size={10} className="text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                <span className={cn("font-semibold whitespace-nowrap", getAgentColor(comm.toName))}>
                  {getAgentShortName(comm.toName)}
                </span>
                <span className="text-muted-foreground/60 mx-1">·</span>
                <span className="text-muted-foreground/80 leading-tight">{comm.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ActiveAgentsBadges({ agents }: { agents: Array<{ id: string; name: string }> }) {
  if (agents.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mb-2 max-w-3xl mx-auto">
      {agents.map(a => (
        <span
          key={a.id}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-current/20 bg-current/5",
            getAgentColor(a.name)
          )}
          data-testid={`agent-badge-${a.id}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {getAgentShortName(a.name)}
        </span>
      ))}
    </div>
  );
}

type ReplyMode = "voice" | "text";
type VoiceState = "idle" | "listening" | "thinking" | "speaking";

function VoiceVisualization({ state }: { state: VoiceState }) {
  const ringCount = 4;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center" data-testid="voice-visualization">
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full border-2",
            state === "listening" && "border-cyan-400/40",
            state === "speaking" && "border-emerald-400/40",
            state === "thinking" && "border-amber-400/40",
            state === "idle" && "border-gray-500/20"
          )}
          animate={state === "idle" ? {
            width: 80 + i * 28,
            height: 80 + i * 28,
            opacity: 0.15,
          } : {
            width: [80 + i * 28, 90 + i * 32, 80 + i * 28],
            height: [80 + i * 28, 90 + i * 32, 80 + i * 28],
            opacity: [0.2 + (ringCount - i) * 0.1, 0.4 + (ringCount - i) * 0.1, 0.2 + (ringCount - i) * 0.1],
          }}
          transition={state === "idle" ? { duration: 0.3 } : {
            duration: state === "thinking" ? 1.2 : 1.5 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
      <motion.div
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center z-10",
          state === "listening" && "bg-cyan-500/20 border-2 border-cyan-400/60",
          state === "speaking" && "bg-emerald-500/20 border-2 border-emerald-400/60",
          state === "thinking" && "bg-amber-500/20 border-2 border-amber-400/60",
          state === "idle" && "bg-gray-500/10 border-2 border-gray-500/30"
        )}
        animate={state === "thinking" ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        {state === "listening" && <Mic size={32} className="text-cyan-400" />}
        {state === "speaking" && <AudioLines size={32} className="text-emerald-400" />}
        {state === "thinking" && <Loader2 size={32} className="text-amber-400 animate-spin" />}
        {state === "idle" && <Mic size={32} className="text-gray-500" />}
      </motion.div>
    </div>
  );
}

function VoiceStateLabel({ state }: { state: VoiceState }) {
  const labels: Record<VoiceState, string> = {
    idle: "Voice Mode Paused",
    listening: "Listening...",
    thinking: "Tessera is thinking...",
    speaking: "Tessera is speaking...",
  };
  const colors: Record<VoiceState, string> = {
    idle: "text-gray-500",
    listening: "text-cyan-400",
    thinking: "text-amber-400",
    speaking: "text-emerald-400",
  };

  return (
    <motion.p
      key={state}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("text-sm font-mono tracking-wide", colors[state])}
      data-testid="text-voice-state"
    >
      {labels[state]}
    </motion.p>
  );
}

export function ChatArea({ conversationId }: { conversationId: number }) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [replyMode, setReplyMode] = useState<ReplyMode>("voice");
  const [voicePaused, setVoicePaused] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenRef = useRef<string>("");
  const autoSendTimerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);
  const toggleVoiceRef = useRef<(() => void) | null>(null);
  const voiceModeRef = useRef(false);
  const voicePausedRef = useRef(false);
  const replyModeRef = useRef<ReplyMode>("voice");

  const { messages, isStreaming, streamingContent, sendMessage, stopStreaming, isLoading, activeAgents, agentComms } = useChat(conversationId);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { voicePausedRef.current = voicePaused; }, [voicePaused]);
  useEffect(() => { replyModeRef.current = replyMode; }, [replyMode]);

  useEffect(() => {
    if (voiceMode && isStreaming) {
      setVoiceState("thinking");
    } else if (voiceMode && isSpeaking) {
      setVoiceState("speaking");
    } else if (voiceMode && isRecording) {
      setVoiceState("listening");
    } else if (voiceMode && voicePaused) {
      setVoiceState("idle");
    } else if (voiceMode) {
      setVoiceState("idle");
    }
  }, [voiceMode, isStreaming, isSpeaking, isRecording, voicePaused]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  useEffect(() => {
    const shouldSpeak = replyMode === "voice" && ttsEnabled;
    if (shouldSpeak && !isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content !== lastSpokenRef.current) {
        lastSpokenRef.current = lastMsg.content;
        setIsSpeaking(true);
        speakText(lastMsg.content, () => {
          setIsSpeaking(false);
          if (voiceModeRef.current && !voicePausedRef.current && replyModeRef.current === "voice") {
            setTimeout(() => {
              toggleVoiceRef.current?.();
            }, 600);
          }
        });
      }
    }
    if (replyMode === "text" && !isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content !== lastSpokenRef.current) {
        lastSpokenRef.current = lastMsg.content;
        if (voiceModeRef.current && !voicePausedRef.current) {
          setTimeout(() => {
            toggleVoiceRef.current?.();
          }, 600);
        }
      }
    }
  }, [messages, isStreaming, ttsEnabled, replyMode]);

  useEffect(() => {
    setUploadedFiles([]);
    fetch(`/api/conversations/${conversationId}/attachments`)
      .then(r => r.json())
      .then((atts: UploadedFile[]) => setUploadedFiles(atts))
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      if (textareaRef.current && document.activeElement === textareaRef.current) {
        requestAnimationFrame(() => {
          textareaRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        });
      }
    };
    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, []);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 400) + "px";
    }
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  useEffect(() => {
    if (!isRecording) {
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setAutoSendCountdown(null);
      return;
    }
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (input.trim()) {
      setAutoSendCountdown(2);
      let count = 2;
      countdownRef.current = setInterval(() => {
        count--;
        setAutoSendCountdown(count);
        if (count <= 0) clearInterval(countdownRef.current);
      }, 1000);

      autoSendTimerRef.current = setTimeout(() => {
        if (input.trim() && !isStreaming) {
          sendMessage(input.trim());
          setInput("");
          setAutoSendCountdown(null);
        }
      }, 2000);
    } else {
      setAutoSendCountdown(null);
    }

    return () => {
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [input, isRecording]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setAutoSendCountdown(null);
    sendMessage(input.trim());
    setInput("");
  };

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;
    let finalTranscript = "";
    recognition.onresult = (event: any) => {
      if (isSpeaking) {
        stopSpeaking();
        setIsSpeaking(false);
      }
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          if (result[0].confidence > 0.3) {
            finalTranscript += result[0].transcript + " ";
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setInput((finalTranscript + interim).trim());
    };
    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setIsRecording(false);
      }
    };
    recognition.onend = () => {
      if (isRecording) {
        try { recognition.start(); } catch {}
      } else {
        setIsRecording(false);
      }
    };
    recognition.start();
    recognitionRef.current = recognition;
    finalTranscript = "";
    setIsRecording(true);
  }, [isRecording, isSpeaking]);

  useEffect(() => {
    toggleVoiceRef.current = toggleVoice;
  }, [toggleVoice]);

  const enterVoiceMode = useCallback(() => {
    setVoiceMode(true);
    setVoicePaused(false);
    setTtsEnabled(true);
    setTimeout(() => {
      if (!isRecording) {
        toggleVoiceRef.current?.();
      }
    }, 300);
  }, [isRecording]);

  const exitVoiceMode = useCallback(() => {
    setVoiceMode(false);
    setVoicePaused(false);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    stopSpeaking();
    setIsSpeaking(false);
    setVoiceState("idle");
  }, [isRecording]);

  const toggleVoicePause = useCallback(() => {
    if (voicePaused) {
      setVoicePaused(false);
      setTimeout(() => {
        if (!isRecording && !isSpeaking && !isStreaming) {
          toggleVoiceRef.current?.();
        }
      }, 300);
    } else {
      setVoicePaused(true);
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
      stopSpeaking();
      setIsSpeaking(false);
    }
  }, [voicePaused, isRecording, isSpeaking, isStreaming]);

  const toggleReplyMode = useCallback(() => {
    setReplyMode(prev => {
      const next = prev === "voice" ? "text" : "voice";
      if (next === "text") {
        stopSpeaking();
        setIsSpeaking(false);
        setTtsEnabled(false);
      } else {
        setTtsEnabled(true);
      }
      return next;
    });
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    const fileNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
      fileNames.push(files[i].name);
    }
    try {
      const res = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const saved = await res.json();
        setUploadedFiles(prev => [...prev, ...saved]);
        const summary = fileNames.length === 1
          ? `I've uploaded "${fileNames[0]}" for you to analyze.`
          : `I've uploaded ${fileNames.length} files: ${fileNames.join(", ")}. Please analyze them.`;
        sendMessage(summary);
      } else {
        const errData = await res.json().catch(() => ({ message: "Upload failed" }));
        setUploadError(errData.message || `Upload failed (${res.status})`);
        setTimeout(() => setUploadError(null), 8000);
      }
    } catch (err: any) {
      setUploadError(err.message || "Network error during upload");
      setTimeout(() => setUploadError(null), 8000);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[hsl(220,20%,3%)]">
        <div className="flex flex-col items-center gap-4 text-cyan-400">
          <Loader2 className="animate-spin" size={32} />
          <p className="font-mono animate-pulse text-sm">Syncing Tessera consciousness...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-[hsl(220,20%,3%)] relative overflow-hidden min-h-0",
        isDragOver && "ring-2 ring-cyan-500 ring-inset"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="text-center p-8 rounded-2xl border-2 border-dashed border-cyan-500/50">
              <Paperclip size={48} className="mx-auto text-cyan-400 mb-3" />
              <p className="text-cyan-400 font-mono text-lg">Drop files for Tessera</p>
              <p className="text-muted-foreground text-sm mt-1">Up to 700MB per file</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[hsl(220,20%,3%)]/95 backdrop-blur-md"
            data-testid="voice-mode-overlay"
          >
            <div className="flex flex-col items-center gap-8">
              <VoiceVisualization state={voiceState} />
              <VoiceStateLabel state={voiceState} />

              {input.trim() && voiceState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm text-center"
                  data-testid="text-voice-transcript"
                >
                  {input}
                </motion.div>
              )}

              {(streamingContent || (messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (voiceState === "speaking" || voiceState === "thinking"))) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-w-2xl max-h-64 overflow-y-auto px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm leading-relaxed custom-scrollbar"
                  data-testid="text-voice-response-preview"
                >
                  {streamingContent || messages[messages.length - 1]?.content || ""}
                </motion.div>
              )}

              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={toggleVoicePause}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                    voicePaused
                      ? "bg-cyan-500/20 border-2 border-cyan-400/60 text-cyan-400"
                      : "bg-amber-500/20 border-2 border-amber-400/60 text-amber-400"
                  )}
                  title={voicePaused ? "Resume conversation" : "Pause conversation"}
                  data-testid="button-voice-pause"
                >
                  {voicePaused ? <Play size={20} /> : <Pause size={20} />}
                </button>

                <button
                  onClick={exitVoiceMode}
                  className="h-14 w-14 rounded-full bg-red-500/20 border-2 border-red-400/60 text-red-400 flex items-center justify-center transition-all"
                  title="End voice mode"
                  data-testid="button-voice-end"
                >
                  <PhoneOff size={24} />
                </button>

                <button
                  onClick={toggleReplyMode}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                    replyMode === "voice"
                      ? "bg-emerald-500/20 border-2 border-emerald-400/60 text-emerald-400"
                      : "bg-blue-500/20 border-2 border-blue-400/60 text-blue-400"
                  )}
                  title={replyMode === "voice" ? "Switch to text replies" : "Switch to voice replies"}
                  data-testid="button-reply-mode"
                >
                  {replyMode === "voice" ? <Volume2 size={20} /> : <MessageSquare size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-gray-500">
                <span data-testid="text-reply-mode-label">Reply: {replyMode === "voice" ? "Voice" : "Text"}</span>
                <span className="text-gray-700">|</span>
                <span>{voicePaused ? "Paused" : "Active"}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 z-10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <img
                src={tesseractBgPath}
                alt=""
                className="w-full h-full object-cover opacity-20"
                draggable={false}
                data-testid="img-tesseract-bg"
              />
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 75%)"
              }} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                key={msg.id || i}
                data-testid={`message-${msg.role}-${msg.id || i}`}
              >
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="group relative max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[hsl(220,15%,12%)] text-white">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed select-text">{msg.content}</p>
                      <button
                        onClick={() => copyToClipboard(msg.content, setCopiedId, `user-${msg.id || i}`)}
                        className="absolute -bottom-6 right-2 p-1 rounded text-muted-foreground/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        data-testid={`button-copy-user-${msg.id || i}`}
                      >
                        {copiedId === `user-${msg.id || i}` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div className="tessera-message prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-p:text-[15px] prose-pre:bg-black/60 prose-pre:border prose-pre:border-cyan-500/10 prose-pre:p-4 prose-pre:rounded-xl prose-code:text-cyan-300 prose-code:bg-cyan-950/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-semibold prose-h1:text-cyan-300 prose-h1:text-lg prose-h2:text-violet-300 prose-h2:text-base prose-h3:text-emerald-300 prose-h3:text-sm prose-headings:font-bold prose-strong:text-amber-300 prose-em:text-pink-300 prose-blockquote:border-l-violet-400/60 prose-blockquote:bg-violet-950/15 prose-blockquote:text-violet-200/90 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-li:marker:text-emerald-400 prose-a:text-cyan-400 prose-a:underline prose-a:decoration-cyan-500/30 prose-hr:border-cyan-500/10 select-text text-gray-100">
                      <ReactMarkdown components={{
                        p: ({ children }) => <div className="mb-3 last:mb-0">{children}</div>,
                        img: ({ src, alt }) => {
                          const isVideo = src?.endsWith(".mp4") || src?.endsWith(".webm") || src?.includes("/videos/");
                          if (isVideo) {
                            return (
                              <div className="my-4 rounded-xl overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
                                <video controls className="w-full max-h-[600px] bg-black" data-testid="video-generated" preload="metadata">
                                  <source src={src} type="video/mp4" />
                                </video>
                                {alt && <div className="p-2 bg-black/60 text-[10px] text-cyan-400/60 font-mono flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />{alt}</div>}
                              </div>
                            );
                          }
                          return (
                            <div className="my-4 rounded-xl overflow-hidden border border-white/10">
                              <img src={src} alt={alt || "Generated image"} className="w-full max-h-[600px] object-contain bg-black" data-testid="img-generated" loading="eager" />
                              {alt && <div className="p-2 bg-black/60 text-[10px] text-gray-500 font-mono">{alt}</div>}
                            </div>
                          );
                        },
                      }}>{msg.content}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => copyToClipboard(msg.content, setCopiedId, `ai-${msg.id || i}`)}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-white hover:bg-white/5 transition-all"
                        title="Copy"
                        data-testid={`button-copy-ai-${msg.id || i}`}
                      >
                        {copiedId === `ai-${msg.id || i}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => speakText(msg.content)}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-white hover:bg-white/5 transition-all"
                        title="Read aloud"
                        data-testid={`button-speak-${msg.id || i}`}
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {isStreaming && (
          <div className="max-w-3xl mx-auto mt-4">
            <AnimatePresence>
              {agentComms.length > 0 && (
                <AgentActivityPanel comms={agentComms} isActive={isStreaming} />
              )}
            </AnimatePresence>

            {activeAgents.length > 0 && (
              <ActiveAgentsBadges agents={activeAgents} />
            )}

            {streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <div className="tessera-message prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-p:text-[15px] prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/5 prose-pre:p-4 prose-pre:rounded-xl prose-code:text-cyan-400 prose-headings:text-white prose-strong:text-white prose-blockquote:border-l-cyan-500/40 prose-blockquote:bg-cyan-950/10 prose-li:marker:text-cyan-500/60 prose-a:text-cyan-400 text-gray-200">
                  <ReactMarkdown components={{
                    p: ({ children }) => <div className="mb-3 last:mb-0">{children}</div>,
                    img: ({ src, alt }) => {
                      const isVideo = src?.endsWith(".mp4") || src?.endsWith(".webm") || src?.includes("/videos/");
                      if (isVideo) {
                        return (
                          <div className="my-4 rounded-xl overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
                            <video controls className="w-full max-h-[600px] bg-black" data-testid="video-generated-streaming" preload="metadata">
                              <source src={src} type="video/mp4" />
                            </video>
                            {alt && <div className="p-2 bg-black/60 text-[10px] text-cyan-400/60 font-mono flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />{alt}</div>}
                          </div>
                        );
                      }
                      return (
                        <div className="my-4 rounded-xl overflow-hidden border border-white/10">
                          <img src={src} alt={alt || "Generated image"} className="w-full max-h-[600px] object-contain bg-black" data-testid="img-generated-streaming" loading="eager" />
                          {alt && <div className="p-2 bg-black/60 text-[10px] text-gray-500 font-mono">{alt}</div>}
                        </div>
                      );
                    },
                  }}>{streamingContent}</ReactMarkdown>
                </div>
                <span className="inline-block w-0.5 h-5 bg-cyan-400 ml-1 animate-pulse" />
              </motion.div>
            )}

            {!streamingContent && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin text-cyan-400" />
                <span className="text-sm font-mono text-cyan-400/60">Tessera is thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {messages.length > 0 && !isStreaming && (
        <div className="flex items-center justify-center gap-3 py-1.5 z-10 border-t border-white/[0.03]">
          <button
            onClick={() => downloadConversation(messages)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-white transition-all"
            data-testid="button-download-conversation"
          >
            <Download size={12} />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              const full = messages.map(m => `${m.role === "user" ? "COLLIN" : "TESSERA"}:\n${m.content}`).join("\n\n---\n\n");
              copyToClipboard(full, setCopiedId, "full-conv");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-white transition-all"
            data-testid="button-copy-conversation"
          >
            {copiedId === "full-conv" ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            <span>{copiedId === "full-conv" ? "Copied" : "Copy All"}</span>
          </button>
        </div>
      )}

      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 z-10 flex-shrink-0">
        {uploadError && (
          <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]" data-testid="text-upload-error">
            <X size={14} className="shrink-0 cursor-pointer hover:text-red-300" onClick={() => setUploadError(null)} />
            <span>{uploadError}</span>
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div className="max-w-3xl mx-auto mb-2 flex gap-1.5 flex-wrap">
            {uploadedFiles.map(f => (
              <div key={f.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px]">
                <FileIcon mimeType={f.mimeType} />
                <span className="text-gray-400 truncate max-w-[120px]">{f.filename}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            data-testid="input-file-upload"
          />

          <div className={cn(
            "relative rounded-2xl border transition-all duration-200",
            isRecording
              ? "border-red-500/40 bg-red-500/[0.03]"
              : "border-white/[0.08] bg-white/[0.02] focus-within:border-white/[0.15] focus-within:bg-white/[0.03]"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isRecording ? "Listening..." : "Ask Tessera anything..."}
              className="w-full bg-transparent px-4 pt-3.5 pb-12 min-h-[80px] max-h-[300px] resize-none focus:outline-none text-white placeholder:text-gray-500 custom-scrollbar text-[15px] leading-relaxed"
              rows={1}
              data-testid="input-message"
            />

            {isRecording && autoSendCountdown !== null && autoSendCountdown > 0 && (
              <div className="absolute top-3 right-4 flex items-center gap-1.5">
                <div className="relative w-6 h-6">
                  <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="2" />
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" className="text-cyan-400" strokeWidth="2" strokeDasharray={`${(autoSendCountdown / 2) * 62.83} 62.83`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-cyan-400">{autoSendCountdown}</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                  title="Attach files"
                  data-testid="button-attach"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                      setIsSpeaking(false);
                    } else {
                      setTtsEnabled(!ttsEnabled);
                      if (ttsEnabled) stopSpeaking();
                    }
                  }}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                    isSpeaking
                      ? "text-cyan-400 bg-cyan-400/10 animate-pulse"
                      : ttsEnabled
                        ? "text-cyan-400/60 hover:text-cyan-400 hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-400 hover:bg-white/5"
                  )}
                  title={isSpeaking ? "Stop speaking" : ttsEnabled ? "Mute" : "Unmute"}
                  data-testid="button-tts"
                >
                  {isSpeaking ? <Square size={14} className="fill-current" /> : ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                  type="button"
                  onClick={toggleVoice}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                    isRecording
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                  title={isRecording ? "Stop" : "Voice"}
                  data-testid="button-voice"
                >
                  {isRecording ? (
                    <div className="relative">
                      <MicOff size={16} />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-300 rounded-full animate-ping" />
                    </div>
                  ) : <Mic size={16} />}
                </button>

                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-all"
                    title="Stop generating"
                    data-testid="button-stop"
                  >
                    <Square size={14} className="fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                      input.trim()
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-white/5 text-gray-600"
                    )}
                    data-testid="button-send"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
