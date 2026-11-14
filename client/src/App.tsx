import { Switch, Route, Link } from "wouter";
import { Leaf } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AccountBar from "@/components/AccountBar";
import ThemeToggle from "@/components/ThemeToggle";
import HomePage from "@/pages/HomePage";
import ReservationsPage from "@/pages/ReservationsPage";
import ImpactPage from "@/pages/ImpactPage";
import ListingDetailPage from "@/pages/ListingDetailPage";
import OrganizationsPage, {
  OrganizationDetailPage,
} from "@/pages/OrganizationsPage";
import NotFound from "@/pages/not-found";
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <header className="border-b bg-background">
          <div className="max-w-7xl mx-auto p-5 flex items-center justify-between flex-wrap gap-5">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-semibold tracking-tight"
            >
              <Leaf className="text-emerald-700" />
              FoodLoop
            </Link>
            <nav
              aria-label="Main navigation"
              className="flex items-center flex-wrap gap-5 text-sm"
            >
              <Link href="/">Find food</Link>
              <Link href="/monitor">Pickups</Link>
              <Link href="/impact">Impact</Link>
              <Link href="/organizations">Organizations</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <AccountBar />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/map" component={HomePage} />
          <Route path="/monitor" component={ReservationsPage} />
          <Route path="/impact" component={ImpactPage} />
          <Route path="/organizations" component={OrganizationsPage} />
          <Route path="/organizations/:id" component={OrganizationDetailPage} />
          <Route path="/listings/:id" component={ListingDetailPage} />
          <Route component={NotFound} />
        </Switch>
        <footer className="border-t px-5 py-8 text-sm text-muted-foreground">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3 justify-between">
            <p>FoodLoop · Surplus food, shared locally.</p>
            <p>
              Observations are not food-safety certification. Confirm allergens
              and handling with the donor.
            </p>
          </div>
        </footer>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
