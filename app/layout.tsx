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
        <main className='max-w-6xl mx-auto px-6 py-8'>{children}</main>
      </body>
    </html>
  )
}
