import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { courseRunApi, courseApi, type CourseRunResponse, type CourseResponse, type LessonResponse } from "@/lib/api"
import FileActionLinks from "@/components/FileActionLinks"
import { getLessonAsset } from "@/lib/lessonContent"

function PreviewModal({ lesson, onClose }: { lesson: LessonResponse; onClose: () => void }) {
  const asset = getLessonAsset(lesson.contentData)
  const fileUrl = asset.url
  const fileName = asset.fileName || lesson.title
  const openLabel = lesson.type === "video" ? "Open Video" : lesson.type === "photo" ? "Open Image" : "Open File"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {lesson.type === "video" ? "play_circle" : lesson.type === "photo" ? "image" : "description"}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{lesson.title}</p>
              {lesson.description && <p className="text-[11px] text-slate-400">{lesson.description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6">
          {fileUrl ? (
            lesson.type === "video" ? (
              <video controls src={fileUrl} className="w-full rounded-xl max-h-96 bg-black" />
            ) : lesson.type === "photo" ? (
              <img src={fileUrl} alt={lesson.title} className="w-full rounded-xl max-h-96 object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <span className="material-symbols-outlined text-slate-300 text-6xl">description</span>
                <p className="text-sm text-slate-500">{lesson.description}</p>
                <div className="flex items-center gap-3">
                  <FileActionLinks
                    url={fileUrl}
                    fileName={fileName}
                    openClassName="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    downloadClassName="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                    openLabel={openLabel}
                    downloadLabel="Download"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
              <span className="material-symbols-outlined text-5xl">cloud_off</span>
              <p className="text-sm font-semibold">No file uploaded yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

const iconMap: Record<string, string> = {
  video: "play_circle",
  photo: "image",
  document: "description",
  resource: "description",
  live: "podcasts",
  text: "article",
}
const colorMap: Record<string, string> = {
  video: "text-secondary bg-secondary/10",
  photo: "text-primary bg-primary/10",
  document: "text-tertiary bg-tertiary/10",
  resource: "text-primary bg-primary/10",
  live: "text-tertiary bg-tertiary/10",
  text: "text-slate-500 bg-slate-100",
}

export default function CourseRunDetailPage() {
  const navigate = useNavigate()
  const { runId } = useParams<{ runId: string }>()
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [previewLesson, setPreviewLesson] = useState<LessonResponse | null>(null)
  const [publishing, setPublishing] = useState(false)

  const [run, setRun] = useState<CourseRunResponse | null>(null)
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!runId) return
    courseRunApi.getById(runId)
      .then(async (r) => {
        setRun(r)
        // Fetch parent course for breadcrumb
        try {
          const c = await courseApi.getById(r.courseId)
          setCourse(c)
        } catch {
          // breadcrumb will still show courseId
        }
      })
      .catch(() => setRun(null))
      .finally(() => setLoading(false))
  }, [runId])

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      next.has(chId) ? next.delete(chId) : next.add(chId)
      return next
    })
  }

  const toggleStatus = async () => {
    if (!run || publishing) return
    const newStatus = run.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    setPublishing(true)
    try {
      await courseRunApi.update(run.id, {
        courseId: run.courseId,
        code: run.code,
        status: newStatus,
        startsAt: run.startsAt ?? new Date().toISOString(),
        endsAt: run.endsAt ?? new Date().toISOString(),
        timezone: run.timezone ?? "UTC",
        metadata: run.metadata ?? {},
      })
      setRun((prev) => prev ? { ...prev, status: newStatus } : prev)
    } finally {
      setPublishing(false)
    }
  }

  const formatDateTime = (val: string | null) => {
    if (!val) return "—"
    return new Date(val).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-slate-300 text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="material-symbols-outlined text-slate-300 text-6xl">error</span>
        <p className="text-slate-500 font-semibold">Course run not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-secondary hover:underline">
          Go back
        </button>
      </div>
    )
  }

  const chapters = run.chapters ?? []
  const totalLessons = chapters.reduce((a, ch) => a + (ch.lessons?.length ?? 0), 0)

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/dashboard/courses" className="hover:text-secondary transition-colors">Courses</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        {course ? (
          <Link to={`/dashboard/courses/${course.id}`} className="hover:text-secondary transition-colors truncate max-w-40">
            {course.title}
          </Link>
        ) : (
          <span className="truncate max-w-40">Course</span>
        )}
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-600 font-semibold truncate max-w-50">{run.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={toggleStatus}
              disabled={publishing}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1 transition-all ${
                run.status === "PUBLISHED"
                  ? "bg-primary-fixed text-on-primary-fixed hover:opacity-80"
                  : "bg-slate-200 text-slate-500 hover:bg-primary-fixed hover:text-on-primary-fixed"
              } ${publishing ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
            >
              {publishing
                ? <span className="material-symbols-outlined text-[12px] animate-spin">autorenew</span>
                : <span className="material-symbols-outlined text-[12px]">{run.status === "PUBLISHED" ? "visibility" : "visibility_off"}</span>
              }
              {run.status}
            </button>
          </div>
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-slate-900">{run.code}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {run.startsAt ? `${formatDateTime(run.startsAt)} → ${formatDateTime(run.endsAt)}` : "No schedule set"}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors shrink-0 mt-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: "layers", label: "Chapters", value: chapters.length },
          { icon: "menu_book", label: "Lessons", value: totalLessons },
          { icon: "schedule", label: "Est. Duration", value: `${(totalLessons * 0.35).toFixed(1)}h` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <div>
              <p className="text-lg font-extrabold font-headline text-slate-900">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Curriculum</h3>

        {chapters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 flex flex-col items-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-5xl">inbox</span>
            <p className="text-sm font-semibold">No chapters in this run.</p>
          </div>
        ) : (
          chapters
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((chapter, idx) => {
              const isOpen = expandedChapters.has(chapter.id)
              const lessons = chapter.lessons ?? []
              return (
                <div key={chapter.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Chapter header */}
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-xl bg-secondary text-white text-[12px] font-extrabold flex items-center justify-center shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{chapter.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lessons.length === 0
                          ? "No lessons"
                          : `${lessons.length} lesson${lessons.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Lessons */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                          {lessons.length === 0 ? (
                            <div className="px-5 py-4 text-[11px] text-slate-300 italic">No lessons yet.</div>
                          ) : (
                            lessons
                              .slice()
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((lesson) => {
                                const asset = getLessonAsset(lesson.contentData)
                                const hasFile = Boolean(asset.url)
                                return (
                                  <div key={lesson.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorMap[lesson.type] ?? "text-slate-400 bg-slate-100"}`}>
                                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {iconMap[lesson.type] ?? "article"}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {hasFile ? (
                                        <a
                                          href={asset.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-primary min-w-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                                            {lesson.type === "video" ? "play_circle" : lesson.type === "photo" ? "image" : "description"}
                                          </span>
                                          <span className="truncate">{lesson.title}</span>
                                        </a>
                                      ) : (
                                        <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                                      )}
                                      {lesson.description && (
                                        <p className="text-[11px] text-slate-400">{lesson.description}</p>
                                      )}
                                    </div>
                                    {hasFile && (
                                      <button
                                        onClick={() => setPreviewLesson(lesson)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all shrink-0"
                                        title="Preview"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                      </button>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide shrink-0">
                                      {lesson.type}
                                    </span>
                                  </div>
                                )
                              })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
        )}
      </div>
    </motion.div>

    <AnimatePresence>
      {previewLesson && <PreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />}
    </AnimatePresence>
    </>
  )
}
