import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { courses, categoryDisplayMap } from "@/data/courses"

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
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-[20px]">close</span></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Lesson Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Modern Leadership" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Duration (mins)</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" placeholder="e.g. 12" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Video File</label>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 hover:border-secondary/50 rounded-xl px-4 py-4 flex items-center gap-3 transition-colors group">
            <span className="material-symbols-outlined text-slate-300 group-hover:text-secondary text-[24px]">upload_file</span>
            <span className="text-sm text-slate-400 group-hover:text-secondary truncate">{fileName || "Click to upload video"}</span>
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { if (!title.trim()) return; onAdd({ type: "video", icon: "play_circle", title: title.trim(), meta: `Video Lesson${duration ? ` • ${duration} mins` : ""}` }); onClose() }} className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90">Add Lesson</button>
      </div>
    </ModalBackdrop>
  )
}

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
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-[20px]">close</span></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Resource Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Executive Presence Framework" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>PDF Document</option><option>Spreadsheet</option><option>Presentation</option><option>Word Document</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">File</label>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl px-4 py-4 flex items-center gap-3 transition-colors group">
            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary text-[24px]">upload_file</span>
            <div className="text-left overflow-hidden">
              <p className="text-sm text-slate-400 group-hover:text-primary truncate">{file ? file.name : "Click to upload file"}</p>
              {file && <p className="text-[10px] text-slate-300">{(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            </div>
          </button>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { if (!title.trim()) return; const sz = file ? ` • ${(file.size/1024/1024).toFixed(1)} MB` : ""; onAdd({ type: "resource", icon: "description", title: title.trim(), meta: `${fileType}${sz}` }); onClose() }} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90">Add Resource</button>
      </div>
    </ModalBackdrop>
  )
}

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
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-[20px]">close</span></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Session Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Live Q&A: Leadership in Crisis" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-tertiary/20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-tertiary/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-tertiary/20" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { if (!title.trim()) return; const d = date ? new Date(date).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""; onAdd({ type: "live", icon: "podcasts", title: title.trim(), meta: `Live Session${d ? ` • ${d}${time ? ` ${time}` : ""}` : ""}` }); onClose() }} className="flex-1 py-3 rounded-xl bg-tertiary text-white text-sm font-bold hover:opacity-90">Add Session</button>
      </div>
    </ModalBackdrop>
  )
}

