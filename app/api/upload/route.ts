import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const userId = form.get('user_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const filename = `${Date.now()}_${file.name}`
    const path = `${userId}/${filename}`

    const { error } = await supabaseAdmin.storage.from('pdfs').upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: false
    })

    if (error) {
      // Extract error message - handle different error formats from Supabase
      const errorMsg = error.message || String(error) || 'Unknown storage error'
      
      // Provide a more helpful error message if bucket doesn't exist
      if (errorMsg.toLowerCase().includes('bucket') || errorMsg.toLowerCase().includes('not found')) {
        return NextResponse.json({ 
          error: `Storage bucket 'pdfs' not found. Please create it in your Supabase dashboard: Storage > New bucket > Name: 'pdfs' > Public: Yes (or configure RLS policies)`
        }, { status: 400 })
      }
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    return NextResponse.json({ ok: true, path })
  } catch (e: any) {
    // Ensure we always return a string error message
    const errorMsg = e?.message || String(e) || 'Upload failed'
    console.error('Upload API error:', e)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
