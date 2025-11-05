// components/mentor/CourseCreation.jsx
import { Card } from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function CourseCreation({ onCreate }) {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Course</h2>
      <Input placeholder="Course Title" />
      <Input placeholder="Course Description" />
      <Button onClick={onCreate}>Create</Button>
    </Card>
  );
}
