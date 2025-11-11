import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getFoodListings, updateFoodListing } from "@/lib/api";
import HeroSection from "@/components/HeroSection";
import FoodListingCard from "@/components/FoodListingCard";
import MapView from "@/components/MapView";
import ImpactDashboard from "@/components/ImpactDashboard";
import SensorMonitorPanel from "@/components/SensorMonitorPanel";
import QualityInspectionResult from "@/components/QualityInspectionResult";
import PostFoodForm from "@/components/PostFoodForm";
import AIAssistantChat from "@/components/AIAssistantChat";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Bell, Menu, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import inspectionImage from '@assets/generated_images/AI_food_quality_inspection_2d05afb7.png';
import foodLoopLogo from '@assets/PHOTO-2025-11-08-14-22-08_1762633632382.jpg';
import { Link } from "wouter";

export default function HomePage() {
  const { toast } = useToast();
  const [showPostForm, setShowPostForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { data: foodListings, isLoading } = useQuery({
    queryKey: ["/api/food-listings"],
    queryFn: getFoodListings,
  });

  const handleClaimFood = async (id: string) => {
    try {
      await updateFoodListing(id, { status: "claimed" });
      toast({
        title: "Food claimed!",
        description: "You've successfully claimed this food item.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-listings"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim food item",
        variant: "destructive",
      });
    }
  };

  const formatPickupTime = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    };
    return `${new Date(start).toLocaleDateString('en-US', options)} - ${new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const mapLocations = [
    { id: "1", name: "Hope Food Bank - Downtown Halifax", type: "food_bank" as const, latitude: 44.6488, longitude: -63.5752 },
    { id: "2", name: "Community Fridge - North End", type: "community_fridge" as const, latitude: 44.6650, longitude: -63.5820 },
    ...(foodListings || []).map(listing => ({
      id: listing.id,
      name: listing.title,
      type: "food_listing" as const,
      latitude: listing.latitude,
      longitude: listing.longitude,
      freshnessScore: listing.freshnessScore,
    })),
  ];

  const mockSensorReadings = [
    { temperature: 38, humidity: 65, lastUpdate: "2 min ago", status: "normal" as const },
  ];

  const mockQualityResult = {
    defects: 0,
    colorChange: "low" as const,
    bruising: "none" as const,
    packaging: "good" as const,
    shelfLifeDays: 5,
    confidence: 96,
  };

  const impactStats = {
    mealsProvided: (foodListings?.length || 0) * 15,
    poundsSaved: (foodListings?.length || 0) * 25,
    co2Prevented: (foodListings?.length || 0) * 10,
    itemsRescued: foodListings?.length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <img src={foodLoopLogo} alt="FoodLoop AI" className="h-10 w-10 rounded-md" />
                <span className="font-bold text-xl">FoodLoop AI</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/map" className="text-sm font-medium hover:text-primary">Find Food</Link>
                <button onClick={() => setShowPostForm(true)} className="text-sm font-medium hover:text-primary">Post Food</button>
                <Link href="/monitor" className="text-sm font-medium hover:text-primary">Monitor</Link>
                <Link href="/impact" className="text-sm font-medium hover:text-primary">Impact</Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search food..."
                    className="pl-9 w-64"
                    data-testid="input-search"
                  />
                </div>
                <Button variant="ghost" size="icon" data-testid="button-notifications">
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive">
                    3
                  </Badge>
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
              
              <ThemeToggle />
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMobileMenu(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <HeroSection
          onPostFood={() => setShowPostForm(true)}
          onFindFood={() => window.location.href = '/map'}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          <section id="food-listings">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Available Food</h2>
                <p className="text-muted-foreground">Fresh surplus food in your area</p>
              </div>
              <Button onClick={() => setShowPostForm(true)} data-testid="button-post-food">
                <span className="material-icons text-sm mr-2">add_circle</span>
                Post Food
              </Button>
            </div>

            <Tabs defaultValue="list" className="mb-6">
              <TabsList>
                <TabsTrigger value="list" data-testid="tab-list-view">
                  <span className="material-icons text-sm mr-2">view_list</span>
                  List View
                </TabsTrigger>
                <TabsTrigger value="map" data-testid="tab-map-view">
                  <span className="material-icons text-sm mr-2">map</span>
                  Map View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : foodListings && foodListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {foodListings.map((listing) => (
                      <FoodListingCard
                        key={listing.id}
                        id={listing.id}
                        title={listing.title}
                        quantity={listing.quantity}
                        imageUrl={listing.imageUrl || undefined}
                        location={listing.location}
                        pickupTime={formatPickupTime(listing.pickupTimeStart, listing.pickupTimeEnd)}
                        freshnessScore={listing.freshnessScore}
                        defects={listing.defectsDetected || []}
                        onClaim={handleClaimFood}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-icons text-6xl text-muted-foreground mb-4">restaurant</span>
                    <p className="text-xl text-muted-foreground mb-4">No food listings yet</p>
                    <Button onClick={() => setShowPostForm(true)}>
                      <span className="material-icons text-sm mr-2">add_circle</span>
                      Post the first listing
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map" className="mt-6">
                <MapView locations={mapLocations} />
              </TabsContent>
            </Tabs>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ImpactDashboard stats={impactStats} />
            </div>
            <div className="space-y-6">
              <SensorMonitorPanel
                readings={mockSensorReadings}
                locationName="Community Fridge #1"
              />
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">AI Quality Inspection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QualityInspectionResult
                result={mockQualityResult}
                imageUrl={inspectionImage}
              />
              <div className="bg-muted/50 rounded-md p-8 flex flex-col items-center justify-center text-center">
                <span className="material-icons text-6xl text-muted-foreground mb-4">photo_camera</span>
                <h3 className="text-xl font-semibold mb-2">Upload for AI Analysis</h3>
                <p className="text-muted-foreground mb-6">
                  Get instant quality assessment with computer vision
                </p>
                <Button onClick={() => setShowPostForm(true)}>
                  <span className="material-icons text-sm mr-2">upload</span>
                  Upload Photo
                </Button>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Top Organizations</h2>
                <p className="text-muted-foreground">
                  Halifax NGOs and food banks rated by our AI-powered supplier scoring system
                </p>
              </div>
              <Link href="/organizations">
                <Button variant="outline" data-testid="button-view-all-orgs">
                  View All Organizations
                  <span className="material-icons text-sm ml-2">arrow_forward</span>
                </Button>
              </Link>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary/10 rounded-full p-4">
                  <span className="material-icons text-5xl text-primary">apartment</span>
                </div>
                <h3 className="text-2xl font-bold">Discover Trusted Food Partners</h3>
                <p className="text-muted-foreground max-w-2xl">
                  Explore Halifax's leading food banks and NGOs. Our AI analyzes supplier ratings based on 
                  Google reviews, food safety certifications, reliability metrics, and donation history to 
                  help you find the most trustworthy organizations.
                </p>
                <div className="flex gap-4 mt-4">
                  <Badge className="bg-primary/10 text-primary text-sm">
                    <span className="material-icons text-xs mr-1">verified</span>
                    6 Verified Organizations
                  </Badge>
                  <Badge className="bg-primary/10 text-primary text-sm">
                    <span className="material-icons text-xs mr-1">stars</span>
                    AI-Powered Ratings
                  </Badge>
                  <Badge className="bg-primary/10 text-primary text-sm">
                    <span className="material-icons text-xs mr-1">security</span>
                    Food Safety Certified
                  </Badge>
                </div>
                <Link href="/organizations">
                  <Button size="lg" className="mt-4" data-testid="button-explore-orgs">
                    <span className="material-icons text-sm mr-2">explore</span>
                    Explore Organizations
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={foodLoopLogo} alt="FoodLoop AI" className="h-10 w-10 rounded-md" />
                <span className="font-bold text-xl">FoodLoop AI</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Reducing food waste through AI-powered redistribution. 
                Connecting surplus food with communities in need.
              </p>
              <div className="flex gap-4">
                <Badge className="bg-primary/10 text-primary">
                  <span className="material-icons text-xs mr-1">verified</span>
                  AI Certified
                </Badge>
                <Badge className="bg-primary/10 text-primary">
                  <span className="material-icons text-xs mr-1">eco</span>
                  Carbon Neutral
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/map" className="hover:text-foreground">Find Food</Link></li>
                <li><button onClick={() => setShowPostForm(true)} className="hover:text-foreground">Post Food</button></li>
                <li><Link href="/monitor" className="hover:text-foreground">Monitor</Link></li>
                <li><Link href="/impact" className="hover:text-foreground">Impact Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-foreground">AI Technology</a></li>
                <li><a href="#" className="hover:text-foreground">Partners</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 FoodLoop AI. Powered by Computer Vision, NLP & IoT.</p>
          </div>
        </div>
      </footer>

      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Post Food</DialogTitle>
          </DialogHeader>
          <PostFoodForm 
            onSuccess={() => {
              setShowPostForm(false);
              queryClient.invalidateQueries({ queryKey: ["/api/food-listings"] });
            }}
          />
        </DialogContent>
      </Dialog>

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-8">
            <Link href="/map" className="text-lg font-medium hover:text-primary">Find Food</Link>
            <button onClick={() => { setShowPostForm(true); setShowMobileMenu(false); }} className="text-lg font-medium hover:text-primary text-left">Post Food</button>
            <Link href="/monitor" className="text-lg font-medium hover:text-primary">Monitor</Link>
            <Link href="/impact" className="text-lg font-medium hover:text-primary">Impact</Link>
          </nav>
        </SheetContent>
      </Sheet>

      {showChat && (
        <div className="fixed bottom-24 right-4 z-50 shadow-xl">
          <AIAssistantChat onClose={() => setShowChat(false)} />
        </div>
      )}

      <Button
        size="lg"
        className="fixed bottom-4 right-4 z-40 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setShowChat(!showChat)}
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
