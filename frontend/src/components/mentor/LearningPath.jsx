// components/mentor/LearningPath.jsx
import { Card } from "../ui/Card";
import Progress from "../ui/Progress";

export default function LearningPath({ steps }) {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Learning Path</h3>
      {steps.map((step, idx) => (
        <div key={idx}>
          <p>{step.title}</p>
          <Progress value={step.progress} />
        </div>
      ))}
    </Card>
  );
}
