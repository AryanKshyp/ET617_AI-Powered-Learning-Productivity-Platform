import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { game_type, score, metadata } = body

    if (!game_type || score === undefined) {
      return NextResponse.json({ error: 'Game type and score required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('game_scores')
      .insert({
        user_id: body.user_id || null, // Client should provide after auth check
        game_type,
        score,
        metadata: metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Game score insert error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Game score API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

