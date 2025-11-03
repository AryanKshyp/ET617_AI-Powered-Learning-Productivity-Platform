import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { habits } = body // Array of habits to create

    if (!habits || !Array.isArray(habits)) {
      return NextResponse.json({ error: 'Habits array required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const habitsToInsert = habits.map((h: any) => ({
      user_id: body.user_id, // Client should provide after auth check
      habit_type: h.habit_type,
      target_value: h.target_value,
      unit: h.unit,
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabaseAdmin
      .from('wellness_habits')
      .insert(habitsToInsert)
      .select()

    if (error) {
      console.error('Wellness habit insert error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Wellness habit API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

