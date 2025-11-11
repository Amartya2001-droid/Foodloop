import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Leaf, Users, TrendingDown, Heart, Zap, Globe, ArrowRight, MapPin } from "lucide-react";
import foodLoopLogo from '@assets/PHOTO-2025-11-08-14-22-08_1762633632382.jpg';

export default function ImpactPage() {
  const impactGoals = [
    {
      icon: TrendingDown,
      title: "Reduce Food Waste",
      goal: "1 Million Pounds",
      description: "Prevent surplus food from reaching landfills by connecting donors with recipients",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Users,
      title: "Feed Communities",
      goal: "500,000 Meals",
      description: "Provide nutritious food to families, food banks, and community fridges in need",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Globe,
      title: "Carbon Reduction",
      goal: "50,000 Tons CO₂",
      description: "Lower greenhouse gas emissions by preventing food decomposition in landfills",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10"
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "AI-Powered Quality Check",
      description: "Computer vision analyzes food photos for freshness, defects, and shelf life estimation",
      icon: Zap
    },
    {
      step: "2",
      title: "Smart Matching",
      description: "Intelligent algorithms connect surplus food with nearby recipients based on location and need",
      icon: Heart
    },
    {
      step: "3",
      title: "Real-Time Monitoring",
      description: "IoT sensors track temperature and humidity to ensure food safety during storage and transport",
      icon: Leaf
    },
  ];

  const statistics = [
    { value: "40%", label: "of food goes to waste in the US" },
    { value: "$408B", label: "economic cost of food waste annually" },
    { value: "8-10%", label: "of global greenhouse gas emissions" },
    { value: "35M", label: "Americans face food insecurity" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img src={foodLoopLogo} alt="FoodLoop AI" className="h-8 w-8 rounded-md" />
                <span className="font-bold text-lg">Our Impact</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <Badge className="mx-auto" variant="secondary">
            <Leaf className="h-3 w-3 mr-1" />
            Mission-Driven Technology
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Fighting Food Waste with
            <span className="block text-primary mt-2">AI & Community</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            FoodLoop AI uses cutting-edge technology to transform how we redistribute surplus food,
            connecting those who have with those who need—reducing waste, feeding communities, and
            protecting our planet.
          </p>
        </section>

        {/* Problem Statistics */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">The Problem We're Solving</h2>
            <p className="text-muted-foreground">Food waste is one of the world's most urgent challenges</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statistics.map((stat, index) => (
              <Card key={index} className="hover-elevate" data-testid={`stat-card-${index}`}>
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Impact Goals */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Our Impact Goals</h2>
            <p className="text-muted-foreground">Measurable change through technology and community action</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {impactGoals.map((goal, index) => {
              const Icon = goal.icon;
              return (
                <Card key={index} className="hover-elevate" data-testid={`impact-goal-${index}`}>
                  <CardContent className="p-6 space-y-4">
                    <div className={`${goal.bgColor} rounded-lg p-3 w-fit`}>
                      <Icon className={`h-6 w-6 ${goal.color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{goal.title}</h3>
                      <div className="text-2xl font-bold text-primary mb-2">{goal.goal}</div>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">How FoodLoop AI Works</h2>
            <p className="text-muted-foreground">Technology-powered food redistribution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative" data-testid={`how-it-works-${index}`}>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-y-1/2 z-0" />
                  )}
                  <Card className="relative hover-elevate">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-xl font-bold">
                          {item.step}
                        </div>
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>

        {/* Vision Statement */}
        <section className="relative overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          <div className="relative p-12 md:p-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Our Vision for 2030</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              A world where no edible food goes to waste, every community has access to nutritious meals,
              and technology bridges the gap between surplus and need. FoodLoop AI is building the
              infrastructure to make this vision a reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/map">
                <Button size="lg" data-testid="button-find-food">
                  <MapPin className="h-5 w-5 mr-2" />
                  Find Food Near You
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" data-testid="button-donate-food">
                  <Heart className="h-5 w-5 mr-2" />
                  Donate Surplus Food
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Join Movement */}
        <section className="text-center space-y-6 pb-8">
          <h2 className="text-3xl font-bold">Join the Movement</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every pound of food saved, every meal provided, and every ton of CO₂ prevented brings us
            closer to a sustainable future. Be part of the solution.
          </p>
          <Link href="/">
            <Button size="lg" className="group" data-testid="button-get-started">
              Get Started Today
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
