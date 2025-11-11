import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import MapPage from "@/pages/MapPage";
import ImpactPage from "@/pages/ImpactPage";
import MonitorPage from "@/pages/MonitorPage";
import OrganizationsPage from "@/pages/OrganizationsPage";
import OrganizationDetailPage from "@/pages/OrganizationDetailPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/map" component={MapPage} />
      <Route path="/monitor" component={MonitorPage} />
      <Route path="/impact" component={ImpactPage} />
      <Route path="/organizations" component={OrganizationsPage} />
      <Route path="/organizations/:id" component={OrganizationDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
