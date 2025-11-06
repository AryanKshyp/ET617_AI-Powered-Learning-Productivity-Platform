'use client'
import { useEffect, useState } from 'react'

interface PDFViewerProps {
  filePath: string
  title?: string
  bucketName?: string
}

export default function PDFViewer({ filePath, title, bucketName = 'materials' }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!filePath) {
      setError('No file path provided')
      setLoading(false)
      return
    }

    // Build public URL for PDF in Supabase storage
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (!base) {
      setError('Supabase URL not configured')
      setLoading(false)
      return
    }

    // Clean the base URL (remove trailing slash if present)
    const cleanBase = base.replace(/\/$/, '')
    // Encode the file path to handle special characters
    const encodedPath = encodeURIComponent(filePath)
    const url = `${cleanBase}/storage/v1/object/public/${bucketName}/${encodedPath}`
    
    setPdfUrl(url)
    setLoading(false)
  }, [filePath, bucketName])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-gray-600">Loading PDF...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 rounded-lg p-6">
        <div className="text-red-600 mb-2">{error}</div>
        {filePath && (
          <div className="text-sm text-gray-500 mt-2">
            File path: <span className="font-mono">{filePath}</span>
          </div>
        )}
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-gray-600">Unable to generate PDF URL</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-purple-700 hover:text-purple-800 underline"
        >
          Open in new tab
        </a>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <iframe
          src={pdfUrl}
          className="w-full h-[600px] border-0"
          title={title || 'PDF Viewer'}
        />
      </div>
      <div className="mt-2 text-xs text-gray-500">
        PDF loaded: {filePath.split('/').pop()}
      </div>
    </div>
  )
}

