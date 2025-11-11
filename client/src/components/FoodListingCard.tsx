import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Thermometer } from "lucide-react";

interface FoodListingCardProps {
  id: string;
  title: string;
  quantity: string;
  imageUrl?: string;
  location: string;
  pickupTime: string;
  freshnessScore: number;
  temperature?: number;
  humidity?: number;
  defects: string[];
  onClaim?: (id: string) => void;
}

export default function FoodListingCard({
  id,
  title,
  quantity,
  imageUrl,
  location,
  pickupTime,
  freshnessScore,
  temperature,
  humidity,
  defects,
  onClaim,
}: FoodListingCardProps) {
  const getFreshnessColor = (score: number) => {
    if (score >= 90) return "text-primary";
    if (score >= 70) return "text-chart-4";
    return "text-destructive";
  };

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-food-${id}`}>
      <div className="relative aspect-video bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons text-muted-foreground text-5xl">restaurant</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={`${getFreshnessColor(freshnessScore)} bg-background/80 backdrop-blur-md border`}>
            <span className="material-icons text-sm mr-1">verified</span>
            {freshnessScore}% Fresh
          </Badge>
        </div>
        {defects.length === 0 && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary/90 backdrop-blur-md">
              <span className="material-icons text-sm mr-1">check_circle</span>
              No Defects
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2" data-testid={`text-title-${id}`}>{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{quantity}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" data-testid={`text-location-${id}`}>{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" data-testid={`text-pickup-${id}`}>{pickupTime}</span>
          </div>
        </div>

        {(temperature !== undefined || humidity !== undefined) && (
          <div className="flex gap-2 mb-4">
            {temperature !== undefined && (
              <Badge variant="secondary" className="text-xs">
                <Thermometer className="h-3 w-3 mr-1" />
                {temperature}°F
              </Badge>
            )}
            {humidity !== undefined && (
              <Badge variant="secondary" className="text-xs">
                <span className="material-icons text-xs mr-1">water_drop</span>
                {humidity}%
              </Badge>
            )}
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={() => onClaim?.(id)}
          data-testid={`button-claim-${id}`}
        >
          <span className="material-icons text-sm mr-2">add_shopping_cart</span>
          Claim Food
        </Button>
      </CardContent>
    </Card>
  );
}
