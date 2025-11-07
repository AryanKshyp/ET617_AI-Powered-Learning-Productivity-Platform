"use client";
import { useEffect, useState } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'

export default function GeneratePage() {
  const params = useParams<{ id: string }>()
  const sp = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const type = sp.get('type') === 'assignment' ? 'assignment' : 'quiz'

  const [payload, setPayload] = useState<any>({})

  const runPython = async () => {
    setLoading(true)
    try {
      // Use production URL
      const baseUrl = process.env.NEXT_PUBLIC_PYTHON_GENERATOR_URL || 'https://rag-pipeline-nm08.onrender.com';
      const generatorUrl = baseUrl.endsWith('/generate') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/generate`;
      
      if (!generatorUrl) {
        setLoading(false)
        return
      }
      // Replace sourceText with actual material text or a signed URL-based extraction
      const sourceText = ''
      const res = await fetch(generatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, type, bloom_level: 'apply', material_meta: { id: params.id } })
      })
      if (!res.ok) throw new Error('generator error')
      const data = await res.json()
      setPayload(data)
    } catch (e) {
      // noop; you can surface error UI if desired
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setLoading(true)
    const res = await fetch('/api/generated', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ material_id: params.id, course_id: null, section_id: null, generated_type: type, payload, generator: 'python-script' }) })
    setLoading(false)
    if (res.ok) router.push(`/materials/${params.id}`)
  }

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Generate {type === 'quiz' ? 'Quiz' : 'Assignment'}</h1>
      <p className="text-sm text-gray-600">Paste or edit the JSON payload to save with this material.</p>
      <div className="space-x-2">
        <button onClick={runPython} disabled={loading} className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-60">Generate with Python</button>
        <button onClick={save} disabled={loading} className="px-3 py-2 bg-purple-700 text-white rounded disabled:opacity-60">Save</button>
      </div>
      <textarea value={JSON.stringify(payload, null, 2)} onChange={(e) => { try { setPayload(JSON.parse(e.target.value)) } catch { } }} className="w-full min-h-[300px] border rounded p-3 font-mono"></textarea>
    </div>
  )
}



