// src/components/courses/TutorSession.jsx - Modern Chatbot UI with Streaming Effect
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User,
  Clock,
  ArrowRight
} from 'lucide-react';

const TutorSession = ({ courseId, topic, onComplete, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Start session on mount (only once)
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startSession();
    }
  }, []);

  // Timer for practice questions
  useEffect(() => {
    let timer;
    if (sessionData?.questions && currentQuestionIndex >= 0 && currentQuestionIndex < sessionData.questions.length) {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionData, currentQuestionIndex]);

  const startSession = async () => {
    try {
      setIsLoading(true);
      setIsTyping(true);
      
      // Add welcome message (ONLY ONCE)
      addBotMessage(
        `👋 Hello! I'm your AI Tutor. Let's work on improving your understanding of **${topic}**. I'll explain the concept first, then we'll practice with some questions. Ready to start?`,
        'welcome'
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tutor/start-topic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            courseId,
            topic,
            preferredDifficulty: 'medium'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      setSessionData(data);
      
      // Show explanation messages with streaming effect
      setTimeout(() => {
        showExplanationWithStreaming(data.explanation);
        setIsTyping(false);
      }, 2000);

    } catch (error) {
      console.error('❌ Start session error:', error);
      setIsTyping(false);
      addBotMessage(
        'Sorry, I encountered an error starting the session. Please try again later.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addBotMessage = (content, type = 'text', actionButtons = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type: 'bot',
      content,
      messageType: type,
      timestamp: new Date(),
      actionButtons
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Show explanation with streaming/typing effect
  const showExplanationWithStreaming = (explanation) => {
    if (!explanation) return;

    // Show messages one by one with delays
    let delay = 0;

    // Simple Definition
    if (explanation.simpleDefinition) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(
            `📚 **Simple Definition**\n\n${explanation.simpleDefinition.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim()}`,
            'explanation'
          );
        }, 1500); // Typing effect duration
      }, delay);
      delay += 2500; // Wait before next message
    }

    // Example
    if (explanation.example) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(
            `💡 **Practical Example**\n\n${explanation.example.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim()}`,
            'explanation'
          );
        }, 1500);
      }, delay);
      delay += 2500;
    }

    // Importance
    if (explanation.importance) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(
            `⭐ **Why This Matters**\n\n${explanation.importance.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim()}`,
            'explanation'
          );
        }, 1500);
      }, delay);
      delay += 2500;
    }

    // Key Points
    if (explanation.keyPoints && explanation.keyPoints.length > 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const keyPointsText = explanation.keyPoints
            .map((point, idx) => `${idx + 1}. ${point.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim()}`)
            .join('\n');
          addBotMessage(
            `✅ **Key Points to Remember**\n\n${keyPointsText}`,
            'explanation'
          );
        }, 1500);
      }, delay);
      delay += 2500;
    }

    // Common Mistakes
    if (explanation.commonMistakes && explanation.commonMistakes.length > 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const mistakesText = explanation.commonMistakes
            .map((mistake, idx) => `⚠️ ${mistake.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim()}`)
            .join('\n');
          addBotMessage(
            `🚫 **Common Mistakes to Avoid**\n\n${mistakesText}`,
            'explanation'
          );
        }, 1500);
      }, delay);
      delay += 2500;
    }

    // Add practice button after all explanations
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(
          'Great! Now let\'s test your understanding with some practice questions. Ready?',
          'text',
          [
            { label: 'Start Practice', action: 'start_practice', variant: 'primary' }
          ]
        );
      }, 1500);
    }, delay);
  };

  const handleActionButton = async (action) => {
    if (action === 'start_practice') {
      startPracticeQuestions();
    } else if (action === 'submit_answers') {
      await submitAnswers();
    } else if (action === 'retry') {
      handleRetry();
    } else if (action === 'finish') {
      handleFinish();
    }
  };

  const startPracticeQuestions = () => {
    if (!sessionData?.questions || sessionData.questions.length === 0) {
      addBotMessage('Sorry, no practice questions available at the moment. Please try again later.', 'error');
      return;
    }

    setCurrentQuestionIndex(0);
    setTimeSpent(0);
    setAnswers({});
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        `Perfect! Let's start practicing. I'll ask you ${sessionData.questions.length} question${sessionData.questions.length > 1 ? 's' : ''}. Take your time and think carefully! 🎯`,
        'text'
      );
      
      setTimeout(() => {
        showQuestion(0);
      }, 1000);
    }, 1500);
  };

  const showQuestion = (index) => {
    if (!sessionData?.questions || index >= sessionData.questions.length) return;

    const question = sessionData.questions[index];
    const questionNumber = index + 1;
    const totalQuestions = sessionData.questions.length;

    let questionContent = `**Question ${questionNumber} of ${totalQuestions}**\n\n${question.question}`;
    
    if (question.hint) {
      questionContent += `\n\n💡 *Hint: ${question.hint}*`;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(questionContent, 'question', null);
    }, 1500);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    const currentQuestion = sessionData.questions[currentQuestionIndex];
    
    if (!answers[currentQuestion.id]) {
      addBotMessage('Please select an answer before moving to the next question.', 'error');
      return;
    }

    // Add user's answer as a message
    addUserMessage(
      currentQuestion.type === 'mcq' 
        ? `I think the answer is: ${answers[currentQuestion.id]}`
        : answers[currentQuestion.id]
    );

    if (currentQuestionIndex < sessionData.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        showQuestion(nextIndex);
      }, 1000);
    } else {
      // All questions answered
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(
          'Great! You\'ve answered all questions. Ready to submit?',
          'text',
          [
            { label: 'Submit Answers', action: 'submit_answers', variant: 'primary' }
          ]
        );
      }, 1500);
    }
  };

  const submitAnswers = async () => {
    try {
      setIsTyping(true);
      addUserMessage('Yes, I\'m ready to submit!');

      const studentAnswers = sessionData.questions.map(q => answers[q.id] || '');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tutor/evaluate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            courseId,
            topic,
            questions: sessionData.questions,
            studentAnswers,
            timeSpent
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to evaluate answers');
      }

      const data = await response.json();
      
      setTimeout(() => {
        showResults(data);
        setIsTyping(false);
      }, 2000);

    } catch (error) {
      console.error('❌ Evaluate error:', error);
      setIsTyping(false);
      addBotMessage('Sorry, I encountered an error evaluating your answers. Please try again.', 'error');
    }
  };

  const showResults = (results) => {
    const score = Math.round(results.evaluation.finalScore * 100);
    const isMastered = results.isMastered;

    let resultMessage = `🎯 **Your Results**\n\n`;
    resultMessage += `**Score: ${score}%**\n\n`;
    resultMessage += `${results.evaluation.summary}\n\n`;

    if (isMastered) {
      resultMessage += `🎉 **Congratulations!** You've mastered "${topic}"!`;
    } else if (results.masteryStatus) {
      const masteryScore = Math.round(results.masteryStatus.masteryScore * 100);
      const needed = Math.round((0.8 - results.masteryStatus.masteryScore) * 100);
      resultMessage += `📊 **Mastery Progress:** ${masteryScore}%\n`;
      resultMessage += `You need ${needed}% more to master this topic.`;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(resultMessage, 'results');

      // Show detailed feedback with delays
      setTimeout(() => {
        results.evaluation.evaluations.forEach((evalItem, idx) => {
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              const feedback = evalItem.isCorrect
                ? `✅ **Correct!**\n\n${evalItem.questionText}\n\n${evalItem.explanation}`
                : `❌ **Incorrect**\n\n${evalItem.questionText}\n\n**Your answer:** ${evalItem.studentAnswer}\n**Correct answer:** ${evalItem.correctAnswer}\n\n${evalItem.explanation}`;
              
              addBotMessage(feedback, evalItem.isCorrect ? 'success' : 'error');
            }, 1200);
          }, (idx + 1) * 1000);
        });
      }, 2000);

      // Add action buttons
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          if (isMastered) {
            addBotMessage(
              'Excellent work! You\'ve mastered this topic. Would you like to continue learning?',
              'text',
              [
                { label: 'Finish Session', action: 'finish', variant: 'primary' }
              ]
            );
          } else {
            addBotMessage(
              'Would you like to try again or finish the session?',
              'text',
              [
                { label: 'Try Again', action: 'retry', variant: 'secondary' },
                { label: 'Finish', action: 'finish', variant: 'primary' }
              ]
            );
          }
        }, 1500);
      }, 3000 + (results.evaluation.evaluations.length * 1000));
    }, 1500);
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeSpent(0);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage('Great! Let\'s try again. I\'ll ask you the same questions.', 'text');
      setTimeout(() => {
        showQuestion(0);
      }, 1000);
    }, 1500);
  };

  const handleFinish = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        'Thank you for the session! Keep practicing and you\'ll master this topic in no time. Good luck! 🚀',
        'text'
      );
      setTimeout(() => {
        if (onComplete) onComplete();
        if (onClose) onClose();
      }, 2000);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isTyping) return;

    addUserMessage(inputMessage);
    setInputMessage('');

    const lowerMessage = inputMessage.toLowerCase();
    if (lowerMessage.includes('yes') || lowerMessage.includes('ready') || lowerMessage.includes('start')) {
      setIsTyping(true);
      setTimeout(() => {
        if (sessionData?.questions && currentQuestionIndex < 0) {
          startPracticeQuestions();
        } else {
          addBotMessage('Great! Let\'s continue. Use the buttons to navigate through the session.', 'text');
        }
        setIsTyping(false);
      }, 1500);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage('I understand. Use the action buttons to continue, or feel free to ask me anything about this topic!', 'text');
        setIsTyping(false);
      }, 1500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Tutor</h3>
              <p className="text-sm text-white/80">Learning: {topic}</p>
            </div>
          </div>
          {timeSpent > 0 && (
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{formatTime(timeSpent)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`rounded-2xl px-4 py-3 shadow-md ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.messageType === 'error'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : message.messageType === 'success'
                  ? 'bg-green-50 text-green-900 border border-green-200'
                  : message.messageType === 'question'
                  ? 'bg-purple-50 text-purple-900 border-2 border-purple-200'
                  : message.messageType === 'results'
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 text-orange-900 border-2 border-orange-200'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                {/* Message Content */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content.split('**').map((part, idx) => 
                    idx % 2 === 1 ? (
                      <strong key={idx} className="font-semibold">{part}</strong>
                    ) : (
                      <span key={idx}>{part}</span>
                    )
                  )}
                </div>

                {/* Question Options */}
                {message.messageType === 'question' && sessionData?.questions && currentQuestionIndex >= 0 && currentQuestionIndex < sessionData.questions.length && (
                  <div className="mt-4 space-y-2">
                    {sessionData.questions[currentQuestionIndex]?.type === 'mcq' && 
                     sessionData.questions[currentQuestionIndex]?.options?.length > 0 &&
                     sessionData.questions[currentQuestionIndex].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const qId = sessionData.questions[currentQuestionIndex].id;
                          handleAnswerSelect(qId, option);
                          addUserMessage(option);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          answers[sessionData.questions[currentQuestionIndex].id] === option
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white border-2 border-purple-200 text-purple-900 hover:border-purple-400 hover:bg-purple-50'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {option}
                      </button>
                    ))}

                    {sessionData.questions[currentQuestionIndex]?.type === 'short_answer' && (
                      <textarea
                        value={answers[sessionData.questions[currentQuestionIndex].id] || ''}
                        onChange={(e) => handleAnswerSelect(sessionData.questions[currentQuestionIndex].id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none resize-none"
                        rows={3}
                      />
                    )}

                    {sessionData.questions[currentQuestionIndex]?.type === 'fill_blank' && (
                      <input
                        type="text"
                        value={answers[sessionData.questions[currentQuestionIndex].id] || ''}
                        onChange={(e) => handleAnswerSelect(sessionData.questions[currentQuestionIndex].id, e.target.value)}
                        placeholder="Fill in the blank..."
                        className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none"
                      />
                    )}

                    {sessionData.questions[currentQuestionIndex] && (
                      <button
                        onClick={handleNextQuestion}
                        disabled={!answers[sessionData.questions[currentQuestionIndex].id]}
                        className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                      >
                        {currentQuestionIndex < sessionData.questions.length - 1 ? (
                          <>
                            <span>Next Question</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        ) : (
                          <span>Review Answers</span>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {message.actionButtons && message.actionButtons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actionButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionButton(btn.action)}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                          btn.variant === 'primary'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={isTyping}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorSession;
