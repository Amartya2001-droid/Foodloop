import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface InspectionResult {
  defects: number;
  colorChange: "none" | "low" | "moderate" | "high";
  bruising: "none" | "minimal" | "moderate" | "severe";
  packaging: "good" | "fair" | "damaged";
  shelfLifeDays: number;
  confidence: number;
}

interface QualityInspectionResultProps {
  result: InspectionResult;
  imageUrl?: string;
}

export default function QualityInspectionResult({ result, imageUrl }: QualityInspectionResultProps) {
  const getStatusIcon = (level: string) => {
    if (level === "none" || level === "minimal" || level === "low" || level === "good") {
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    }
    if (level === "moderate" || level === "fair") {
      return <AlertTriangle className="h-4 w-4 text-chart-4" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusText = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <Card data-testid="card-quality-inspection">
      <CardHeader>
        <CardTitle className="text-lg">AI Quality Inspection</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <span className="material-icons text-xs mr-1">verified</span>
            {result.confidence}% Confidence
          </Badge>
          {result.defects === 0 && (
            <Badge className="bg-primary">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Passed Inspection
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl && (
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
            <img src={imageUrl} alt="Food inspection" className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-primary/30 pointer-events-none" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">Defects Detected</span>
            <div className="flex items-center gap-2">
              {result.defects === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="font-semibold">{result.defects}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">Color Change</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(result.colorChange)}
              <span className="text-sm">{getStatusText(result.colorChange)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">Bruising</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(result.bruising)}
              <span className="text-sm">{getStatusText(result.bruising)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">Packaging</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(result.packaging)}
              <span className="text-sm">{getStatusText(result.packaging)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Shelf Life</span>
            <span className="text-2xl font-mono font-bold text-primary">
              {result.shelfLifeDays}d
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
