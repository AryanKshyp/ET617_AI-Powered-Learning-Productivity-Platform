'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface LeaderboardEntry {
  user_id: string
  user_email: string
  total_xp: number
  level: number
  rank: number
}

interface GameLeaderboardEntry {
  user_id: string
  user_email: string
  score: number
  rank: number
}

export default function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState<'overall' | 'clickspeed' | 'memory' | 'reaction' | 'sequence'>('overall')
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([])
  const [gameLeaderboard, setGameLeaderboard] = useState<GameLeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRank, setUserRank] = useState<number | null>(null)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (leaderboardType === 'overall') {
      loadOverallLeaderboard()
    } else {
      loadGameLeaderboard()
    }
  }, [leaderboardType, currentUserId])

  const loadCurrentUser = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      setCurrentUserId(userData.user.id)
    }
  }

  const loadOverallLeaderboard = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('user_id, total_xp, level')
      .order('total_xp', { ascending: false })
      .limit(100)

    if (data) {
      // Get user emails (we'll use a simplified approach)
      const entries: LeaderboardEntry[] = data.map((stat, index) => ({
        user_id: stat.user_id,
        user_email: stat.user_id.substring(0, 8) + '...', // Simplified display
        total_xp: stat.total_xp || 0,
        level: stat.level || 1,
        rank: index + 1,
      }))

      setOverallLeaderboard(entries)

      // Find user's rank
      if (currentUserId) {
        const userEntry = entries.find((e) => e.user_id === currentUserId)
        setUserRank(userEntry ? userEntry.rank : null)
      }
    }
  }

  const loadGameLeaderboard = async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('user_id, score')
      .eq('game_type', leaderboardType)
      .order('score', { ascending: leaderboardType === 'reaction' || leaderboardType === 'memory' }) // Lower is better for these
      .limit(50)

    if (data) {
      const entries: GameLeaderboardEntry[] = data.map((score, index) => ({
        user_id: score.user_id || '',
        user_email: score.user_id ? score.user_id.substring(0, 8) + '...' : 'Anonymous',
        score: score.score,
        rank: index + 1,
      }))

      setGameLeaderboard(entries)
    }
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getDisplayScore = (score: number, type: string) => {
    if (type === 'clickspeed' || type === 'sequence') {
      return score.toString()
    }
    if (type === 'reaction' || type === 'memory') {
      return `${score}ms`
    }
    return score.toString()
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">🏆 Leaderboards</h2>
        <p className="text-gray-600">See how you rank against others!</p>
      </div>

      {/* Leaderboard Type Selector */}
      <div className="flex gap-2 justify-center flex-wrap">
        {(['overall', 'clickspeed', 'memory', 'reaction', 'sequence'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setLeaderboardType(type)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              leaderboardType === type
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'overall' ? 'Overall XP' : type}
          </button>
        ))}
      </div>

      {/* User Rank Display */}
      {userRank && leaderboardType === 'overall' && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
          <div className="text-lg font-semibold text-purple-800">
            Your Rank: #{userRank}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {leaderboardType === 'overall' ? 'XP & Level' : 'Score'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(leaderboardType === 'overall' ? overallLeaderboard : gameLeaderboard).map((entry) => (
                <tr
                  key={entry.user_id || entry.rank}
                  className={`hover:bg-gray-50 ${
                    currentUserId === entry.user_id ? 'bg-purple-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold">{getMedal(entry.rank)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.user_email}
                      {currentUserId === entry.user_id && (
                        <span className="ml-2 text-purple-600">(You)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leaderboardType === 'overall' ? (
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {(entry as LeaderboardEntry).total_xp} XP
                        </div>
                        <div className="text-gray-500">Level {(entry as LeaderboardEntry).level}</div>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-gray-900">
                        {getDisplayScore(entry.score, leaderboardType)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {leaderboardType === 'overall' && overallLeaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No leaderboard data available yet. Start earning XP to appear on the leaderboard!
        </div>
      )}

      {leaderboardType !== 'overall' && gameLeaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No scores for this game yet. Be the first to play!
        </div>
      )}
    </div>
  )
}

