import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const material_id = searchParams.get('material_id')
    if (!material_id) return NextResponse.json({ error: 'material_id required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('generated_items').select('*').eq('material_id', material_id).order('created_at', { ascending: false })
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



