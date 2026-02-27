import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/ChatPage";
import IncomePage from "@/pages/IncomePage";
import FleetPage from "@/pages/FleetPage";
import AgentsPage from "@/pages/AgentsPage";
import ConferencePage from "@/pages/ConferencePage";
import LearningPage from "@/pages/LearningPage";

import SystemPage from "@/pages/SystemPage";
import LifePage from "@/pages/LifePage";
import CodeBuilderPage from "@/pages/CodeBuilderPage";
import RulesPage from "@/pages/RulesPage";
import SyncPage from "@/pages/SyncPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatPage} />
      <Route path="/c/:id" component={ChatPage} />
      <Route path="/life" component={LifePage} />
      <Route path="/income" component={IncomePage} />
      <Route path="/fleet" component={FleetPage} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/conference" component={ConferencePage} />
      <Route path="/learning" component={LearningPage} />
      <Route path="/rules" component={RulesPage} />
      <Route path="/sync" component={SyncPage} />

      <Route path="/code" component={CodeBuilderPage} />
      <Route path="/shell" component={CodeBuilderPage} />
      <Route path="/system" component={SystemPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
