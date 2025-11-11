import type { FoodListing, InsertFoodListing } from "@shared/schema";

export async function getFoodListings(): Promise<FoodListing[]> {
  const response = await fetch("/api/food-listings");
  if (!response.ok) {
    throw new Error("Failed to fetch food listings");
  }
  return response.json();
}

export async function getFoodListing(id: string): Promise<FoodListing> {
  const response = await fetch(`/api/food-listings/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch food listing");
  }
  return response.json();
}

export async function createFoodListing(data: InsertFoodListing & { image?: File }): Promise<FoodListing> {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (key === "image" && value instanceof File) {
      formData.append("image", value);
    } else if (value !== undefined && value !== null) {
      if (typeof value === "object" && !(value instanceof Date)) {
        formData.append(key, JSON.stringify(value));
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  const response = await fetch("/api/food-listings", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create food listing");
  }

  return response.json();
}

export async function updateFoodListing(id: string, updates: Partial<FoodListing>): Promise<FoodListing> {
  const response = await fetch(`/api/food-listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update food listing");
  }

  return response.json();
}

export async function deleteFoodListing(id: string): Promise<void> {
  const response = await fetch(`/api/food-listings/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete food listing");
  }
}
