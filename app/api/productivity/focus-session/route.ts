import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { session_type, duration_minutes } = body

    // Get user from auth header or body
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null

    if (authHeader) {
      // Extract user from token if needed
      // For now, we'll get it from the client
    }

    // For now, we expect user_id in body (set by client after auth check)
    // In production, extract from JWT token

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Note: In production, extract userId from authenticated session
    // For now, we'll need to get it from the client request
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('focus_sessions')
      .insert({
        user_id: body.user_id, // Client should provide this after auth check
        session_type: session_type || 'pomodoro',
        duration_minutes: duration_minutes || 25,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Focus session insert error:', sessionError)
      return NextResponse.json({ error: String(sessionError) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: sessionData })
  } catch (e) {
    console.error('Focus session API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, completed, distraction_count } = body

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completed_at = new Date().toISOString()
      }
    }
    if (distraction_count !== undefined) {
      updateData.distraction_count = distraction_count
    }

    const { data, error } = await supabaseAdmin
      .from('focus_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Focus session update error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Focus session update error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

