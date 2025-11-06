'use client'
import dynamic from 'next/dynamic'
import PDFUploader from '@/components/PDFUploader'
import { Quiz } from '@/components/quizzes'
import useClickstream from '@/components/useClickstream'
import { useState } from 'react'

const ClickSpeedGame = dynamic(()=>import('@/components/ClickSpeedGame'), { ssr: false })

export default function UploadPage() {
  useClickstream('reader')
  const [pdfPath, setPdfPath] = useState<string|null>(null)

  return (
    <div className='relative'>
      <div className='absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(800px_400px_at_0%_0%,rgba(99,102,241,0.08),transparent),radial-gradient(600px_300px_at_100%_0%,rgba(16,185,129,0.08),transparent)]' />

      <div className='mb-6'>
        <div className='text-xs uppercase tracking-wider text-slate-500 mb-1'>Workspace</div>
        <h1 className='text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-emerald-600'>Reader & Tools — Learnify</h1>
        <div className='text-slate-600 mt-1'>Upload a PDF and practice with Brainstellar quizzes and the click game.</div>
      </div>

      <div className='grid md:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <PDFUploader onUpload={(p)=>setPdfPath(p)} />
          <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-semibold text-slate-900'>PDF Reader</h3>
              {pdfPath && (
                <a className='text-xs text-slate-600 hover:text-slate-800 underline' href={supabaseUrlFor(pdfPath)} target='_blank'>Open in new tab</a>
              )}
            </div>
            {pdfPath ? (
              <div>
                <iframe src={supabaseUrlFor(pdfPath)} className='w-full h-[600px] rounded-lg border border-slate-200' />
                <div className='mt-2 text-xs text-slate-500'>
                  PDF loaded: {pdfPath.split('/').pop()}
                </div>
              </div>
            ) : (
              <div className='text-sm text-slate-500'>No PDF loaded. Upload one to view it here.</div>
            )}
          </div>
        </div>

        <div>
          <div className='space-y-4'>
            <Quiz level='easy' />
            <Quiz level='medium' />
            <Quiz level='hard' />
            <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
              <div className='text-sm font-semibold text-slate-900 mb-2'>Click Speed Game</div>
              <ClickSpeedGame />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// helper: build public URL for pdf in Supabase storage
function supabaseUrlFor(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  // Supabase storage public URL pattern
  return `${base.replace(/\.co\/$/, '.co')}/storage/v1/object/public/uploadFiles/${encodeURIComponent(path)}`
}
