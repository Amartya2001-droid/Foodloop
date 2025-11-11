import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFoodListings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Search, Navigation, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { FoodListing } from "@shared/schema";
import foodLoopLogo from '@assets/PHOTO-2025-11-08-14-22-08_1762633632382.jpg';

export default function MapPage() {
  const { toast } = useToast();
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState({ lat: 44.6488, lng: -63.5752 }); // Default to Halifax
  const [mapRadius, setMapRadius] = useState(150);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { data: foodListings, isLoading } = useQuery({
    queryKey: ["/api/food-listings"],
    queryFn: getFoodListings,
  });

  const filteredListings = foodListings?.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate responsive marker radius based on container size
  useEffect(() => {
    const updateRadius = () => {
      if (mapContainerRef.current) {
        const containerWidth = mapContainerRef.current.offsetWidth;
        const containerHeight = mapContainerRef.current.offsetHeight;
        // Use 30% of the smaller dimension, clamped between 80px and 250px
        const newRadius = Math.max(80, Math.min(250, Math.min(containerWidth, containerHeight) * 0.3));
        setMapRadius(newRadius);
      }
    };

    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Getting your location...",
        description: "Please allow location access",
      });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast({
            title: "Location updated!",
            description: "Map centered on your current location",
          });
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "Using default location (Halifax)",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getFreshnessColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img src={foodLoopLogo} alt="FoodLoop AI" className="h-8 w-8 rounded-md" />
                <span className="font-bold text-lg">Find Food Nearby</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMyLocation}
                data-testid="button-my-location"
              >
                <Navigation className="h-4 w-4 mr-2" />
                My Location
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Map View */}
        <div className="flex-1 relative bg-muted/20">
          {/* Search Bar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search location or food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background shadow-lg"
                data-testid="input-map-search"
              />
            </div>
          </div>

          {/* Interactive Map Display */}
          <div ref={mapContainerRef} className="h-full w-full relative overflow-hidden">
            {/* Map Background Grid */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/10">
              <svg className="w-full h-full opacity-30">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Map Markers */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-4xl h-full max-h-[600px] p-8">
                  {/* User Location Marker */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-blue-500/20 rounded-full animate-ping"></div>
                    </div>
                  </div>

                  {/* Food Listing Markers */}
                  {filteredListings?.map((listing, index) => {
                    const angle = (index * 360) / (filteredListings.length || 1);
                    const x = Math.cos((angle * Math.PI) / 180) * mapRadius;
                    const y = Math.sin((angle * Math.PI) / 180) * mapRadius;

                    return (
                      <button
                        key={listing.id}
                        onClick={() => setSelectedListing(listing)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover-elevate active-elevate-2"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                        }}
                        data-testid={`marker-${listing.id}`}
                      >
                        <div className={`relative ${selectedListing?.id === listing.id ? 'scale-125' : ''}`}>
                          <div className={`h-6 w-6 ${getFreshnessColor(listing.freshnessScore)} rounded-full border-3 border-white shadow-lg flex items-center justify-center`}>
                            <MapPin className="h-4 w-4 text-white fill-current" />
                          </div>
                          {selectedListing?.id === listing.id && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10">
            <Card className="shadow-lg">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Excellent (90+)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs">Good (70-89)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs">Fair (&lt;70)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">You</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar with Listing Details */}
        <div className="w-full md:w-96 bg-background border-l overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">
                {filteredListings?.length || 0} Available
              </h2>
              <p className="text-sm text-muted-foreground">
                Food listings near you
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredListings && filteredListings.length > 0 ? (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      selectedListing?.id === listing.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedListing(listing)}
                    data-testid={`card-listing-${listing.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {listing.imageUrl && (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="w-16 h-16 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{listing.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {listing.quantity}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `hsl(${listing.freshnessScore}, 70%, 50%)`,
                                color: 'white'
                              }}
                            >
                              {listing.freshnessScore}% Fresh
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{listing.location}</span>
                            <span className="mx-1">•</span>
                            <span>
                              {calculateDistance(
                                userLocation.lat,
                                userLocation.lng,
                                listing.latitude,
                                listing.longitude
                              )} mi
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No food listings nearby</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
