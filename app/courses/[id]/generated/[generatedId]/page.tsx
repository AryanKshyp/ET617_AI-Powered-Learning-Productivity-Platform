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

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Quiz</h2>
          {questions.map((question: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">
                Question {index + 1}: {question.question || 'Question text not available'}
              </h3>
              <div className="space-y-2">
                {isArray(question.choices) && question.choices.length > 0 ? (
                  question.choices.map((choice: string, choiceIndex: number) => (
                    <label key={choiceIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={choice}
                        className="form-radio"
                      />
                      <span>{choice}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No choices available</p>
                )}
              </div>
              {question.explanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
              {question.answer && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Correct Answer:</strong> {question.answer}
                </div>
              )}
            </div>
          ))}
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

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Print
            </button>
            <button
              onClick={() => {
                const data = {
                  type: generatedItem.generated_type || 'unknown',
                  content: generatedItem.payload || null,
                  settings: generatedItem.generation_settings || null,
                  generated_at: generatedItem.created_at
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${generatedItem.generated_type || 'content'}-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
