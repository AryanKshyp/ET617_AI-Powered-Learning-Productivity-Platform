import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import PDFViewer from '@/components/PDFViewer'

async function getMaterial(id: string) {
  const { data, error } = await supabaseAdmin.from('materials').select('*').eq('id', id).single()
  if (error) throw new Error(String(error))
  return data
}

function getFileDownloadUrl(filePath: string, bucketName: string = 'materials'): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const cleanBase = base.replace(/\/$/, '')
  const encodedPath = encodeURIComponent(filePath)
  return `${cleanBase}/storage/v1/object/public/${bucketName}/${encodedPath}`
}

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const material = await getMaterial(params.id)
  const isPDF = material.material_type === 'pdf'
  const hasFile = material.file_path && material.material_type !== 'note'
  
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{material.title}</h1>
        <Link className="text-purple-700 hover:text-purple-800" href="/dashboard">Back to Dashboard</Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {material.material_type === 'note' ? (
          <div>
            <h2 className="text-lg font-semibold mb-3">Note Content</h2>
            <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">{material.content}</pre>
          </div>
        ) : isPDF && material.file_path ? (
          <PDFViewer filePath={material.file_path} title={material.title} bucketName="materials" />
        ) : hasFile ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">File Material</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                File type: <span className="font-semibold">{material.material_type.toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Storage path: <span className="font-mono text-xs">{material.file_path}</span>
              </p>
              {material.file_path && (
                <a
                  href={getFileDownloadUrl(material.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
                >
                  Download File
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-600">
            <p>No file content available for this material.</p>
            {material.file_path && (
              <p className="text-sm mt-2">File path: <span className="font-mono">{material.file_path}</span></p>
            )}
          </div>
        )}
      </div>

      {(material.material_type === 'pdf' || material.material_type === 'note') && (
        <div className="bg-white rounded-xl shadow p-4 space-x-3">
          <Link className="px-3 py-2 bg-purple-700 text-white rounded hover:bg-purple-800" href={`/materials/${params.id}/generate?type=assignment`}>Create Assignment</Link>
          <Link className="px-3 py-2 bg-purple-700 text-white rounded hover:bg-purple-800" href={`/materials/${params.id}/generate?type=quiz`}>Create Quiz (Bloom)</Link>
        </div>
      )}
    </div>
  )
}



