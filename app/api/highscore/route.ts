import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const score = Number(body.score || 0)
    const user_id = body.user_id || null
    
    // Validate score
    if (score <= 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin.from('highscores').insert({ user_id, score }).select()
    
    if (error) {
      console.error('Highscore insert error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Highscore API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
