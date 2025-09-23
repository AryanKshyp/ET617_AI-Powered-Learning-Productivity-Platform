import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // reconstruct fields we expect
    const entry = {
      user_id: body.user_id ?? null,
      time: new Date().toISOString(),
      event_context: body.event_context ?? body.context ?? null,
      component: body.component ?? null,
      event_name: body.event_name ?? body.type ?? null,
      description: body.description ?? null,
      origin: body.origin ?? null,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      metadata: body.metadata ?? {}
    }
    const { error } = await supabaseAdmin.from('clickstream').insert(entry)
    if (error) {
      console.error('Insert error', error)
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
