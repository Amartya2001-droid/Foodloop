import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createFoodListing } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PostFoodFormProps {
  onSubmit?: (data: any) => void;
  onSuccess?: () => void;
}

export default function PostFoodForm({ onSubmit, onSuccess }: PostFoodFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    category: "",
    cost: "",
    location: "",
    expiryDate: "",
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createMutation = useMutation({
    mutationFn: createFoodListing,
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your food listing has been posted.",
      });
      onSuccess?.();
      setFormData({
        title: "",
        description: "",
        quantity: "",
        category: "",
        cost: "",
        location: "",
        expiryDate: "",
      });
      setUploadedImage(null);
      setImageFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post food listing",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // AI Food Detection
      setIsAnalyzing(true);
      toast({
        title: "Analyzing food...",
        description: "AI is detecting what food this is",
      });

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/detect-food", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to analyze food");
        }

        const foodData = await response.json();
        
        // Auto-fill the form with AI-detected data
        setFormData(prev => ({
          ...prev,
          title: foodData.title || prev.title,
          description: foodData.description || prev.description,
          quantity: foodData.quantity || prev.quantity,
          category: foodData.category || prev.category,
        }));

        toast({
          title: "Food detected!",
          description: `Identified as: ${foodData.title}`,
        });
      } catch (error) {
        console.error("Food detection error:", error);
        toast({
          title: "Detection failed",
          description: "You can still fill in the details manually",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expiryDate = new Date(formData.expiryDate);

    const listingData = {
      title: formData.title,
      description: formData.description,
      quantity: formData.quantity,
      category: formData.category,
      cost: formData.cost || undefined,
      location: formData.location,
      latitude: 44.6488,
      longitude: -63.5752,
      expiryDate: expiryDate,
      freshnessScore: 85,
      qualityScore: 85,
      defectsDetected: [],
      aiAnalysis: null,
      donorId: "demo-user",
      image: imageFile || undefined,
    };

    createMutation.mutate(listingData as any);
    onSubmit?.(listingData);
  };

  return (
    <Card data-testid="card-post-food-form">
      <CardHeader>
        <CardTitle className="text-2xl">Post Surplus Food</CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your surplus food with the community
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image">Food Photo (AI Detection)</Label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="image-upload"
                className="flex-1 flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
              >
                {isAnalyzing ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing your food...
                    </p>
                  </div>
                ) : uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Uploaded food"
                    className="max-h-48 rounded-md"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload photo for AI detection
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-fills title, category & description
                    </p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-image-upload"
                  disabled={isAnalyzing}
                />
              </label>
              <Button type="button" variant="outline" size="icon">
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Food Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Fresh Vegetables Mix"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produce">Produce</SelectItem>
                  <SelectItem value="bakery">Bakery</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="prepared">Prepared Food</SelectItem>
                  <SelectItem value="packaged">Packaged Goods</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the food items, dietary info, allergens..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              data-testid="input-description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                placeholder="e.g., 5 lbs, 10 servings"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                data-testid="input-quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost (Optional)</Label>
              <Input
                id="cost"
                placeholder="e.g., Free, $5, $10"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                data-testid="input-cost"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Pickup Location *</Label>
            <Input
              id="location"
              placeholder="Address or landmark"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              data-testid="input-location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date *</Label>
            <Input
              id="expiry-date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              data-testid="input-expiry-date"
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-muted-foreground">
              When does this food expire or need to be picked up by?
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={createMutation.isPending || isAnalyzing}
            data-testid="button-submit-post"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI Analyzing...
              </>
            ) : (
              <>
                <span className="material-icons text-sm mr-2">publish</span>
                Post Food Listing
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
