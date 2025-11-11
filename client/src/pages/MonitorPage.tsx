import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { Clock, MapPin, User, Phone, Package, TrendingUp } from "lucide-react";

interface ListingWithClaims {
  id: string;
  title: string;
  description: string;
  quantity: string;
  category: string;
  location: string;
  cost: string | null;
  status: string;
  freshnessScore: number;
  createdAt: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  claims: Array<{
    id: string;
    claimerName: string;
    claimerContact: string;
    claimedAt: string;
    status: string;
  }>;
}

export default function MonitorPage() {
  const { data: myListings, isLoading } = useQuery<ListingWithClaims[]>({
    queryKey: ["/api/my-listings"],
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      produce: "bg-primary/10 text-primary border-primary/20",
      bakery: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      dairy: "bg-chart-3/10 text-chart-3 border-chart-3/20",
      prepared: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      packaged: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getStatusColor = (status: string) => {
    if (status === "available") return "bg-primary/10 text-primary border-primary/20";
    if (status === "claimed") return "bg-chart-4/10 text-chart-4 border-chart-4/20";
    return "bg-muted text-muted-foreground border-border";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const totalListings = myListings?.length || 0;
  const activeListing = myListings?.filter(l => l.status === "available").length || 0;
  const claimedListings = myListings?.filter(l => l.status === "claimed").length || 0;
  const totalClaims = myListings?.reduce((acc, l) => acc + l.claims.length, 0) || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Supplier Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your food listings and track claimers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-3xl font-bold">{totalListings}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-primary">{activeListing}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Claimed</p>
                <p className="text-3xl font-bold text-chart-4">{claimedListings}</p>
              </div>
              <User className="h-8 w-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-3xl font-bold text-chart-2">{totalClaims}</p>
              </div>
              <User className="h-8 w-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings with Claims */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Food Listings</h2>
        
        {myListings && myListings.length > 0 ? (
          <div className="space-y-4">
            {myListings.map((listing) => (
              <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{listing.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getCategoryColor(listing.category)}>
                          {listing.category}
                        </Badge>
                        <Badge className={getStatusColor(listing.status)}>
                          {listing.status}
                        </Badge>
                        {listing.cost && (
                          <Badge variant="outline">{listing.cost}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {listing.freshnessScore}% Fresh
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {listing.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Quantity:</span>
                          <span className="text-muted-foreground">{listing.quantity}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{listing.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Posted {formatDistance(new Date(listing.createdAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Pickup:</span>
                          <span className="text-muted-foreground">
                            {new Date(listing.pickupTimeStart).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })} - {new Date(listing.pickupTimeEnd).toLocaleTimeString('en-US', { 
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">
                        Claimers ({listing.claims.length})
                      </h4>
                      {listing.claims.length > 0 ? (
                        <div className="space-y-3">
                          {listing.claims.map((claim) => (
                            <Card key={claim.id} className="bg-muted/30">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{claim.claimerName}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {claim.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{claim.claimerContact}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Claimed {formatDistance(new Date(claim.claimedAt), new Date(), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md">
                          No claims yet. Waiting for recipients...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No listings yet</p>
              <p className="text-muted-foreground">
                Post your first food listing to start monitoring
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
