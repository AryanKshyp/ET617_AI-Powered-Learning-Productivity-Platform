"use client";
import Header from "@/components/dashhome/header";
import Hero from "@/components/dashhome/hero";
import FeatureList from "@/components/dashhome/FeatureList";
import { useEffect, useState } from "react";

type Course = { id: string; title: string; description: string | null };
type Section = { id: string; title: string };
type Material = { id: string; title: string; material_type: string };

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/courses");
      const json = await res.json();
      setCourses(json.data || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!activeCourse) return;
      const res = await fetch(`/api/sections?course_id=${activeCourse.id}`);
      const json = await res.json();
      setSections(json.data || []);
      const matRes = await fetch(`/api/materials?course_id=${activeCourse.id}`);
      const matJson = await matRes.json();
      setMaterials(matJson.data || []);
    })();
  }, [activeCourse]);

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const res = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newCourseTitle }) });
    const json = await res.json();
    if (json.data) {
      setCourses([json.data, ...courses]);
      setNewCourseTitle("");
    }
  };

  const createSection = async () => {
    if (!activeCourse || !newSectionTitle.trim()) return;
    const res = await fetch("/api/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: activeCourse.id, title: newSectionTitle }) });
    const json = await res.json();
    if (json.data) {
      setSections([...(sections || []), json.data]);
      setNewSectionTitle("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      <FeatureList />

      <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Courses</h2>
          <div className="flex gap-2 mb-3">
            <input value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} placeholder="New course title" className="flex-1 border px-3 py-2 rounded" />
            <button onClick={createCourse} className="px-3 py-2 bg-purple-700 text-white rounded">Add</button>
          </div>
          <ul className="space-y-2">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <button onClick={() => setActiveCourse(c)} className={`flex-1 text-left px-3 py-2 rounded ${activeCourse?.id === c.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>{c.title}</button>
                <a href={`/courses/${c.id}`} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                  Open
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-1 bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Sections</h2>
          {activeCourse ? (
            <>
              <div className="flex gap-2 mb-3">
                <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="New section title" className="flex-1 border px-3 py-2 rounded" />
                <button onClick={createSection} className="px-3 py-2 bg-purple-700 text-white rounded">Add</button>
              </div>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.id} className="px-3 py-2 rounded hover:bg-gray-50">{s.title}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-600">Select a course to view sections</p>
          )}
        </div>

        <div className="md:col-span-1 bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Materials</h2>
          {activeCourse ? (
            <>
              <UploadMaterial courseId={activeCourse.id} onUploaded={(m) => setMaterials([m, ...materials])} />
              <ul className="space-y-2 mt-3">
                {materials.map((m) => (
                  <li key={m.id} className="px-3 py-2 rounded hover:bg-gray-50 flex justify-between">
                    <span>{m.title} <span className="text-gray-500 text-xs">({m.material_type})</span></span>
                    <a className="text-purple-700" href={`/materials/${m.id}`}>Open</a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-600">Select a course to view materials</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadMaterial({ courseId, onUploaded }: { courseId: string; onUploaded: (m: Material) => void }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.set('course_id', courseId);
    form.set('title', title || file.name);
    form.set('file', file);
    const res = await fetch('/api/materials', { method: 'POST', body: form });
    const json = await res.json();
    setLoading(false);
    if (json.data) {
      onUploaded(json.data);
      setTitle("");
      setFile(null);
    }
  };

  const createNote = async () => {
    if (!note.trim()) return;
    setLoading(true);
    const res = await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, title: title || 'Note', content: note }) });
    const json = await res.json();
    setLoading(false);
    if (json.data) {
      onUploaded(json.data);
      setTitle("");
      setNote("");
    }
  };

  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full border px-3 py-2 rounded" />
      <div className="flex items-center gap-2">
        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={uploadFile} disabled={loading || !file} className="px-3 py-2 bg-purple-700 text-white rounded disabled:opacity-60">Upload</button>
      </div>
      <div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Or write a note..." className="w-full border px-3 py-2 rounded min-h-[100px]"></textarea>
        <button onClick={createNote} disabled={loading || !note.trim()} className="mt-2 px-3 py-2 bg-purple-700 text-white rounded disabled:opacity-60">Save Note</button>
      </div>
    </div>
  );
}
