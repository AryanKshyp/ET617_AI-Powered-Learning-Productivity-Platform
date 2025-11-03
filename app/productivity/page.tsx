"use client";

import { useState } from "react";
import Header from "@/components/dashhome/header";
import PomodoroTimer from "@/components/productivity/PomodoroTimer";
import TaskBoard from "@/components/productivity/TaskBoard";
import WellnessTracker from "@/components/productivity/WellnessTracker";
import GamesHub from "@/components/productivity/GamesHub";
import AnalyticsDashboard from "@/components/productivity/AnalyticsDashboard";
import Leaderboard from "@/components/productivity/Leaderboard";

type TabType = 'focus' | 'tasks' | 'wellness' | 'games' | 'analytics' | 'leaderboard';

export default function ProductivityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('focus');

  const tabs = [
    { id: 'focus' as TabType, label: '🍅 Focus Sessions', icon: '🍅' },
    { id: 'tasks' as TabType, label: '📋 Task Board', icon: '📋' },
    { id: 'wellness' as TabType, label: '💚 Wellness', icon: '💚' },
    { id: 'games' as TabType, label: '🎮 Games & Breaks', icon: '🎮' },
    { id: 'analytics' as TabType, label: '📊 Analytics', icon: '📊' },
    { id: 'leaderboard' as TabType, label: '🏆 Leaderboard', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Productivity & Wellness Hub
          </h1>
          <p className="text-gray-600">
            Stay focused, track habits, play games, and boost your learning efficiency
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 min-h-[600px]">
          {activeTab === 'focus' && <PomodoroTimer />}
          {activeTab === 'tasks' && <TaskBoard />}
          {activeTab === 'wellness' && <WellnessTracker />}
          {activeTab === 'games' && <GamesHub />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'leaderboard' && <Leaderboard />}
        </div>
      </div>
    </div>
  );
}

