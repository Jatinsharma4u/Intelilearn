// components/mentor/CourseDashboard.jsx
import { Card } from "../ui/Card";
import Button from "../ui/Button";

export default function CourseDashboard({ courses }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {courses.map((course, idx) => (
        <Card key={idx} className="p-4 space-y-2">
          <h3 className="text-lg font-semibold">{course.title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{course.description}</p>
          <Button>Open</Button>
        </Card>
      ))}
    </div>
  );
}
