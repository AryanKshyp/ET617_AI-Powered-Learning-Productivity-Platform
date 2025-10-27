import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { material_id, course_id, generated_type, settings } = body;

    if (!material_id || !course_id || !generated_type || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get material details
    const { data: material, error: materialError } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', material_id)
      .single();

    if (materialError || !material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Check if it's a PDF file
    if (material.material_type !== 'pdf') {
      return NextResponse.json({ error: 'Content generation only supported for PDF files' }, { status: 400 });
    }

    // Call Python generator service
    const pythonGeneratorUrl = process.env.NEXT_PUBLIC_PYTHON_GENERATOR_URL || 'http://localhost:8000';
    
    let generationRequest;
    
    if (generated_type === 'summary') {
      // For summary, we need to call a different endpoint or modify the existing one
      generationRequest = {
        text: `Generate a ${settings.length} summary from pages ${settings.page_range}`,
        type: 'summary',
        bloom_level: settings.bloom_level,
        material_meta: { id: material_id },
        pdf_id: material.file_path, // Assuming file_path contains the PDF ID
        settings: settings
      };
    } else {
      // For quiz and assignment
      generationRequest = {
        text: `Generate ${generated_type} with ${settings.num_questions} questions from pages ${settings.page_range}`,
        type: generated_type,
        bloom_level: settings.bloom_level,
        material_meta: { id: material_id },
        pdf_id: material.file_path,
        settings: settings
      };
    }

    const pythonResponse = await fetch(`${pythonGeneratorUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generationRequest)
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python generator error:', errorText);
      return NextResponse.json({ 
        error: 'Content generation failed', 
        details: errorText 
      }, { status: 500 });
    }

    const generatedContent = await pythonResponse.json();

    // Save generated content to database
    const { data: generatedItem, error: saveError } = await supabaseAdmin
      .from('generated_items')
      .insert({
        course_id,
        material_id,
        generated_type,
        payload: generatedContent,
        generation_settings: settings,
        generator: 'python-rag-pipeline'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      return NextResponse.json({ 
        error: 'Failed to save generated content',
        details: saveError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: generatedItem 
    });

  } catch (error) {
    console.error('Generate content error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
