'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ClickSpeedGame() {
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [count, setCount] = useState(0)
  const [best, setBest] = useState<number|null>(null)
  const audioRef = useRef<HTMLAudioElement|null>(null)

  useEffect(() => {
    // fetch best score
    (async ()=>{
      const { data } = await supabase.from('highscores').select('score').order('score', { ascending: false }).limit(1)
      if (data && data[0]) setBest(data[0].score)
    })()
  }, [])

  useEffect(() => {
    let t: any = null
    if (running) {
      audioRef.current?.play().catch(()=>{})
      t = setInterval(()=> setTimeLeft(t=>t-1), 1000)
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
      setTimeLeft(10)
    }
    if (timeLeft <= 0 && running) {
      setRunning(false)
      finish()
    }
    return ()=> clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft])

  const start = () => { setCount(0); setTimeLeft(10); setRunning(true) }

  const click = () => { if (!running) return; setCount(c=>c+1) }

  async function finish() {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      await fetch('/api/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: count, user_id: user?.id ?? null })
      })
      // refresh best
      const { data } = await supabase.from('highscores').select('score').order('score', { ascending: false }).limit(1)
      if (data && data[0]) setBest(data[0].score)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className='bg-white p-4 rounded shadow text-center'>
      <h4 className='font-bold mb-2'>Click Speed Game</h4>
      <div className='mb-2'>
        <div className='text-3xl font-extrabold'>{count}</div>
        <div className='text-sm text-slate-500'>Time left: {timeLeft}s</div>
      </div>

      <div className='flex gap-2 justify-center'>
        <button className='bg-red-500 text-white px-4 py-2 rounded' onClick={start}>Start</button>
        <button className='bg-emerald-500 text-white px-4 py-2 rounded' onClick={click}>Click!</button>
      </div>

      <div className='mt-3'>
        <div className='text-sm'>Best: {best ?? '—'}</div>
      </div>

      <audio ref={audioRef} src='/music.mp3' loop />
    </div>
  )
}
