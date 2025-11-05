// pages/WeaknessDetector.jsx
import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import WeakTopicCard from '../components/weakness/WeakTopicCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';

const WeaknessDetector = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const weakTopics = [
    {
      id: 1,
      topic: 'TCP/IP Protocol',
      weaknessScore: 75,
      attempts: 24,
      correct: 8,
      lastPracticed: '2 days ago',
      recommendations: ['Review flashcards', 'Take practice quiz', 'Watch tutorial video']
    },
    {
      id: 2,
      topic: 'Binary Trees',
      weaknessScore: 60,
      attempts: 18,
      correct: 9,
      lastPracticed: '1 day ago',
      recommendations: ['Solve practice problems', 'Review algorithms', 'Join study group']
    },
    {
      id: 3,
      topic: 'Linear Regression',
      weaknessScore: 45,
      attempts: 15,
      correct: 10,
      lastPracticed: '3 days ago',
      recommendations: ['Review formulas', 'Practice with dataset', 'Watch lecture']
    }
  ];

  const overallProgress = 62;

  return (
    <MainLayout>
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Weakness Detector</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Identify and improve your weak topics with AI-powered recommendations
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Overall Mastery Progress</CardTitle>
              <CardDescription>
                Your current progress across all topics based on quiz performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="inline-block relative">
                  <Progress value={overallProgress} className="w-64 h-64" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{overallProgress}%</span>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {overallProgress >= 70 ? 'Great progress! Keep it up.' : 
                   overallProgress >= 40 ? 'Good progress. Focus on weak areas.' : 
                   'Keep practicing to improve your skills.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weak Topics</CardTitle>
              <CardDescription>
                Topics that need more practice based on your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weakTopics.map(topic => (
                  <WeakTopicCard
                    key={topic.id}
                    topic={topic}
                    isSelected={selectedTopic?.id === topic.id}
                    onSelect={() => setSelectedTopic(
                      selectedTopic?.id === topic.id ? null : topic
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedTopic && (
            <Card>
              <CardHeader>
                <CardTitle>Improvement Plan for {selectedTopic.topic}</CardTitle>
                <CardDescription>
                  AI-generated recommendations to strengthen this topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Actions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedTopic.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Practice Stats</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Attempts: </span>
                        {selectedTopic.attempts}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Correct: </span>
                        {selectedTopic.correct}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Accuracy: </span>
                        {Math.round((selectedTopic.correct / selectedTopic.attempts) * 100)}%
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Practiced: </span>
                        {selectedTopic.lastPracticed}
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg mt-4">
                    Start Practice Session
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default WeaknessDetector;