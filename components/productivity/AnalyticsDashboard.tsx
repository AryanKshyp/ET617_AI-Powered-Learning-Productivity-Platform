'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface AnalyticsData {
  totalStudyHours: number
  averageSessionDuration: number
  studySessions: number
  retentionScore: number
  efficiencyScore: number
  focusSessionsCompleted: number
  tasksCompleted: number
  habitsLogged: number
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setLoading(false)
      return
    }

    const userId = userData.user.id
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }

    try {
      // Learning sessions
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('duration_minutes, retention_score, efficiency_score')
        .eq('user_id', userId)
        .gte('session_date', startDate.toISOString().split('T')[0])

      // Focus sessions
      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', startDate.toISOString())

      // Tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())

      // Habit logs
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate.toISOString().split('T')[0])

      // Calculate analytics
      const totalStudyHours = sessions
        ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60
        : 0
      const avgDuration =
        sessions && sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
          : 0
      const avgRetention =
        sessions && sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.retention_score || 0), 0) / sessions.length
          : 0
      const avgEfficiency =
        sessions && sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.efficiency_score || 0), 0) / sessions.length
          : 0

      setAnalytics({
        totalStudyHours: Math.round(totalStudyHours * 10) / 10,
        averageSessionDuration: Math.round(avgDuration),
        studySessions: sessions?.length || 0,
        retentionScore: Math.round(avgRetention * 10) / 10,
        efficiencyScore: Math.round(avgEfficiency * 10) / 10,
        focusSessionsCompleted: focusSessions?.length || 0,
        tasksCompleted: tasks?.length || 0,
        habitsLogged: habitLogs?.length || 0,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-500">No analytics data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-end">
        {(['week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium ${
              timeRange === range
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Study Hours"
          value={analytics.totalStudyHours}
          unit="hours"
          icon="📚"
          color="blue"
        />
        <MetricCard
          title="Focus Sessions"
          value={analytics.focusSessionsCompleted}
          unit="sessions"
          icon="🍅"
          color="red"
        />
        <MetricCard
          title="Tasks Completed"
          value={analytics.tasksCompleted}
          unit="tasks"
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Habits Logged"
          value={analytics.habitsLogged}
          unit="logs"
          icon="💚"
          color="purple"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">📊 Study Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Average Session Duration</span>
                <span className="font-semibold">{analytics.averageSessionDuration} min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min((analytics.averageSessionDuration / 60) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Sessions</span>
                <span className="font-semibold">{analytics.studySessions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">🎯 Learning Efficiency</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Retention Score</span>
                <span className="font-semibold">
                  {analytics.retentionScore > 0 ? `${analytics.retentionScore}/100` : 'N/A'}
                </span>
              </div>
              {analytics.retentionScore > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      analytics.retentionScore >= 80
                        ? 'bg-green-500'
                        : analytics.retentionScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${analytics.retentionScore}%` }}
                  ></div>
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Efficiency Score</span>
                <span className="font-semibold">
                  {analytics.efficiencyScore > 0 ? `${analytics.efficiencyScore}/100` : 'N/A'}
                </span>
              </div>
              {analytics.efficiencyScore > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      analytics.efficiencyScore >= 80
                        ? 'bg-green-500'
                        : analytics.efficiencyScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${analytics.efficiencyScore}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-xl font-bold mb-4">💡 Insights & Recommendations</h3>
        <ul className="space-y-2 text-gray-700">
          {analytics.averageSessionDuration < 30 && (
            <li>• Consider longer study sessions for better retention (aim for 45-60 minutes)</li>
          )}
          {analytics.focusSessionsCompleted < 5 && (
            <li>• Use focus timers more regularly to improve productivity</li>
          )}
          {analytics.retentionScore > 0 && analytics.retentionScore < 70 && (
            <li>• Your retention could improve - try active recall techniques</li>
          )}
          {analytics.habitsLogged < 10 && (
            <li>• Track wellness habits consistently to maintain study balance</li>
          )}
          {analytics.totalStudyHours > 20 && (
            <li>• Great job! You've put in significant study hours this period</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  unit,
  icon,
  color,
}: {
  title: string
  value: number
  unit: string
  icon: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  }

  return (
    <div className={`border-2 rounded-xl p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{unit}</div>
    </div>
  )
}

