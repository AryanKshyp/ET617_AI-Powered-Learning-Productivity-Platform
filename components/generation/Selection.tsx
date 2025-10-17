"use client";

import React from 'react';
import { ArrowLeft, BookOpen, PenTool, ClipboardCheck } from 'lucide-react';
import { useRouter } from "next/navigation";

// Define the available pages/views

/**
 * Component for the "Assignment, Quizzes & Question Paper Generation" menu.
 */
const GenerationMenu = () => {
    const themeColor = 'bg-purple-800'; // Dark purple for the header accent

    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white rounded-lg shadow-2xl mx-auto my-8 max-w-xl">

            {/* Header Section - Matches the design */}
            <header className="text-center mb-12 w-full px-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
                    Assignment, Quizzes & Question Paper Generation
                </h1>
                {/* Purple bar accent */}
                <div className={`h-2 ${themeColor} w-full mx-auto mt-2 rounded-full shadow-lg`}></div>
            </header>

            <div className="flex flex-col items-center space-y-6 w-full max-w-xs">
                {/* Note: All buttons related to "Generation" now navigate to the Question Bank Upload page
           as that is the implied starting point for these features based on your request. */}

                <button
                    onClick={() => router.push('assignment')}
                    className="flex items-center justify-center w-full px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg shadow-xl transition duration-300 transform hover:scale-[1.03] hover:bg-gray-700 active:scale-[1.01]"
                >
                    <ClipboardCheck className="w-6 h-6 mr-3" />
                    Generate Assignment
                </button>

                <button
                    onClick={() => router.push('quiz')}
                    className="flex items-center justify-center w-full px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg shadow-xl transition duration-300 transform hover:scale-[1.03] hover:bg-gray-700 active:scale-[1.01]"
                >
                    <PenTool className="w-6 h-6 mr-3" />
                    Generate Quiz
                </button>

                <button
                    // All generation options currently lead to the Question Bank/PYQs upload page for simplicity
                    onClick={() => router.push('questionPaper')}
                    className="flex items-center justify-center w-full px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg shadow-xl transition duration-300 transform hover:scale-[1.03] hover:bg-gray-700 active:scale-[1.01]"
                >
                    <BookOpen className="w-6 h-6 mr-3" />
                    Generate Question Paper
                </button>
            </div>

            {/* Go Back Button at the bottom left */}
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
};

export default GenerationMenu;
