'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type HabitType = 'sleep' | 'hydration' | 'mindfulness' | 'movement'

interface Habit {
  id: string
  habit_type: HabitType
  target_value: number
  unit: string
}

interface HabitLog {
  habit_id: string
  log_date: string
  value: number
}

export default function WellnessTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayLogs, setTodayLogs] = useState<Record<string, number>>({})
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    loadHabits()
    loadTodayLogs()
    loadStreak()
  }, [])

  const loadHabits = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('wellness_habits')
      .select('*')
      .eq('user_id', userData.user.id)

    if (data && data.length > 0) {
      setHabits(data)
    } else {
      // Create default habits if none exist
      await createDefaultHabits()
    }
  }

  const createDefaultHabits = async () => {
    const defaults = [
      { habit_type: 'sleep', target_value: 8, unit: 'hours' },
      { habit_type: 'hydration', target_value: 8, unit: 'glasses' },
      { habit_type: 'mindfulness', target_value: 10, unit: 'minutes' },
      { habit_type: 'movement', target_value: 30, unit: 'minutes' },
    ]

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const res = await fetch('/api/productivity/wellness-habit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userData.user.id, habits: defaults }),
    })

    const json = await res.json()
    if (json.data) {
      setHabits(json.data)
    }
  }

  const loadTodayLogs = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('habit_logs')
      .select('habit_id, value')
      .eq('user_id', userData.user.id)
      .eq('log_date', today)

    if (data) {
      const logs: Record<string, number> = {}
      data.forEach((log) => {
        logs[log.habit_id] = log.value
      })
      setTodayLogs(logs)
    }
  }

  const loadStreak = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('user_stats')
      .select('streak_days')
      .eq('user_id', userData.user.id)
      .single()

    if (data) {
      setStreak(data.streak_days || 0)
    }
  }

  const logHabit = async (habitId: string, value: number) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const res = await fetch('/api/productivity/wellness-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userData.user.id, habit_id: habitId, value }),
    })

    const json = await res.json()
    if (json.data) {
      setTodayLogs({ ...todayLogs, [habitId]: value })
      
      // Award XP for logging habits
      if (userData.user) {
        await fetch('/api/productivity/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.user.id,
            amount: 10,
            source: 'habit',
            source_id: habitId,
          }),
        })
      }

      loadStreak()
    }
  }

  const getHabitIcon = (type: HabitType) => {
    switch (type) {
      case 'sleep':
        return '😴'
      case 'hydration':
        return '💧'
      case 'mindfulness':
        return '🧘'
      case 'movement':
        return '🏃'
      default:
        return '💚'
    }
  }

  const getHabitName = (type: HabitType) => {
    switch (type) {
      case 'sleep':
        return 'Sleep'
      case 'hydration':
        return 'Hydration'
      case 'mindfulness':
        return 'Mindfulness'
      case 'movement':
        return 'Movement'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Streak Display */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">🔥</div>
        <div className="text-3xl font-bold mb-1">{streak} Days</div>
        <div className="text-purple-100">Current Streak</div>
      </div>

      {/* Habits Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {habits.map((habit) => {
          const currentValue = todayLogs[habit.id] || 0
          const progress = Math.min((currentValue / habit.target_value) * 100, 100)

          return (
            <div
              key={habit.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getHabitIcon(habit.habit_type)}</span>
                  <div>
                    <h3 className="text-xl font-bold">{getHabitName(habit.habit_type)}</h3>
                    <p className="text-sm text-gray-500">
                      Target: {habit.target_value} {habit.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {currentValue} / {habit.target_value} {habit.unit}
                  </span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      progress >= 100
                        ? 'bg-green-500'
                        : progress >= 50
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Log */}
              <div className="flex gap-2">
                <button
                  onClick={() => logHabit(habit.id, Math.max(0, currentValue - 1))}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={habit.target_value * 2}
                  value={currentValue}
                  onChange={(e) => logHabit(habit.id, parseInt(e.target.value) || 0)}
                  className="flex-1 px-4 py-2 border rounded-lg text-center"
                />
                <button
                  onClick={() => logHabit(habit.id, currentValue + 1)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  +
                </button>
              </div>

              {progress >= 100 && (
                <div className="mt-3 text-center text-green-600 font-semibold">
                  ✨ Goal achieved today!
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Wellness Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-bold text-lg mb-3 text-blue-800">💡 Wellness Tips</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• Aim for 7-9 hours of sleep for optimal cognitive function</li>
          <li>• Drink water regularly throughout the day</li>
          <li>• Take 5-10 minute mindfulness breaks to reduce stress</li>
          <li>• Include 30 minutes of physical activity daily</li>
        </ul>
      </div>
    </div>
  )
}

