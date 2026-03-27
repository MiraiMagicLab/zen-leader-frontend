import { motion } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { courseApi, type CourseResponse } from "@/lib/api"

const categoryColors: Record<string, string> = {
  "STRATEGIC MASTERY": "bg-secondary/80",
  "HUMAN CENTRICITY": "bg-tertiary/80",
  "FINANCE & OPS": "bg-primary/80",
}

const levelColors: Record<string, string> = {
  "Beginner": "bg-emerald-100 text-emerald-700",
  "Intermediate": "bg-amber-100 text-amber-700",
  "Advanced": "bg-orange-100 text-orange-700",
  "Expert": "bg-rose-100 text-rose-700",
}


export default function CourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const courseId = id ?? ""

  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    courseApi.getById(courseId)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-slate-300 text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="material-symbols-outlined text-slate-200 text-6xl">search_off</span>
        <p className="text-slate-400 font-semibold">Course not found.</p>
        <button onClick={() => navigate("/dashboard/courses")} className="text-secondary text-sm font-bold hover:underline">
          Back to Courses
        </button>
      </div>
    )
  }

  const courseRuns = course.courseRuns ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate("/dashboard/courses")} className="hover:text-secondary transition-colors">
          Courses
        </button>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-600 font-semibold truncate max-w-xs">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: Main Card ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Banner */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
            <div className="relative h-56">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-secondary/20 to-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-200 text-6xl">image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
              {course.category && (
                <span className={`absolute top-4 left-4 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg ${categoryColors[course.category] ?? "bg-slate-600/80"} backdrop-blur-sm`}>
                  {course.category}
                </span>
              )}
              {course.level && (
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm ${levelColors[course.level] ?? "bg-white/80 text-slate-600"}`}>
                  {course.level}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">{course.code}</p>
              <h2 className="text-2xl font-extrabold font-headline text-secondary leading-tight mb-3">
                {course.title}
              </h2>

              {/* Tags */}
              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {course.description && (
                <p className="text-sm text-slate-500 leading-relaxed">{course.description}</p>
              )}
            </div>
          </div>

          {/* Course Runs */}
          {courseRuns.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                <h3 className="text-base font-extrabold font-headline text-slate-900">Course Runs</h3>
                <span className="ml-auto text-[10px] font-bold bg-secondary/10 text-secondary px-2.5 py-1 rounded-lg">{courseRuns.length} Runs</span>
              </div>

              {courseRuns.map((run, ri) => (
                <button
                  key={run.id}
                  onClick={() => navigate(`/dashboard/runs/${run.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-secondary/5 transition-colors text-left"
                >
                  <span className="w-6 h-6 rounded-lg bg-secondary/10 text-secondary text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    {String(ri + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-bold text-slate-800 flex-1 truncate font-mono">{run.code}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    run.status === "PUBLISHED" ? "bg-primary-fixed text-on-primary-fixed" : "bg-slate-200 text-slate-500"
                  }`}>
                    {run.status}
                  </span>
                  <span className="material-symbols-outlined text-slate-300 text-[16px]">chevron_right</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="space-y-4">

          {/* Course Details */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <h3 className="text-sm font-extrabold text-slate-900 font-headline mb-5">Course Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Code</span>
                <span className="text-sm font-mono font-bold text-slate-700">{course.code}</span>
              </div>
              {course.category && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Category</span>
                  <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg">
                    {course.category}
                  </span>
                </div>
              )}
              {course.level && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Level</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${levelColors[course.level] ?? "bg-slate-100 text-slate-500"}`}>
                    {course.level}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Order Index</span>
                <span className="text-sm font-bold text-slate-700">#{course.orderIndex}</span>
              </div>
              {course.programCode && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Program</span>
                  <span className="text-sm font-bold text-slate-700">{course.programCode}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Course Runs</span>
                <span className="text-sm font-bold text-slate-700">{courseRuns.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <h3 className="text-sm font-extrabold text-slate-900 font-headline mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/5 text-left transition-colors group"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-secondary text-[18px] transition-colors">edit</span>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-secondary transition-colors">Edit Course</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-tertiary/5 text-left transition-colors group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-tertiary text-[18px] transition-colors">bar_chart</span>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-tertiary transition-colors">View Stats</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-left transition-colors group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-700 text-[18px] transition-colors">archive</span>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-700 transition-colors">Archive Course</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
