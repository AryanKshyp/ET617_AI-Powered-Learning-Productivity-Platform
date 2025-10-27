import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'

async function getMaterial(id: string) {
  const { data, error } = await supabaseAdmin.from('materials').select('*').eq('id', id).single()
  if (error) throw new Error(String(error))
  return data
}

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const material = await getMaterial(params.id)
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{material.title}</h1>
        <Link className="text-purple-700" href="/dashboard">Back to Dashboard</Link>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {material.material_type === 'note' ? (
          <pre className="whitespace-pre-wrap">{material.content}</pre>
        ) : (
          <p className="text-sm text-gray-600">Open file from storage path: <span className="font-mono">{material.file_path}</span></p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-x-3">
        <Link className="px-3 py-2 bg-purple-700 text-white rounded" href={`/materials/${params.id}/generate?type=assignment`}>Create Assignment</Link>
        <Link className="px-3 py-2 bg-purple-700 text-white rounded" href={`/materials/${params.id}/generate?type=quiz`}>Create Quiz (Bloom)</Link>
      </div>
    </div>
  )
}



