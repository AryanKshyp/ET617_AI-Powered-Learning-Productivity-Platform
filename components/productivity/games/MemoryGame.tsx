'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const CARD_PAIRS = 8
const SYMBOLS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝', '🍑', '🍒']

export default function MemoryGame() {
  const [cards, setCards] = useState<Array<{ id: number; symbol: string; flipped: boolean; matched: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)

  useEffect(() => {
    initializeGame()
    loadBestScore()
  }, [])

  const loadBestScore = async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('score')
      .eq('game_type', 'memory')
      .order('score', { ascending: true }) // Lower moves = better
      .limit(1)
    
    if (data && data[0]) setBestScore(data[0].score)
  }

  const initializeGame = () => {
    const symbols = [...SYMBOLS].slice(0, CARD_PAIRS)
    const pairs = [...symbols, ...symbols]
    
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]]
    }

    setCards(
      pairs.map((symbol, index) => ({
        id: index,
        symbol,
        flipped: false,
        matched: false,
      }))
    )
    setFlippedCards([])
    setMoves(0)
    setScore(0)
    setGameOver(false)
  }

  const handleCardClick = (cardId: number) => {
    if (gameOver || flippedCards.length >= 2) return
    
    const card = cards[cardId]
    if (card.flipped || card.matched) return

    const newCards = cards.map((c) =>
      c.id === cardId ? { ...c, flipped: true } : c
    )
    setCards(newCards)

    if (flippedCards.length === 0) {
      setFlippedCards([cardId])
    } else {
      const firstCard = cards[flippedCards[0]]
      const newMoves = moves + 1
      setMoves(newMoves)

      if (firstCard.symbol === card.symbol) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.symbol === card.symbol ? { ...c, matched: true, flipped: false } : c
            )
          )
          setFlippedCards([])
          setScore(score + 10)
          
          // Check if game over
          const allMatched = newCards.filter(c => c.id === cardId || c.id === flippedCards[0]).every(c => c.matched)
          if (newCards.filter(c => c.matched).length === CARD_PAIRS * 2 - 2) {
            finishGame(newMoves)
          }
        }, 1000)
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              flippedCards.includes(c.id) || c.id === cardId ? { ...c, flipped: false } : c
            )
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const finishGame = async (finalMoves: number) => {
    setGameOver(true)
    
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    
    if (user) {
      await fetch('/api/productivity/game-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            game_type: 'memory',
            score: finalMoves,
            metadata: { pairs: CARD_PAIRS },
          }),
        })

        // Award XP
        await fetch('/api/productivity/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            amount: 30,
            source: 'game',
            description: 'Completed Memory Game',
          }),
        })
      }

      loadBestScore()
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold">Moves: {moves}</div>
          <div className="text-lg">Score: {score}</div>
        </div>
        <div>
          {bestScore && <div className="text-sm text-gray-600">Best: {bestScore} moves</div>}
          <button
            onClick={initializeGame}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            New Game
          </button>
        </div>
      </div>

      {gameOver && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">
          🎉 Congratulations! You completed the game in {moves} moves!
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || gameOver}
            className={`aspect-square text-4xl rounded-lg transition-all ${
              card.matched
                ? 'bg-green-200 opacity-50'
                : card.flipped
                ? 'bg-white shadow-lg'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {card.flipped || card.matched ? card.symbol : '?'}
          </button>
        ))}
      </div>
    </div>
  )
}

