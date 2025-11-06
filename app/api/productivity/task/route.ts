import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { board_id, title, description, priority, due_date, user_id } = body

    console.log('Task creation request:', { board_id, title, user_id, priority })

    if (!title || !board_id) {
      return NextResponse.json({ error: 'Title and board_id required' }, { status: 400 })
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        board_id,
        user_id: user_id,
        title,
        description: description || null,
        priority: priority || 'medium',
        due_date: due_date || null,
        status: 'todo',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Task insert error:', error)
      return NextResponse.json({ 
        error: error.message || String(error),
        details: error 
      }, { status: 500 })
    }

    console.log('Task created successfully:', data)
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Task API error:', e)
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Internal server error',
      details: String(e)
    }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, priority, due_date, description } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (status !== undefined) {
      updateData.status = status
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (due_date !== undefined) updateData.due_date = due_date
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Task update error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error('Task update error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Task delete error:', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Task delete error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

