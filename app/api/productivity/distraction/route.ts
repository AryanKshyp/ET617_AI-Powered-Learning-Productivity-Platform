import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event_type, focus_session_id, metadata } = body

    if (!event_type) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('distraction_events')
      .insert({
        user_id: body.user_id || null, // Client should provide after auth check
        event_type,
        focus_session_id: focus_session_id || null,
        metadata: metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Distraction event insert error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Distraction API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

