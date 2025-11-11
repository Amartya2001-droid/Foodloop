import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Leaf, Package } from "lucide-react";

interface ImpactStats {
  mealsProvided: number;
  poundsSaved: number;
  co2Prevented: number;
  itemsRescued: number;
}

interface ImpactDashboardProps {
  stats: ImpactStats;
}

export default function ImpactDashboard({ stats }: ImpactDashboardProps) {
  const impactMetrics = [
    {
      icon: Users,
      label: "Meals Provided",
      value: stats.mealsProvided.toLocaleString(),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Package,
      label: "Pounds Saved",
      value: stats.poundsSaved.toLocaleString(),
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: Leaf,
      label: "CO₂ Prevented",
      value: `${stats.co2Prevented.toLocaleString()} lbs`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Items Rescued",
      value: stats.itemsRescued.toLocaleString(),
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <Card data-testid="card-impact-dashboard">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Community Impact</CardTitle>
        <p className="text-sm text-muted-foreground">Real-time environmental and social metrics</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {impactMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-md space-y-2"
                data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </div>
                <p className="text-3xl font-mono font-bold">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
