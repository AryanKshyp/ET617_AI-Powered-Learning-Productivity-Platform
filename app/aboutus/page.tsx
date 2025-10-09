"use client";

import { useState } from "react";
import classroom from "@/public/classroom.png";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-purple-700">ProLearn AI</h1>
        <nav className="flex items-center gap-8">
          <a href="/aboutus" className="hover:text-purple-700">About Us</a>

          {/* Login dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
            >
              Log In
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg overflow-hidden">
                <Link
                  href="/login/student"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Student
                </Link>
                <Link
                  href="/login/teacher"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Teacher
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row items-start lg:items-stretch px-8 py-12 gap-8">
        {/* Left Side Image */}
        <div className="lg:w-1/2">
          <Image src={classroom} alt="Classroom" className="rounded-lg" />
        </div>

        {/* Right Side Text */}
        <div className="lg:w-1/2 bg-purple-50 p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">About Us:</h2>
          <p className="mb-3 leading-relaxed">
            At ProLearnAI, we believe learning is most impactful when students and teachers grow together. 
            Our AI-powered platform is designed to create a seamless bridge between teaching and studying 
            by listening to what really matters—feedback.
          </p>
          <p className="mb-3 leading-relaxed">
            We collect insights from both students and teachers, analyze them using advanced AI, 
            and transform them into tailored learning materials, resources, and strategies. 
            Whether you're a student striving to understand concepts better, or a teacher looking for 
            effective tools to explain them, our platform ensures that the right content reaches the 
            right person at the right time.
          </p>
          <p className="mb-3 leading-relaxed">
            Our mission is simple: to make education smarter, personalized, and more productive for everyone. 
            By combining human feedback with the power of AI, we are reimagining how knowledge is shared, 
            understood, and applied.
          </p>
          <p className="leading-relaxed">
            Together, we’re not just building a platform—we’re building a future where learning and 
            teaching continuously improve, hand in hand.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white text-sm px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>
          For any queries: <span className="font-semibold">Mobile No. 9589375565</span>
        </p>
        <p>
          Email ID: <span className="font-semibold">harshitak232@gmail.com</span>
        </p>
      </footer>
    </div>
  );
}

