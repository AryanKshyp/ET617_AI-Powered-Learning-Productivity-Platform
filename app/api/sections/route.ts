import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const course_id = searchParams.get('course_id')
    if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('sections').select('*').eq('course_id', course_id).order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { course_id, title } = body
    if (!course_id || !title) return NextResponse.json({ error: 'course_id and title required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('sections').insert({ course_id, title }).select().single()
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to create section' }, { status: 500 })
  }
}



