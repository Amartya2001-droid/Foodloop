import ImpactDashboard from '../ImpactDashboard';

export default function ImpactDashboardExample() {
  const mockStats = {
    mealsProvided: 12847,
    poundsSaved: 45230,
    co2Prevented: 18650,
    itemsRescued: 3256,
  };

  return (
    <div className="max-w-4xl">
      <ImpactDashboard stats={mockStats} />
    </div>
  );
}
