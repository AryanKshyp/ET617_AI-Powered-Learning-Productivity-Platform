import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('generated_items')
      .select(`
        *,
        materials (
          id,
          title,
          material_type
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Generated item not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch generated item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('generated_items')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete generated item' }, { status: 500 });
  }
}
