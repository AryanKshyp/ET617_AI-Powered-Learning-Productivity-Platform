"use client";
import React, { useEffect, useState, useRef } from 'react'; // Added useRef
import { Upload} from 'lucide-react'; // Using Lucide for icons
import { useRouter } from "next/navigation";

// Paper type
type Paper = { id: number; title: string; year: number | null; count: number | null };

/**
 * Reusable component for displaying a single paper/question bank card.
 */
const PaperCard = ({ paper }) => {
  // Mock image URL to replicate the industrial/engineering theme from the example image
  const imageUrl = `https://placehold.co/400x300/e0e0e0/333333?text=Engineering+Papers`;

  const handleCardClick = () => {
    console.log(`Navigating to view paper: ${paper.title}`);
    // In a real application, you'd use Next.js router here.
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[1.01] flex flex-col"
    >
      {/* Image Section - Mimics the original image content */}
      <div className="relative h-32 md:h-40 bg-gray-100">
        <img
          src={imageUrl}
          alt={paper.title}
          className="w-full h-full object-cover transition-opacity duration-500"
        //   onError={(e) => {
        //     // Fallback for image loading error
        //     e.target.onerror = null;
        //     e.target.src = "https://placehold.co/400x300/6A1B9A/ffffff?text=Document";
        //   }}
        />
      </div>

      {/* Title Section */}
      <div className="p-3 text-center flex-grow flex items-center justify-center">
        <p className="text-gray-800 text-sm font-semibold truncate px-2">
          {paper.title}
        </p>
      </div>
    </div>
  );
};

/**
 * Main application component acting as the Next.js page.
 */
const PYQ = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const themeColor = 'bg-purple-800'; // Dark purple for the header accent

  // Create refs for the hidden file inputs
  const pyqFileInputRef = useRef(null);
  const qbFileInputRef = useRef(null);

  // Function to programmatically click the hidden file input
  const triggerFileInput = (ref) => {
    if (!isUploading && ref.current) {
      ref.current.click();
    }
  };

  // Function to handle the file selection event
  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];

    if (file) {
      setIsUploading(true);
      const form = new FormData();
      form.set('title', file.name);
      form.set('file', file);
      fetch('/api/question-bank', { method: 'POST', body: form })
        .then(res => res.json())
        .then(json => {
          if (json?.data) {
            setPapers((prev) => [json.data, ...prev]);
          } else {
            // Extract error message safely
            let errorMsg = 'Upload failed';
            if (json?.error) {
              if (typeof json.error === 'string') {
                errorMsg = json.error;
              } else if (json.error?.message) {
                errorMsg = String(json.error.message);
              } else {
                try {
                  errorMsg = JSON.stringify(json.error);
                } catch {
                  errorMsg = 'Upload failed';
                }
              }
            }
            setError(errorMsg);
          }
        })
        .catch((err) => {
          console.error('Upload error:', err);
          const errorMsg = err?.message || (typeof err === 'string' ? err : 'Upload failed');
          setError(errorMsg);
        })
        .finally(() => {
          setIsUploading(false);
          console.log('PDF got');
          event.target.value = null;
        });
    }
  };

  // Load papers from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/question-bank')
      .then(res => res.json())
      .then(json => { if (!cancelled) setPapers(json?.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load papers'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const router = useRouter();
 

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section - Matches the image design */}
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
            Question Bank & PYQs
          </h1>
          <div className={`h-2 ${themeColor} w-2/3 sm:w-1/3 mx-auto mt-2 rounded-full shadow-lg`}></div>
        </header>

        {/* Upload Buttons Section */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <button
            onClick={() => triggerFileInput(pyqFileInputRef)}
            disabled={isUploading}
            className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition duration-200 transform hover:shadow-lg ${themeColor} hover:bg-purple-900 disabled:opacity-50`}
          >
            <Upload className="w-5 h-5 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload PYQs'}
          </button>
          <button
            onClick={() => triggerFileInput(qbFileInputRef)}
            disabled={isUploading}
            className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition duration-200 transform hover:shadow-lg ${themeColor} hover:bg-purple-900 disabled:opacity-50`}
          >
            <Upload className="w-5 h-5 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Question Bank'}
          </button>
        </div>

        {/* Hidden File Input Elements */}
        {/* These elements are triggered by clicking the buttons above */}
        <input
          type="file"
          ref={pyqFileInputRef}
          onChange={(e) => handleFileChange(e, 'PYQ')}
          // Accept common document formats
          accept=".pdf,.doc,.docx"
          className="hidden"
        />
        <input
          type="file"
          ref={qbFileInputRef}
          onChange={(e) => handleFileChange(e, 'Question Bank')}
          // Accept common document formats
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        {/* Uploaded Papers Header */}
        <h2 className="text-xl font-bold text-gray-700 mb-4 px-2">
          <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
            Uploaded Papers
          </span>
        </h2>

        {/* Papers Grid Section */}
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : error ? (
          <div className="text-center text-rose-600">{error}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}

        {/* Footer/Navigation Button */}
        <div className="mt-12 w-full flex justify-center">
        <button
          onClick={() => router.push("/dashboard")} // navigate back to dashboard main page
          className="px-10 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 transform hover:scale-[1.05] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-400/50"
        >
          ← Back to Dashboard
        </button>
      </div>
        
      </div>
    </div>
  );
};

export default PYQ;