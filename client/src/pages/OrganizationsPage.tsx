import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
}

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Top Organizations</h1>
        <p className="text-muted-foreground text-lg">
          Halifax NGOs and food banks working to reduce food waste and fight hunger
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations?.map((org) => (
          <div key={org.id}>
            <Link href={`/organizations/${org.id}`} data-testid={`link-org-${org.id}`}>
              <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-org-${org.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-xl">{org.name}</CardTitle>
                    </div>
                    {org.verified && (
                      <Badge variant="default" className="flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="w-fit">{org.type}</Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {org.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{org.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{org.contactPhone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{org.contactEmail}</span>
                    </div>

                    {org.website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {org.website.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-medium text-primary mt-4">
                    View Supplier Ratings →
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {(!organizations || organizations.length === 0) && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No organizations found</p>
        </div>
      )}
    </div>
  );
}
