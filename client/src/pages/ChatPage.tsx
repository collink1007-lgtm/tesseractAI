import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { useParams, useLocation } from "wouter";
import { useCreateConversation } from "@/hooks/use-conversations";
import splashVideoPath from "@assets/_users_d3285a53-5237-4955-9b0c-0510add02ca1_generated_483b77a6_1772144346120.mp4";

const SPLASH_KEY = "tessera_splash_shown";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id ? parseInt(params.id, 10) : null;
  const createConv = useCreateConversation();
  const [, navigate] = useLocation();
  const alreadyShown = useRef(sessionStorage.getItem(SPLASH_KEY) === "1");
  const [showSplash, setShowSplash] = useState(!conversationId && !alreadyShown.current);
  const [splashDone, setSplashDone] = useState(!!conversationId || alreadyShown.current);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (conversationId) {
      setShowSplash(false);
      setSplashDone(true);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId && splashDone && !createdRef.current) {
      createdRef.current = true;
      createConv.mutate({ title: "New Chat" });
    }
  }, [splashDone, conversationId]);

  useEffect(() => {
    if (showSplash && !splashDone) {
      sessionStorage.setItem(SPLASH_KEY, "1");
      timerRef.current = setTimeout(() => {
        setSplashDone(true);
        setShowSplash(false);
      }, 6000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [showSplash, splashDone]);

  if (showSplash && !splashDone) {
    return (
      <div className="fixed inset-0 z-[100] bg-black" data-testid="splash-screen">
        <video
          src={splashVideoPath}
          autoPlay
          muted
          playsInline
          loop
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="splash-video"
        />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full animate-splash-bar" />
          </div>
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Initializing systems</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full bg-background overflow-hidden">
      <Sidebar />
      {conversationId ? (
        <ChatArea conversationId={conversationId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
          <div className="max-w-sm z-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-xs font-mono mt-3">Starting chat...</p>
          </div>
        </div>
      )}
    </div>
  );
}
