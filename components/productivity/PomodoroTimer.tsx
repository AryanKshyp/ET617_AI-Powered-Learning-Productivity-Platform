'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

type SessionType = 'pomodoro' | 'forest' | 'custom'

export default function PomodoroTimer() {
  const [running, setRunning] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('pomodoro')
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [distractions, setDistractions] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [trees, setTrees] = useState<number[]>([]) // Forest mode: track completed sessions
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [completedSessions, setCompletedSessions] = useState(0)

  // Fetch user's forest trees
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data } = await supabase
        .from('focus_sessions')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('session_type', 'forest')
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (data) {
        setTrees(Array.from({ length: Math.min(data.length, 20) }, (_, i) => i))
        setCompletedSessions(data.length)
      }
    })()
  }, [])

  useEffect(() => {
    if (running && (minutes > 0 || seconds > 0)) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s === 0) {
            setMinutes((m) => {
              if (m === 0) {
                finishSession()
                return 0
              }
              return m - 1
            })
            return 59
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, minutes, seconds])

  const startSession = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      alert('Please log in')
      return
    }

    const duration = sessionType === 'pomodoro' ? 25 : sessionType === 'forest' ? 25 : minutes
    const res = await fetch('/api/productivity/focus-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userData.user.id,
        session_type: sessionType,
        duration_minutes: duration,
      }),
    })

    const json = await res.json()
    if (json.data) {
      setSessionId(json.data.id)
      setRunning(true)
      if (sessionType === 'pomodoro') setMinutes(25)
      else if (sessionType === 'forest') setMinutes(25)
      setSeconds(0)
    }
  }

  const finishSession = async () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (sessionId) {
      await fetch('/api/productivity/focus-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          completed: true,
          distraction_count: distractions,
        }),
      })

      // Award XP
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        await fetch('/api/productivity/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.user.id,
            amount: 50,
            source: 'focus_session',
            source_id: sessionId,
          }),
        })
      }

      if (sessionType === 'forest') {
        setTrees([...trees, trees.length])
        setCompletedSessions(completedSessions + 1)
      }

      setSessionId(null)
      setDistractions(0)
      alert('🎉 Focus session completed! You earned 50 XP!')
    }
  }

  const stopSession = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (sessionId) {
      fetch('/api/productivity/focus-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, completed: false }),
      })
    }
    setSessionId(null)
    setDistractions(0)
  }

  const recordDistraction = async () => {
    if (running) {
      setDistractions((d) => d + 1)
      // Track distraction event
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        await fetch('/api/productivity/distraction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.user.id,
            event_type: 'manual',
            focus_session_id: sessionId,
          }),
        })
      }
    }
  }

  const formatTime = (m: number, s: number) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Timer Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Focus Timer</h2>
            
            {/* Session Type Selector */}
            <div className="flex gap-2 justify-center mb-6">
              <button
                onClick={() => setSessionType('pomodoro')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  sessionType === 'pomodoro'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                🍅 Pomodoro (25min)
              </button>
              <button
                onClick={() => setSessionType('forest')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  sessionType === 'forest'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                🌲 Forest (25min)
              </button>
              <button
                onClick={() => setSessionType('custom')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  sessionType === 'custom'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                ⚙️ Custom
              </button>
            </div>

            {/* Custom Duration */}
            {sessionType === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 25)}
                  disabled={running}
                  className="w-32 px-3 py-2 border rounded-lg text-center"
                />
              </div>
            )}

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-8 border-purple-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-purple-700">
                    {formatTime(minutes, seconds)}
                  </div>
                  {running && (
                    <div className="mt-2 text-sm text-gray-500">
                      {distractions > 0 && `⚠️ ${distractions} distractions`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              {!running ? (
                <button
                  onClick={startSession}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Start Focus
                </button>
              ) : (
                <button
                  onClick={stopSession}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Stop Session
                </button>
              )}
              {running && (
                <button
                  onClick={recordDistraction}
                  className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
                >
                  ⚠️ Distracted
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Forest Display */}
        {sessionType === 'forest' && (
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <h3 className="text-xl font-bold mb-4 text-green-800">🌲 Your Forest</h3>
            <p className="text-sm text-gray-600 mb-4">
              Each completed session grows a tree! You've completed {completedSessions} sessions.
            </p>
            <div className="grid grid-cols-5 gap-3 min-h-[300px]">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center text-4xl ${
                    trees.includes(i) ? '🌲' : '🌱 opacity-30'
                  }`}
                >
                  {trees.includes(i) ? '🌲' : '🌱'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {sessionType === 'pomodoro' && (
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
            <h3 className="text-xl font-bold mb-4 text-red-800">🍅 Pomodoro Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Completed Sessions:</span>
                <span className="font-semibold">{completedSessions}</span>
              </div>
              <div className="text-sm text-gray-600">
                The Pomodoro Technique: 25 minutes of focused work, then take a 5-minute break.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

