import FoodListingCard from '../FoodListingCard';
import foodImage from '@assets/generated_images/Fresh_surplus_food_arrangement_fd80cf7a.png';

export default function FoodListingCardExample() {
  return (
    <div className="max-w-sm">
      <FoodListingCard
        id="1"
        title="Fresh Vegetables & Bread"
        quantity="5 lbs mixed produce, 2 loaves"
        imageUrl={foodImage}
        location="Community Kitchen, Downtown"
        pickupTime="Today, 4:00 PM - 6:00 PM"
        freshnessScore={94}
        temperature={38}
        humidity={65}
        defects={[]}
        onClaim={(id) => console.log('Claimed:', id)}
      />
    </div>
  );
}
