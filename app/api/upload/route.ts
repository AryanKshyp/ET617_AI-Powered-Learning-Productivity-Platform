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

    const { error } = await supabaseAdmin.storage.from('uploadFiles').upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: false
    })

    if (error) {
      // Log the full error for debugging
      console.error('Supabase storage error:', JSON.stringify(error, null, 2))
      console.error('Error type:', typeof error)
      console.error('Error properties:', Object.keys(error as any))
      
      // Extract error message - Supabase StorageError typically has a 'message' property
      // Helper function to safely extract error message
      const extractErrorMsg = (err: any): string => {
        if (!err) return 'Unknown storage error'
        if (typeof err === 'string') return err
        if (err?.message && typeof err.message === 'string') return err.message
        if (err?.error) {
          const nested = extractErrorMsg(err.error)
          if (nested !== 'Unknown storage error') return nested
        }
        // Try to find statusCode or statusText for more context
        if (err?.statusCode) return `Storage error (${err.statusCode}): ${err.message || 'Unknown error'}`
        if (err?.statusText) return `Storage error: ${err.statusText}`
        // Try JSON.stringify as last resort
        try {
          const stringified = JSON.stringify(err)
          if (stringified && stringified !== '{}' && stringified !== 'null') {
            return stringified.length > 200 ? stringified.substring(0, 200) + '...' : stringified
          }
        } catch {
          // JSON.stringify failed
        }
        return 'Unknown storage error'
      }
      
      let errorMsg = extractErrorMsg(error)
      
      // Provide a more helpful error message if bucket doesn't exist
      const lowerMsg = errorMsg.toLowerCase()
      if (lowerMsg.includes('bucket') || lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
        return NextResponse.json({ 
          error: `Storage bucket 'uploadFiles' not found. Please create it in your Supabase dashboard: Storage > New bucket > Name: 'uploadFiles' > Public: Yes (or configure RLS policies)`
        }, { status: 400 })
      }
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    return NextResponse.json({ ok: true, path })
  } catch (e: any) {
    // Ensure we always return a string error message
    console.error('Upload API error:', e)
    console.error('Error type:', typeof e)
    console.error('Error stack:', e?.stack)
    
    let errorMsg = 'Upload failed'
    if (e?.message && typeof e.message === 'string') {
      errorMsg = e.message
    } else if (typeof e === 'string') {
      errorMsg = e
    } else if (e && typeof e === 'object') {
      // Try to extract meaningful error message
      if (e.error && typeof e.error === 'string') {
        errorMsg = e.error
      } else if (e.statusText && typeof e.statusText === 'string') {
        errorMsg = e.statusText
      } else {
        try {
          const str = JSON.stringify(e)
          if (str && str !== '{}') errorMsg = str
        } catch {
          errorMsg = 'Upload failed: An unexpected server error occurred'
        }
      }
    }
    
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
