import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"

// ─── Types ────────────────────────────────────────────────────────────────────
type LessonType = "video" | "resource" | "live"
interface Lesson {
  id: number
  type: LessonType
  icon: string
  title: string
  meta: string
}
interface Module {
  id: number
  title: string
  lessons: Lesson[]
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const initialModules: Module[] = [
  {
    id: 1,
    title: "Module 1: Foundations of Power",
    lessons: [
      { id: 1, type: "video", icon: "play_circle", title: "Introduction to Modern Leadership", meta: "Video Lesson • 12 mins" },
      { id: 2, type: "resource", icon: "description", title: "The Executive Presence Framework", meta: "PDF Document • 1.4 MB" },
    ],
  },
]

// ─── Modal backdrop ───────────────────────────────────────────────────────────
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
        {children}
      </motion.div>
    </div>
  )
}

// ─── Add Video Modal ──────────────────────────────────────────────────────────
function AddVideoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<Lesson, "id">) => void }) {
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline text-slate-900">Add Video Lesson</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Lesson Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Modern Leadership"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Duration (mins)</label>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 12"
            type="number"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Video File</label>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 hover:border-secondary/50 rounded-xl px-4 py-4 flex items-center gap-3 transition-colors group"
          >
            <span className="material-symbols-outlined text-slate-300 group-hover:text-secondary transition-colors text-[24px]">upload_file</span>
            <span className="text-sm text-slate-400 group-hover:text-secondary transition-colors truncate">
              {fileName || "Click to upload video"}
            </span>
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => {
            if (!title.trim()) return
            onAdd({ type: "video", icon: "play_circle", title: title.trim(), meta: `Video Lesson${duration ? ` • ${duration} mins` : ""}` })
            onClose()
          }}
          className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Add Lesson
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Add Resource Modal ───────────────────────────────────────────────────────
function AddResourceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<Lesson, "id">) => void }) {
  const [title, setTitle] = useState("")
  const [fileType, setFileType] = useState("PDF Document")
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline text-slate-900">Add Resource</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Resource Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Executive Presence Framework"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option>PDF Document</option>
            <option>Spreadsheet</option>
            <option>Presentation</option>
            <option>Word Document</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">File</label>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl px-4 py-4 flex items-center gap-3 transition-colors group"
          >
            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[24px]">upload_file</span>
            <div className="text-left overflow-hidden">
              <p className="text-sm text-slate-400 group-hover:text-primary transition-colors truncate">
                {file ? file.name : "Click to upload file"}
              </p>
              {file && <p className="text-[10px] text-slate-300">{(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            </div>
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => {
            if (!title.trim()) return
            const sizeMeta = file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""
            onAdd({ type: "resource", icon: "description", title: title.trim(), meta: `${fileType}${sizeMeta ? ` • ${sizeMeta}` : ""}` })
            onClose()
          }}
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Add Resource
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Add Live Modal ───────────────────────────────────────────────────────────
function AddLiveModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<Lesson, "id">) => void }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-tertiary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>podcasts</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline text-slate-900">Add Live Session</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Session Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Live Q&A: Leadership in Crisis"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-tertiary/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-tertiary/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-tertiary/20"
            />
          </div>
        </div>
        <div className="bg-tertiary/5 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <p className="text-xs text-slate-500 leading-relaxed">Live sessions will be streamed directly to enrolled learners. A meeting link will be auto-generated.</p>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => {
            if (!title.trim()) return
            const dateMeta = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""
            onAdd({ type: "live", icon: "podcasts", title: title.trim(), meta: `Live Session${dateMeta ? ` • ${dateMeta}${time ? ` ${time}` : ""}` : ""}` })
            onClose()
          }}
          className="flex-1 py-3 rounded-xl bg-tertiary text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Add Session
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Edit Lesson Modal ────────────────────────────────────────────────────────
function EditLessonModal({ lesson, onClose, onSave }: { lesson: Lesson; onClose: () => void; onSave: (title: string, meta: string) => void }) {
  const [title, setTitle] = useState(lesson.title)
  const [meta, setMeta] = useState(lesson.meta)

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-extrabold font-headline text-slate-900">Edit Lesson</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Meta (duration / size)</label>
          <input
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { onSave(title.trim(), meta.trim()); onClose() }}
          className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Save Changes
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Lesson icon color ────────────────────────────────────────────────────────
const lessonIconColor: Record<LessonType, string> = {
  video: "bg-secondary/10 text-secondary",
  resource: "bg-primary/10 text-primary",
  live: "bg-tertiary/10 text-tertiary",
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateCoursePage() {
  const navigate = useNavigate()

  // Thumbnail
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  // Difficulty / visibility
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate")
  const [publicAccess, setPublicAccess] = useState(true)

  // Modules
  const [courseModules, setCourseModules] = useState<Module[]>(initialModules)
  const nextLessonId = useRef(10)
  const nextModuleId = useRef(10)

  // Inline module title editing
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState("")

  // Lesson editing modal
  const [editingLesson, setEditingLesson] = useState<{ moduleId: number; lesson: Lesson } | null>(null)

  // Add-content modals: { moduleId, type }
  const [addModal, setAddModal] = useState<{ moduleId: number; type: "video" | "resource" | "live" } | null>(null)

  // ── Module helpers ──
  const startEditModule = (mod: Module) => {
    setEditingModuleId(mod.id)
    setEditingModuleTitle(mod.title)
  }
  const saveEditModule = (id: number) => {
    setCourseModules((prev) => prev.map((m) => m.id === id ? { ...m, title: editingModuleTitle || m.title } : m))
    setEditingModuleId(null)
  }
  const deleteModule = (id: number) => setCourseModules((prev) => prev.filter((m) => m.id !== id))
  const addModule = () => {
    const id = nextModuleId.current++
    setCourseModules((prev) => [...prev, { id, title: `Module ${prev.length + 1}: New Module`, lessons: [] }])
    // auto-enter edit mode
    setEditingModuleId(id)
    setEditingModuleTitle(`Module ${courseModules.length + 1}: New Module`)
  }

  // ── Lesson helpers ──
  const addLesson = useCallback((moduleId: number, lesson: Omit<Lesson, "id">) => {
    setCourseModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, { ...lesson, id: nextLessonId.current++ }] }
          : m
      )
    )
  }, [])

  const saveLesson = (moduleId: number, lessonId: number, title: string, meta: string) => {
    setCourseModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, title, meta } : l) }
          : m
      )
    )
  }

  const deleteLesson = (moduleId: number, lessonId: number) => {
    setCourseModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
      )
    )
  }

  // ── Thumbnail upload ──
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setThumbnailPreview(url)
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
        <section className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <button
              onClick={() => navigate("/dashboard/courses")}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm font-semibold mb-3 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Courses
            </button>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">
              Create New Leadership Course
            </h2>
            <p className="text-slate-500 mt-2 font-body max-w-xl">
              Define your curriculum, configure enrollment settings, and publish your expertise to the global leadership community.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/dashboard/courses")}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Save as Draft
            </button>
            <button className="px-6 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
              Publish Course
            </button>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]">description</span>
                </div>
                <h3 className="text-xl font-extrabold font-headline text-slate-900">Basic Information</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Course Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Adaptive Leadership in the Digital Era"
                    className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Craft a compelling summary of what students will achieve..."
                    className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Category</label>
                    <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                      <select className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8">
                        <option>Strategic Management</option>
                        <option>Human Centricity</option>
                        <option>Finance & Ops</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Instructor</label>
                    <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                      <select className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8">
                        <option>Dr. Marcus Aurelius</option>
                        <option>Dr. Aris Thorne</option>
                        <option>Sarah Jenkins</option>
                        <option>Michael Chen</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Builder */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[22px]">view_module</span>
                  </div>
                  <h3 className="text-xl font-extrabold font-headline text-slate-900">Curriculum Builder</h3>
                </div>
                <button
                  onClick={addModule}
                  className="flex items-center gap-1.5 text-secondary font-bold text-sm hover:text-secondary/70 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Add Module
                </button>
              </div>

              <div className="space-y-4">
                {courseModules.map((mod) => (
                  <div key={mod.id} className="rounded-xl border border-slate-100 overflow-hidden">
                    {/* Module Header */}
                    <div className="bg-surface-container-low px-5 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-slate-300 text-[20px] cursor-grab shrink-0">drag_indicator</span>
                        {editingModuleId === mod.id ? (
                          <input
                            autoFocus
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            onBlur={() => saveEditModule(mod.id)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEditModule(mod.id); if (e.key === "Escape") setEditingModuleId(null) }}
                            className="flex-1 bg-white border border-secondary/30 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        ) : (
                          <span className="font-bold text-slate-800 text-sm truncate">{mod.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditModule(mod)}
                          title="Edit module title"
                          className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => deleteModule(mod.id)}
                          title="Delete module"
                          className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Lessons */}
                    {mod.lessons.length > 0 && (
                      <div className="divide-y divide-slate-50">
                        {mod.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 group/lesson hover:bg-slate-50/60 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lessonIconColor[lesson.type]}`}>
                              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {lesson.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{lesson.meta}</p>
                            </div>
                            {/* Lesson action buttons (show on hover) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingLesson({ moduleId: mod.id, lesson })}
                                title="Edit lesson"
                                className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button
                                onClick={() => deleteLesson(mod.id, lesson.id)}
                                title="Delete lesson"
                                className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Content Buttons */}
                    <div className="px-6 py-4 flex flex-wrap gap-3 bg-white border-t border-slate-50">
                      <button
                        onClick={() => setAddModal({ moduleId: mod.id, type: "video" })}
                        className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-secondary/50 hover:text-secondary rounded-xl text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Video
                      </button>
                      <button
                        onClick={() => setAddModal({ moduleId: mod.id, type: "resource" })}
                        className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary rounded-xl text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Resource
                      </button>
                      <button
                        onClick={() => setAddModal({ moduleId: mod.id, type: "live" })}
                        className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-tertiary/50 hover:text-tertiary rounded-xl text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Live
                      </button>
                    </div>
                  </div>
                ))}

                {courseModules.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                    <span className="material-symbols-outlined text-slate-200 text-5xl block mb-3">view_module</span>
                    <p className="text-slate-400 text-sm font-semibold">No modules yet. Click <strong>Add Module</strong> to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Course Settings */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
              <h3 className="text-base font-extrabold font-headline text-slate-900 mb-6">Course Settings</h3>

              {/* Thumbnail */}
              <div className="mb-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Course Thumbnail</p>
                <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-secondary/40 transition-colors relative group"
                >
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-100 opacity-60" />
                      <span className="material-symbols-outlined text-secondary text-3xl relative z-10">cloud_upload</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Change Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Price + Duration */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Price (USD)</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="text-slate-400 text-sm font-bold">$</span>
                    <input type="number" defaultValue={199} className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Duration</label>
                  <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5">
                    <input type="text" defaultValue="12 Hours" className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-3">Difficulty Level</label>
                <div className="flex flex-wrap gap-2">
                  {(["Beginner", "Intermediate", "Expert"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        difficulty === level
                          ? "bg-secondary border-secondary text-white shadow-md"
                          : "border-slate-200 text-slate-500 hover:border-secondary/40 hover:text-secondary"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visibility & Launch */}
            <div className="bg-secondary rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <h3 className="text-base font-extrabold font-headline mb-6 relative z-10">Visibility & Launch</h3>
              <div className="flex items-center justify-between mb-5 relative z-10">
                <span className="text-secondary-container text-xs font-bold uppercase tracking-widest">Status</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Draft</span>
              </div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                  <span className="text-sm font-bold">Public Access</span>
                </div>
                <button
                  onClick={() => setPublicAccess((v) => !v)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${publicAccess ? "bg-primary-fixed" : "bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${publicAccess ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              <p className="text-secondary-container text-xs italic leading-relaxed mb-6 relative z-10">
                "Leadership is the capacity to translate vision into reality."
              </p>
              <button className="w-full bg-primary-fixed text-on-primary-fixed font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 relative z-10">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                Create Course
              </button>
            </div>

            {/* Expert Tip */}
            <div className="bg-[#1a3a2a] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary-fixed text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                <span className="text-[11px] font-bold text-primary-fixed uppercase tracking-widest">Expert Tip</span>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">
                Courses with at least 5 modules and interactive assessments see 40% higher completion rates. Consider adding a live Q&A session.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {addModal?.type === "video" && (
          <AddVideoModal
            key="add-video"
            onClose={() => setAddModal(null)}
            onAdd={(l) => addLesson(addModal.moduleId, l)}
          />
        )}
        {addModal?.type === "resource" && (
          <AddResourceModal
            key="add-resource"
            onClose={() => setAddModal(null)}
            onAdd={(l) => addLesson(addModal.moduleId, l)}
          />
        )}
        {addModal?.type === "live" && (
          <AddLiveModal
            key="add-live"
            onClose={() => setAddModal(null)}
            onAdd={(l) => addLesson(addModal.moduleId, l)}
          />
        )}
        {editingLesson && (
          <EditLessonModal
            key="edit-lesson"
            lesson={editingLesson.lesson}
            onClose={() => setEditingLesson(null)}
            onSave={(title, meta) => saveLesson(editingLesson.moduleId, editingLesson.lesson.id, title, meta)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
