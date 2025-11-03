'use client'
import { useState } from 'react'
import ClickSpeedGame from '@/components/ClickSpeedGame'
import MemoryGame from '@/components/productivity/games/MemoryGame'
import ReactionGame from '@/components/productivity/games/ReactionGame'
import SequenceGame from '@/components/productivity/games/SequenceGame'

type GameType = 'clickspeed' | 'memory' | 'reaction' | 'sequence'

export default function GamesHub() {
  const [activeGame, setActiveGame] = useState<GameType>('clickspeed')

  const games = [
    { id: 'clickspeed' as GameType, name: 'Click Speed', icon: '⚡', description: 'Test your clicking speed!' },
    { id: 'memory' as GameType, name: 'Memory Match', icon: '🧠', description: 'Find matching pairs' },
    { id: 'reaction' as GameType, name: 'Reaction Time', icon: '🎯', description: 'Test your reflexes' },
    { id: 'sequence' as GameType, name: 'Number Sequence', icon: '🔢', description: 'Memorize number patterns' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">🎮 Games & Brain Breaks</h2>
        <p className="text-gray-600">Take a break and challenge yourself!</p>
      </div>

      {/* Game Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeGame === game.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-4xl mb-2">{game.icon}</div>
            <div className="font-semibold">{game.name}</div>
            <div className="text-xs text-gray-500 mt-1">{game.description}</div>
          </button>
        ))}
      </div>

      {/* Game Display */}
      <div className="bg-gray-50 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
        {activeGame === 'clickspeed' && <ClickSpeedGame />}
        {activeGame === 'memory' && <MemoryGame />}
        {activeGame === 'reaction' && <ReactionGame />}
        {activeGame === 'sequence' && <SequenceGame />}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Playing games during study breaks can help refresh your mind and improve focus when you return to studying!
        </p>
      </div>
    </div>
  )
}

