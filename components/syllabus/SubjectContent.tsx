"use client";

import React from "react";
// Removed unused useRouter import

interface SyllabusContentProps {
  code: string;
  name: string;
  syllabus: string;
  onGoBack: () => void; // <--- Added new prop for the back action
}

const SyllabusContent: React.FC<SyllabusContentProps> = ({ code, name, syllabus, onGoBack }) => {
  

  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, index) => {
      if (block.startsWith("##")) {
        return <h2 key={index} className="text-3xl font-bold mt-8 mb-4 border-b-2 pb-2 text-[#4A47A3]">{block.replace("##", "").trim()}</h2>;
      }
      if (block.startsWith("###")) {
        return <h3 key={index} className="text-xl font-semibold mt-6 mb-2 text-gray-700">{block.replace("###", "").trim()}</h3>;
      }
      if (block.trim()) {
        const lines = block.split("\n").map(line => line.trim());
        const listItems = lines.filter(line => line.startsWith("-"));
        
        // If it's a list, render a list
        if (listItems.length > 0) {
            return (
                <ul key={index} className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                    {listItems.map((item, i) => <li key={i}>{item.substring(1).trim()}</li>)}
                </ul>
            );
        }
        
        // Otherwise, render a regular paragraph
        return <p key={index} className="text-base text-gray-700 mb-4 leading-relaxed">{block.trim()}</p>
      }
      return null;
    });
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-900">{code}: {name}</h1>
      <div className="mb-8 border-t border-gray-200 pt-4">
        {/* Rendered syllabus content */}
        {renderContent(syllabus)}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={onGoBack} // <--- Implemented the click handler
          className="px-10 py-3 bg-[#4A47A3] text-white font-bold rounded-full shadow-lg hover:bg-[#6A67D6] transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#4A47A3]/50"
        >
          ← Go Back to Subjects
        </button>
      </div>
    </div>
  );
};

export default SyllabusContent;
