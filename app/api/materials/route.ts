import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const course_id = searchParams.get('course_id')
    const section_id = searchParams.get('section_id')
    
    console.log('Materials GET - course_id:', course_id, 'section_id:', section_id)
    
    if (!course_id) {
      console.error('Materials GET - Missing course_id')
      return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    }
    
    let query = supabaseAdmin.from('materials').select('*').eq('course_id', course_id)
    if (section_id) {
      query = query.eq('section_id', section_id)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Materials GET - Supabase error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: error.message || String(error),
        details: error 
      }, { status: 500 })
    }
    
    console.log('Materials GET - Success, returning', data?.length || 0, 'materials')
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    console.error('Materials GET - Exception:', e)
    return NextResponse.json({ 
      error: e?.message || 'failed to fetch materials',
      details: String(e)
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file') as File | null
      const course_id = form.get('course_id') as string | null
      const section_id = form.get('section_id') as string | null
      const title = (form.get('title') as string | null) || (file ? file.name : null)
      const uploader_id = form.get('uploader_id') as string | null
      if (!file || !course_id || !title) return NextResponse.json({ error: 'file, course_id, title required' }, { status: 400 })
      
      const filename = `${Date.now()}_${file.name}`
      const path = `${course_id}/${section_id || 'unsectioned'}/${filename}`
      
      // Upload to storage
      const { error: upErr } = await supabaseAdmin.storage.from('materials').upload(path, file, { 
        contentType: file.type || 'application/octet-stream', 
        upsert: false 
      })
      if (upErr) {
        // Extract error message safely
        const extractStorageError = (err: any): string => {
          if (!err) return 'Storage upload failed'
          if (typeof err === 'string') return err
          if (err?.message && typeof err.message === 'string') return err.message
          if (err?.error && typeof err.error === 'string') return err.error
          if (err?.statusText && typeof err.statusText === 'string') return err.statusText
          try {
            const str = JSON.stringify(err)
            if (str && str !== '{}') return str
          } catch {}
          return 'Storage upload failed'
        }
        
        const errorMsg = extractStorageError(upErr)
        const lowerMsg = errorMsg.toLowerCase()
        
        // Provide a more helpful error message if bucket doesn't exist
        if (lowerMsg.includes('bucket') || lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
          return NextResponse.json({ 
            error: `Storage bucket 'materials' not found. Please create it in your Supabase dashboard: Storage > New bucket > Name: 'materials' > Public: Yes (or configure RLS policies)`
          }, { status: 400 })
        }
        return NextResponse.json({ error: errorMsg }, { status: 400 })
      }
      
      // Determine material type
      const material_type = (file.type || '').split('/')[1] || 'file'
      
      // Build insert object - try with optional columns first, then fall back to minimal if needed
      // Start with the absolute minimum required columns
      let insertData: any = { 
        course_id, 
        title, 
        material_type
      }
      
      // Try to add optional columns - if they don't exist, we'll retry without them
      insertData.file_path = path
      if (section_id) {
        insertData.section_id = section_id
      }
      if (uploader_id) {
        insertData.uploader_id = uploader_id
      }
      
      // DO NOT include page_count or file_size - they may not exist
      // These are commented out to avoid column errors:
      // insertData.page_count = material_type === 'pdf' ? null : null
      // insertData.file_size = file.size
      
      let { data, error } = await supabaseAdmin.from('materials').insert(insertData).select().single()
      
      // If error mentions missing column, try again with minimal columns only
      if (error) {
        const errorMsg = error?.message || JSON.stringify(error) || ''
        const lowerMsg = errorMsg.toLowerCase()
        
        // Check if it's a column error - retry with minimal columns
        if (lowerMsg.includes('column') && (lowerMsg.includes('not found') || lowerMsg.includes('schema cache'))) {
          console.warn('Column error detected, retrying with minimal columns:', errorMsg)
          
          // Retry with only the absolute minimum
          const minimalData: any = {
            course_id,
            title,
            material_type
          }
          
          // Try to add file_path if it exists, otherwise skip it
          const retryResult = await supabaseAdmin.from('materials').insert(minimalData).select().single()
          
          if (retryResult.error) {
            // If minimal still fails, it's a different issue
            console.error('Materials POST - Database insert error (minimal retry):', retryResult.error)
            const extractDbError = (err: any): string => {
              if (!err) return 'Database error'
              if (typeof err === 'string') return err
              if (err?.message && typeof err.message === 'string') return err.message
              if (err?.error && typeof err.error === 'string') return err.error
              try {
                const str = JSON.stringify(err)
                if (str && str !== '{}') return str
              } catch {}
              return 'Database error: Your materials table may be missing required columns. Please check your database schema.'
            }
            return NextResponse.json({ error: extractDbError(retryResult.error) }, { status: 500 })
          }
          
          // Success with minimal columns
          data = retryResult.data
          error = null
        } else {
          // Different error, handle normally
          console.error('Materials POST - Database insert error (file):', error)
          const extractDbError = (err: any): string => {
            if (!err) return 'Database error'
            if (typeof err === 'string') return err
            if (err?.message && typeof err.message === 'string') return err.message
            if (err?.error && typeof err.error === 'string') return err.error
            try {
              const str = JSON.stringify(err)
              if (str && str !== '{}') return str
            } catch {}
            return 'Database error occurred'
          }
          return NextResponse.json({ error: extractDbError(error) }, { status: 500 })
        }
      }
      
      // If we get here, insert was successful
      return NextResponse.json({ data })
    } else {
      const body = await req.json()
      const { course_id, section_id, uploader_id, title, content, material_type = 'note' } = body
      if (!course_id || !title || !content) return NextResponse.json({ error: 'course_id, title, content required' }, { status: 400 })
      const { data, error } = await supabaseAdmin.from('materials').insert({ 
        course_id, 
        section_id, 
        uploader_id, 
        title, 
        material_type, 
        content 
      }).select().single()
      if (error) {
        console.error('Materials POST - Database insert error (note):', error)
        const extractDbError = (err: any): string => {
          if (!err) return 'Database error'
          if (typeof err === 'string') return err
          if (err?.message && typeof err.message === 'string') return err.message
          if (err?.error && typeof err.error === 'string') return err.error
          try {
            const str = JSON.stringify(err)
            if (str && str !== '{}') return str
          } catch {}
          return 'Database error occurred'
        }
        return NextResponse.json({ error: extractDbError(error) }, { status: 500 })
      }
      return NextResponse.json({ data })
    }
  } catch (e: any) {
    console.error('Materials POST - Exception:', e)
    console.error('Exception type:', typeof e)
    console.error('Exception stack:', e?.stack)
    
    const extractExceptionError = (err: any): string => {
      if (!err) return 'Failed to create material'
      if (typeof err === 'string') return err
      if (err?.message && typeof err.message === 'string') return err.message
      if (err?.error && typeof err.error === 'string') return err.error
      try {
        const str = JSON.stringify(err)
        if (str && str !== '{}') return str
      } catch {}
      return 'Failed to create material: An unexpected error occurred'
    }
    
    return NextResponse.json({ 
      error: extractExceptionError(e)
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const material_id = searchParams.get('material_id')
    if (!material_id) return NextResponse.json({ error: 'material_id required' }, { status: 400 })
    
    // Get material details first
    const { data: material, error: fetchError } = await supabaseAdmin
      .from('materials')
      .select('file_path')
      .eq('id', material_id)
      .single()
    
    if (fetchError) {
      console.error('Materials DELETE - Fetch error:', fetchError)
      const extractError = (err: any): string => {
        if (!err) return 'Failed to fetch material'
        if (typeof err === 'string') return err
        if (err?.message && typeof err.message === 'string') return err.message
        try {
          const str = JSON.stringify(err)
          if (str && str !== '{}') return str
        } catch {}
        return 'Failed to fetch material'
      }
      return NextResponse.json({ error: extractError(fetchError) }, { status: 500 })
    }
    
    // Delete from storage if file exists
    if (material?.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('materials')
        .remove([material.file_path])
      
      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete from database
    const { error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', material_id)
    
    if (error) {
      console.error('Materials DELETE - Database error:', error)
      const extractError = (err: any): string => {
        if (!err) return 'Failed to delete material'
        if (typeof err === 'string') return err
        if (err?.message && typeof err.message === 'string') return err.message
        try {
          const str = JSON.stringify(err)
          if (str && str !== '{}') return str
        } catch {}
        return 'Failed to delete material'
      }
      return NextResponse.json({ error: extractError(error) }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Materials DELETE - Exception:', e)
    const extractError = (err: any): string => {
      if (!err) return 'Failed to delete material'
      if (typeof err === 'string') return err
      if (err?.message && typeof err.message === 'string') return err.message
      return 'Failed to delete material: An unexpected error occurred'
    }
    return NextResponse.json({ error: extractError(e) }, { status: 500 })
  }
}



