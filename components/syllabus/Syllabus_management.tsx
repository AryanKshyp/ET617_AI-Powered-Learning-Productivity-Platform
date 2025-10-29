"use client";

import React from "react";
// Assuming SubjectCard and SyllabusContent are correctly imported based on your component structure
// The paths might need adjustment based on your actual file system, but keeping them as is for now.
import SubjectCard from "@/components/syllabus/SubjectCards";
import SyllabusContent from "@/components/syllabus/SubjectContent";
import { useRouter } from "next/navigation";

const subjects = [
  { code: "CE 334", name: "Structural Analysis", slug: "structural-analysis", image: "https://placehold.co/200x150/505050/ffffff?text=CE+334", syllabus: `## Course Description
This course provides an introduction to the fundamental principles of structural analysis. Students will learn to determine forces, moments, and displacements in statically determinate and indeterminate structures.

## Topics Covered
### Part 1: Statically Determinate Structures
- Principles of statics and equilibrium
- Analysis of trusses, beams, and frames
- Influence lines for determinate structures

### Part 2: Introduction to Indeterminate Structures
- Degrees of freedom
- Method of consistent deformations (Force Method)
- Slope-Deflection Method
- Moment Distribution Method

## Learning Outcomes
- Students will be able to analyze and design simple structural elements.
- Students will understand the concept of static and kinematic indeterminacy.
- Students will be able to apply classical methods to solve indeterminate structures.` 
  },
  { code: "CE 336", name: "Foundation Engineering", slug: "foundation-engineering", image: "https://placehold.co/200x150/505050/ffffff?text=CE+336", syllabus: `## Course Description
A study of soil properties and their application to the design and analysis of shallow and deep foundations.

## Topics Covered
### Part 1: Soil Mechanics Review
- Stress distribution in soils
- Consolidation and settlement analysis
- Shear strength of soils

### Part 2: Shallow Foundations
- Bearing capacity theories (Terzaghi, Meyerhof, etc.)
- Design of spread footings and mat foundations
- Settlement of shallow foundations

### Part 3: Deep Foundations
- Pile foundations (static and dynamic analysis)
- Drilled shafts and caissons
- Lateral earth pressures and retaining walls

## Field Work
- Standard Penetration Test (SPT)
- Cone Penetration Test (CPT)
- Laboratory testing for soil classification and strength.` 
  },
  // Added placeholder syllabus data to make the content view richer
];

export default function SyllabusPage() {
  // state to hold the slug of the currently selected subject, or null for the subject list view
  const [selected, setSelected] = React.useState<string | null>(null);

  const subject = subjects.find(s => s.slug === selected);

  // Function to go back to the main subject list
  const handleGoBack = () => {
    setSelected(null);
  };
  const router = useRouter();
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
        {!subject ? "Select a Course Syllabus" : `Course Syllabus: ${subject.code}`}
      </h1>
      
      {!subject ? (
        // Subject Card View (List)
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {subjects.map(subj => (
            <div 
              key={subj.code} 
              onClick={() => setSelected(subj.slug)}
              // Add accessibility for keyboard users
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelected(subj.slug);
                }
              }}
            >
              <SubjectCard subject={subj} />
            </div>
          ))}
        </div>
      ) : (
        // Syllabus Content View
        <SyllabusContent 
          code={subject.code} 
          name={subject.name} 
          syllabus={subject.syllabus} 
          onGoBack={handleGoBack} // <--- Pass the new handler down
        />
      )}

      <div className="mt-12 w-full flex justify-center">
        <button
          onClick={() => router.push("/dashboard")} // navigate back to dashboard main page
          className="px-10 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 transform hover:scale-[1.05] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-400/50"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}