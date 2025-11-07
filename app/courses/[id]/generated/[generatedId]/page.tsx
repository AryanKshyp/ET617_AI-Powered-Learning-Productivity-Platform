"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type GeneratedItem = {
  id: string;
  generated_type: string;
  payload: any;
  generation_settings?: any;
  created_at: string;
  material?: {
    id: string;
    title: string;
    material_type: string;
  };
};

export default function GeneratedContentPage() {
  const params = useParams<{ id: string; generatedId: string }>();
  const router = useRouter();
  const [generatedItem, setGeneratedItem] = useState<GeneratedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [selectedChoices, setSelectedChoices] = useState<Record<number, string>>({});

  useEffect(() => {
    loadGeneratedContent();
  }, [params.generatedId]);

  const loadGeneratedContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/generated/${params.generatedId}`);
      const json = await res.json();
      
      if (json.data) {
        setGeneratedItem(json.data);
      } else {
        console.error('Failed to load generated content:', json.error);
      }
    } catch (error) {
      console.error('Error loading generated content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely check if a value is an array
  const isArray = (value: any): value is any[] => {
    return Array.isArray(value);
  };

  const normalizeChoices = (choices: any): Array<{ key: string; text: string }> => {
    if (!choices) return [];

    if (Array.isArray(choices)) {
      return choices
        .map((choice, index) => {
          if (choice && typeof choice === 'object') {
            const key = (choice.key || choice.label || String.fromCharCode(65 + index)).toString().toUpperCase();
            const text = (choice.text || choice.value || '').toString().trim();
            return text ? { key, text } : null;
          }
          const text = choice !== undefined && choice !== null ? String(choice).trim() : '';
          if (!text) return null;
          return {
            key: String.fromCharCode(65 + index),
            text
          };
        })
        .filter((choice): choice is { key: string; text: string } => Boolean(choice));
    }

    if (typeof choices === 'object') {
      return Object.entries(choices).map(([key, value], index) => ({
        key: (key || String.fromCharCode(65 + index)).toString().toUpperCase(),
        text: value !== undefined && value !== null ? String(value).trim() : ''
      })).filter(choice => choice.text);
    }

    return [];
  };

  const deriveAnswerDisplay = (
    question: any,
    normalizedChoices: Array<{ key: string; text: string }>,
    hasChoices: boolean
  ): string => {
    const answerText = typeof question?.answer_text === 'string' ? question.answer_text.trim() : '';
    const rawAnswer = typeof question?.answer === 'string' ? question.answer.trim() : '';

    if (hasChoices) {
      const match = normalizedChoices.find((choice) => {
        const choiceKey = choice.key.toUpperCase();
        const answerKeyMatch = rawAnswer ? choiceKey === rawAnswer.toUpperCase() : false;
        const answerTextMatch = rawAnswer
          ? choice.text.toLowerCase() === rawAnswer.toLowerCase()
          : false;
        const derivedTextMatch = answerText
          ? choice.text.toLowerCase() === answerText.toLowerCase()
          : false;
        const derivedKeyMatch = answerText
          ? choiceKey === answerText.toUpperCase()
          : false;
        return answerKeyMatch || answerTextMatch || derivedTextMatch || derivedKeyMatch;
      });

      if (match) {
        return `${match.key}. ${match.text}`;
      }

      if (answerText) {
        return answerText;
      }

      if (rawAnswer && rawAnswer.length > 1) {
        return rawAnswer;
      }

      return '';
    }

    if (answerText) {
      return answerText;
    }

    if (rawAnswer && rawAnswer.length > 1) {
      return rawAnswer;
    }

    return '';
  };

  // Helper function to detect the content type based on payload structure
  const detectContentType = (payload: any): 'quiz' | 'assignment' | 'summary' | 'unknown' => {
    if (!payload || typeof payload !== 'object') {
      return 'unknown';
    }

    // Check for Quiz: has questions array
    if (isArray(payload.questions) && payload.questions.length > 0) {
      return 'quiz';
    }

    // Check for Assignment: has assignment_tasks array
    if (isArray(payload.assignment_tasks) && payload.assignment_tasks.length > 0) {
      return 'assignment';
    }

    // Check for Summary: has key_points array or content field
    if (isArray(payload.key_points) || payload.content || typeof payload === 'string') {
      return 'summary';
    }

    return 'unknown';
  };

  const renderContent = () => {
    if (!generatedItem) return null;

    const { generated_type, payload } = generatedItem;

    // Detect content type from payload structure (more reliable than generated_type)
    const detectedType = detectContentType(payload);
    const contentType = detectedType !== 'unknown' ? detectedType : generated_type;

    // Render Quiz content
    if (contentType === 'quiz' || (isArray(payload?.questions) && payload.questions.length > 0)) {
      const questions = isArray(payload?.questions) ? payload.questions : [];
      
      if (questions.length === 0) {
        return (
          <div className="border rounded-lg p-4">
            <p className="text-gray-500">No questions found in this quiz.</p>
          </div>
        );
      }

      const toggleQuestionReveal = (index: number) => {
        const newRevealed = new Set(revealedQuestions);
        if (newRevealed.has(index)) {
          newRevealed.delete(index);
          // Also hide answer if question is hidden
          const newRevealedAnswers = new Set(revealedAnswers);
          newRevealedAnswers.delete(index);
          setRevealedAnswers(newRevealedAnswers);
          setSelectedChoices((prev) => {
            const { [index]: _removed, ...rest } = prev;
            return rest;
          });
        } else {
          newRevealed.add(index);
        }
        setRevealedQuestions(newRevealed);
      };

      const toggleAnswerReveal = (index: number) => {
        const newRevealed = new Set(revealedAnswers);
        if (newRevealed.has(index)) {
          newRevealed.delete(index);
        } else {
          newRevealed.add(index);
        }
        setRevealedAnswers(newRevealed);
      };

      const handleChoiceSelect = (questionIndex: number, choiceKey: string) => {
        setSelectedChoices((prev) => ({ ...prev, [questionIndex]: choiceKey }));
        const newRevealed = new Set(revealedAnswers);
        newRevealed.add(questionIndex);
        setRevealedAnswers(newRevealed);
      };

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Quiz</h2>
          {questions.map((question: any, index: number) => {
            const normalizedChoices = normalizeChoices(question.choices);
            const hasChoices = normalizedChoices.length > 0;
            const showOptions = revealedQuestions.has(index);
            const showAnswer = revealedAnswers.has(index);
            const answerDisplay = deriveAnswerDisplay(question, normalizedChoices, hasChoices);
            const canRevealDetails = Boolean(answerDisplay) || Boolean(question.explanation);
            
            return (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div 
                  className="font-semibold mb-3 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleQuestionReveal(index)}
                >
                  <span>
                    Question {index + 1}: {question.question || 'Question text not available'}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {showOptions ? '▼' : '▶'}
                  </span>
                </div>
                
                {showOptions && (
                  <div className="space-y-2 mb-3">
                    {hasChoices ? (
                      normalizedChoices.map((choice, choiceIndex: number) => (
                        <label key={choiceIndex} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={choice.text}
                            className="form-radio"
                            onChange={() => handleChoiceSelect(index, choice.key)}
                            checked={selectedChoices[index] === choice.key}
                          />
                          <span>
                            <span className="font-medium mr-2 text-gray-600">{choice.key}.</span>
                            {choice.text}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No choices available</p>
                    )}
                  </div>
                )}
                
                {showOptions && canRevealDetails && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAnswerReveal(index);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                )}
                
                {showAnswer && answerDisplay && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <strong className="text-green-800">Correct Answer:</strong>
                    <p className="text-green-900 mt-1">{answerDisplay}</p>
                  </div>
                )}
                
                {showAnswer && question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <strong className="text-blue-800">Explanation:</strong>
                    <p className="text-blue-900 mt-1">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Render Assignment content
    if (contentType === 'assignment' || (isArray(payload?.assignment_tasks) && payload.assignment_tasks.length > 0)) {
      const assignmentTasks = isArray(payload?.assignment_tasks) ? payload.assignment_tasks : [];
      const learningObjectives = isArray(payload?.learning_objectives) ? payload.learning_objectives : [];
      const rubric = isArray(payload?.rubric) ? payload.rubric : [];

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{payload?.title || 'Assignment'}</h2>
          
          {payload?.instructions && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="whitespace-pre-wrap">{payload.instructions}</p>
            </div>
          )}

          {learningObjectives.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Learning Objectives</h3>
              <ul className="list-disc list-inside space-y-1">
                {learningObjectives.map((objective: string, index: number) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {assignmentTasks.length > 0 ? (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Assignment Tasks</h3>
              <div className="space-y-3">
                {assignmentTasks.map((task: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Task {task.task_number || index + 1}</h4>
                      {task.points && (
                        <span className="text-sm text-gray-600">{task.points}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-700">{task.description}</p>
                    )}
                    {task.bloom_level && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {task.bloom_level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <p className="text-gray-500">No assignment tasks found.</p>
            </div>
          )}

          {rubric.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Grading Rubric</h3>
              <ul className="list-disc list-inside space-y-1">
                {rubric.map((criterion: string, index: number) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}

          {payload?.estimated_time && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Estimated Time</h3>
              <p>{payload.estimated_time}</p>
            </div>
          )}
        </div>
      );
    }

    // Render Summary content
    if (contentType === 'summary' || isArray(payload?.key_points) || payload?.content || typeof payload === 'string') {
      const keyPoints = isArray(payload?.key_points) ? payload.key_points : [];

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{payload?.title || 'Summary'}</h2>
          
          <div className="border rounded-lg p-4">
            <div className="prose max-w-none">
              {typeof payload === 'string' ? (
                <p className="whitespace-pre-wrap">{payload}</p>
              ) : payload?.content ? (
                <p className="whitespace-pre-wrap">{payload.content}</p>
              ) : (
                <p className="text-gray-500">Summary content not available</p>
              )}
            </div>
          </div>

          {keyPoints.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Key Points</h3>
              <ul className="list-disc list-inside space-y-1">
                {keyPoints.map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {payload?.length && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                Length: {payload.length}
              </span>
            )}
            {payload?.bloom_level && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                Bloom's Level: {payload.bloom_level}
              </span>
            )}
            {payload?.page_range && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                Pages: {payload.page_range}
              </span>
            )}
            {payload?.word_count && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
                {payload.word_count}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Fallback for unknown content types
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Generated Content</h3>
        {payload ? (
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(payload, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">No content found</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading content...</div>
      </div>
    );
  }

  if (!generatedItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Content not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold capitalize">{generatedItem.generated_type}</h1>
              <p className="text-gray-600">
                Generated {new Date(generatedItem.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => router.push(`/courses/${params.id}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Course
            </button>
          </div>

          {/* Generation Settings */}
          {generatedItem.generation_settings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Generation Settings</h3>
              <div className="flex flex-wrap gap-2">
                {generatedItem.generation_settings.bloom_level && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    Bloom's Level: {generatedItem.generation_settings.bloom_level}
                  </span>
                )}
                {generatedItem.generation_settings.page_range && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                    Pages: {generatedItem.generation_settings.page_range}
                  </span>
                )}
                {generatedItem.generation_settings.num_questions && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                    Questions: {generatedItem.generation_settings.num_questions}
                  </span>
                )}
                {generatedItem.generation_settings.length && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
                    Length: {generatedItem.generation_settings.length}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {renderContent()}

          {/* Metadata Display */}
          {generatedItem.payload?.metadata && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Generation Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {generatedItem.payload.metadata.total_questions && (
                  <div>
                    <span className="font-medium">Questions:</span>
                    <span className="ml-2">{generatedItem.payload.metadata.total_questions}</span>
                  </div>
                )}
                {generatedItem.payload.metadata.total_tasks && (
                  <div>
                    <span className="font-medium">Tasks:</span>
                    <span className="ml-2">{generatedItem.payload.metadata.total_tasks}</span>
                  </div>
                )}
                {generatedItem.payload.metadata.bloom_level && (
                  <div>
                    <span className="font-medium">Bloom's Level:</span>
                    <span className="ml-2 capitalize">{generatedItem.payload.metadata.bloom_level}</span>
                  </div>
                )}
                {generatedItem.payload.metadata.page_range && (
                  <div>
                    <span className="font-medium">Page Range:</span>
                    <span className="ml-2">{generatedItem.payload.metadata.page_range}</span>
                  </div>
                )}
                {generatedItem.payload.metadata.length && (
                  <div>
                    <span className="font-medium">Length:</span>
                    <span className="ml-2 capitalize">{generatedItem.payload.metadata.length}</span>
                  </div>
                )}
                {generatedItem.payload.metadata.word_count && (
                  <div>
                    <span className="font-medium">Word Count:</span>
                    <span className="ml-2">{generatedItem.payload.metadata.word_count}</span>
                  </div>
                )}
                {generatedItem.payload.metadata.generated_from && (
                  <div className="col-span-2">
                    <span className="font-medium">Source:</span>
                    <span className="ml-2">{generatedItem.payload.metadata.generated_from}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
