import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get material details first
    const { data: material, error: fetchError } = await supabaseAdmin
      .from('materials')
      .select('file_path')
      .eq('id', params.id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: String(fetchError) }, { status: 500 });
    }
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    // Delete from storage if file exists
    if (material.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('materials')
        .remove([material.file_path]);
      
      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete from database
    const { error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
