'use client'
import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const title = useMemo(()=> mode === 'signin' ? 'Welcome back' : 'Create your account', [mode])

  const handleSubmit = async () => {
    setMessage(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        window.location.href = '/upload'
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        setMessage('Signup complete — check your email to confirm (if required).')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative min-h-[80vh] flex items-center justify-center px-6'>
      <div className='absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-emerald-50' />
      <div className='absolute -z-10 top-[-120px] right-[-120px] w-[360px] h-[360px] rounded-full bg-indigo-200/40 blur-3xl' />
      <div className='absolute -z-10 bottom-[-120px] left-[-120px] w-[360px] h-[360px] rounded-full bg-emerald-200/40 blur-3xl' />

      <div className='w-full max-w-lg rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden'>
        <div className='p-6 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50'>
          <div className='text-2xl font-bold text-slate-900'>{title}</div>
          <div className='text-slate-600 text-sm mt-1'>Sign in to continue or create a new account.</div>
        </div>

        <div className='p-6'>
          <div className='inline-flex p-1 rounded-xl bg-slate-100 text-sm mb-4'>
            <button
              onClick={()=>setMode('signin')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${mode==='signin'?'bg-white shadow text-slate-900':'text-slate-600'}`}
            >
              Sign in
            </button>
            <button
              onClick={()=>setMode('signup')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${mode==='signup'?'bg-white shadow text-slate-900':'text-slate-600'}`}
            >
              Sign up
            </button>
          </div>

          <div className='space-y-3'>
            <div>
              <label className='block text-xs font-medium text-slate-600 mb-1'>Email</label>
              <input
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder='you@example.com'
                className='w-full p-2.5 rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400/40'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-slate-600 mb-1'>Password</label>
              <div className='relative'>
                <input
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder='••••••••'
                  type={showPassword ? 'text' : 'password'}
                  className='w-full p-2.5 pr-10 rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400/40'
                />
                <button
                  type='button'
                  onClick={()=>setShowPassword(s=>!s)}
                  className='absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700'
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className='mt-3 text-sm text-slate-700 bg-slate-100 rounded-lg p-2'>{message}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className='mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50 hover:shadow-md transition-all'
          >
            {loading ? 'Please wait…' : (mode==='signin' ? 'Sign in' : 'Create account')}
          </button>

          <div className='mt-3 text-xs text-slate-500'>By continuing you agree to our Terms and Privacy Policy.</div>
        </div>
      </div>
    </div>
  )
}
