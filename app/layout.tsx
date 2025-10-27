import './globals.css'
import React from 'react'

export const metadata = {
  title: 'ProLearn AI - AI-Powered Learning Platform',
  description: 'Transform education with AI-powered personalized learning experiences. Bridge the gap between teaching and learning for a smarter future.'
}

export default function RootLayout({ children } : { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className='min-h-screen'>
        {children}
      </body>
    </html>
  )
}
