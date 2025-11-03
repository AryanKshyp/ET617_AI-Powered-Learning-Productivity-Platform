import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, source, source_id, description } = body

    if (!amount || !source) {
      return NextResponse.json({ error: 'Amount and source required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const userId = body.user_id // Client should provide after auth check

    // Create XP transaction
    const { data: transaction, error: transError } = await supabaseAdmin
      .from('xp_transactions')
      .insert({
        user_id: userId,
        amount,
        source,
        source_id: source_id || null,
        description: description || null,
      })
      .select()
      .single()

    if (transError) {
      console.error('XP transaction insert error:', transError)
      return NextResponse.json({ error: String(transError) }, { status: 500 })
    }

    // Update user stats
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    const currentXP = stats?.total_xp || 0
    const currentLevel = stats?.level || 1
    const newXP = currentXP + amount

    // Calculate level (simplified: 100 XP per level)
    const newLevel = Math.floor(newXP / 100) + 1
    const currentLevelXP = newXP % 100

    await supabaseAdmin
      .from('user_stats')
      .upsert(
        {
          user_id: userId,
          total_xp: newXP,
          level: newLevel,
          current_level_xp: currentLevelXP,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    // Check for level up
    const levelUp = newLevel > currentLevel

    return NextResponse.json({
      ok: true,
      data: {
        transaction,
        total_xp: newXP,
        level: newLevel,
        level_up: levelUp,
      },
    })
  } catch (e) {
    console.error('XP API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

