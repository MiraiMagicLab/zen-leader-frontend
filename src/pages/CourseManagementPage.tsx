import { motion } from "framer-motion"
import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { programApi, courseApi, type CourseResponse, type ProgramResponse } from "@/lib/api"
import type { CourseData } from "@/data/courses"

const actionIcons: Record<string, string> = {
  EDIT: "edit",
  STATS: "bar_chart",
  DELETE: "delete_forever",
  ARCHIVE: "archive",
}

const actionColors: Record<string, string> = {
  EDIT: "text-slate-600 hover:text-secondary hover:bg-secondary/10",
  STATS: "text-slate-600 hover:text-tertiary hover:bg-tertiary/10",
  DELETE: "text-slate-600 hover:text-error hover:bg-error/10",
  ARCHIVE: "text-slate-600 hover:text-slate-800 hover:bg-slate-100",
}

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

function mapToCourseData(c: CourseResponse): CourseData {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    category: c.category ?? "",
    level: c.level ?? "",
    thumbnailUrl: c.thumbnailUrl ?? "",
    description: c.description ?? undefined,
    tags: c.tags ?? [],
    orderIndex: c.orderIndex,
    programId: c.programId ?? null,
    programCode: c.programCode ?? undefined,
    actions: ["EDIT", "DELETE"],
  }
}

export default function CourseManagementPage() {
  const navigate = useNavigate()
  const [programFilter, setProgramFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingCourse, setDeletingCourse] = useState<CourseData | null>(null)

  const [apiCourses, setApiCourses] = useState<CourseResponse[]>([])
  const [allPrograms, setAllPrograms] = useState<ProgramResponse[]>([])
  const [loading, setLoading] = useState(true)

  // ── Load data from API ──────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([courseApi.getAll(), programApi.getAll()])
      .then(([crs, progs]) => {
        setApiCourses(crs)
        setAllPrograms(progs)
      })
      .catch((e) => console.error("Failed to load:", e))
      .finally(() => setLoading(false))
  }, [])

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingCourse) return
    try {
      await courseApi.remove(deletingCourse.id)
      setApiCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id))
    } catch (e) {
      console.error("Failed to delete course:", e)
    } finally {
      setDeletingCourse(null)
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const allCourses = useMemo<CourseData[]>(
    () => apiCourses.map(mapToCourseData),
    [apiCourses],
  )

  const filtered = allCourses.filter((c) => {
    if (programFilter !== "All" && c.programId !== programFilter) return false
    if (categoryFilter !== "All" && c.category !== categoryFilter) return false
    return true
  })

  // ── Pagination ──────────────────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 6
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedCourses = useMemo(() => {
    const head = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(head, head + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-slate-300 text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">
            Course Management
          </h2>
          <p className="text-slate-500 mt-2 font-body">
            Strategize, curate, and scale your organization's intellectual capital.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/courses/create")}
          className="flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create New Course
        </button>
      </section>

      {/* Filters */}
      <section>
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Program
              </label>
              <div className="relative">
                <select
                  value={programFilter}
                  onChange={(e) => { setProgramFilter(e.target.value); setCurrentPage(1) }}
                  className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                >
                  <option value="All">All Programs</option>
                  {allPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.code})</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
                  className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                >
                  <option value="All">All Categories</option>
                  {Object.keys(categoryColors).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <span className="material-symbols-outlined text-slate-200 text-5xl block mb-3">menu_book</span>
            <p className="text-slate-400 text-sm font-semibold">No courses found.</p>
          </div>
        )}
        {paginatedCourses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            onClick={() => navigate(`/dashboard/courses/${course.id}`)}
            className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden group hover:shadow-[0px_20px_48px_rgba(31,62,114,0.12)] transition-shadow cursor-pointer"
          >
            {/* Cover Image */}
            <div className="relative h-48 overflow-hidden">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-200 text-5xl">image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
              {/* Category Badge */}
              {course.category && (
                <span className={`absolute top-3 left-3 text-[10px] font-bold text-white px-2.5 py-1 rounded ${categoryColors[course.category] ?? "bg-slate-600/80"} backdrop-blur-sm`}>
                  {course.category}
                </span>
              )}
              {/* Level Badge */}
              {course.level && (
                <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm ${levelColors[course.level] ?? "bg-white/80 text-slate-600"}`}>
                  {course.level}
                </span>
              )}
            </div>

            {/* Card Body */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-0.5">{course.code}</p>
                  <h4 className="text-sm font-extrabold text-slate-900 font-headline leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                    {course.title}
                  </h4>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {course.actions.map((action) => (
                    <button
                      key={action}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (action === "EDIT") navigate(`/dashboard/courses/${course.id}/edit`)
                        if (action === "DELETE") setDeletingCourse(course)
                      }}
                      className={`p-1.5 rounded-lg transition-all ${actionColors[action]}`}
                      title={action}
                    >
                      <span className="material-symbols-outlined text-[16px]">{actionIcons[action]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  <span className="font-bold text-slate-600">#{course.orderIndex}</span> · {course.programCode ?? <span className="italic">No program</span>}
                </span>
              </div>
              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {course.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {course.tags.length > 4 && (
                    <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">+{course.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                currentPage === p
                  ? "bg-secondary text-white shadow-md"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold font-headline text-slate-900">Delete Course</h3>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-surface-container-low rounded-xl px-4 py-3 mb-6">
              Are you sure you want to delete <strong className="text-slate-900">{deletingCourse.title}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingCourse(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-error text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Delete Course
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
