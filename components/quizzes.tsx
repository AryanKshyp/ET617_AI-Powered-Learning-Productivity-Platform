'use client'
import { useEffect, useMemo, useState } from 'react'

type Q = { id: number, q: string, options: string[], a: number }

// Three quizzes (Easy, Medium, Hard) — questions are paraphrased from Brainstellar puzzles as starter content.
export const QUIZZES: Record<string, Q[]> = {
  easy: [
    { id:1, q:'A fair coin is flipped repeatedly. What is the probability of getting two heads in a row before two tails in a row?', options:['1/2','1/3','2/3','3/4'], a:0 },
    { id:2, q:'You have 2 eggs and 100-floor building. What is the minimum worst-case drops required?', options:['10','14','20','7'], a:1 },
    { id:3, q:'Monty Hall: pick door 1, host opens door 3 revealing a goat. Should you switch to door 2?', options:['Yes','No','Doesn\'t matter','Only if host is random'], a:0 },
    { id:4, q:'A snail climbs 3ft by day and slides 2ft by night. How many days to climb 30ft?', options:['28','27','30','26'], a:0 },
    { id:5, q:'Two envelopes problem: you have two envelopes, one has double the other. Is it beneficial to switch?', options:['Yes','No','Indeterminate','Only if you know distribution'], a:3 }
  ],
  medium: [
    { id:1, q:'You start at origin and do symmetric random walk. What is probability you reach +a before -b?', options:['a/(a+b)','b/(a+b)','a-b/(a+b)','a*a/(a+b)'], a:1 },
    { id:2, q:'You have n coins; expected number of flips until first head?', options:['1','2','n','Depends'], a:0 },
    { id:3, q:'Given 100 light bulbs toggled by divisors, how many remain ON?', options:['10','9','1','sqrt(100)'], a:3 },
    { id:4, q:'A deck is shuffled; probability two adjacent cards are in increasing order?', options:['1/2','1/3','1/4','2/3'], a:0 },
    { id:5, q:'You want to partition candies equally with minimal swaps; general approach?', options:['Greedy','Sort and split','Randomize','Impossible'], a:1 }
  ],
  hard: [
    { id:1, q:'What is the smallest k such that 1+2+...+k >= 100?', options:['13','14','15','12'], a:0 },
    { id:2, q:'Random point inside unit disk: probability it lies closer to center than to boundary?', options:['1/4','1/2','3/4','1'], a:1 },
    { id:3, q:'Expected number of trials to collect all coupons with n types?', options:['n','n log n','sqrt(n)','n^2'], a:1 },
    { id:4, q:'Probability of no fixed point in a random permutation (derangement) tends to?', options:['1/e','0','1','1/2'], a:0 },
    { id:5, q:'Given coins fair, probability of exactly k heads in n flips?', options:['C(n,k)/2^n','k/n','1/2^k','nCk'], a:0 }
  ]
}

export function Quiz({ level }:{ level: 'easy'|'medium'|'hard'}) {
  const qs = QUIZZES[level]
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [selected, setSelected] = useState<number|null>(null)
  const [revealed, setRevealed] = useState(false)

  const progressPercent = useMemo(()=> ((index) / qs.length) * 100, [index, qs.length])

  useEffect(()=>{ setSelected(null); setRevealed(false) }, [index])

  const onSelect = (i:number) => {
    if (done || revealed) return
    setSelected(i)
    const isCorrect = i === qs[index].a
    if (isCorrect) setScore(s=>s+1)
    setRevealed(true)
  }

  const goNext = () => {
    if (index+1 === qs.length) setDone(true)
    else setIndex(index+1)
  }

  return (
    <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm' data-quiz-level={level}>
      <div className='absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(1000px_400px_at_0%_0%,rgba(99,102,241,0.15),transparent),radial-gradient(600px_300px_at_100%_0%,rgba(16,185,129,0.15),transparent)]' />
      <div className='relative p-5'>
        <div className='flex items-center justify-between mb-3'>
          <div className='text-xs uppercase tracking-wider font-semibold text-slate-500'>Brainstellar</div>
          <span className='inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700'>
            <span className={`w-2 h-2 rounded-full ${level==='easy'?'bg-emerald-500':level==='medium'?'bg-amber-500':'bg-rose-500'}`} />
            {level.toUpperCase()}
          </span>
        </div>

        {!done ? (
          <>
            <div className='mb-4'>
              <div className='text-sm text-slate-500 mb-1'>Question {index+1} of {qs.length}</div>
              <div className='h-2 bg-slate-100 rounded-full overflow-hidden'>
                <div className='h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all' style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className='mb-4 text-slate-900 text-base md:text-lg font-semibold'>
              {qs[index].q}
            </div>

            <div className='grid gap-2'>
              {qs[index].options.map((opt, i)=>{
                const isCorrect = revealed && i === qs[index].a
                const isWrong = revealed && selected === i && !isCorrect
                return (
                  <button
                    key={i}
                    onClick={()=>onSelect(i)}
                    className={[
                      'group text-left p-3 rounded-xl border transition-all',
                      'hover:shadow-sm focus:ring-2 focus:ring-indigo-400/40',
                      revealed ? 'cursor-default' : 'hover:-translate-y-[1px]',
                      isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-900' :
                      isWrong ? 'border-rose-300 bg-rose-50 text-rose-900' :
                      'border-slate-200 bg-white/70 text-slate-800 hover:border-slate-300'
                    ].join(' ')}
                    disabled={revealed}
                  >
                    <div className='flex items-center gap-3'>
                      <span className={[
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        isCorrect ? 'bg-emerald-500 text-white' : isWrong ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                      ].join(' ')}>
                        {String.fromCharCode(65+i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className='mt-4 flex items-center justify-between'>
              <div className='text-sm text-slate-600'>Score: <span className='font-semibold text-slate-800'>{score}</span></div>
              <button
                onClick={goNext}
                disabled={!revealed}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors'
              >
                {index+1 === qs.length ? 'Finish' : 'Next'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className='opacity-80'><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </>
        ) : (
          <div className='text-center py-6'>
            <div className='text-3xl mb-2'>🎉</div>
            <div className='text-xl font-bold mb-1'>Score: {score}/{qs.length}</div>
            <div className='text-slate-600 mb-4'>Great job! Keep sharpening that brain.</div>
            <button
              className='mt-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-md transition-shadow'
              onClick={()=>{ setIndex(0); setScore(0); setDone(false)}}
            >
              Retry Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