function EditLessonModal({ lesson, onClose, onSave }: { lesson: Lesson; onClose: () => void; onSave: (title: string, meta: string) => void }) {
  const [title, setTitle] = useState(lesson.title)
  const [meta, setMeta] = useState(lesson.meta)
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-extrabold font-headline text-slate-900">Edit Lesson</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-[20px]">close</span></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Meta (duration / size)</label>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { onSave(title.trim(), meta.trim()); onClose() }} className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90">Save Changes</button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function SaveToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
        >
          <span className="material-symbols-outlined text-primary-fixed text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Changes saved successfully!
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const lessonIconColor: Record<LessonType, string> = {
  video: "bg-secondary/10 text-secondary",
  resource: "bg-primary/10 text-primary",
  live: "bg-tertiary/10 text-tertiary",
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const course = courses.find((c) => c.id === Number(id))

  // ── Form state (pre-filled) ──
  const [title, setTitle] = useState(course?.title ?? "")
  const [description, setDescription] = useState(course?.description ?? "")
  const [category, setCategory] = useState(categoryDisplayMap[course?.category ?? ""] ?? "Strategic Management")
  const [instructor, setInstructor] = useState(course?.instructor ?? "Dr. Aris Thorne")
  const [price, setPrice] = useState(String(course?.price ?? 199))
  const [duration, setDuration] = useState(course?.duration ?? "12 Hours")
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Expert">(course?.difficulty ?? "Intermediate")
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">(course?.status ?? "DRAFT")
  const [publicAccess, setPublicAccess] = useState(true)

  // ── Thumbnail ──
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course?.image ?? null)

  // ── Modules ──
  const [courseModules, setCourseModules] = useState<Module[]>([
    {
      id: 1,
      title: "Module 1: Core Concepts",
      lessons: [
        { id: 1, type: "video", icon: "play_circle", title: "Introduction", meta: "Video Lesson • 10 mins" },
      ],
    },
  ])
  const nextLessonId = useRef(20)
  const nextModuleId = useRef(20)

  // ── Editing state ──
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState("")
  const [editingLesson, setEditingLesson] = useState<{ moduleId: number; lesson: Lesson } | null>(null)
  const [addModal, setAddModal] = useState<{ moduleId: number; type: "video" | "resource" | "live" } | null>(null)

  // ── Save state ──
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  const handleSave = () => {
    if (saveState !== "idle") return
    setSaveState("saving")
    setTimeout(() => {
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    }, 1000)
  }

  // ── Module helpers ──
  const startEditModule = (mod: Module) => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title) }
  const saveEditModule = (id: number) => {
    setCourseModules((prev) => prev.map((m) => m.id === id ? { ...m, title: editingModuleTitle || m.title } : m))
    setEditingModuleId(null)
  }
  const addModule = () => {
    const id = nextModuleId.current++
    const newTitle = `Module ${courseModules.length + 1}: New Module`
    setCourseModules((prev) => [...prev, { id, title: newTitle, lessons: [] }])
    setEditingModuleId(id)
    setEditingModuleTitle(newTitle)
  }

  const addLesson = useCallback((moduleId: number, lesson: Omit<Lesson, "id">) => {
    setCourseModules((prev) =>
      prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, { ...lesson, id: nextLessonId.current++ }] } : m)
    )
  }, [])

  const saveLesson = (moduleId: number, lessonId: number, title: string, meta: string) => {
    setCourseModules((prev) =>
      prev.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, title, meta } : l) } : m)
    )
  }

  const deleteLesson = (moduleId: number, lessonId: number) => {
    setCourseModules((prev) =>
      prev.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m)
    )
  }

  // 404 guard
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <span className="material-symbols-outlined text-slate-200 text-6xl">search_off</span>
        <p className="text-slate-400 font-semibold">Course not found.</p>
        <button onClick={() => navigate("/dashboard/courses")} className="px-6 py-2.5 rounded-xl bg-secondary text-white font-bold text-sm">Back to Courses</button>
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
        <section className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <button onClick={() => navigate("/dashboard/courses")} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm font-semibold mb-3 transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Courses
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">Edit Course</h2>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${status === "PUBLISHED" ? "bg-primary-fixed/20 text-on-primary-fixed-variant" : "bg-slate-100 text-slate-500"}`}>
                {status}
              </span>
            </div>
            <p className="text-slate-500 mt-2 font-body max-w-xl">Update course details, curriculum, and settings. Changes are saved instantly.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate("/dashboard/courses")} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saveState !== "idle"}
              className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                saveState === "saved"
                  ? "bg-secondary text-white"
                  : saveState === "saving"
                  ? "bg-primary-fixed/70 text-on-primary-fixed cursor-wait"
                  : "bg-primary-fixed text-on-primary-fixed hover:shadow-lg active:scale-95"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${saveState === "saving" ? "animate-spin" : ""}`}>
                {saveState === "saved" ? "check_circle" : saveState === "saving" ? "autorenew" : "save"}
              </span>
              {saveState === "saved" ? "Saved!" : saveState === "saving" ? "Saving..." : "Save Changes"}
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Category</label>
                    <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8">
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
                      <select value={instructor} onChange={(e) => setInstructor(e.target.value)} className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8">
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
                <button onClick={addModule} className="flex items-center gap-1.5 text-secondary font-bold text-sm hover:text-secondary/70 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Add Module
                </button>
              </div>
              <div className="space-y-4">
                {courseModules.map((mod) => (
                  <div key={mod.id} className="rounded-xl border border-slate-100 overflow-hidden">
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
                        <button onClick={() => startEditModule(mod)} className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setCourseModules((prev) => prev.filter((m) => m.id !== mod.id))} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                    {mod.lessons.length > 0 && (
                      <div className="divide-y divide-slate-50">
                        {mod.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 group/lesson hover:bg-slate-50/60 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lessonIconColor[lesson.type]}`}>
                              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{lesson.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{lesson.meta}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                              <button onClick={() => setEditingLesson({ moduleId: mod.id, lesson })} className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button onClick={() => deleteLesson(mod.id, lesson.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-6 py-4 flex flex-wrap gap-3 bg-white border-t border-slate-50">
                      <button onClick={() => setAddModal({ moduleId: mod.id, type: "video" })} className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-secondary/50 hover:text-secondary rounded-xl text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span>Add Video
                      </button>
                      <button onClick={() => setAddModal({ moduleId: mod.id, type: "resource" })} className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary rounded-xl text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span>Add Resource
                      </button>
                      <button onClick={() => setAddModal({ moduleId: mod.id, type: "live" })} className="flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-tertiary/50 hover:text-tertiary rounded-xl text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span>Add Live
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
                <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setThumbnailPreview(URL.createObjectURL(f))
                }} />
                <button onClick={() => thumbnailInputRef.current?.click()} className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 overflow-hidden hover:border-secondary/40 transition-colors relative group">
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-3xl">cloud_upload</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload Image</span>
                    </div>
                  )}
                </button>
              </div>
              {/* Price + Duration */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Price (USD)</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="text-slate-400 text-sm font-bold">$</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Duration</label>
                  <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5">
                    <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-transparent text-sm font-bold text-slate-700 focus:outline-none" />
                  </div>
                </div>
              </div>
              {/* Difficulty */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-3">Difficulty Level</label>
                <div className="flex flex-wrap gap-2">
                  {(["Beginner", "Intermediate", "Expert"] as const).map((level) => (
                    <button key={level} onClick={() => setDifficulty(level)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${difficulty === level ? "bg-secondary border-secondary text-white shadow-md" : "border-slate-200 text-slate-500 hover:border-secondary/40 hover:text-secondary"}`}>
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
              {/* Status toggle */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <span className="text-secondary-container text-xs font-bold uppercase tracking-widest">Status</span>
                <button
                  onClick={() => setStatus((s) => s === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest transition-colors ${status === "PUBLISHED" ? "bg-primary-fixed text-on-primary-fixed" : "bg-white/20 text-white hover:bg-white/30"}`}
                >
                  {status}
                </button>
              </div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                  <span className="text-sm font-bold">Public Access</span>
                </div>
                <button onClick={() => setPublicAccess((v) => !v)} className={`w-12 h-6 rounded-full transition-colors relative ${publicAccess ? "bg-primary-fixed" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${publicAccess ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              <p className="text-secondary-container text-xs italic leading-relaxed mb-6 relative z-10">
                "Leadership is the capacity to translate vision into reality."
              </p>
              <button
                onClick={handleSave}
                disabled={saveState !== "idle"}
                className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 relative z-10 ${
                  saveState === "saved" ? "bg-secondary/80 text-white" : "bg-primary-fixed text-on-primary-fixed hover:opacity-90"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {saveState === "saved" ? "check_circle" : saveState === "saving" ? "autorenew" : "save"}
                </span>
                {saveState === "saved" ? "Saved!" : saveState === "saving" ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Stats snapshot */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Course Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-extrabold font-headline text-slate-900">{course.enrolled}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enrolled</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold font-headline text-slate-900">{course.avgScore ?? "—"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Avg Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {addModal?.type === "video" && <AddVideoModal key="v" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.moduleId, l)} />}
        {addModal?.type === "resource" && <AddResourceModal key="r" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.moduleId, l)} />}
        {addModal?.type === "live" && <AddLiveModal key="l" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.moduleId, l)} />}
        {editingLesson && <EditLessonModal key="el" lesson={editingLesson.lesson} onClose={() => setEditingLesson(null)} onSave={(t, m) => saveLesson(editingLesson.moduleId, editingLesson.lesson.id, t, m)} />}
      </AnimatePresence>

      <AnimatePresence>
        {saveState === "saved" && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
          >
            <span className="material-symbols-outlined text-primary-fixed text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Changes saved successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
