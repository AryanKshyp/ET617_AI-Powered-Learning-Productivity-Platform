'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
} from 'chart.js'
import useClickstream from '@/components/useClickstream'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
)

export default function DashboardPage() {
  useClickstream('dashboard')
  const [events, setEvents] = useState<any[]>([])
  const [scores, setScores] = useState<any[]>([])

  useEffect(()=> {
    let pollTimer: any

    const fetchAll = async () => {
      try {

        const { data: ev, error: evError } = await supabase
          .from('clickstream')
          .select('*')
          .order('time', { ascending: true })
          .limit(1000)
        if (evError) {
          console.error('Error fetching clickstream:', evError)
        } else {
          setEvents(ev ?? [])
        }

        const { data: hs, error: hsError } = await supabase
          .from('highscores')
          .select('*')
          .order('score', { ascending: false })
          .limit(10)
        if (hsError) {
          console.error('Error fetching highscores:', hsError)
        } else {
          setScores(hs ?? [])
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      }
    }

    fetchAll()
    pollTimer = setInterval(fetchAll, 5000)

    const channel = supabase.channel('public:clickstream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickstream' }, payload => {
        setEvents(prev => [...prev, payload.new])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'highscores' }, payload => {
        setScores(prev => [payload.new, ...prev].slice(0,20))
      })
      .subscribe()

    return ()=> {
      if (pollTimer) clearInterval(pollTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  const counts = events.reduce((acc:any, e:any)=> { acc[e.event_name] = (acc[e.event_name]||0)+1; return acc }, {})

  const totalEvents = events.length
  const uniqueEventTypes = Object.keys(counts).length
  const topScore = scores.length ? Math.max(...scores.map((s:any)=> Number(s.score)||0)) : 0
  const totalPlayers = new Set(scores.map((s:any)=> s.user_id || 'anon')).size

  function downloadCsv(filename: string, rows: any[]) {
    if (!rows || rows.length === 0) {
      const blob = new Blob(['No data'], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    
    // Type guard to ensure rows are objects
    const validRows = rows.filter(row => row && typeof row === 'object')
    
    const headers = Array.from(
      validRows.reduce((set: Set<string>, row: Record<string, any>) => {
        Object.keys(row).forEach(k => set.add(k))
        return set
      }, new Set<string>())
    )
    
    const csv = [headers.join(',')]
    for (const row of validRows) {
      const line = headers.map(h => formatCsvCell(row[h as keyof typeof row]))
      csv.push(line.join(','))
    }
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatCsvCell(value: any) {
    if (value == null) return ''
    if (typeof value === 'object') {
      try { return JSON.stringify(value).replaceAll('"', '""') } catch {}
    }
    const str = String(value).replaceAll('"', '""')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str}"`
    return str
  }

  return (
    <div className='relative'>
      <div className='absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(800px_400px_at_0%_0%,rgba(99,102,241,0.08),transparent),radial-gradient(600px_300px_at_100%_0%,rgba(16,185,129,0.08),transparent)]' />

      <div className='mb-6'>
        <div className='text-xs uppercase tracking-wider text-slate-500 mb-1'>Insights</div>
        <h1 className='text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-emerald-600'>Learnify Dashboard</h1>
        <div className='text-slate-600 mt-1'>Live clickstream and gameplay metrics with export tools.</div>
      </div>

      <div className='flex flex-wrap items-center gap-3 mb-6'>
        <button
          className='px-3 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors'
          onClick={() => downloadCsv('clickstream.csv', events)}
        >
          Download Clickstream CSV
        </button>
        <button
          className='px-3 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors'
          onClick={() => downloadCsv('highscores.csv', scores)}
        >
          Download Highscores CSV
        </button>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
          <div className='text-xs text-slate-500'>Total Events</div>
          <div className='text-2xl font-bold text-slate-900 mt-1'>{totalEvents}</div>
          <div className='absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-indigo-200/40' />
        </div>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
          <div className='text-xs text-slate-500'>Event Types</div>
          <div className='text-2xl font-bold text-slate-900 mt-1'>{uniqueEventTypes}</div>
          <div className='absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-sky-200/40' />
        </div>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
          <div className='text-xs text-slate-500'>Top Score</div>
          <div className='text-2xl font-bold text-slate-900 mt-1'>{topScore}</div>
          <div className='absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-emerald-200/40' />
        </div>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
          <div className='text-xs text-slate-500'>Players</div>
          <div className='text-2xl font-bold text-slate-900 mt-1'>{totalPlayers}</div>
          <div className='absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-rose-200/40' />
        </div>
      </div>

      <div className='grid md:grid-cols-2 gap-6'>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-slate-900'>Event Counts</h3>
            <span className='text-xs text-slate-500'>last 1000</span>
          </div>
          <Bar
            data={{
              labels: Object.keys(counts),
              datasets: [{
                label: 'Events',
                data: Object.values(counts),
                backgroundColor: 'rgba(99,102,241,0.6)',
                borderRadius: 8,
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: { enabled: true }
              },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: 'rgba(15,23,42,0.06)' } }
              }
            }}
          />
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-slate-900'>Top Highscores</h3>
            <span className='text-xs text-slate-500'>max 10</span>
          </div>
          <ol className='divide-y divide-slate-100'>
            {scores.map((s:any, idx:number)=>(
              <li key={s.id} className='py-2 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold'>{idx+1}</span>
                  <div className='text-slate-900'>{s.user_id ?? 'anon'}</div>
                </div>
                <div className='text-slate-900 font-bold'>{s.score}</div>
              </li>
            ))}
            {!scores.length && (
              <li className='py-6 text-center text-slate-500 text-sm'>No scores yet</li>
            )}
          </ol>
        </div>
      </div>

      <section className='mt-6 relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='font-semibold text-slate-900'>Recent Events</h3>
          <span className='text-xs text-slate-500'>showing latest 200</span>
        </div>
        <div className='overflow-auto max-h-96 rounded-lg'>
          <table className='w-full text-sm'>
            <thead className='sticky top-0 bg-white/90 backdrop-blur-sm'>
              <tr className='text-left text-slate-500'>
                <th className='py-2 pr-4 font-medium'>Time</th>
                <th className='py-2 pr-4 font-medium'>Event</th>
                <th className='py-2 pr-4 font-medium'>Component</th>
                <th className='py-2 pr-4 font-medium'>Desc</th>
                <th className='py-2 pr-4 font-medium'>Origin</th>
                <th className='py-2 pr-4 font-medium'>IP</th>
              </tr>
            </thead>
            <tbody>
              {events.slice().reverse().slice(0,200).map(e=> (
                <tr key={e.id} className='border-t border-slate-100 hover:bg-slate-50/60'>
                  <td className='py-2 pr-4 whitespace-nowrap text-slate-700'>{new Date(e.time).toLocaleString()}</td>
                  <td className='py-2 pr-4 text-slate-900 font-medium'>{e.event_name}</td>
                  <td className='py-2 pr-4 text-slate-700'>{e.component}</td>
                  <td className='py-2 pr-4 max-w-xs truncate text-slate-600'>{e.description}</td>
                  <td className='py-2 pr-4 max-w-xs truncate text-slate-600'>{e.origin}</td>
                  <td className='py-2 pr-4 text-slate-500'>{e.ip_address}</td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td colSpan={6} className='py-10 text-center text-slate-500'>No events yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
