import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { programApi, courseApi, courseRunApi, chapterApi, lessonApi, assetApi, type ProgramResponse } from "@/lib/api"
import MarkdownEditor from "@/components/MarkdownEditor"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import FileActionLinks from "@/components/FileActionLinks"
import { buildLessonContentData } from "@/lib/lessonContent"

// ─── Types ────────────────────────────────────────────────────────────────────
type LessonType = "video" | "photo" | "document" | "text"

interface LessonItem {
  id: number
  type: LessonType
  title: string
  description: string
  fileUrl?: string
  fileName?: string
}

interface Chapter {
  id: number
  title: string
  lessons: LessonItem[]
}

interface CourseRun {
  id: number
  code: string       // unique run identifier (e.g. "Run 1: Strategic Mindset")
  startsAt: string   // datetime-local string
  endsAt: string     // datetime-local string
  status: "DRAFT" | "PUBLISHED"
  chapters: Chapter[]
  collapsed: boolean
}

// ─── Initial Curriculum Data ──────────────────────────────────────────────────
const initialCourseRuns: CourseRun[] = [
  {
    id: 1,
    code: "Run 1: Strategic Mindset",
    startsAt: "2026-03-26T09:00",
    endsAt: "2026-03-26T10:30",
    status: "PUBLISHED",
    collapsed: false,
    chapters: [
      {
        id: 1,
        title: "The Foundation",
        lessons: [
          { id: 1, type: "video", title: "Video: Defining Leadership in 2024", description: "12:45 • High Definition" },
        ],
      },
    ],
  },
  {
    id: 2,
    code: "Run 2: Unnamed Run",
    startsAt: "",
    endsAt: "",
    status: "DRAFT",
    collapsed: true,
    chapters: [],
  },
]

// ─── Modal Backdrop ───────────────────────────────────────────────────────────
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
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

