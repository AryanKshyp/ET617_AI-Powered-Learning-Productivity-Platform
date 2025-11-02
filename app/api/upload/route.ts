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
      // Log the full error for debugging
      console.error('Supabase storage error:', JSON.stringify(error, null, 2))
      console.error('Error type:', typeof error)
      console.error('Error properties:', Object.keys(error as any))
      
      // Extract error message - Supabase StorageError typically has a 'message' property
      let errorMsg = 'Unknown storage error'
      if (typeof error === 'string') {
        errorMsg = error
      } else if (error?.message) {
        errorMsg = String(error.message)
      } else {
        // Last resort: try to stringify or convert
        try {
          const errorObj = error as any
          if (errorObj.error) {
            errorMsg = typeof errorObj.error === 'string' ? errorObj.error : String(errorObj.error)
          } else {
            errorMsg = JSON.stringify(error)
          }
        } catch {
          errorMsg = String(error)
        }
      }
      
      // Provide a more helpful error message if bucket doesn't exist
      const lowerMsg = errorMsg.toLowerCase()
      if (lowerMsg.includes('bucket') || lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
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
