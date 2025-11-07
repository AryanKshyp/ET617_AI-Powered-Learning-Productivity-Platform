import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestUser } from '@/lib/getRequestUser';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await getRequestUser(req);
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', authResult.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await getRequestUser(req);
    if (!authResult.user) {
      return NextResponse.json({error: 'Unauthorized'}, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({ title, description })
      .eq('id', params.id)
      .eq('owner_id', authResult.user.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await getRequestUser(req);
    if (!authResult.user) {
      return NextResponse.json({error: 'Unauthorized'}, { status: 401 });
    }

    const { error, count } = await supabaseAdmin
      .from('courses')
      .delete({ count: 'exact' })
      .eq('id', params.id)
      .eq('owner_id', authResult.user.id);

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    if (!count) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
