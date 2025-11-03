'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReactionGame() {
  const [waiting, setWaiting] = useState(false)
  const [showClick, setShowClick] = useState(false)
  const [reactions, setReactions] = useState<number[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [bestReaction, setBestReaction] = useState<number | null>(null)

  useEffect(() => {
    loadBestScore()
  }, [])

  const loadBestScore = async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('score')
      .eq('game_type', 'reaction')
      .order('score', { ascending: true }) // Lower = better
      .limit(1)
    
    if (data && data[0]) setBestReaction(data[0].score)
  }

  const startRound = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    setWaiting(true)
    setShowClick(false)
    setGameStarted(true)
    
    // Random delay between 1-4 seconds
    const delay = 1000 + Math.random() * 3000
    
    timeoutRef.current = setTimeout(() => {
      setWaiting(false)
      setShowClick(true)
      startTimeRef.current = Date.now()
    }, delay)
  }

  const handleClick = async () => {
    if (!showClick) {
      // Clicked too early
      setWaiting(false)
      setShowClick(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      alert('Too early! Wait for the green circle.')
      return
    }

    const reactionTime = Date.now() - startTimeRef.current
    setReactions([...reactions, reactionTime])
    setShowClick(false)

    if (reactions.length >= 4) {
      // Game complete - calculate average
      const avgReaction = [...reactions, reactionTime].reduce((a, b) => a + b, 0) / 5
      
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      
      if (user) {
        await fetch('/api/productivity/game-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            game_type: 'reaction',
            score: Math.round(avgReaction),
            metadata: { individual_times: [...reactions, reactionTime] },
          }),
        })

        // Award XP
        await fetch('/api/productivity/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            amount: 25,
            source: 'game',
            description: 'Completed Reaction Test',
          }),
        })

        loadBestScore()
      }

      alert(`Game Complete! Average reaction time: ${Math.round(avgReaction)}ms`)
      setReactions([])
      setGameStarted(false)
    } else {
      // Next round
      setTimeout(() => {
        startRound()
      }, 1000)
    }
  }

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setReactions([])
    setWaiting(false)
    setShowClick(false)
    setGameStarted(false)
  }

  const avgReaction = reactions.length > 0 
    ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
    : 0

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Reaction Time Test</h3>
        <p className="text-gray-600 mb-4">
          Click as fast as you can when the circle turns green!<br />
          Complete 5 rounds to see your average.
        </p>
        {bestReaction && (
          <div className="text-sm text-gray-600 mb-2">Best Average: {bestReaction}ms</div>
        )}
      </div>

      <div className="mb-6">
        <div className="text-lg">
          Round {reactions.length + 1} / 5
        </div>
        {reactions.length > 0 && (
          <div className="text-sm text-gray-600 mt-2">
            Current Average: {avgReaction}ms
          </div>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={gameStarted ? handleClick : startRound}
          disabled={waiting}
          className={`w-64 h-64 rounded-full text-white text-xl font-bold transition-all ${
            waiting
              ? 'bg-gray-400 cursor-wait'
              : showClick
              ? 'bg-green-500 hover:bg-green-600 cursor-pointer animate-pulse'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {waiting ? 'Wait...' : showClick ? 'CLICK NOW!' : gameStarted ? 'Too Early!' : 'Start Round'}
        </button>
      </div>

      {reactions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Recent Times:</h4>
          <div className="flex gap-2 justify-center flex-wrap">
            {reactions.map((time, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded">
                {time}ms
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={resetGame}
        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
      >
        Reset Game
      </button>
    </div>
  )
}

