"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from "@/components/dashhome/header";
import { supabase } from '@/lib/supabaseClient';

type Course = { 
  id: string; 
  title: string; 
  description: string | null;
  created_at: string;
};

type Material = { 
  id: string; 
  title: string; 
  material_type: string;
  page_count?: number;
  file_size?: number;
  created_at: string;
};

type GeneratedItem = {
  id: string;
  generated_type: string;
  payload: any;
  generation_settings?: any;
  created_at: string;
};

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    loadCourseData();
  }, [params.id]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      
      // Load course details
      const courseRes = await fetch(`/api/courses/${params.id}`);
      const courseData = await courseRes.json();
      if (courseData.data) {
        setCourse(courseData.data);
      }

      // Load materials
      const materialsRes = await fetch(`/api/materials?course_id=${params.id}`);
      const materialsData = await materialsRes.json();
      setMaterials(materialsData.data || []);

      // Load generated items
      const generatedRes = await fetch(`/api/generated?course_id=${params.id}`);
      const generatedData = await generatedRes.json();
      setGeneratedItems(generatedData.data || []);

    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (material: Material) => {
    if (material.material_type !== 'pdf') {
      alert('Content generation is only available for PDF files');
      return;
    }
    setSelectedMaterial(material);
    setShowGenerationModal(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const res = await fetch(`/api/materials/${materialId}`, { method: 'DELETE' });
      if (res.ok) {
        setMaterials(materials.filter(m => m.id !== materialId));
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Course Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-purple-100 mb-4">{course.description}</p>
          )}
          <div className="flex gap-4 text-sm">
            <span>{materials.length} materials</span>
            <span>{generatedItems.length} generated items</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Materials Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Course Materials</h2>
              <button
                onClick={() => router.push(`/courses/${params.id}/upload`)}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
              >
                Upload Material
              </button>
            </div>
            
            <div className="space-y-3">
              {materials.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No materials uploaded yet</p>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{material.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {material.material_type.toUpperCase()}
                          </span>
                          {material.page_count && (
                            <span>{material.page_count} pages</span>
                          )}
                          {material.file_size && (
                            <span>{(material.file_size / 1024 / 1024).toFixed(1)} MB</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/materials/${material.id}`)}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                        >
                          View
                        </button>
                        {(material.material_type === 'pdf' || material.material_type === 'note') && (
                          <button
                            onClick={() => handleGenerate(material)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Generate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generated Content Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Content</h2>
            
            <div className="space-y-3">
              {generatedItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No content generated yet</p>
              ) : (
                generatedItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium capitalize">{item.generated_type}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Generated {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {item.generation_settings && (
                          <div className="flex gap-2 mt-2">
                            {item.generation_settings.bloom_level && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {item.generation_settings.bloom_level}
                              </span>
                            )}
                            {item.generation_settings.page_range && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Pages {item.generation_settings.page_range}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/courses/${params.id}/generated/${item.id}`)}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generation Modal */}
      {showGenerationModal && selectedMaterial && (
        <GenerationModal
          material={selectedMaterial}
          courseId={params.id}
          onClose={() => {
            setShowGenerationModal(false);
            setSelectedMaterial(null);
          }}
          onGenerated={() => {
            loadCourseData();
            setShowGenerationModal(false);
            setSelectedMaterial(null);
          }}
        />
      )}
    </div>
  );
}

// Generation Modal Component
function GenerationModal({ 
  material, 
  courseId, 
  onClose, 
  onGenerated 
}: { 
  material: Material; 
  courseId: string; 
  onClose: () => void; 
  onGenerated: () => void;
}) {
  const [contentType, setContentType] = useState<'quiz' | 'assignment' | 'summary'>('quiz');
  const [pageRange, setPageRange] = useState({ start: 1, end: material.page_count || 1 });
  const [numQuestions, setNumQuestions] = useState(5);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [bloomLevel, setBloomLevel] = useState<'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'>('apply');
  const [loading, setLoading] = useState(false);

  // Reset page range to end of PDF when component mounts or material changes
  useEffect(() => {
    if (material.material_type === 'pdf' && material.page_count) {
      setPageRange({ start: 1, end: material.page_count });
    }
  }, [material.material_type, material.page_count]);

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
        onGenerated();
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

          {/* Page Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Page Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={material.page_count || 1}
                value={pageRange.start}
                onChange={(e) => setPageRange({ ...pageRange, start: parseInt(e.target.value) })}
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Start"
              />
              <span className="self-center">to</span>
              <input
                type="number"
                min="1"
                max={material.page_count || 1}
                value={pageRange.end}
                onChange={(e) => setPageRange({ ...pageRange, end: parseInt(e.target.value) })}
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="End"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total pages: {material.page_count || 'Unknown'}
            </p>
          </div>

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
            onClick={onClose}
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
  );
}
