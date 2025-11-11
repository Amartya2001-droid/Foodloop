import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";

interface MapLocation {
  id: string;
  name: string;
  type: "food_bank" | "community_fridge" | "food_listing";
  latitude: number;
  longitude: number;
  freshnessScore?: number;
}

interface MapViewProps {
  locations: MapLocation[];
  center?: { lat: number; lng: number };
}

export default function MapView({ locations, center }: MapViewProps) {
  const getMarkerColor = (type: string) => {
    switch (type) {
      case "food_bank": return "bg-chart-2";
      case "community_fridge": return "bg-chart-1";
      case "food_listing": return "bg-primary";
      default: return "bg-muted";
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "food_bank": return "warehouse";
      case "community_fridge": return "kitchen";
      case "food_listing": return "restaurant";
      default: return "place";
    }
  };

  return (
    <Card className="overflow-hidden" data-testid="card-map-view">
      <div className="relative aspect-video md:aspect-auto md:h-[500px] bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 to-chart-1/20" />
        
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-background/80 backdrop-blur-md border">
            <Navigation className="h-3 w-3 mr-1" />
            {locations.length} locations nearby
          </Badge>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-8">
            {locations.slice(0, 6).map((location) => (
              <div
                key={location.id}
                className="relative group cursor-pointer"
                data-testid={`map-marker-${location.id}`}
              >
                <div className={`p-3 ${getMarkerColor(location.type)} rounded-full shadow-lg hover-elevate active-elevate-2`}>
                  <span className="material-icons text-white">
                    {getMarkerIcon(location.type)}
                  </span>
                </div>
                
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-background border rounded-md shadow-lg p-2 whitespace-nowrap text-xs">
                    <p className="font-semibold">{location.name}</p>
                    {location.freshnessScore && (
                      <p className="text-muted-foreground">
                        {location.freshnessScore}% fresh
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <div className="bg-background/80 backdrop-blur-md border rounded-md p-2 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span>Food Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-1 rounded-full" />
              <span>Community Fridges</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-2 rounded-full" />
              <span>Food Banks</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
