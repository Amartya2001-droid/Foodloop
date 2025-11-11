import QualityInspectionResult from '../QualityInspectionResult';
import inspectionImage from '@assets/generated_images/AI_food_quality_inspection_2d05afb7.png';

export default function QualityInspectionResultExample() {
  const mockResult = {
    defects: 0,
    colorChange: "low" as const,
    bruising: "none" as const,
    packaging: "good" as const,
    shelfLifeDays: 5,
    confidence: 96,
  };

  return (
    <div className="max-w-md">
      <QualityInspectionResult
        result={mockResult}
        imageUrl={inspectionImage}
      />
    </div>
  );
}
