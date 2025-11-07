"use client";

import Header from "@/components/dashhome/header";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Course = { id: string; title: string; description: string | null };
type Material = { id: string; title: string; material_type: string };
type SyllabusItem = { id: number; title: string; content: string };
type QuestionResource = {
  id: number;
  title: string;
  year: number | null;
  resourceType: "pyq" | "question_bank";
};

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [materialsByCourse, setMaterialsByCourse] = useState<Record<string, Material[]>>({});
  const [materialsLoadingByCourse, setMaterialsLoadingByCourse] = useState<Record<string, boolean>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [syllabusByCourse, setSyllabusByCourse] = useState<Record<string, SyllabusItem[]>>({});
  const [syllabusLoadingByCourse, setSyllabusLoadingByCourse] = useState<Record<string, boolean>>({});
  const [questionsByCourse, setQuestionsByCourse] = useState<Record<string, QuestionResource[]>>({});
  const [questionsLoadingByCourse, setQuestionsLoadingByCourse] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoadingCourses(true);
    (async () => {
      try {
        const res = await fetch("/api/courses");
        const json = await res.json();
        if (cancelled) return;
        const loadedCourses: Course[] = json.data || [];
        setCourses(loadedCourses);
        if (loadedCourses.length > 0) {
          setExpandedCourseId((prev) => prev ?? loadedCourses[0].id);
        }
      } catch (error) {
        console.error("Failed to load courses", error);
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadSyllabusForCourse = useCallback(
    async (courseId: string) => {
      if (syllabusByCourse[courseId]) return;

      setSyllabusLoadingByCourse((prev) => ({
        ...prev,
        [courseId]: true,
      }));

      try {
        const response = await fetch(`/api/syllabus?course_id=${courseId}`);
        const json = await response.json();
        setSyllabusByCourse((prev) => ({
          ...prev,
          [courseId]: json.data || [],
        }));
      } catch (error) {
        console.error("Failed to load syllabus", error);
        setSyllabusByCourse((prev) => ({
          ...prev,
          [courseId]: [],
        }));
      } finally {
        setSyllabusLoadingByCourse((prev) => ({
          ...prev,
          [courseId]: false,
        }));
      }
    },
    [syllabusByCourse]
  );

  const loadQuestionsForCourse = useCallback(
    async (courseId: string) => {
      if (questionsByCourse[courseId]) return;

      setQuestionsLoadingByCourse((prev) => ({
        ...prev,
        [courseId]: true,
      }));

      try {
        const response = await fetch(`/api/question-bank?course_id=${courseId}`);
        const json = await response.json();
        setQuestionsByCourse((prev) => ({
          ...prev,
          [courseId]: json.data || [],
        }));
      } catch (error) {
        console.error("Failed to load question resources", error);
        setQuestionsByCourse((prev) => ({
          ...prev,
          [courseId]: [],
        }));
      } finally {
        setQuestionsLoadingByCourse((prev) => ({
          ...prev,
          [courseId]: false,
        }));
      }
    },
    [questionsByCourse]
  );

  const loadMaterialsForCourse = useCallback(
    async (courseId: string) => {
      if (materialsByCourse[courseId]) return;

      setMaterialsLoadingByCourse((prev) => ({
        ...prev,
        [courseId]: true,
      }));

      try {
        const matRes = await fetch(`/api/materials?course_id=${courseId}`);
        const matJson = await matRes.json();
        setMaterialsByCourse((prev) => ({
          ...prev,
          [courseId]: matJson.data || [],
        }));
      } catch (error) {
        console.error("Failed to load materials", error);
        setMaterialsByCourse((prev) => ({
          ...prev,
          [courseId]: [],
        }));
      } finally {
        setMaterialsLoadingByCourse((prev) => ({
          ...prev,
          [courseId]: false,
        }));
      }
    },
    [materialsByCourse]
  );

  useEffect(() => {
    if (!expandedCourseId) return;
    void Promise.all([
      loadMaterialsForCourse(expandedCourseId),
      loadSyllabusForCourse(expandedCourseId),
      loadQuestionsForCourse(expandedCourseId),
    ]);
  }, [expandedCourseId, loadMaterialsForCourse, loadQuestionsForCourse, loadSyllabusForCourse]);

  const handleToggleCourse = useCallback(
    (courseId: string) => {
      setExpandedCourseId((current) => {
        const next = current === courseId ? null : courseId;
        return next;
      });
    },
    []
  );

  const handleMaterialUploaded = useCallback((courseId: string, material: Material) => {
    setMaterialsByCourse((prev) => {
      const current = prev[courseId] || [];
      return {
        ...prev,
        [courseId]: [material, ...current],
      };
    });
  }, []);

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    try {
      setCreatingCourse(true);
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newCourseTitle.trim() }),
      });
      const json = await res.json();
      if (json.data) {
        setCourses((prev) => [json.data, ...prev]);
        setNewCourseTitle("");
        setExpandedCourseId(json.data.id);
        setMaterialsByCourse((prev) => ({
          ...prev,
          [json.data.id]: [],
        }));
        setSyllabusByCourse((prev) => ({
          ...prev,
          [json.data.id]: [],
        }));
        setQuestionsByCourse((prev) => ({
          ...prev,
          [json.data.id]: [],
        }));
      }
    } catch (error) {
      console.error("Failed to create course", error);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreateSyllabusEntry = useCallback(
    async (courseId: string, payload: { title: string; content: string }) => {
      try {
        const response = await fetch(`/api/syllabus?course_id=${courseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await response.json();
        if (json.data) {
          setSyllabusByCourse((prev) => ({
            ...prev,
            [courseId]: [json.data, ...(prev[courseId] || [])],
          }));
          return json.data as SyllabusItem;
        }
      } catch (error) {
        console.error("Failed to create syllabus entry", error);
      }
      return null;
    },
    []
  );

  const handleCreateQuestionResource = useCallback(
    async (
      courseId: string,
      payload: { title: string; year: number | null; resourceType: QuestionResource["resourceType"] }
    ) => {
      try {
        const response = await fetch(`/api/question-bank?course_id=${courseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await response.json();
        if (json.data) {
          setQuestionsByCourse((prev) => ({
            ...prev,
            [courseId]: [json.data, ...(prev[courseId] || [])],
          }));
          return json.data as QuestionResource;
        }
      } catch (error) {
        console.error("Failed to create question resource", error);
      }
      return null;
    },
    []
  );

  const courseCards = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.map((course) => {
      const isExpanded = expandedCourseId === course.id;
      const materials = materialsByCourse[course.id] || [];
      const materialsLoading = Boolean(materialsLoadingByCourse[course.id]);
      const syllabus = syllabusByCourse[course.id] || [];
      const syllabusLoading = Boolean(syllabusLoadingByCourse[course.id]);
      const questionResources = questionsByCourse[course.id] || [];
      const questionResourcesLoading = Boolean(questionsLoadingByCourse[course.id]);

      return (
        <CourseCard
          key={course.id}
          course={course}
          isExpanded={isExpanded}
          onToggle={handleToggleCourse}
          materials={materials}
          materialsLoading={materialsLoading}
          onMaterialUploaded={handleMaterialUploaded}
          syllabus={syllabus}
          syllabusLoading={syllabusLoading}
          onCreateSyllabus={handleCreateSyllabusEntry}
          questionResources={questionResources}
          questionResourcesLoading={questionResourcesLoading}
          onCreateQuestionResource={handleCreateQuestionResource}
        />
      );
    });
  }, [
    courses,
    expandedCourseId,
    handleCreateQuestionResource,
    handleCreateSyllabusEntry,
    handleMaterialUploaded,
    handleToggleCourse,
    materialsByCourse,
    materialsLoadingByCourse,
    questionsByCourse,
    questionsLoadingByCourse,
    syllabusByCourse,
    syllabusLoadingByCourse,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Course Dashboard</h1>
          <p className="text-sm md:text-base text-purple-100 max-w-2xl">
            Every course now has a dedicated hub for syllabus management, question banks, AI content, and materials.
          </p>
        </div>
      </section>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <section className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add a course</h2>
                <p className="text-sm text-gray-500">Create a new course hub to manage content in one place.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Course title"
                  className="flex-1 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleCreateCourse}
                  disabled={creatingCourse || !newCourseTitle.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {creatingCourse ? "Adding…" : "Add course"}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your courses</h2>
                <p className="text-sm text-gray-500">Dive into any course to manage its tools, resources, and materials.</p>
              </div>
              <span className="hidden text-sm font-medium text-purple-600 md:inline-block">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </span>
            </div>

            {courses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-inner border border-gray-100 p-4 flex gap-3 overflow-x-auto">
                {courses.map((course) => {
                  const isActive = expandedCourseId === course.id;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleToggleCourse(course.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                        isActive ? "bg-purple-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {course.title}
                    </button>
                  );
                })}
              </div>
            )}

            {loadingCourses ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((key) => (
                  <div key={key} className="animate-pulse bg-white rounded-2xl shadow-md p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-32 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
                <h3 className="text-lg font-semibold text-gray-900">No courses yet</h3>
                <p className="text-sm">Create a course to unlock syllabus tools, question banks, and resources.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {courseCards}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

type CourseCardProps = {
  course: Course;
  isExpanded: boolean;
  onToggle: (courseId: string) => void;
  materials: Material[];
  materialsLoading: boolean;
  onMaterialUploaded: (courseId: string, material: Material) => void;
  syllabus: SyllabusItem[];
  syllabusLoading: boolean;
  onCreateSyllabus: (courseId: string, payload: { title: string; content: string }) => Promise<SyllabusItem | null>;
  questionResources: QuestionResource[];
  questionResourcesLoading: boolean;
  onCreateQuestionResource: (
    courseId: string,
    payload: { title: string; year: number | null; resourceType: QuestionResource["resourceType"] }
  ) => Promise<QuestionResource | null>;
};

function CourseCard({
  course,
  isExpanded,
  onToggle,
  materials,
  materialsLoading,
  onMaterialUploaded,
  syllabus,
  syllabusLoading,
  onCreateSyllabus,
  questionResources,
  questionResourcesLoading,
  onCreateQuestionResource,
}: CourseCardProps) {
  const handleToggle = useCallback(() => {
    onToggle(course.id);
  }, [course.id, onToggle]);

  const [syllabusTitle, setSyllabusTitle] = useState("");
  const [syllabusContent, setSyllabusContent] = useState("");
  const [syllabusSubmitting, setSyllabusSubmitting] = useState(false);

  const [questionTitle, setQuestionTitle] = useState("");
  const [questionYear, setQuestionYear] = useState<string>("");
  const [questionType, setQuestionType] = useState<QuestionResource["resourceType"]>("pyq");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);

  const handleAddSyllabus = useCallback(async () => {
    if (!syllabusContent.trim() && !syllabusTitle.trim()) return;
    setSyllabusSubmitting(true);
    try {
      const newItem = await onCreateSyllabus(course.id, {
        title: syllabusTitle.trim() || "Syllabus",
        content: syllabusContent.trim(),
      });
      if (newItem) {
        setSyllabusTitle("");
        setSyllabusContent("");
      }
    } catch (error) {
      console.error("Failed to add syllabus", error);
    } finally {
      setSyllabusSubmitting(false);
    }
  }, [course.id, onCreateSyllabus, syllabusContent, syllabusTitle]);

  const handleAddQuestionResource = useCallback(async () => {
    if (!questionTitle.trim()) return;
    setQuestionSubmitting(true);
    try {
      const newItem = await onCreateQuestionResource(course.id, {
        title: questionTitle.trim(),
        year: questionYear.trim() ? Number(questionYear) || null : null,
        resourceType: questionType,
      });
      if (newItem) {
        setQuestionTitle("");
        setQuestionYear("");
        setQuestionType("pyq");
      }
    } catch (error) {
      console.error("Failed to add question resource", error);
    } finally {
      setQuestionSubmitting(false);
    }
  }, [course.id, onCreateQuestionResource, questionTitle, questionType, questionYear]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
              {course.description ? (
                <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
              ) : (
                <p className="text-sm text-gray-400">Add a description from the course page to help collaborators understand the focus.</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Open workspace
              </Link>
              <button
                type="button"
                onClick={handleToggle}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-300 hover:text-purple-700"
              >
                {isExpanded ? "Hide details" : "View course hub"}
              </button>
            </div>
          </div>
        </div>

        <Link
          href={`/courses/${course.id}`}
          className="inline-flex w-fit items-center justify-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50"
        >
          Visit generated content
        </Link>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 pt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-gray-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Syllabus management</h4>
                  <p className="text-sm text-gray-500">Add updates and keep track of the latest syllabus overview.</p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-purple-500">Course specific</span>
              </div>

              <div className="space-y-3">
                <input
                  value={syllabusTitle}
                  onChange={(e) => setSyllabusTitle(e.target.value)}
                  placeholder="Syllabus title"
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  value={syllabusContent}
                  onChange={(e) => setSyllabusContent(e.target.value)}
                  placeholder="Outline the syllabus or add notes..."
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSyllabus}
                    disabled={syllabusSubmitting || (!syllabusContent.trim() && !syllabusTitle.trim())}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {syllabusSubmitting ? "Saving..." : "Save syllabus"}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                {syllabusLoading && syllabus.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading syllabus entries…</p>
                ) : syllabus.length === 0 ? (
                  <p className="text-sm text-gray-500">No syllabus entries yet. Add one to get started.</p>
                ) : (
                  syllabus.map((item) => (
                    <div key={item.id} className="bg-purple-50/60 border border-purple-100 rounded-lg p-3">
                      <h5 className="text-sm font-semibold text-purple-800">{item.title}</h5>
                      {item.content && <p className="mt-1 text-xs text-purple-700 whitespace-pre-line">{item.content}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Question resources</h4>
                  <p className="text-sm text-gray-500">Combine PYQs and question banks in one place.</p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-purple-500">Course specific</span>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={questionTitle}
                    onChange={(e) => setQuestionTitle(e.target.value)}
                    placeholder="Resource title"
                    className="flex-1 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    value={questionYear}
                    onChange={(e) => setQuestionYear(e.target.value)}
                    placeholder="Year (optional)"
                    className="w-full sm:w-32 border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQuestionType("pyq")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      questionType === "pyq"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-600 hover:border-purple-200"
                    }`}
                  >
                    PYQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionType("question_bank")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      questionType === "question_bank"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-600 hover:border-purple-200"
                    }`}
                  >
                    Question bank
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddQuestionResource}
                    disabled={questionSubmitting || !questionTitle.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {questionSubmitting ? "Saving..." : "Save resource"}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                {questionResourcesLoading && questionResources.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading question resources…</p>
                ) : questionResources.length === 0 ? (
                  <p className="text-sm text-gray-500">No question resources yet. Add PYQs or question banks.</p>
                ) : (
                  questionResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 bg-white"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900">{resource.title}</p>
                        <p className="text-xs text-gray-500">
                          {resource.resourceType === "pyq" ? "Previous year question" : "Question bank"}
                          {typeof resource.year === "number" ? ` · ${resource.year}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide rounded-full px-3 py-1 ${
                          resource.resourceType === "pyq"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {resource.resourceType === "pyq" ? "PYQ" : "Bank"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Materials</h4>
              <p className="text-sm text-gray-500">Keep lecture notes, slides, and course docs together.</p>
            </div>
            <span className="text-sm font-medium text-purple-600">
              {materials.length} {materials.length === 1 ? "item" : "items"}
            </span>
          </div>

          <UploadMaterial
            courseId={course.id}
            onUploaded={(material) => onMaterialUploaded(course.id, material)}
          />

          <div className="border-t border-gray-100 pt-4 space-y-3">
            {materialsLoading && materials.length === 0 ? (
              <p className="text-sm text-gray-500">Loading materials…</p>
            ) : materials.length === 0 ? (
              <p className="text-sm text-gray-500">No materials yet. Upload files or save a note to populate the library.</p>
            ) : (
              materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-purple-200 hover:bg-purple-50 transition"
                >
                  <div>
                    <p className="font-medium text-sm md:text-base text-gray-900">{material.title}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{material.material_type}</p>
                  </div>
                  <Link
                    href={`/materials/${material.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    Open
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
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
    try {
      const form = new FormData();
      form.set("course_id", courseId);
      form.set("title", title || file.name);
      form.set("file", file);
      const res = await fetch("/api/materials", { method: "POST", body: form });
      const json = await res.json();
      if (json.data) {
        onUploaded(json.data);
        setTitle("");
        setFile(null);
      }
    } catch (error) {
      console.error("Failed to upload material", error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          title: title || "Note",
          content: note,
        }),
      });
      const json = await res.json();
      if (json.data) {
        onUploaded(json.data);
        setTitle("");
        setNote("");
      }
    } catch (error) {
      console.error("Failed to save note", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)]">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <button
          onClick={uploadFile}
          disabled={loading || !file}
          className="inline-flex justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading && file ? "Uploading…" : "Upload file"}
        </button>
      </div>
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Or capture a quick note for this course…"
          className="w-full border border-gray-200 px-3 py-2 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="flex justify-end">
          <button
            onClick={createNote}
            disabled={loading || !note.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading && !file ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    </div>
  );
}
