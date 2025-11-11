import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Eye, Brain, Map } from "lucide-react";
import heroImage from '@assets/generated_images/Community_fridge_stocking_scene_1cde58ab.png';

interface HeroSectionProps {
  onPostFood?: () => void;
  onFindFood?: () => void;
}

export default function HeroSection({ onPostFood, onFindFood }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Community working together to reduce food waste"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <Badge className="mb-4 bg-primary/20 backdrop-blur-md border-primary/30">
            <Leaf className="h-3 w-3 mr-1" />
            AI-Powered Food Redistribution
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Reduce Food Waste.<br />
            Feed Communities.
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-foreground/90 max-w-2xl">
            Real-time AI platform connecting surplus food with those who need it. 
            Computer vision quality checks, smart matching, and IoT monitoring ensure safe redistribution.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-primary/90 backdrop-blur-md hover:bg-primary"
              onClick={onPostFood}
              data-testid="button-hero-post-food"
            >
              <span className="material-icons text-sm mr-2">add_circle</span>
              Post Surplus Food
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-background/60 backdrop-blur-md border-foreground/20"
              onClick={onFindFood}
              data-testid="button-hero-find-food"
            >
              <span className="material-icons text-sm mr-2">search</span>
              Find Food Nearby
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Brain, label: "AI Quality Check", description: "Computer Vision" },
              { icon: Eye, label: "Defect Detection", description: "Automated Inspection" },
              { icon: Map, label: "Smart Matching", description: "NLP Powered" },
              { icon: Leaf, label: "IoT Sensors", description: "Real-time Monitoring" },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-4 bg-background/70 backdrop-blur-md border rounded-md"
                >
                  <Icon className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
