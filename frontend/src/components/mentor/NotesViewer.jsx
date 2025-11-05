// components/mentor/NotesViewer.jsx
import { Card } from "../ui/Card";

export default function NotesViewer({ notes }) {
  return (
    <Card className="p-6 space-y-2">
      <h3 className="text-lg font-semibold">Notes</h3>
      {notes.length > 0 ? (
        notes.map((note, idx) => (
          <p key={idx} className="text-gray-700 dark:text-gray-300">{note}</p>
        ))
      ) : (
        <p className="text-gray-500">No notes available</p>
      )}
    </Card>
  );
}
