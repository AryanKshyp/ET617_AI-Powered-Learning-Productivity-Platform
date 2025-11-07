import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { material_id, course_id, generated_type, settings } = body;

    console.log('Generate content request:', { material_id, course_id, generated_type, settings });

    if (!material_id || !course_id || !generated_type || !settings) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: `Missing: ${!material_id ? 'material_id ' : ''}${!course_id ? 'course_id ' : ''}${!generated_type ? 'generated_type ' : ''}${!settings ? 'settings' : ''}`
      }, { status: 400 });
    }

    // Validate settings
    if (!settings.bloom_level) {
      return NextResponse.json({ 
        error: 'Missing bloom_level in settings' 
      }, { status: 400 });
    }

    // Validate page range for PDFs
    if (settings.page_range) {
      const pageRangeMatch = settings.page_range.match(/^(\d+)-(\d+)$/);
      if (!pageRangeMatch) {
        return NextResponse.json({ 
          error: 'Invalid page_range format. Expected format: "start-end" (e.g., "1-10")' 
        }, { status: 400 });
      }
      const start = parseInt(pageRangeMatch[1]);
      const end = parseInt(pageRangeMatch[2]);
      if (start > end) {
        return NextResponse.json({ 
          error: 'Invalid page_range: start page must be less than or equal to end page' 
        }, { status: 400 });
      }
    }

    // Get material details
    const { data: material, error: materialError } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', material_id)
      .single();

    if (materialError) {
      console.error('Material fetch error:', materialError);
      return NextResponse.json({ 
        error: 'Material not found',
        details: materialError.message 
      }, { status: 404 });
    }

    if (!material) {
      return NextResponse.json({ 
        error: 'Material not found',
        details: 'Material with the provided ID does not exist' 
      }, { status: 404 });
    }

    // Support PDFs and inline notes
    if (material.material_type !== 'pdf' && material.material_type !== 'note') {
      return NextResponse.json({ 
        error: 'Content generation only supported for PDF files or notes',
        details: `Material type "${material.material_type}" is not supported` 
      }, { status: 400 });
    }

    // Call Python generator service (expects full endpoint URL, e.g., https://rag-pipeline-nm08.onrender.com/generate)
    // Note: Server-side routes use process.env (not NEXT_PUBLIC_ prefix)
    const baseUrl = process.env.PYTHON_GENERATOR_URL || process.env.NEXT_PUBLIC_PYTHON_GENERATOR_URL || 'https://rag-pipeline-nm08.onrender.com';
    // Ensure the URL ends with /generate
    const pythonGeneratorUrl = baseUrl.endsWith('/generate') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/generate`;
    
    if (!pythonGeneratorUrl) {
      return NextResponse.json({ 
        error: 'Python generator URL not configured',
        details: 'Please set PYTHON_GENERATOR_URL environment variable' 
      }, { status: 500 });
    }

    let generationRequest;

    const isNote = material.material_type === 'note';

    if (isNote) {
      // Use note content directly as the text source
      const base = {
        text: material.content || '',
        type: generated_type,
        bloom_level: settings.bloom_level,
        material_meta: { id: material_id },
        settings: settings
      } as any;
      generationRequest = base;
    } else {
      // PDF: instruct generator and pass pdf_id for RAG
      if (generated_type === 'summary') {
        generationRequest = {
          text: `Generate a ${settings.length} summary from pages ${settings.page_range}`,
          type: 'summary',
          bloom_level: settings.bloom_level,
          material_meta: { id: material_id },
          pdf_id: material.file_path,
          bucket_name: 'materials',  // Specify the correct bucket name
          settings: settings
        };
      } else {
        generationRequest = {
          text: `Generate ${generated_type} with ${settings.num_questions} questions from pages ${settings.page_range}`,
          type: generated_type,
          bloom_level: settings.bloom_level,
          material_meta: { id: material_id },
          pdf_id: material.file_path,
          bucket_name: 'materials',  // Specify the correct bucket name
          settings: settings
        };
      }
    }

    console.log('Calling Python generator:', pythonGeneratorUrl);
    console.log('Generation request:', JSON.stringify(generationRequest, null, 2));

    let pythonResponse;
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      // Create timeout for fetch request (5 minutes)
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      pythonResponse = await fetch(pythonGeneratorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationRequest),
        signal: controller.signal
      });
      
      if (timeoutId) clearTimeout(timeoutId);
    } catch (fetchError: any) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('Python generator fetch error:', fetchError);
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return NextResponse.json({ 
          error: 'Python generator request timed out',
          details: 'The generator service did not respond within 5 minutes' 
        }, { status: 500 });
      }
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json({ 
          error: 'Python generator service unreachable',
          details: `Could not connect to ${pythonGeneratorUrl}. Please ensure the service is running.` 
        }, { status: 500 });
      }
      return NextResponse.json({ 
        error: 'Failed to call Python generator',
        details: fetchError.message || 'Unknown network error' 
      }, { status: 500 });
    }

    if (!pythonResponse.ok) {
      let errorText;
      try {
        errorText = await pythonResponse.text();
      } catch (e) {
        errorText = `HTTP ${pythonResponse.status}: ${pythonResponse.statusText}`;
      }
      console.error('Python generator error:', errorText);
      return NextResponse.json({ 
        error: 'Content generation failed', 
        details: errorText 
      }, { status: 500 });
    }

    let generatedContent;
    try {
      generatedContent = await pythonResponse.json();
    } catch (parseError) {
      console.error('Failed to parse Python generator response:', parseError);
      return NextResponse.json({ 
        error: 'Invalid response from Python generator',
        details: 'The generator service returned invalid JSON' 
      }, { status: 500 });
    }

    // Save generated content to database
    // Try with generation_settings first, fallback without it if column doesn't exist
    let insertData: any = {
      course_id,
      material_id,
      generated_type,
      payload: generatedContent,
      generator: 'python-rag-pipeline',
      generation_settings: settings
    };
    
    let { data: generatedItem, error: saveError } = await supabaseAdmin
      .from('generated_items')
      .insert(insertData)
      .select()
      .single();

    // If error is about missing generation_settings column, retry without it
    const errorMsg = saveError?.message || JSON.stringify(saveError) || '';
    const lowerMsg = errorMsg.toLowerCase();
    if (saveError && (
      lowerMsg.includes('generation_settings') || 
      (lowerMsg.includes('column') && lowerMsg.includes('schema cache') && lowerMsg.includes('generation_settings'))
    )) {
      console.warn('generation_settings column not found, retrying without it:', errorMsg);
      insertData = {
        course_id,
        material_id,
        generated_type,
        payload: generatedContent,
        generator: 'python-rag-pipeline'
      };
      
      const retryResult = await supabaseAdmin
        .from('generated_items')
        .insert(insertData)
        .select()
        .single();
      
      generatedItem = retryResult.data;
      saveError = retryResult.error;
    }

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
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
