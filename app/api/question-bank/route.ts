import { NextResponse } from 'next/server';

type Paper = {
  id: number;
  title: string;
  year: number | null;
  resourceType: 'pyq' | 'question_bank';
};

const papersByCourse: Record<string, Paper[]> = {};

function getCourseId(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('course_id');
  return courseId?.trim() || null;
}

export async function GET(req: Request) {
  const courseId = getCourseId(req);
  if (!courseId) {
    return NextResponse.json({ error: 'course_id query parameter is required' }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: papersByCourse[courseId] || [] });
}

export async function POST(req: Request) {
  const courseId = getCourseId(req);
  if (!courseId) {
    return NextResponse.json({ error: 'course_id query parameter is required' }, { status: 400 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let title = 'Uploaded Paper';
    let year: number | null = null;
    let resourceType: Paper['resourceType'] = 'question_bank';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : title;
      year = typeof body?.year === 'number' ? body.year : null;
      resourceType = body?.resourceType === 'pyq' ? 'pyq' : 'question_bank';
    } else if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const formTitle = form.get('title');
      const formType = form.get('resourceType');
      title = typeof formTitle === 'string' && formTitle.trim() ? formTitle.trim() : title;
      resourceType = formType === 'pyq' ? 'pyq' : 'question_bank';
      const parsedYear = Number(form.get('year'));
      year = Number.isFinite(parsedYear) ? parsedYear : null;
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    const newItem: Paper = {
      id: Date.now(),
      title,
      year,
      resourceType,
    };

    papersByCourse[courseId] = [newItem, ...(papersByCourse[courseId] || [])];

    return NextResponse.json({ success: true, data: newItem });
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


