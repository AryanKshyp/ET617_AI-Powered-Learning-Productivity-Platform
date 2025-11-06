import { NextResponse } from 'next/server';

type Paper = { id: number; title: string; year: number | null; count: number | null };

let SAMPLE_PAPERS: Paper[] = [
  { id: 1, title: 'PYQ 2024 (1)', year: 2024, count: 1 },
  { id: 2, title: 'PYQ 2024 (2)', year: 2024, count: 2 },
  { id: 3, title: 'PYQ 2023 (1)', year: 2023, count: 1 },
  { id: 4, title: 'PYQ 2023 (2)', year: 2023, count: 2 },
  { id: 5, title: 'PYQ 2022 (1)', year: 2022, count: 1 },
  { id: 6, title: 'PYQ 2022 (2)', year: 2022, count: 2 },
  { id: 7, title: 'PYQ 2021 (1)', year: 2021, count: 1 },
  { id: 8, title: 'Question Bank', year: null, count: null }
];

export async function GET() {
  return NextResponse.json({ success: true, data: SAMPLE_PAPERS });
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const title: string = body?.title || 'Uploaded Paper';
      const year: number | null = typeof body?.year === 'number' ? body.year : null;
      const count: number | null = typeof body?.count === 'number' ? body.count : 1;
      const newItem: Paper = { id: Date.now(), title, year, count };
      SAMPLE_PAPERS = [newItem, ...SAMPLE_PAPERS];
      return NextResponse.json({ success: true, data: newItem });
    }

    // Accept basic multipart without storing the file (demo only)
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const title = String(form.get('title') || 'Uploaded Paper');
      const newItem: Paper = { id: Date.now(), title, year: null, count: 1 };
      SAMPLE_PAPERS = [newItem, ...SAMPLE_PAPERS];
      return NextResponse.json({ success: true, data: newItem });
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


