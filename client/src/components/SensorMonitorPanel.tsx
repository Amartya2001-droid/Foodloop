import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Activity } from "lucide-react";

interface SensorReading {
  temperature: number;
  humidity: number;
  lastUpdate: string;
  status: "normal" | "warning" | "critical";
}

interface SensorMonitorPanelProps {
  readings: SensorReading[];
  locationName: string;
}

export default function SensorMonitorPanel({ readings, locationName }: SensorMonitorPanelProps) {
  const latestReading = readings[0] || {
    temperature: 38,
    humidity: 65,
    lastUpdate: "2 min ago",
    status: "normal" as const,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "text-primary";
      case "warning": return "text-chart-4";
      case "critical": return "text-destructive";
      default: return "text-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal": return <Badge className="bg-primary/10 text-primary border-primary/20">Normal</Badge>;
      case "warning": return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Warning</Badge>;
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      default: return null;
    }
  };

  return (
    <Card data-testid="card-sensor-monitor">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">IoT Sensors</CardTitle>
          {getStatusBadge(latestReading.status)}
        </div>
        <p className="text-xs text-muted-foreground">{locationName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-md">
                <Thermometer className={`h-5 w-5 ${getStatusColor(latestReading.status)}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="text-2xl font-mono font-semibold" data-testid="text-temperature">
                  {latestReading.temperature}°F
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-md">
                <Droplets className={`h-5 w-5 ${getStatusColor(latestReading.status)}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-2xl font-mono font-semibold" data-testid="text-humidity">
                  {latestReading.humidity}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Activity className="h-3 w-3" />
          <span>Updated {latestReading.lastUpdate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
