import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const owner_id = searchParams.get('owner_id')
    const query = supabaseAdmin.from('courses').select('*').order('created_at', { ascending: false })
    const { data, error } = owner_id ? await query.eq('owner_id', owner_id) : await query
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { owner_id, title, description } = body
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('courses').insert({ owner_id, title, description }).select().single()
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to create course' }, { status: 500 })
  }
}



