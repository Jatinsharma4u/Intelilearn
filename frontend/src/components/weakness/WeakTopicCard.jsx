const WeakTopicCard = ({ topic, isSelected, onSelect }) => {
  const getSeverityColor = (score) => {
    if (score >= 70) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">{topic.topic}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(topic.weaknessScore)}`}>
          {topic.weaknessScore}% weak
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{topic.attempts} attempts</span>
        <span>{topic.correct} correct</span>
        <span>Last: {topic.lastPracticed}</span>
      </div>
    </div>
  );
};

export default WeakTopicCard;