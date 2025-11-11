import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Brain, Shield, Star } from "lucide-react";

interface SupplierData {
  supplierName: string;
  overallRating: number;
  googleReviewScore: number;
  foodSafetyCertified: boolean;
  reliabilityScore: number;
  qualityScore: number;
  donationHistory: number;
  aiAnalysis: {
    reasoning: string;
    factors: string[];
    confidence: number;
  };
}

interface AISupplierAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  supplier: SupplierData | null;
}

export default function AISupplierAnalysisModal({
  open,
  onClose,
  supplier,
}: AISupplierAnalysisModalProps) {
  const [analysisStage, setAnalysisStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const analysisStages = [
    { icon: Brain, text: "Analyzing supplier data...", color: "text-blue-500" },
    { icon: Star, text: "Evaluating Google reviews...", color: "text-yellow-500" },
    { icon: Shield, text: "Verifying food safety certifications...", color: "text-green-500" },
    { icon: Sparkles, text: "Calculating reliability metrics...", color: "text-purple-500" },
  ];

  useEffect(() => {
    if (!open) {
      setAnalysisStage(0);
      setProgress(0);
      return;
    }

    const stageInterval = setInterval(() => {
      setAnalysisStage((prev) => {
        if (prev < analysisStages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return prev + 2;
        }
        clearInterval(progressInterval);
        return 100;
      });
    }, 80);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, [open]);

  const isAnalyzing = progress < 100;

  if (!supplier) return null;

  const CurrentIcon = analysisStages[analysisStage]?.icon || Brain;
  const currentStage = analysisStages[analysisStage];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-ai-analysis">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            FoodLoop AI Supplier Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isAnalyzing ? (
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <CurrentIcon className={`h-16 w-16 ${currentStage?.color} opacity-75`} />
                  </div>
                  <CurrentIcon className={`h-16 w-16 ${currentStage?.color} animate-pulse`} />
                </div>
                <p className="text-lg font-medium text-center" data-testid="text-analysis-stage">
                  {currentStage?.text}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Analysis Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" data-testid="progress-analysis" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {analysisStages.map((stage, index) => {
                  const StageIcon = stage.icon;
                  const isComplete = index < analysisStage;
                  const isCurrent = index === analysisStage;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-primary/5 border-primary/30"
                          : isComplete
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-muted/30 border-muted"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <StageIcon className={`h-4 w-4 flex-shrink-0 ${isCurrent ? stage.color : "text-muted-foreground"}`} />
                      )}
                      <span className={`text-xs ${isComplete || isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                        {stage.text.replace("...", "")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">Analysis Complete!</h3>
                <p className="text-muted-foreground">
                  {supplier.supplierName} has been thoroughly evaluated
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Overall AI Score</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {supplier.overallRating.toFixed(1)}/5.0
                    </span>
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-background rounded-md p-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Google Reviews</p>
                      <p className="font-semibold">{supplier.googleReviewScore.toFixed(1)}/5.0</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-background rounded-md p-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Food Safety</p>
                      <p className="font-semibold">
                        {supplier.foodSafetyCertified ? "Certified" : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-background rounded-md p-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Reliability</p>
                      <p className="font-semibold">{supplier.reliabilityScore.toFixed(1)}/5.0</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-background rounded-md p-3">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                      <p className="font-semibold">{supplier.qualityScore.toFixed(1)}/5.0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Certifications & Compliance</h4>
                <div className="flex flex-wrap gap-2">
                  {supplier.foodSafetyCertified && (
                    <>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" data-testid="badge-haccp">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        HACCP Certified
                      </Badge>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" data-testid="badge-fda">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        FDA Compliant
                      </Badge>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" data-testid="badge-iso">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        ISO 22000
                      </Badge>
                    </>
                  )}
                  {supplier.googleReviewScore >= 4.0 && (
                    <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" data-testid="badge-highly-rated">
                      <Star className="h-3 w-3 mr-1" />
                      Highly Rated
                    </Badge>
                  )}
                  {supplier.reliabilityScore >= 4.0 && (
                    <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" data-testid="badge-reliable">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Reliable Partner
                    </Badge>
                  )}
                  {supplier.donationHistory >= 0.8 && (
                    <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" data-testid="badge-consistent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Consistent Donor
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">AI Analysis</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm leading-relaxed">{supplier.aiAnalysis.reasoning}</p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Key Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {supplier.aiAnalysis.factors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">AI Confidence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={supplier.aiAnalysis.confidence * 100} className="w-24 h-1.5" />
                      <span className="text-xs font-medium">{Math.round(supplier.aiAnalysis.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
