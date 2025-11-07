import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getRequestUser } from '@/lib/getRequestUser'

export async function GET(req: Request) {
  try {
    const authResult = await getRequestUser(req)
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = supabaseAdmin
      .from('courses')
      .select('*')
      .eq('owner_id', authResult.user.id)
      .order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await getRequestUser(req)
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description } = body
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({ owner_id: authResult.user.id, title, description })
      .select()
      .single()
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'failed to create course' }, { status: 500 })
  }
}



