import MapView from '../MapView';

export default function MapViewExample() {
  const mockLocations = [
    { id: "1", name: "Hope Food Bank - Downtown Halifax", type: "food_bank" as const, latitude: 44.6488, longitude: -63.5752 },
    { id: "2", name: "Community Fridge - North End", type: "community_fridge" as const, latitude: 44.6650, longitude: -63.5820 },
    { id: "3", name: "Fresh Produce Available", type: "food_listing" as const, latitude: 44.6540, longitude: -63.5900, freshnessScore: 94 },
    { id: "4", name: "Bakery Surplus", type: "food_listing" as const, latitude: 44.6410, longitude: -63.5680, freshnessScore: 88 },
    { id: "5", name: "Community Fridge - Dartmouth", type: "community_fridge" as const, latitude: 44.6670, longitude: -63.5650 },
    { id: "6", name: "Halifax Regional Food Bank", type: "food_bank" as const, latitude: 44.6380, longitude: -63.5910 },
  ];

  return (
    <div className="max-w-4xl">
      <MapView locations={mockLocations} />
    </div>
  );
}
