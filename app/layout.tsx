import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Learnify',
  description: 'Read papers, make quizzes, play games — Learnify'
}

export default function RootLayout({ children } : { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className='bg-slate-50 min-h-screen'>
        <header className='bg-white shadow-sm border-b'>
          <div className='max-w-6xl mx-auto px-6 py-4 flex items-center gap-4'>
            <div className='text-2xl font-bold text-indigo-600'>Learnify</div>
            <nav className='ml-auto space-x-4'>
              <a href='/' className='text-sm'>Home</a>
              <a href='/upload' className='text-sm'>Reader</a>
              <a href='/dashboard' className='text-sm'>Dashboard</a>
              <a href='/login' className='text-sm'>Login</a>
            </nav>
          </div>
        </header>
        <main className='max-w-6xl mx-auto px-6 py-8'>{children}</main>
      </body>
    </html>
  )
}
