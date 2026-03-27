import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  programApi,
  courseApi,
  type ProgramResponse,
  type CourseResponse,
  type ProgramUpsertRequest,
} from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────
type Program = ProgramResponse

// ─── Create Program Modal ─────────────────────────────────────────────────────
function CreateProgramModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: ProgramUpsertRequest) => void
}) {
  const [code, setCode] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleCreate = () => {
    if (!title.trim() || !code.trim()) return
    onCreate({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || null,
      thumbnailUrl: bannerPreview,
      isPublished,
      publishedAt: isPublished ? new Date().toISOString() : null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder_special</span>
            </div>
            <h3 className="text-lg font-extrabold font-headline text-slate-900">Create New Program</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Banner Image</label>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
            <button
              onClick={() => bannerRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 hover:border-secondary/40 rounded-xl py-4 flex flex-col items-center justify-center gap-1 overflow-hidden relative group transition-colors"
              style={{ minHeight: 120 }}
            >
              {bannerPreview ? (
                <>
                  <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-slate-300 text-2xl">cloud_upload</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload Banner (16:9)</span>
                </>
              )}
            </button>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Program Code <span className="text-error">*</span>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EXEC-LDR-2024"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Program Title <span className="text-error">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Executive Leadership Excellence"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief overview of the program..."
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-slate-700">Published</span>
            <button
              onClick={() => setIsPublished((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isPublished ? "bg-secondary" : "bg-slate-200"}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isPublished ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-sm font-bold hover:opacity-90 transition-opacity">Create Program</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Program Settings Modal ───────────────────────────────────────────────────
function ProgramSettingsModal({
  program,
  onClose,
  onSave,
}: {
  program: Program
  onClose: () => void
  onSave: (data: ProgramUpsertRequest) => void
}) {
  const [code, setCode] = useState(program.code)
  const [title, setTitle] = useState(program.title)
  const [description, setDescription] = useState(program.description ?? "")
  const [isPublished, setIsPublished] = useState(program.isPublished)
  const [bannerPreview, setBannerPreview] = useState<string | null>(program.thumbnailUrl)
  const bannerRef = useRef<HTMLInputElement>(null)

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    if (!title.trim() || !code.trim()) return
    onSave({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || null,
      thumbnailUrl: bannerPreview,
      isPublished,
      publishedAt: isPublished && !program.publishedAt ? new Date().toISOString() : program.publishedAt,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            </div>
            <h3 className="text-lg font-extrabold font-headline text-slate-900">Program Settings</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Banner Image</label>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
            <button
              onClick={() => bannerRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 hover:border-secondary/40 rounded-xl py-4 flex flex-col items-center justify-center gap-1 overflow-hidden relative group transition-colors"
              style={{ minHeight: 120 }}
            >
              {bannerPreview ? (
                <>
                  <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-slate-300 text-2xl">cloud_upload</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload Banner (16:9)</span>
                </>
              )}
            </button>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Program Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Program Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-slate-700">Published</span>
            <button
              onClick={() => setIsPublished((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isPublished ? "bg-secondary" : "bg-slate-200"}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isPublished ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-sm font-bold hover:opacity-90 transition-opacity">Save Changes</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Course to Program Modal ──────────────────────────────────────────────
function AddCourseModal({
  onClose,
  onAdd,
  existingIds,
  allCourses,
}: {
  onClose: () => void
  onAdd: (c: CourseResponse) => void
  existingIds: Set<string>
  allCourses: CourseResponse[]
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () =>
      allCourses.filter(
        (c) =>
          !existingIds.has(c.id) &&
          (search.trim() === "" ||
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase())),
      ),
    [allCourses, existingIds, search],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>library_add</span>
            </div>
            <h3 className="text-lg font-extrabold font-headline text-slate-900">Add Course to Program</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>

        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or code..."
            autoFocus
            className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <span className="material-symbols-outlined text-slate-200 text-4xl block mb-2">search_off</span>
              <p className="text-sm text-slate-400 font-semibold">
                {allCourses.length === existingIds.size ? "All courses already added." : "No courses match your search."}
              </p>
            </div>
          )}
          {filtered.map((course) => (
            <button
              key={course.id}
              onClick={() => {
                onAdd(course)
                onClose()
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-secondary/30 hover:bg-secondary/5 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-secondary transition-colors">{course.title}</p>
                <p className="text-[11px] text-slate-400 font-mono">{course.code}{course.category ? ` · ${course.category}` : ""}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-secondary text-[20px] shrink-0 transition-colors">add_circle</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgramManagementPage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [allCourses, setAllCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>("")

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL")
  const [filterSearch, setFilterSearch] = useState("")
  const [filterMinCourses, setFilterMinCourses] = useState<number | "">("")

  // ── Load data from API ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [progs, crs] = await Promise.all([programApi.getAll(), courseApi.getAll()])
      setPrograms(progs)
      setAllCourses(crs)
      setSelectedId((prev) => prev || progs[0]?.id || "")
    } catch (e) {
      console.error("Failed to load data:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filteredPrograms = programs.filter((p) => {
    if (filterStatus === "PUBLISHED" && !p.isPublished) return false
    if (filterStatus === "DRAFT" && p.isPublished) return false
    if (filterSearch.trim() && !p.title.toLowerCase().includes(filterSearch.toLowerCase()) && !p.code.toLowerCase().includes(filterSearch.toLowerCase())) return false
    if (filterMinCourses !== "" && p.courses.length < Number(filterMinCourses)) return false
    return true
  })

  const hasActiveFilters = filterStatus !== "ALL" || filterSearch.trim() !== "" || filterMinCourses !== ""

  const clearFilters = () => {
    setFilterStatus("ALL")
    setFilterSearch("")
    setFilterMinCourses("")
  }

  const selected = programs.find((p) => p.id === selectedId) ?? programs[0]

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateProgram = async (data: ProgramUpsertRequest) => {
    try {
      const created = await programApi.create(data)
      setPrograms((prev) => [...prev, created])
      setSelectedId(created.id)
    } catch (e) {
      console.error("Failed to create program:", e)
    }
  }

  const handleAddCourse = async (course: CourseResponse) => {
    if (!selected) return
    try {
      await courseApi.update(course.id, {
        code: course.code,
        title: course.title,
        description: course.description,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
        category: course.category,
        programId: selected.id,
        orderIndex: course.orderIndex,
        tags: course.tags,
      })
      // Refresh programs to reflect the updated course list
      const progs = await programApi.getAll()
      setPrograms(progs)
    } catch (e) {
      console.error("Failed to add course to program:", e)
    }
  }

  const togglePublished = async (program: Program) => {
    try {
      const updated = await programApi.update(program.id, {
        code: program.code,
        title: program.title,
        description: program.description,
        thumbnailUrl: program.thumbnailUrl,
        isPublished: !program.isPublished,
        publishedAt: !program.isPublished ? new Date().toISOString() : program.publishedAt,
      })
      setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (e) {
      console.error("Failed to toggle published:", e)
    }
  }

  const handleDeleteProgram = async (programId: string) => {
    try {
      await programApi.remove(programId)
      setPrograms((prev) => {
        const next = prev.filter((p) => p.id !== programId)
        if (selectedId === programId) setSelectedId(next[0]?.id ?? "")
        return next
      })
    } catch (e) {
      console.error("Failed to delete program:", e)
    }
  }

  const handleSaveSettings = async (data: ProgramUpsertRequest) => {
    if (!selected) return
    try {
      const updated = await programApi.update(selected.id, data)
      setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (e) {
      console.error("Failed to update program:", e)
    }
  }

  const existingCourseIds = useMemo(
    () => new Set(selected?.courses.map((c) => c.id) ?? []),
    [selected],
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-slate-300 text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* ── Header ── */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">
              Program & Curriculum Management
            </h2>
            <p className="text-slate-500 mt-2 font-body">
              Organize individual courses into comprehensive leadership programs.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/dashboard/programs/create")}
              className="flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create New Program
            </button>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold font-headline text-slate-900">Programs</h3>
                  {hasActiveFilters && (
                    <span className="bg-secondary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {filteredPrograms.length} / {programs.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs font-bold text-error hover:underline transition-colors">
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilter((v) => !v)}
                    className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      showFilter || hasActiveFilters
                        ? "bg-secondary/10 text-secondary"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    Filter
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-b border-slate-100"
                  >
                    <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-container-low/50">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Search</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">search</span>
                          <input
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            placeholder="Title or code..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
                        <div className="flex gap-2">
                          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setFilterStatus(s)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                filterStatus === s
                                  ? "bg-secondary border-secondary text-white"
                                  : "border-slate-200 text-slate-400 hover:border-secondary/40 hover:text-secondary"
                              }`}
                            >
                              {s === "ALL" ? "All" : s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Min. Courses</label>
                        <input
                          type="number"
                          min={0}
                          value={filterMinCourses}
                          onChange={(e) => setFilterMinCourses(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 3"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table Header */}
              <div className="grid grid-cols-12 px-6 py-3 bg-surface-container-low text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="col-span-6">Program</span>
                <span className="col-span-2 text-center">Courses</span>
                <span className="col-span-3 text-center">Status</span>
                <span className="col-span-1"></span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-50">
                {filteredPrograms.length === 0 && programs.length > 0 && (
                  <div className="py-12 text-center">
                    <span className="material-symbols-outlined text-slate-200 text-4xl block mb-2">search_off</span>
                    <p className="text-slate-400 text-sm font-semibold">No programs match your filters.</p>
                    <button onClick={clearFilters} className="mt-2 text-secondary text-xs font-bold hover:underline">Clear filters</button>
                  </div>
                )}
                {filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    onClick={() => setSelectedId(program.id)}
                    className={`grid grid-cols-12 px-6 py-5 cursor-pointer transition-colors items-center ${
                      selectedId === program.id
                        ? "bg-secondary/5 border-l-4 border-secondary"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="col-span-6 pr-3 flex items-center gap-3">
                      {program.thumbnailUrl ? (
                        <img src={program.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-slate-300 text-[18px]">image</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm font-bold leading-snug truncate ${selectedId === program.id ? "text-secondary" : "text-slate-800"}`}>
                          {program.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{program.code}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-extrabold text-slate-900">{program.courses.length}</p>
                      <p className="text-[10px] text-slate-400">Courses</p>
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePublished(program) }}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest transition-colors ${
                          program.isPublished
                            ? "bg-secondary/15 text-secondary hover:bg-secondary/25"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {program.isPublished ? "Published" : "Draft"}
                      </button>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id) }}
                        className="p-1.5 text-slate-300 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {programs.length === 0 && (
                  <div className="py-16 text-center">
                    <span className="material-symbols-outlined text-slate-200 text-5xl block mb-3">folder_open</span>
                    <p className="text-slate-400 text-sm font-semibold">No programs yet. Create one to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right (2/5): Curriculum Preview */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden"
                >
                  {/* Preview Header */}
                  <div className="p-6 border-b border-slate-50">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Curriculum Preview</p>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-extrabold font-headline text-slate-900 leading-tight">{selected.title}</h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">{selected.code}</p>
                      </div>
                      <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                      </div>
                    </div>
                    {selected.description && (
                      <p className="text-[12px] text-slate-500 mt-2 line-clamp-2">{selected.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 py-4 flex gap-3 border-b border-slate-50">
                    <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">settings</span>
                      Settings
                    </button>
                    <button
                      onClick={() => setShowAddCourseModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-fixed text-on-primary-fixed text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Add Course
                    </button>
                  </div>

                  {/* Course Sequence */}
                  <div className="p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Course Sequence ({selected.courses.length})
                    </p>

                    <div className="space-y-2">
                      {selected.courses
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((course, idx) => (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-secondary/20 hover:bg-secondary/5 transition-all"
                          >
                            <span className="w-7 h-7 rounded-lg bg-surface-container-low text-slate-500 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{course.title}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{course.code}{course.category ? ` · ${course.category}` : ""}</p>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        selected.isPublished
                          ? "bg-secondary/15 text-secondary"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {selected.isPublished ? "Published" : "Draft"}
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Courses</p>
                        <p className="text-xl font-extrabold font-headline text-slate-900">{selected.courses.length}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProgramModal key="create" onClose={() => setShowCreateModal(false)} onCreate={handleCreateProgram} />
        )}
        {showAddCourseModal && selected && (
          <AddCourseModal
            key="add-course"
            onClose={() => setShowAddCourseModal(false)}
            onAdd={handleAddCourse}
            existingIds={existingCourseIds}
            allCourses={allCourses}
          />
        )}
        {showSettingsModal && selected && (
          <ProgramSettingsModal
            key="settings"
            program={selected}
            onClose={() => setShowSettingsModal(false)}
            onSave={handleSaveSettings}
          />
        )}
      </AnimatePresence>
    </>
  )
}
