import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, color, user_id } = body

    console.log('Task board creation request:', { title, color, user_id })

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('task_boards')
      .insert({
        user_id: user_id,
        title,
        color: color || 'blue',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Task board insert error:', error)
      return NextResponse.json({ 
        error: error.message || String(error),
        details: error 
      }, { status: 500 })
    }

    console.log('Task board created successfully:', data)
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Task board API error:', e)
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Internal server error',
      details: String(e)
    }, { status: 500 })
  }
}

