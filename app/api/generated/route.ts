import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const material_id = searchParams.get('material_id')
    const course_id = searchParams.get('course_id')
    
    // Support querying by either material_id or course_id
    if (!material_id && !course_id) {
      return NextResponse.json({ error: 'material_id or course_id required' }, { status: 400 })
    }
    
    let query = supabaseAdmin.from('generated_items').select('*')
    
    if (material_id) {
      query = query.eq('material_id', material_id)
    }
    if (course_id) {
      query = query.eq('course_id', course_id)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to fetch generated items' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { course_id, section_id, material_id, generated_type, payload, generator } = body
    if (!course_id || !material_id || !generated_type || !payload) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('generated_items').insert({ course_id, section_id, material_id, generated_type, payload, generator: generator || 'manual' }).select().single()
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to create generated item' }, { status: 500 })
  }
}



