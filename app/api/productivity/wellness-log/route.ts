import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { habit_id, value, notes } = body

    if (!habit_id || value === undefined) {
      return NextResponse.json({ error: 'Habit ID and value required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Upsert (insert or update if exists for today)
    const { data, error } = await supabaseAdmin
      .from('habit_logs')
      .upsert(
        {
          habit_id,
          user_id: body.user_id, // Client should provide after auth check
          log_date: today,
          value,
          notes: notes || null,
        },
        {
          onConflict: 'habit_id,log_date',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Wellness log insert error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    // Update user stats streak
    await updateStreak(body.user_id)

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Wellness log API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateStreak(userId: string) {
  try {
    // Get user stats
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (stats) {
      const lastActivity = stats.last_activity_date
        ? new Date(stats.last_activity_date).toISOString().split('T')[0]
        : null

      let newStreak = stats.streak_days || 0

      if (lastActivity === today) {
        // Already logged today, no change
      } else if (lastActivity === yesterday) {
        // Continuing streak
        newStreak += 1
      } else {
        // Reset streak
        newStreak = 1
      }

      await supabaseAdmin
        .from('user_stats')
        .update({
          streak_days: newStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      // Create new stats
      await supabaseAdmin.from('user_stats').insert({
        user_id: userId,
        streak_days: 1,
        last_activity_date: today,
      })
    }
  } catch (e) {
    console.error('Streak update error:', e)
  }
}

