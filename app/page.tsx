export default function Home() {
  return (
    <div className='relative py-12'>
      <div className='absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(900px_400px_at_0%_0%,rgba(99,102,241,0.10),transparent),radial-gradient(700px_300px_at_100%_0%,rgba(16,185,129,0.10),transparent)]' />

      {/* Hero */}
      <section className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm p-8 md:p-12 shadow-sm'>
        <div className='absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-indigo-200/40 blur-3xl' />
        <div className='absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-200/40 blur-3xl' />

        <div className='relative max-w-3xl'>
          <div className='text-xs uppercase tracking-wider text-slate-500 mb-2'>Read • Quiz • Analyze • Play</div>
          <h1 className='text-4xl md:text-6xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-emerald-600'>
            Learnify
          </h1>
          <p className='mt-3 text-slate-600 text-lg'>Read research PDFs in a focused workspace, generate Brainstellar-style quizzes, track interaction analytics, and compete on the Click Speed leaderboard.</p>
          <div className='mt-6 flex flex-wrap items-center gap-3'>
            <a href='/upload' className='inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors'>
              Open Reader
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none'><path d='M9 5l7 7-7 7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>
            </a>
            <a href='/dashboard' className='inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-50'>
              View Dashboard
            </a>
            <a href='/login' className='inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white/70 border border-slate-200 hover:bg-white'>
              Sign in / up
            </a>
          </div>
          <div className='mt-4 text-xs text-slate-500'>Built with Next.js, Tailwind, Supabase, Chart.js</div>
        </div>
      </section>

      {/* Feature grid */}
      <section className='mt-10 grid md:grid-cols-3 gap-6'>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
          <div className='absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-indigo-200/40' />
          <div className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white mb-3'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'><path d='M4 19.5V4.5C4 3.67157 4.67157 3 5.5 3H13.5L20 9.5V19.5C20 20.3284 19.3284 21 18.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z' stroke='currentColor' strokeWidth='2'/><path d='M13 3V9H20' stroke='currentColor' strokeWidth='2'/></svg>
          </div>
          <h3 className='font-bold mb-1 text-slate-900'>Focused Reader</h3>
          <p className='text-sm text-slate-600'>Upload PDFs and read them without distractions. Actions like clicks and scrolls are tracked automatically.</p>
        </div>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
          <div className='absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-emerald-200/40' />
          <div className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white mb-3'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'><path d='M12 20L4 16V8L12 4L20 8V16L12 20Z' stroke='currentColor' strokeWidth='2'/><path d='M12 12V7' stroke='currentColor' strokeWidth='2'/></svg>
          </div>
          <h3 className='font-bold mb-1 text-slate-900'>Brainstellar Quizzes</h3>
          <p className='text-sm text-slate-600'>Three starter quizzes and smooth interactions with instant feedback and progression.</p>
        </div>
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
          <div className='absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-rose-200/40' />
          <div className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white mb-3'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2'/><path d='M8 12h8' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></svg>
          </div>
          <h3 className='font-bold mb-1 text-slate-900'>Click Speed Game</h3>
          <p className='text-sm text-slate-600'>Play the 10-second challenge and climb the leaderboard. Scores update in real-time.</p>
        </div>
      </section>

      {/* How it works */}
      <section className='mt-10 grid md:grid-cols-3 gap-6'>
        <div className='rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
          <div className='text-xs uppercase tracking-wider text-slate-500 mb-1'>Step 1</div>
          <h4 className='font-semibold text-slate-900 mb-1'>Sign in and upload</h4>
          <p className='text-sm text-slate-600'>Create an account and upload a PDF to get started.</p>
        </div>
        <div className='rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
          <div className='text-xs uppercase tracking-wider text-slate-500 mb-1'>Step 2</div>
          <h4 className='font-semibold text-slate-900 mb-1'>Read and practice</h4>
          <p className='text-sm text-slate-600'>Use the reader and take the included quizzes to test understanding.</p>
        </div>
        <div className='rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
          <div className='text-xs uppercase tracking-wider text-slate-500 mb-1'>Step 3</div>
          <h4 className='font-semibold text-slate-900 mb-1'>Track and compete</h4>
          <p className='text-sm text-slate-600'>View analytics on the dashboard and compete on the highscores.</p>
        </div>
      </section>
    </div>
  )
}
