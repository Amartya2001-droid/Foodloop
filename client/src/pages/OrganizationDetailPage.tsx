import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  Star, 
  Package, 
  TrendingUp,
  Award,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import AISupplierAnalysisModal from "@/components/AISupplierAnalysisModal";

interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  imageUrl: string | null;
  verified: boolean;
  createdAt: string;
  suppliers: SupplierRating[];
}

interface SupplierRating {
  id: string;
  supplierId: string;
  organizationId: string;
  overallRating: number;
  googleReviewScore: number | null;
  foodSafetyCertified: boolean;
  reliabilityScore: number;
  qualityScore: number;
  totalDonations: number;
  aiAnalysis: {
    reasoning: string;
    factors: {
      googleReviewScore: number;
      foodSafetyCertified: boolean;
      reliabilityScore: number;
      qualityScore: number;
      totalDonations: number;
    };
    confidence: number;
  } | null;
  supplierName: string;
  activeListings: number;
  totalListings: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrganizationDetailPage() {
  const [, params] = useRoute("/organizations/:id");
  const orgId = params?.id;
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRating | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organizations", orgId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch organization");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!orgId,
  });

  const handleAnalyzeSupplier = (supplier: SupplierRating) => {
    setSelectedSupplier(supplier);
    setShowAnalysisModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Organization not found</p>
          <Link href="/organizations">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sort suppliers by overall rating
  const sortedSuppliers = [...(organization.suppliers || [])].sort(
    (a, b) => b.overallRating - a.overallRating
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/organizations">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Organizations
        </Button>
      </Link>

      {/* Organization Header */}
      <Card className="mb-8" data-testid="card-org-header">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-3xl mb-1">{organization.name}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{organization.type}</Badge>
                  {organization.verified && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{organization.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm">{organization.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{organization.contactPhone}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{organization.contactEmail}</span>
            </div>

            {organization.website && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <a 
                  href={organization.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {organization.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supplier Ratings Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Trusted Suppliers</h2>
        <p className="text-muted-foreground">
          AI-analyzed ratings based on Google reviews, food safety certifications, and reliability metrics
        </p>
      </div>

      {sortedSuppliers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No suppliers rated yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedSuppliers.map((supplier, index) => (
            <Card 
              key={supplier.id} 
              className="hover-elevate" 
              data-testid={`card-supplier-${supplier.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      index === 0 ? 'bg-yellow-500/10 text-yellow-600' : 
                      index === 1 ? 'bg-gray-400/10 text-gray-600' : 
                      index === 2 ? 'bg-orange-600/10 text-orange-700' : 
                      'bg-primary/10 text-primary'
                    } flex-shrink-0`}>
                      {index < 3 ? (
                        <Award className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{supplier.supplierName}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" aria-label={`${supplier.overallRating.toFixed(1)} stars out of 5`} />
                          <span className="font-semibold">{supplier.overallRating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">/ 5.0</span>
                        </div>
                        {supplier.foodSafetyCertified && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Certified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{supplier.totalDonations}</div>
                      <div className="text-xs text-muted-foreground">Donations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{supplier.activeListings}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* AI Analysis Reasoning */}
                {supplier.aiAnalysis && (
                  <div className="bg-muted/50 p-4 rounded-md">
                    <div className="flex items-start gap-2 mb-2">
                      <Star className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">AI Analysis</p>
                        <p className="text-sm text-muted-foreground">{supplier.aiAnalysis.reasoning}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Confidence: {(supplier.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                {/* Rating Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reliability</span>
                      <span className="font-semibold">{supplier.reliabilityScore.toFixed(1)} / 5.0</span>
                    </div>
                    <Progress value={supplier.reliabilityScore * 20} aria-label={`Reliability score: ${supplier.reliabilityScore.toFixed(1)} out of 5`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quality</span>
                      <span className="font-semibold">{supplier.qualityScore.toFixed(1)} / 5.0</span>
                    </div>
                    <Progress value={supplier.qualityScore * 20} aria-label={`Quality score: ${supplier.qualityScore.toFixed(1)} out of 5`} />
                  </div>

                  {supplier.googleReviewScore && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Google Reviews</span>
                        <span className="font-semibold">{supplier.googleReviewScore.toFixed(1)} / 5.0</span>
                      </div>
                      <Progress value={supplier.googleReviewScore * 20} aria-label={`Google review score: ${supplier.googleReviewScore.toFixed(1)} out of 5`} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Listings</span>
                      <span className="font-semibold">{supplier.totalListings}</span>
                    </div>
                    <Progress value={Math.min(supplier.totalListings, 100)} aria-label={`Total listings: ${supplier.totalListings}`} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => handleAnalyzeSupplier(supplier)} 
                    className="w-full"
                    variant="outline"
                    data-testid={`button-analyze-${supplier.id}`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    View Full AI Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AISupplierAnalysisModal
        open={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        supplier={selectedSupplier ? {
          supplierName: selectedSupplier.supplierName,
          overallRating: selectedSupplier.overallRating,
          googleReviewScore: selectedSupplier.googleReviewScore || 0,
          foodSafetyCertified: selectedSupplier.foodSafetyCertified,
          reliabilityScore: selectedSupplier.reliabilityScore,
          qualityScore: selectedSupplier.qualityScore,
          donationHistory: selectedSupplier.totalDonations / 100, // Normalize to 0-1 scale
          aiAnalysis: {
            reasoning: selectedSupplier.aiAnalysis?.reasoning || "No analysis available",
            factors: selectedSupplier.aiAnalysis?.factors 
              ? Object.keys(selectedSupplier.aiAnalysis.factors).filter(key => 
                  typeof selectedSupplier.aiAnalysis?.factors[key as keyof typeof selectedSupplier.aiAnalysis.factors] !== 'object'
                )
              : [],
            confidence: selectedSupplier.aiAnalysis?.confidence || 0,
          }
        } : null}
      />
    </div>
  );
}
