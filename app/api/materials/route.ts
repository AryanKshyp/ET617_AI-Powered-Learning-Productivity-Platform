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
        // Provide a more helpful error message if bucket doesn't exist
        if (upErr.message?.toLowerCase().includes('bucket') || upErr.message?.toLowerCase().includes('not found')) {
          return NextResponse.json({ 
            error: `Storage bucket 'materials' not found. Please create it in your Supabase dashboard: Storage > New bucket > Name: 'materials' > Public: Yes (or configure RLS policies)`
          }, { status: 400 })
        }
        return NextResponse.json({ error: upErr.message }, { status: 400 })
      }
      
      // Determine material type
      const material_type = (file.type || '').split('/')[1] || 'file'
      
      // For PDFs, we'll need to get page count (this would require a PDF processing library)
      // For now, we'll set it to null and handle it in the Python service
      const page_count = material_type === 'pdf' ? null : null
      const file_size = file.size
      
      const { data, error } = await supabaseAdmin.from('materials').insert({ 
        course_id, 
        section_id, 
        uploader_id, 
        title, 
        material_type, 
        file_path: path,
        page_count,
        file_size
      }).select().single()
      
      if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
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
      if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
      return NextResponse.json({ data })
    }
  } catch (e: any) {
    console.error('Materials POST - Exception:', e)
    return NextResponse.json({ 
      error: e?.message || 'failed to create material',
      details: String(e)
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
    
    if (fetchError) return NextResponse.json({ error: String(fetchError) }, { status: 500 })
    
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
    
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'failed to delete material' }, { status: 500 })
  }
}



