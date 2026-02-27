import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Message } from "@shared/schema";

export interface AgentInfo {
  id: string;
  name: string;
}

export interface AgentComm {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  message: string;
  timestamp: number;
}

export function useChat(conversationId: number | null) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<AgentInfo[]>([]);
  const [agentComms, setAgentComms] = useState<AgentComm[]>([]);
  const lastAccumulatedRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const queryKey = conversationId 
    ? [buildUrl(api.messages.list.path, { conversationId })] 
    : [];

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!conversationId) return [];
      const url = buildUrl(api.messages.list.path, { conversationId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return (await res.json()) as Message[];
    },
    enabled: !!conversationId,
  });

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (readerRef.current) {
      try { readerRef.current.cancel(); } catch (_e) {}
      readerRef.current = null;
    }
    const accumulated = lastAccumulatedRef.current;
    if (accumulated && conversationId) {
      const optimisticAssistantMsg: Message = {
        id: Date.now() + 1,
        conversationId,
        role: "assistant",
        content: accumulated + "\n\n*[Response stopped by user]*",
        createdAt: new Date(),
      };
      queryClient.setQueryData(queryKey, (old: Message[] = []) => {
        const filtered = old.filter(m => !(m.role === "assistant" && m.id > Date.now() - 60000));
        return [...filtered, optimisticAssistantMsg];
      });
      fetch(`/api/conversations/${conversationId}/save-partial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: accumulated + "\n\n*[Response stopped by user]*" }),
        credentials: "include",
      }).catch(() => {});
    }
    setIsStreaming(false);
    setStreamingContent("");
  }, [conversationId, queryClient, queryKey]);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || isStreaming) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setStreamingContent("");
    setError(null);
    setActiveAgents([]);
    setAgentComms([]);
    lastAccumulatedRef.current = "";

    const optimisticUserMsg: Message = {
      id: Date.now(),
      conversationId,
      role: "user",
      content,
      createdAt: new Date(),
    };
    
    queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, optimisticUserMsg]);

    try {
      const url = buildUrl(api.messages.create.path, { conversationId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to send message");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let accumulated = "";
      let sseBuffer = "";
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;

        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.agents) {
              setActiveAgents(data.agents);
            }
            if (data.comms) {
              setAgentComms(data.comms);
            }
            if (data.status === "browsing" && data.urls) {
              const browseNotice = `*Browsing ${data.urls.length} URL(s): ${data.urls.join(", ")}...*\n\n`;
              accumulated += browseNotice;
              setStreamingContent(accumulated);
            }
            if (data.done) {
              receivedDone = true;
              if (data.finalContent) {
                accumulated = data.finalContent;
                setStreamingContent(data.finalContent);
              }
              const finalText = accumulated;
              if (finalText) {
                lastAccumulatedRef.current = finalText;
                const optimisticAssistantMsg: Message = {
                  id: Date.now() + 1,
                  conversationId: conversationId!,
                  role: "assistant",
                  content: finalText,
                  createdAt: new Date(),
                };
                queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, optimisticAssistantMsg]);
              }
              break;
            }
            if (data.imageGenerated && data.replaceTag) {
              accumulated = accumulated.replace(data.replaceTag, `\n\n![Generated Image](${data.imageGenerated})\n\n`);
              setStreamingContent(accumulated);
            }
            if (data.content) {
              accumulated += data.content;
              setStreamingContent(accumulated);
              lastAccumulatedRef.current = accumulated;
            }
          } catch (_e) {
          }
        }
        if (receivedDone) break;
      }

      if (sseBuffer.trim()) {
        const remaining = sseBuffer.trim();
        if (remaining.startsWith("data: ")) {
          const dataStr = remaining.slice(6).trim();
          try {
            const data = JSON.parse(dataStr);
            if (data.content) {
              accumulated += data.content;
              lastAccumulatedRef.current = accumulated;
            }
            if (data.finalContent) {
              accumulated = data.finalContent;
              lastAccumulatedRef.current = accumulated;
            }
          } catch (_e) {}
        }
      }

      if (!receivedDone && accumulated) {
        lastAccumulatedRef.current = accumulated;
        const optimisticAssistantMsg: Message = {
          id: Date.now() + 1,
          conversationId: conversationId!,
          role: "assistant",
          content: accumulated,
          createdAt: new Date(),
        };
        queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, optimisticAssistantMsg]);
      }

      readerRef.current = null;
      abortControllerRef.current = null;
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      if (lastAccumulatedRef.current) {
        const optimisticAssistantMsg: Message = {
          id: Date.now() + 1,
          conversationId: conversationId!,
          role: "assistant",
          content: lastAccumulatedRef.current,
          createdAt: new Date(),
        };
        queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, optimisticAssistantMsg]);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey });
    } finally {
      readerRef.current = null;
      abortControllerRef.current = null;
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [conversationId, isStreaming, queryClient, queryKey]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
    error,
    activeAgents,
    agentComms,
  };
}
