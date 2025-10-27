"use client";

import { useState } from "react";
import classroom from "@/public/classroom.png";
import teacher from "@/public/teacher.png";
import quiz from "@/public/quiz.png";
import pyqs from "@/public/pyqs.png";
import Image from "next/image";
import Link from "next/link";

export default function AboutUs() {
  const [open, setOpen] = useState(false);

  const values = [
    {
      icon: "🎯",
      title: "Personalized Learning",
      description: "Every student learns differently. Our AI adapts to individual learning styles and pace."
    },
    {
      icon: "🤝",
      title: "Collaborative Growth",
      description: "We believe in the power of teacher-student collaboration to enhance educational outcomes."
    },
    {
      icon: "🚀",
      title: "Innovation First",
      description: "We continuously evolve our platform with cutting-edge AI technology and educational research."
    },
    {
      icon: "📊",
      title: "Data-Driven Insights",
      description: "Our platform provides actionable insights to improve both teaching and learning experiences."
    }
  ];

  const team = [
    {
      name: "AI Research Team",
      role: "Machine Learning & NLP",
      description: "Developing advanced algorithms for content generation and personalization"
    },
    {
      name: "Education Specialists",
      role: "Pedagogy & Curriculum Design",
      description: "Ensuring our platform aligns with educational best practices and learning theories"
    },
    {
      name: "Product Development",
      role: "User Experience & Design",
      description: "Creating intuitive interfaces that make learning accessible and engaging"
    },
    {
      name: "Data Science Team",
      role: "Analytics & Insights",
      description: "Building systems to track progress and provide meaningful feedback"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ProLearn AI
              </h1>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/aboutus" className="text-purple-600 font-medium">
                About Us
              </Link>
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Get Started
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
                    <Link
                      href="/login/student"
                      className="block px-6 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                      🎓 Student Login
                    </Link>
                    <Link
                      href="/login/teacher"
                      className="block px-6 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                      👨‍🏫 Teacher Login
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About
              <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ProLearn AI
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing education through AI-powered personalized learning experiences, 
              bridging the gap between teaching and learning for a smarter future.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  At ProLearn AI, we believe learning is most impactful when students and teachers grow together. 
                  Our AI-powered platform is designed to create a seamless bridge between teaching and studying 
                  by listening to what really matters—feedback.
                </p>
                <p>
                  We collect insights from both students and teachers, analyze them using advanced AI, 
                  and transform them into tailored learning materials, resources, and strategies. 
                  Whether you're a student striving to understand concepts better, or a teacher looking for 
                  effective tools to explain them, our platform ensures that the right content reaches the 
                  right person at the right time.
                </p>
                <p>
                  Our mission is simple: to make education smarter, personalized, and more productive for everyone. 
                  By combining human feedback with the power of AI, we are reimagining how knowledge is shared, 
                  understood, and applied.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src={classroom} 
                  alt="Modern Classroom" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at ProLearn AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How We Work</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our three-step process that transforms education through AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Collect Feedback</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                We gather insights from both students and teachers about their learning and teaching experiences, 
                understanding what works and what needs improvement.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI Analysis</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our advanced AI algorithms analyze the collected data to identify patterns, 
                learning preferences, and areas for improvement in educational content.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Generate Content</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                We create personalized learning materials, quizzes, and resources tailored to individual 
                needs, ensuring optimal learning outcomes for every student.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind ProLearn AI's innovation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {member.name}
                </h3>
                <p className="text-purple-600 font-medium text-center mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Together, we're not just building a platform—we're building a future where learning and 
              teaching continuously improve, hand in hand.
            </p>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              We envision a world where every student has access to personalized, effective learning experiences, 
              and every teacher has the tools and insights needed to make a lasting impact on their students' lives.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Our Mission?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Be part of the educational revolution with ProLearn AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login/student"
              className="px-8 py-4 bg-white text-purple-600 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200"
            >
              Start Learning
            </Link>
            <Link
              href="/login/teacher"
              className="px-8 py-4 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-200"
            >
              Start Teaching
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <h3 className="text-2xl font-bold">ProLearn AI</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Revolutionizing education through AI-powered personalized learning experiences. 
                Bridging the gap between teaching and learning for a smarter future.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 ProLearn AI. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/aboutus" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/login/student" className="text-gray-400 hover:text-white transition-colors">Student Login</Link></li>
                <li><Link href="/login/teacher" className="text-gray-400 hover:text-white transition-colors">Teacher Login</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p>📞 +91 9589375565</p>
                <p>✉️ harshitak232@gmail.com</p>
                <p>🌐 www.prolearnai.com</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

