import { NextResponse } from "next/server";

type SyllabusItem = {
  id: number;
  title: string;
  content: string;
};

const syllabusByCourse: Record<string, SyllabusItem[]> = {};

function getCourseId(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course_id");
  return courseId?.trim() || null;
}

export async function GET(req: Request) {
  const courseId = getCourseId(req);
  if (!courseId) {
    return NextResponse.json({ error: "course_id query parameter is required" }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: syllabusByCourse[courseId] || [] });
}

export async function POST(req: Request) {
  const courseId = getCourseId(req);
  if (!courseId) {
    return NextResponse.json({ error: "course_id query parameter is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "Syllabus";
    const content = typeof body?.content === "string" && body.content.trim() ? body.content.trim() : "";

    const newItem: SyllabusItem = {
      id: Date.now(),
      title,
      content,
    };

    syllabusByCourse[courseId] = [newItem, ...(syllabusByCourse[courseId] || [])];

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save syllabus" }, { status: 500 });
  }
}