// ─── Add Content Modal ────────────────────────────────────────────────────────
function AddContentModal({
  type,
  onClose,
  onAdd,
}: {
  type: LessonType
  onClose: () => void
  onAdd: (item: Omit<LessonItem, "id">) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const config = {
    video: { icon: "play_circle", color: "text-secondary bg-secondary/10", label: "Upload Video", placeholder: "e.g. Defining Leadership in 2024", accept: "video/*" },
    photo: { icon: "image", color: "text-primary bg-primary/10", label: "Upload Photo", placeholder: "e.g. Course Banner", accept: "image/*" },
    document: { icon: "description", color: "text-tertiary bg-tertiary/10", label: "Add Document", placeholder: "e.g. Executive Presence Framework", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" },
    text: { icon: "article", color: "text-slate-600 bg-slate-100", label: "Add Text Content", placeholder: "e.g. Module Introduction", accept: "" },
  }[type]

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const clearSelectedFile = () => {
    setFile(null)
    setFileUrl(undefined)
    setImagePreview(null)
    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  const handleFile = async (picked: File) => {
    setFile(picked)
    if (!title.trim()) setTitle(picked.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "))
    const ext = picked.name.split(".").pop()?.toUpperCase() ?? ""
    setDescription(`${ext} • ${formatSize(picked.size)}`)
    if (type === "photo") {
      setImagePreview(URL.createObjectURL(picked))
    }

    setIsUploading(true)
    try {
      const response = await assetApi.upload(picked)
      setFileUrl(response.url)
    } catch (error) {
      console.error("Upload failed:", error)
      alert(error instanceof Error ? error.message : "File upload failed. Please check your connection and try again.")
      clearSelectedFile()
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.color}`}>
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline text-slate-900">{config.label}</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
        </button>
      </div>

      <div className="space-y-4">
        {type !== "text" && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">File</label>
            <input ref={fileRef} type="file" accept={config.accept} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {type === "photo" && imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt="preview" className="w-full h-36 object-cover" />
                <button onClick={clearSelectedFile}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                  <span className="material-symbols-outlined text-white text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl px-4 py-4 flex items-center gap-3 cursor-pointer transition-all ${dragging ? "border-secondary bg-secondary/5" : "border-slate-200 hover:border-secondary/50"}`}
              >
                {file ? (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400">{isUploading ? "Uploading..." : formatSize(file.size)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); clearSelectedFile() }}
                      className="p-1 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-300 text-[28px]">upload_file</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Click or drag &amp; drop</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {type === "video" ? "MP4, MOV, AVI" : type === "photo" ? "JPG, PNG, WEBP" : "PDF, DOC, PPT, XLS"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={config.placeholder}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 12:45 • High Definition"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => {
            if (!title.trim()) return
            if (type !== "text" && !fileUrl) {
              alert("Please upload a file first.")
              return
            }
            onAdd({ type, title: title.trim(), description, fileUrl, fileName: file?.name })
          }}
          disabled={isUploading || !title.trim() || (type !== "text" && !fileUrl)}
          className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Add Lesson
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Edit Lesson Modal ────────────────────────────────────────────────────────
function EditLessonModal({ lesson, onClose, onSave }: { lesson: LessonItem; onClose: () => void; onSave: (title: string, description: string, fileUrl?: string, fileName?: string) => void }) {
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description)
  const [fileUrl, setFileUrl] = useState<string | undefined>(lesson.fileUrl)
  const [imagePreview, setImagePreview] = useState<string | null>(lesson.type === "photo" ? (lesson.fileUrl ?? null) : null)
  const [fileName, setFileName] = useState<string | null>(lesson.fileName ?? null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const icons: Record<string, string> = { video: "play_circle", photo: "image", document: "description", text: "article" }
  const acceptMap: Record<string, string> = { video: "video/*", photo: "image/*", document: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" }
  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const clearSelectedFile = () => {
    setFileUrl(undefined)
    setFileName(null)
    setImagePreview(null)
    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toUpperCase() ?? ""
    setDescription(`${ext} • ${formatSize(file.size)}`)
    setFileName(file.name)
    if (lesson.type === "photo") {
      setImagePreview(URL.createObjectURL(file))
    }

    setIsUploading(true)
    try {
      const response = await assetApi.upload(file)
      setFileUrl(response.url)
    } catch (error) {
      console.error("Upload failed:", error)
      alert(error instanceof Error ? error.message : "File upload failed. Please check your connection and try again.")
      setFileUrl(lesson.fileUrl)
      setFileName(lesson.fileName ?? null)
      setImagePreview(lesson.type === "photo" ? (lesson.fileUrl ?? null) : null)
      if (fileRef.current) {
        fileRef.current.value = ""
      }
    } finally {
      setIsUploading(false)
    }
  }

  const hasFileUpload = lesson.type !== "text"

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icons[lesson.type]}</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline text-slate-900">Edit Lesson</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>

        {hasFileUpload && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              {lesson.type === "video" ? "Replace Video" : lesson.type === "photo" ? "Replace Image" : "Replace File"}
            </label>
            <input ref={fileRef} type="file" accept={acceptMap[lesson.type]} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {lesson.type === "photo" && imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt="preview" className="w-full h-32 object-cover" />
                <button onClick={clearSelectedFile}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                  <span className="material-symbols-outlined text-white text-[16px]">close</span>
                </button>
              </div>
            ) : fileName ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icons[lesson.type]}</span>
                <p className="text-sm font-semibold text-slate-700 truncate flex-1">{fileName}</p>
                <button onClick={clearSelectedFile} className="text-slate-400 hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={isUploading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-secondary/40 hover:bg-secondary/5 transition-all text-slate-400 hover:text-secondary disabled:opacity-50">
                <span className="material-symbols-outlined text-[20px]">{isUploading ? "progress_activity" : "upload_file"}</span>
                <span className="text-sm font-semibold">{isUploading ? "Uploading..." : "Click to upload new file"}</span>
              </button>
            )}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button
          onClick={() => {
            if (!title.trim()) return
            if (hasFileUpload && !fileUrl) {
              alert("Please upload a file first.")
              return
            }
            onSave(title.trim(), description, fileUrl, fileName ?? undefined)
            onClose()
          }}
          disabled={isUploading || !title.trim() || (hasFileUpload && !fileUrl)}
          className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Content type config ──────────────────────────────────────────────────────
const contentConfig: Record<LessonType, { icon: string; color: string }> = {
  video:    { icon: "play_circle",  color: "bg-secondary/10 text-secondary" },
  photo:    { icon: "image",        color: "bg-primary/10 text-primary" },
  document: { icon: "description",  color: "bg-tertiary/10 text-tertiary" },
  text:     { icon: "article",      color: "bg-slate-100 text-slate-600" },
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ lesson, onClose }: { lesson: LessonItem; onClose: () => void }) {
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
              <p className="text-[11px] text-slate-400">{lesson.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6">
          {lesson.fileUrl ? (
            lesson.type === "video" ? (
              <video controls src={lesson.fileUrl} className="w-full rounded-xl max-h-96 bg-black" />
            ) : lesson.type === "photo" ? (
              <img src={lesson.fileUrl} alt={lesson.title} className="w-full rounded-xl max-h-96 object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <span className="material-symbols-outlined text-slate-300 text-6xl">description</span>
                <p className="text-sm text-slate-500">{lesson.description}</p>
                <div className="flex items-center gap-3">
                  <FileActionLinks
                    url={lesson.fileUrl}
                    fileName={lesson.fileName || `${lesson.title}.pdf`}
                    openClassName="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    downloadClassName="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                    openLabel="Open PDF"
                    downloadLabel="Download"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
              <span className="material-symbols-outlined text-5xl">cloud_off</span>
              <p className="text-sm font-semibold">No file uploaded yet</p>
              <p className="text-xs">Upload a file in the lesson editor to preview it here.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Review Run Row (step 3) ──────────────────────────────────────────────────
function ReviewRunRow({ run, idx }: { run: CourseRun; idx: number }) {
  const [open, setOpen] = useState(true)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [previewLesson, setPreviewLesson] = useState<LessonItem | null>(null)
  const totalLessons = run.chapters.reduce((a, ch) => a + ch.lessons.length, 0)
  const toggleChapter = (chId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chId)) {
        next.delete(chId)
      } else {
        next.add(chId)
      }
      return next
    })
  }
  const formatDateTime = (val: string) => {
    if (!val) return "—"
    return new Date(val).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${totalLessons > 0 ? "bg-secondary/10" : "bg-slate-100"}`}>
          <span className="material-symbols-outlined text-[20px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            {totalLessons > 0 ? "school" : "class"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Run {String(idx + 1).padStart(2, "0")}</span>
            {(run.startsAt || run.endsAt) && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {formatDateTime(run.startsAt)} – {formatDateTime(run.endsAt)}
                </span>
              </>
            )}
          </div>
          <p className="text-sm font-bold text-slate-900 mt-0.5 truncate font-mono">{run.code}</p>
        </div>
        <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      <AnimatePresence>
        {open && run.chapters.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 px-6 space-y-2">
              {run.chapters.map((ch, chIdx) => {
                const isExpanded = expandedChapters.has(ch.id)
                return (
                  <div key={ch.id} className="rounded-xl bg-slate-50 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-1 h-8 bg-secondary rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700">Chapter {idx + 1}.{chIdx + 1}: {ch.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ch.lessons.length === 0 ? "No lessons yet" : `${ch.lessons.length} lesson${ch.lessons.length > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      {ch.lessons.length > 0 && (
                        <button
                          onClick={() => toggleChapter(ch.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary/10 transition-colors"
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${isExpanded ? "text-secondary" : "text-slate-400"}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {isExpanded ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-1">
                            {ch.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100">
                                <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  {lesson.type === "video" ? "play_circle" : lesson.type === "photo" ? "image" : lesson.type === "document" ? "description" : "article"}
                                </span>
                                <p className="text-[11px] font-semibold text-slate-700 truncate flex-1">{lesson.title}</p>
                                <p className="text-[10px] text-slate-400 shrink-0">{lesson.description}</p>
                                {lesson.type !== "text" && (
                                  <button
                                    onClick={() => setPreviewLesson(lesson)}
                                    className="ml-1 p-1 rounded-lg hover:bg-secondary/10 text-slate-400 hover:text-secondary transition-colors shrink-0"
                                    title="Preview"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewLesson && <PreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const programIdParam = searchParams.get("programId")

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [allPrograms, setAllPrograms] = useState<ProgramResponse[]>([])

  useEffect(() => {
    programApi.getAll().then(setAllPrograms).catch(console.error)
  }, [])

  // ── Step 1 state ──
  const [courseTitle, setCourseTitle] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [courseDesc, setCourseDesc] = useState("")
  const [courseLevel, setCourseLevel] = useState("")
  const [courseCategory, setCourseCategory] = useState("")
  const [courseTags, setCourseTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [orderIndex, setOrderIndex] = useState(0)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    programIdParam ?? null
  )
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [isBannerUploading, setIsBannerUploading] = useState(false)

  // ── Step 2 state ──
  const [courseRuns, setCourseRuns] = useState<CourseRun[]>(initialCourseRuns)
  const nextRunId = useRef(10)
  const nextChapterId = useRef(10)
  const nextLessonId = useRef(10)

  const [addModal, setAddModal] = useState<{ runId: number; chapterId: number; type: LessonType } | null>(null)
  const [lessonDropdown, setLessonDropdown] = useState<{ runId: number; chapterId: number } | null>(null)
  const [editLessonModal, setEditLessonModal] = useState<{ runId: number; chapterId: number; lesson: LessonItem } | null>(null)
  const [previewLesson, setPreviewLesson] = useState<LessonItem | null>(null)

  // ── Save via API cascade ──
  const saveCourse = useCallback(async () => {
    if (saving) return
    if (isBannerUploading) {
      alert("Please wait for the thumbnail upload to finish.")
      return
    }
    const targetProgramId = selectedProgramId ?? programIdParam
    if (!targetProgramId) {
      alert("Please select a program before saving.")
      return
    }
    setSaving(true)
    try {
      const now = new Date().toISOString()

      // 1. Create the course
      const createdCourse = await courseApi.create({
        code: courseCode.trim() || "COURSE-001",
        title: courseTitle.trim() || "Untitled Course",
        description: courseDesc.trim() || null,
        level: courseLevel || null,
        thumbnailUrl: bannerPreview,
        category: courseCategory || null,
        programId: targetProgramId,
        orderIndex,
        tags: courseTags,
      })

      // 2. Create each course run → chapters → lessons
      for (const run of courseRuns) {
        const createdRun = await courseRunApi.create({
          courseId: createdCourse.id,
          code: run.code,
          status: run.status,
          startsAt: run.startsAt ? new Date(run.startsAt).toISOString() : now,
          endsAt: run.endsAt ? new Date(run.endsAt).toISOString() : now,
          timezone: "UTC",
          metadata: {},
        })

        for (let ci = 0; ci < run.chapters.length; ci++) {
          const ch = run.chapters[ci]
          const createdChapter = await chapterApi.create({
            courseRunId: createdRun.id,
            title: ch.title,
            description: null,
            orderIndex: ci,
          })

          for (let li = 0; li < ch.lessons.length; li++) {
            const l = ch.lessons[li]
            await lessonApi.create({
              chapterId: createdChapter.id,
              type: l.type,
              title: l.title,
              description: l.description || null,
              orderIndex: li,
              isHidden: false,
              isOptional: false,
              contentData: buildLessonContentData({
                fileUrl: l.fileUrl,
                fileName: l.fileName,
              }) ?? {},
            })
          }
        }
      }

      navigate(programIdParam ? "/dashboard/programs" : "/dashboard/courses")
    } catch (e) {
      console.error("Failed to save course:", e)
      alert("Failed to save course. Please try again.")
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, isBannerUploading, selectedProgramId, programIdParam, courseCode, courseTitle, courseDesc, courseLevel, bannerPreview, courseCategory, orderIndex, courseTags, courseRuns, navigate])

  // ── CourseRun helpers ──
  const addRun = () => {
    const id = nextRunId.current++
    setCourseRuns((prev) => [
      ...prev,
      { id, code: `Run ${prev.length + 1}: Unnamed Run`, startsAt: "", endsAt: "", status: "DRAFT", chapters: [], collapsed: false },
    ])
  }

  const updateRun = (runId: number, patch: Partial<CourseRun>) => {
    setCourseRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, ...patch } : r)))
  }

  const deleteRun = (runId: number) => setCourseRuns((prev) => prev.filter((r) => r.id !== runId))
  const toggleCollapse = (runId: number) => setCourseRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, collapsed: !r.collapsed } : r)))

  // ── Chapter helpers ──
  const addChapter = (runId: number) => {
    const id = nextChapterId.current++
    const run = courseRuns.find((r) => r.id === runId)
    if (!run) return
    setCourseRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? { ...r, chapters: [...r.chapters, { id, title: `Chapter ${r.chapters.length + 1}`, lessons: [] }] }
          : r
      )
    )
  }

  // ── Lesson helpers ──
  const addLesson = useCallback((runId: number, chapterId: number, item: Omit<LessonItem, "id">) => {
    const id = nextLessonId.current++
    setCourseRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapterId ? { ...ch, lessons: [...ch.lessons, { ...item, id }] } : ch) }
          : r
      )
    )
  }, [])

  const deleteLesson = (runId: number, chapterId: number, lessonId: number) => {
    setCourseRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapterId ? { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId) } : ch) }
          : r
      )
    )
  }

  const updateLesson = (runId: number, chapterId: number, lessonId: number, title: string, description: string, fileUrl?: string, fileName?: string) => {
    setCourseRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapterId ? { ...ch, lessons: ch.lessons.map((l) => l.id === lessonId ? { ...l, title, description, ...(fileUrl !== undefined ? { fileUrl } : {}), ...(fileName !== undefined ? { fileName } : {}) } : l) } : ch) }
          : r
      )
    )
  }

  // ── Stats ──
  const totalChapters = courseRuns.reduce((a, r) => a + r.chapters.length, 0)
  const totalLessons = courseRuns.reduce((a, r) => a + r.chapters.reduce((b, ch) => b + ch.lessons.length, 0), 0)

  // ── Banner upload ──
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsBannerUploading(true)
    try {
      const response = await assetApi.upload(file)
      setBannerPreview(response.url)
    } catch (error) {
      console.error("Thumbnail upload failed:", error)
      alert(error instanceof Error ? error.message : "Thumbnail upload failed. Please check your connection and try again.")
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ""
      }
    } finally {
      setIsBannerUploading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — BASIC INFO
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8 pb-32"
        >
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/dashboard/courses" className="text-slate-400 hover:text-slate-600 font-semibold transition-colors">Courses</Link>
            <span className="material-symbols-outlined text-slate-300 text-[16px]">chevron_right</span>
            <span className="text-slate-700 font-semibold">Create Course</span>
          </nav>

          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">Create Course</h2>
            <p className="text-slate-500 mt-2">Step 1 of 3: Define the core identity of your course.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left column */}
            <div className="lg:col-span-3 space-y-5">
              {/* Title + Code */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                    Course Code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. STRAT-001"
                    className="w-full border border-slate-200 rounded-xl px-5 py-3 text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/25"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Unique identifier — must be unique across all courses.</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                    Course Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Strategic Leadership for the AI Era"
                    className="w-full border border-slate-200 rounded-xl px-5 py-4 text-base text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/25 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-3">Course Description</label>
                <MarkdownEditor
                  id="course-desc-create"
                  value={courseDesc}
                  onChange={setCourseDesc}
                  placeholder={"Provide a compelling overview of what leaders will learn...\n\n## Highlights\n- Point one\n- Point two"}
                  rows={8}
                />
              </div>

              {/* Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-3">Thumbnail URL</label>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isBannerUploading}
                  className="w-full h-48 rounded-xl border-2 border-dashed border-slate-200 hover:border-secondary/40 transition-colors flex flex-col items-center justify-center gap-3 group overflow-hidden relative disabled:opacity-60"
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-secondary text-5xl transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>{isBannerUploading ? "progress_activity" : "add_photo_alternate"}</span>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-500 group-hover:text-secondary transition-colors">{isBannerUploading ? "Uploading thumbnail..." : "Upload thumbnail"}</p>
                        <p className="text-xs text-slate-400 mt-1">Recommended: 1200 × 800px (JPG, PNG)</p>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-6">

                {/* Level — maps to CourseUpsertRequest.level */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                    Level <span className="text-slate-400 font-normal normal-case tracking-normal">· CourseResponse.level</span>
                  </label>
                  <div className="relative">
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value)}
                      className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/25 bg-white pr-10"
                    >
                      <option value="">— Select Level —</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Category — maps to CourseUpsertRequest.category */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                    Category <span className="text-slate-400 font-normal normal-case tracking-normal">· CourseResponse.category</span>
                  </label>
                  <div className="relative">
                    <select
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value)}
                      className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/25 bg-white pr-10"
                    >
                      <option value="">— Select Category —</option>
                      <option value="STRATEGIC MASTERY">Strategic Mastery</option>
                      <option value="HUMAN CENTRICITY">Human Centricity</option>
                      <option value="FINANCE & OPS">Finance &amp; Ops</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Program */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Program</label>
                  <div className="relative">
                    <select
                      value={selectedProgramId ?? ""}
                      onChange={(e) => setSelectedProgramId(e.target.value || null)}
                      className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/25 bg-white pr-10"
                    >
                      <option value="">— No Program —</option>
                      {allPrograms.map((p) => (
                        <option key={p.id} value={p.id}>{p.title} ({p.code})</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Order Index */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Order Index</label>
                  <input
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/25"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Position of this course within the program.</p>
                </div>

                {/* Tags — maps to CourseUpsertRequest.tags / CourseResponse.tags */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                    Tags <span className="text-slate-400 font-normal normal-case tracking-normal">· CourseResponse.tags</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                          e.preventDefault()
                          const tag = tagInput.trim().toLowerCase()
                          if (!courseTags.includes(tag)) setCourseTags((prev) => [...prev, tag])
                          setTagInput("")
                        }
                      }}
                      placeholder="Type & press Enter"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/25"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const tag = tagInput.trim().toLowerCase()
                        if (tag && !courseTags.includes(tag)) setCourseTags((prev) => [...prev, tag])
                        setTagInput("")
                      }}
                      className="px-3 py-2.5 rounded-xl bg-secondary/10 text-secondary text-sm font-bold hover:bg-secondary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  {courseTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {courseTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-[11px] font-bold px-2.5 py-1 rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setCourseTags((prev) => prev.filter((t) => t !== tag))}
                            className="hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Press Enter or comma to add a tag.</p>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-30">
          <button
            onClick={() => navigate(programIdParam ? "/dashboard/programs" : "/dashboard/courses")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-lg font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Save &amp; Continue to Curriculum
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — REVIEW & SAVE
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 3) {
    const totalChapters3 = courseRuns.reduce((a, r) => a + r.chapters.length, 0)
    const totalLessons3 = courseRuns.reduce((a, r) => a + r.chapters.reduce((b, ch) => b + ch.lessons.length, 0), 0)
    const hasWarning = courseRuns.some((r) => r.chapters.some((ch) => ch.lessons.length === 0))

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="pb-28"
        >
          {/* Step Progress */}
          <div className="flex items-center gap-0 mb-8 w-fit">
            {[{ n: 1, label: "Basic Info" }, { n: 2, label: "Curriculum" }, { n: 3, label: "Review & Save" }].map((s, idx) => (
              <div key={s.n} className="flex items-center">
                {idx > 0 && <div className="w-8 h-px bg-slate-200 mx-1" />}
                <button
                  onClick={() => setStep(s.n as 1 | 2 | 3)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${s.n === 3 ? "bg-secondary text-white" : "text-slate-500 hover:text-secondary"}`}
                >
                  {s.n < 3 ? (
                    <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-white/30 text-white flex items-center justify-center text-[11px] font-extrabold">3</span>
                  )}
                  {s.label}
                </button>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">Review &amp; Save Course</h2>
            <p className="text-slate-500 mt-2">Check all course details and curriculum structure before saving.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left: Course Info */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="relative h-44 bg-slate-100">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-300 text-5xl">image</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/50 text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">Preview</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 font-mono">{courseCode || "NO-CODE"}</p>
                  <h3 className="text-xl font-extrabold font-headline text-slate-900 leading-tight">
                    {courseTitle || "Untitled Course"}
                  </h3>
                  <div className="divide-y divide-slate-50 space-y-0">
                    {[
                      { label: "Order Index", value: String(orderIndex), isAccent: false },
                    ].map(({ label, value, isAccent }) => (
                      <div key={label} className="flex items-center justify-between py-3">
                        <span className="text-sm text-slate-500">{label}</span>
                        <span className={`text-sm font-semibold ${isAccent ? "text-secondary" : "text-slate-800"}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {courseDesc && (
                    <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-50 pt-3 prose prose-sm max-w-none prose-headings:text-slate-800 prose-headings:font-bold prose-ul:pl-4 prose-ul:list-disc prose-strong:text-slate-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{courseDesc}</ReactMarkdown>
                    </div>
                  )}
                  <button
                    onClick={() => setStep(1)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit Basic Info
                  </button>
                </div>
              </div>

              {/* Curriculum Stats */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Curriculum Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Course Runs", value: String(courseRuns.length).padStart(2, "0") },
                    { label: "Chapters", value: String(totalChapters3).padStart(2, "0") },
                    { label: "Lessons", value: String(totalLessons3).padStart(2, "0") },
                    { label: "Est. Duration", value: `${(totalLessons3 * 0.35).toFixed(1)}h` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-2xl font-extrabold font-headline text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Curriculum Structure */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                  <h3 className="text-xl font-extrabold font-headline text-slate-900">Curriculum Structure</h3>
                  <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">list</span>
                    Reorganize
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {courseRuns.map((run, idx) => (
                    <ReviewRunRow key={run.id} run={run} idx={idx} />
                  ))}
                  {courseRuns.length === 0 && (
                    <div className="py-12 text-center">
                      <span className="material-symbols-outlined text-slate-200 text-4xl block mb-2">school</span>
                      <p className="text-slate-400 text-sm font-semibold">No course runs added yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                {!hasWarning ? (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="text-sm text-slate-600">All chapters contain lessons.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <p className="text-sm text-slate-600">Some chapters have no lessons. Add content before publishing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-30">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Curriculum
          </button>
          <button
            onClick={() => saveCourse()}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 text-white px-7 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
          >
            Save Course
            <span className="material-symbols-outlined text-[18px]">save</span>
          </button>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — CURRICULUM BUILDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pb-32"
      >
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/dashboard/courses" className="text-slate-400 hover:text-slate-600 font-semibold transition-colors">Courses</Link>
          <span className="material-symbols-outlined text-slate-300 text-[16px]">chevron_right</span>
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 font-semibold transition-colors">Create Course</button>
          <span className="material-symbols-outlined text-slate-300 text-[16px]">chevron_right</span>
          <span className="text-secondary font-semibold">Curriculum Builder</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">Course Curriculum Builder</h2>
            <p className="text-slate-500 mt-2">
              Design the learning journey through course runs and chapters for{" "}
              <button onClick={() => setStep(1)} className="text-secondary font-semibold hover:underline">
                '{courseTitle || "Unnamed Course"}'
              </button>.
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {[
                { icon: "view_module", label: `${totalChapters} Chapters` },
                { icon: "menu_book", label: `${totalLessons} Lessons` },
                { icon: "schedule", label: `${(totalLessons * 0.35).toFixed(1)}h` },
              ].map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 bg-secondary/10 text-secondary text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={addRun}
            className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Course Run
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {courseRuns.map((run, runIdx) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {run.collapsed ? (
                  <div
                    className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleCollapse(run.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-300 text-[20px]">drag_indicator</span>
                      <span className="text-base font-bold text-slate-500 font-mono">{run.code}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${run.status === "PUBLISHED" ? "bg-secondary/10 text-secondary" : "bg-slate-100 text-slate-500"}`}>
                        {run.status}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
                  </div>
                ) : (
                  <>
                    {/* Run header inputs */}
                    <div className="p-6 border-b border-slate-100">
                      <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-slate-300 text-[20px] cursor-grab mt-1 shrink-0">drag_indicator</span>
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Run Code</label>
                            <input
                              value={run.code}
                              onChange={(e) => updateRun(run.id, { code: e.target.value })}
                              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
                            <div className="flex gap-2">
                              {(["DRAFT", "PUBLISHED"] as const).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => updateRun(run.id, { status: s })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${run.status === s ? (s === "PUBLISHED" ? "bg-secondary border-secondary text-white shadow-sm" : "bg-slate-200 border-slate-300 text-slate-700") : "border-slate-200 text-slate-400 hover:border-slate-300"}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Starts At</label>
                              <input
                                type="datetime-local"
                                value={run.startsAt}
                                onChange={(e) => updateRun(run.id, { startsAt: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Ends At</label>
                              <input
                                type="datetime-local"
                                value={run.endsAt}
                                onChange={(e) => updateRun(run.id, { endsAt: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-5">
                          <button onClick={() => toggleCollapse(run.id)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">expand_less</span>
                          </button>
                          <button onClick={() => deleteRun(run.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chapters */}
                    <div className="p-6 space-y-5">
                      {run.chapters.map((chapter, chIdx) => (
                        <div key={chapter.id} className="rounded-xl border border-slate-100">
                          {/* Chapter header */}
                          <div className="bg-slate-50 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-secondary text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                                {runIdx + 1}.{chIdx + 1}
                              </span>
                              <input
                                value={chapter.title}
                                onChange={(e) => {
                                  setCourseRuns((prev) =>
                                    prev.map((r) =>
                                      r.id === run.id
                                        ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapter.id ? { ...ch, title: e.target.value } : ch) }
                                        : r
                                    )
                                  )
                                }}
                                className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none border-b border-transparent focus:border-secondary/50 pb-0.5 transition-colors w-64"
                              />
                            </div>
                            {/* Add Lesson dropdown */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setLessonDropdown(
                                    lessonDropdown?.runId === run.id && lessonDropdown?.chapterId === chapter.id
                                      ? null
                                      : { runId: run.id, chapterId: chapter.id }
                                  )
                                }
                                className="text-secondary text-xs font-bold flex items-center gap-1 hover:opacity-75 transition-opacity"
                              >
                                <span className="material-symbols-outlined text-[14px]">add</span>
                                Add Lesson
                              </button>
                              <AnimatePresence>
                                {lessonDropdown?.runId === run.id && lessonDropdown?.chapterId === chapter.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 bottom-full mb-2 z-20 bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex flex-row gap-1.5"
                                  >
                                    {(["video", "photo", "document", "text"] as LessonType[]).map((lt) => {
                                      const cfg = contentConfig[lt]
                                      const labels: Record<LessonType, string> = { video: "Upload Video", photo: "Upload Photo", document: "Add Document", text: "Add Text" }
                                      return (
                                        <button
                                          key={lt}
                                          onClick={() => { setLessonDropdown(null); setAddModal({ runId: run.id, chapterId: chapter.id, type: lt }) }}
                                          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:border-secondary/40 hover:bg-secondary/5 transition-all group"
                                        >
                                          <span className={`material-symbols-outlined text-[16px] text-slate-400 group-hover:text-secondary transition-colors`}>{cfg.icon}</span>
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-secondary transition-colors leading-tight text-center whitespace-nowrap">{labels[lt]}</span>
                                        </button>
                                      )
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Lessons */}
                          {chapter.lessons.length > 0 && (
                            <div className="divide-y divide-slate-50">
                              {chapter.lessons.map((lesson) => {
                                const cfg = contentConfig[lesson.type]
                                return (
                                  <div key={lesson.id} className="flex items-center gap-4 px-5 py-3.5 group/item hover:bg-slate-50/70 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                                      <p className="text-[11px] text-slate-400">{lesson.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                      {lesson.type !== "text" && (
                                        <button
                                          onClick={() => setPreviewLesson(lesson)}
                                          className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setEditLessonModal({ runId: run.id, chapterId: chapter.id, lesson })}
                                        className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">edit</span>
                                      </button>
                                      <button
                                        onClick={() => deleteLesson(run.id, chapter.id, lesson.id)}
                                        className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Chapter button */}
                      <button
                        onClick={() => addChapter(run.id)}
                        className="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-secondary/40 hover:bg-secondary/5 text-slate-400 hover:text-secondary text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add Chapter to {run.code}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {courseRuns.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
              <span className="material-symbols-outlined text-slate-200 text-5xl block mb-3">school</span>
              <p className="text-slate-400 font-semibold">No course runs yet. Click "Add Course Run" to start.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-30">
        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Basic Info
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveCourse()}
            disabled={saving || isBannerUploading}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            Save as Draft
          </button>
          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-7 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Save &amp; Review Course
          </button>
        </div>
      </div>

      {/* Dropdown backdrop */}
      {lessonDropdown && <div className="fixed inset-0 z-10" onClick={() => setLessonDropdown(null)} />}

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {addModal && (
          <AddContentModal
            type={addModal.type}
            onClose={() => setAddModal(null)}
            onAdd={(item) => { addLesson(addModal.runId, addModal.chapterId, item); setAddModal(null) }}
          />
        )}
      </AnimatePresence>

      {/* Edit Lesson Modal */}
      <AnimatePresence>
        {editLessonModal && (
          <EditLessonModal
            lesson={editLessonModal.lesson}
            onClose={() => setEditLessonModal(null)}
            onSave={(title, description, fileUrl, fileName) => {
              updateLesson(editLessonModal.runId, editLessonModal.chapterId, editLessonModal.lesson.id, title, description, fileUrl, fileName)
              setEditLessonModal(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewLesson && <PreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />}
      </AnimatePresence>
    </>
  )
}
