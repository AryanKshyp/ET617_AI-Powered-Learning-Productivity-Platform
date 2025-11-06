'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SequenceGame() {
  const [sequence, setSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'waiting' | 'showing' | 'input' | 'wrong' | 'won'>('waiting')
  const [bestLevel, setBestLevel] = useState<number | null>(null)

  useEffect(() => {
    loadBestScore()
  }, [])

  const loadBestScore = async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('score')
      .eq('game_type', 'sequence')
      .order('score', { ascending: false })
      .limit(1)
    
    if (data && data[0]) setBestLevel(data[0].score)
  }

  const generateSequence = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1)
  }

  const startLevel = () => {
    const newSequence = generateSequence(level + 2)
    setSequence(newSequence)
    setUserInput([])
    setGameState('showing')

    // Show sequence
    let index = 0
    const showInterval = setInterval(() => {
      if (index < newSequence.length) {
        setSequence(newSequence.map((n, i) => (i === index ? n : 0)))
        index++
      } else {
        clearInterval(showInterval)
        setGameState('input')
        setSequence(new Array(newSequence.length).fill(0))
      }
    }, 800)
  }

  const handleNumberClick = (num: number) => {
    if (gameState !== 'input') return

    const newInput = [...userInput, num]
    setUserInput(newInput)

    // Check if correct
    if (newInput.length === sequence.length) {
      const correct = newInput.every((n, i) => n === sequence[i])
      
      if (correct) {
        // Next level
        setLevel(level + 1)
        setGameState('won')
        setTimeout(() => {
          startLevel()
        }, 1500)
      } else {
        // Game over
        setGameState('wrong')
        finishGame()
      }
    }
  }

  const finishGame = async () => {
    const finalLevel = level

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    
    if (user) {
      await fetch('/api/productivity/game-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            game_type: 'sequence',
            score: finalLevel,
            metadata: { sequence_length: sequence.length },
          }),
        })

        // Award XP
        await fetch('/api/productivity/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            amount: 20 + finalLevel * 5,
            source: 'game',
            description: `Completed Sequence Game - Level ${finalLevel}`,
          }),
        })
      }

      loadBestScore()
  }

  const resetGame = () => {
    setLevel(1)
    setSequence([])
    setUserInput([])
    setGameState('waiting')
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Number Sequence Memory</h3>
        <p className="text-gray-600 mb-4">
          Watch the sequence, then repeat it!
        </p>
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">
            Level: <span className="font-bold">{level}</span>
          </div>
          {bestLevel && (
            <div className="text-sm text-gray-600">
              Best: Level {bestLevel}
            </div>
          )}
        </div>
      </div>

      {/* Sequence Display */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {sequence.map((num, i) => (
            <div
              key={i}
              className={`aspect-square text-4xl font-bold rounded-lg flex items-center justify-center transition-all ${
                num > 0
                  ? 'bg-purple-500 text-white scale-110 shadow-lg'
                  : 'bg-gray-200 text-transparent'
              }`}
            >
              {num > 0 ? num : ''}
            </div>
          ))}
        </div>

        {gameState === 'showing' && (
          <div className="text-blue-600 font-semibold">Watch carefully...</div>
        )}
        {gameState === 'input' && (
          <div className="text-green-600 font-semibold">Your turn! Click the numbers in order</div>
        )}
        {gameState === 'won' && (
          <div className="text-green-600 font-semibold">Correct! Next level...</div>
        )}
        {gameState === 'wrong' && (
          <div className="text-red-600 font-semibold">Wrong sequence! Game over.</div>
        )}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            disabled={gameState !== 'input'}
            className={`aspect-square text-3xl font-bold rounded-lg transition-all ${
              gameState === 'input'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* User Input Display */}
      {userInput.length > 0 && gameState === 'input' && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Your input:</div>
          <div className="flex gap-2 justify-center">
            {userInput.map((num, i) => (
              <span key={i} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xl font-bold">
                {num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {gameState === 'waiting' && (
          <button
            onClick={startLevel}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Start Game
          </button>
        )}
        {gameState === 'wrong' && (
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  )
}

