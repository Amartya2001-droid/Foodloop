import SensorMonitorPanel from '../SensorMonitorPanel';

export default function SensorMonitorPanelExample() {
  const mockReadings = [
    { temperature: 38, humidity: 65, lastUpdate: "2 min ago", status: "normal" as const },
    { temperature: 39, humidity: 64, lastUpdate: "5 min ago", status: "normal" as const },
  ];

  return (
    <div className="max-w-sm">
      <SensorMonitorPanel
        readings={mockReadings}
        locationName="Community Fridge #1"
      />
    </div>
  );
}
