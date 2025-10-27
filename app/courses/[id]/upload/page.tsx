"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CourseUploadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'note'>('file');

  const handleFileUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const form = new FormData();
      form.set('course_id', params.id);
      form.set('title', title || file.name);
      form.set('file', file);
      
      const res = await fetch('/api/materials', { 
        method: 'POST', 
        body: form 
      });
      
      const json = await res.json();
      
      if (json.data) {
        router.push(`/courses/${params.id}`);
      } else {
        alert('Upload failed: ' + (json.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteCreate = async () => {
    if (!note.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/materials', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          course_id: params.id, 
          title: title || 'Note', 
          content: note,
          material_type: 'note'
        }) 
      });
      
      const json = await res.json();
      
      if (json.data) {
        router.push(`/courses/${params.id}`);
      } else {
        alert('Note creation failed: ' + (json.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Note creation error:', error);
      alert('Note creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Upload Material</h1>
            <button
              onClick={() => router.push(`/courses/${params.id}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Course
            </button>
          </div>

          {/* Upload Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setUploadType('file')}
              className={`px-4 py-2 rounded-lg ${
                uploadType === 'file' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setUploadType('note')}
              className={`px-4 py-2 rounded-lg ${
                uploadType === 'note' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Create Note
            </button>
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Title {uploadType === 'file' ? '(optional)' : ''}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={uploadType === 'file' ? 'Leave empty to use filename' : 'Enter note title'}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {uploadType === 'file' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT
                </p>
              </div>

              {file && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">File Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {file.name}</p>
                    <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Type:</strong> {file.type || 'Unknown'}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleFileUpload}
                disabled={loading || !file}
                className="w-full py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Note Content</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full border rounded-lg px-3 py-2 min-h-[200px]"
                />
              </div>

              <button
                onClick={handleNoteCreate}
                disabled={loading || !note.trim()}
                className="w-full py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create Note'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
