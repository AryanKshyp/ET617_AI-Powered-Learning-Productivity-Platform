"use client";

import { useState, useEffect } from 'react';

type Material = {
  id: string;
  title: string;
  material_type: string;
  page_count?: number;
  course_id: string;
};

type GenerateButtonProps = {
  material: Material;
  courseId: string;
};

export default function GenerateButton({ material, courseId }: GenerateButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [contentType, setContentType] = useState<'quiz' | 'assignment' | 'summary'>('quiz');
  const [pageRange, setPageRange] = useState({ start: 1, end: material.page_count || 1 });
  const [numQuestions, setNumQuestions] = useState(5);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [bloomLevel, setBloomLevel] = useState<'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'>('apply');
  const [loading, setLoading] = useState(false);

  // Reset page range to end of PDF when modal opens
  useEffect(() => {
    if (showModal && material.material_type === 'pdf' && material.page_count) {
      setPageRange({ start: 1, end: material.page_count });
    }
  }, [showModal, material.material_type, material.page_count]);

  const handleGenerate = async () => {
    // Validate page range
    if (material.material_type === 'pdf' && material.page_count) {
      if (pageRange.start < 1 || pageRange.end < 1) {
        alert('Page numbers must be greater than 0');
        return;
      }
      if (pageRange.start > pageRange.end) {
        alert('Start page must be less than or equal to end page');
        return;
      }
      if (pageRange.end > material.page_count) {
        alert(`End page cannot exceed total pages (${material.page_count})`);
        return;
      }
    }

    setLoading(true);
    try {
      const settings = {
        page_range: `${pageRange.start}-${pageRange.end}`,
        bloom_level: bloomLevel,
        ...(contentType === 'quiz' || contentType === 'assignment' ? { num_questions: numQuestions } : {}),
        ...(contentType === 'summary' ? { length: summaryLength } : {}),
      };

      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: material.id,
          course_id: courseId,
          generated_type: contentType,
          settings,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        alert('Content generated successfully!');
        setShowModal(false);
        // Optionally reload the page or redirect
        window.location.reload();
      } else {
        const errorMessage = responseData.details || responseData.error || 'Failed to generate content';
        console.error('Generation error:', responseData);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert(`Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
      >
        Generate
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Generate Content</h2>
            
            <div className="space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="summary">Summary</option>
                </select>
              </div>

              {/* Page Range - only for PDFs */}
              {material.material_type === 'pdf' && material.page_count && (
                <div>
                  <label className="block text-sm font-medium mb-2">Page Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={material.page_count}
                      value={pageRange.start}
                      onChange={(e) => setPageRange({ ...pageRange, start: parseInt(e.target.value) })}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Start"
                    />
                    <span className="self-center">to</span>
                    <input
                      type="number"
                      min="1"
                      max={material.page_count}
                      value={pageRange.end}
                      onChange={(e) => setPageRange({ ...pageRange, end: parseInt(e.target.value) })}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="End"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total pages: {material.page_count}
                  </p>
                </div>
              )}

              {/* Number of Questions (for quiz/assignment) */}
              {(contentType === 'quiz' || contentType === 'assignment') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Questions</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {/* Summary Length (for summary) */}
              {contentType === 'summary' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Summary Length</label>
                  <select
                    value={summaryLength}
                    onChange={(e) => setSummaryLength(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="short">Short (1-2 paragraphs)</option>
                    <option value="medium">Medium (3-4 paragraphs)</option>
                    <option value="long">Long (5+ paragraphs)</option>
                  </select>
                </div>
              )}

              {/* Bloom's Taxonomy Level */}
              <div>
                <label className="block text-sm font-medium mb-2">Bloom's Taxonomy Level</label>
                <select
                  value={bloomLevel}
                  onChange={(e) => setBloomLevel(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="remember">Remember</option>
                  <option value="understand">Understand</option>
                  <option value="apply">Apply</option>
                  <option value="analyze">Analyze</option>
                  <option value="evaluate">Evaluate</option>
                  <option value="create">Create</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

