import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { courseApi, courseRunApi, chapterApi, lessonApi, programApi, assetApi, type CourseResponse, type ProgramResponse } from "@/lib/api"
import MarkdownEditor from "@/components/MarkdownEditor"
import FileActionLinks from "@/components/FileActionLinks"

// ─── Types ────────────────────────────────────────────────────────────────────
type LessonType = "video" | "resource" | "live" | "document" | "text" | "photo"
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
interface Run {
  id: number
  apiId: string | null
  code: string
  status: string
  startsAt: string | null
  endsAt: string | null
  timezone: string
  chapters: Chapter[]
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

function AddVideoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<LessonItem, "id">) => void }) {
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
        <button onClick={() => { if (!title.trim()) return; onAdd({ type: "video", title: title.trim(), description: duration ? `Video Lesson • ${duration} mins` : "Video Lesson" }); onClose() }} className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90">Add Lesson</button>
      </div>
    </ModalBackdrop>
  )
}

function AddResourceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<LessonItem, "id">) => void }) {
  const [fileType, setFileType] = useState("PDF Document")
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setIsUploading(true)
    
    try {
      // Upload to Cloudinary via backend
      const response = await assetApi.upload(selectedFile)
      setFileUrl(response.url)
    } catch (error) {
      console.error("Upload failed:", error)
      // Fallback to blob URL if upload fails
      setFileUrl(URL.createObjectURL(selectedFile))
    } finally {
      setIsUploading(false)
    }
  }
  
  // Get filename without extension for title
  const getFileTitle = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, "") // Remove extension
  }
  
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
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>PDF Document</option><option>Spreadsheet</option><option>Presentation</option><option>Word Document</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">File</label>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileRef.current?.click()} disabled={isUploading} className="w-full border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl px-4 py-4 flex items-center gap-3 transition-colors group disabled:opacity-50">
            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary text-[24px]">{isUploading ? "progress_activity" : "upload_file"}</span>
            <div className="text-left overflow-hidden">
              {isUploading ? (
                <p className="text-sm text-slate-400">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-slate-400 group-hover:text-primary truncate">{file ? file.name : "Click to upload file"}</p>
                  {file && <p className="text-[10px] text-slate-300">{(file.size / 1024 / 1024).toFixed(1)} MB</p>}
                </>
              )}
            </div>
          </button>
          {fileUrl && file && (
            <div className="mt-2 p-3 bg-surface-container-low rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uploaded File</p>
              <div className="flex items-center gap-3">
                <FileActionLinks
                  url={fileUrl}
                  fileName={file.name}
                  openClassName="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  downloadClassName="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary hover:underline"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button 
          onClick={() => { 
            if (!file) return
            const title = getFileTitle(file.name)
            const sz = ` • ${(file.size/1024/1024).toFixed(1)} MB`
            onAdd({ type: "resource", title, description: `${fileType}${sz}`, fileUrl, fileName: file.name })
            onClose() 
          }} 
          disabled={isUploading || !file} 
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
        >
          Add Resource
        </button>
      </div>
    </ModalBackdrop>
  )
}

function AddLiveModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<LessonItem, "id">) => void }) {
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
        <button onClick={() => { if (!title.trim()) return; const d = date ? new Date(date).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""; onAdd({ type: "live", title: title.trim(), description: `Live Session${d ? ` • ${d}${time ? ` ${time}` : ""}` : ""}` }); onClose() }} className="flex-1 py-3 rounded-xl bg-tertiary text-white text-sm font-bold hover:opacity-90">Add Session</button>
      </div>
    </ModalBackdrop>
  )
}

function AddTextModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: Omit<LessonItem, "id">) => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline text-slate-900">Add Text Content</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-[20px]">close</span></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Module Introduction" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter text content here..." rows={5} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { if (!title.trim()) return; onAdd({ type: "text", title: title.trim(), description: content.trim() || "Text content" }); onClose() }} className="flex-1 py-3 rounded-xl bg-slate-700 text-white text-sm font-bold hover:opacity-90">Add Text</button>
      </div>
    </ModalBackdrop>
  )
}

function EditLessonModal({ lesson, onClose, onSave }: { lesson: LessonItem; onClose: () => void; onSave: (title: string, description: string, fileUrl?: string, fileName?: string) => void }) {
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description)
  const [fileUrl, setFileUrl] = useState(lesson.fileUrl || "")
  const [displayFileName, setDisplayFileName] = useState(lesson.fileName || (lesson.fileUrl ? lesson.fileUrl.split('/').pop() || "Uploaded file" : ""))
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    setDisplayFileName(file.name)
    
    try {
      // Upload to Cloudinary via backend
      const response = await assetApi.upload(file)
      setFileUrl(response.url)
    } catch (error) {
      console.error("Upload failed:", error)
      // Fallback to blob URL if upload fails
      setFileUrl(URL.createObjectURL(file))
    } finally {
      setIsUploading(false)
    }
  }
  
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
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        {(lesson.type === "resource" || lesson.type === "document" || lesson.type === "photo" || lesson.type === "video") && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">File</label>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
            <div className="space-y-2">
              {fileUrl && displayFileName && (
                <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                  <span className="text-sm text-slate-700 flex-1 truncate" title={displayFileName}>
                    {displayFileName}
                  </span>
                  <button onClick={() => { setFileUrl(""); setDisplayFileName(""); }} className="p-1 text-slate-400 hover:text-error">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={isUploading} className="w-full border-2 border-dashed border-slate-200 hover:border-secondary/50 rounded-xl px-4 py-4 flex items-center gap-3 transition-colors group disabled:opacity-50">
                <span className="material-symbols-outlined text-slate-300 group-hover:text-secondary text-[24px]">{isUploading ? "progress_activity" : "upload_file"}</span>
                <span className="text-sm text-slate-400 group-hover:text-secondary">{isUploading ? "Uploading..." : fileUrl ? "Replace file" : "Click to upload file"}</span>
              </button>
            </div>
            {fileUrl && (
              <div className="flex items-center gap-3 mt-2">
                <FileActionLinks
                  url={fileUrl}
                  fileName={displayFileName}
                  openClassName="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
                  downloadClassName="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-secondary hover:underline"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => { onSave(title.trim(), description.trim(), fileUrl, displayFileName); onClose() }} disabled={isUploading} className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50">Save Changes</button>
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

const lessonIconColor: Record<string, string> = {
  video: "bg-secondary/10 text-secondary",
  resource: "bg-primary/10 text-primary",
  live: "bg-tertiary/10 text-tertiary",
  document: "bg-primary/10 text-primary",
  text: "bg-slate-100 text-slate-500",
  photo: "bg-primary/10 text-primary",
}
const lessonIcon: Record<string, string> = {
  video: "play_circle",
  resource: "description",
  live: "podcasts",
  document: "description",
  text: "article",
  photo: "image",
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const courseId = id ?? ""

  // ── API data ──
  const [apiCourse, setApiCourse] = useState<CourseResponse | null>(null)
  const [allPrograms, setAllPrograms] = useState<ProgramResponse[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!courseId) return
    Promise.all([courseApi.getById(courseId), programApi.getAll()])
      .then(([course, programs]) => {
        setApiCourse(course)
        setAllPrograms(programs)
      })
      .catch(() => setApiCourse(null))
      .finally(() => setLoading(false))
  }, [courseId])

  // ── Form state ──
  const [courseCode, setCourseCode] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("STRATEGIC MASTERY")
  const [level, setLevel] = useState("Beginner")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [orderIndex, setOrderIndex] = useState(1)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  // ── Thumbnail ──
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  // ── Runs → Chapters → Lessons ──
  const [runs, setRuns] = useState<Run[]>([])
  const nextLessonId = useRef(500)
  const nextChapterId = useRef(500)

  // ── Editing state ──
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState("")
  const [editingLesson, setEditingLesson] = useState<{ runId: number; chapterId: number; lesson: LessonItem } | null>(null)
  const [addModal, setAddModal] = useState<{ runId: number; chapterId: number; type: "video" | "resource" | "live" | "text" } | null>(null)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  // ── Save state ──
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  // Populate form when API data arrives
  useEffect(() => {
    if (!apiCourse) return
    setCourseCode(apiCourse.code)
    setTitle(apiCourse.title)
    setDescription(apiCourse.description ?? "")
    setCategory(apiCourse.category ?? "STRATEGIC MASTERY")
    setLevel(apiCourse.level ?? "Beginner")
    setTags(apiCourse.tags ?? [])
    setOrderIndex(apiCourse.orderIndex)
    setSelectedProgramId(apiCourse.programId)
    setThumbnailPreview(apiCourse.thumbnailUrl)
    if (apiCourse.courseRuns.length > 0) {
      let idCounter = 100
      const initialRuns: Run[] = apiCourse.courseRuns.map((r) => ({
        id: idCounter++,
        apiId: r.id,
        code: r.code,
        status: r.status,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        timezone: r.timezone ?? "UTC",
        chapters: r.chapters.map((ch) => ({
          id: idCounter++,
          title: ch.title,
          lessons: ch.lessons.map((l) => ({
            id: idCounter++,
            type: (l.type as LessonType) ?? "resource",
            title: l.title,
            description: l.description ?? "",
          })),
        })),
      }))
      setRuns(initialRuns)
    }
  }, [apiCourse])

  const handleSave = useCallback(async () => {
    if (saveState !== "idle" || !apiCourse) return
    setSaveState("saving")
    const now = new Date().toISOString()
    try {
      // 1. Update course metadata
      await courseApi.update(courseId, {
        code: courseCode.trim() || `COURSE-${courseId}`,
        title: title.trim() || "Untitled Course",
        description: description.trim() || null,
        level,
        thumbnailUrl: thumbnailPreview,
        category,
        programId: selectedProgramId ?? apiCourse.programId,
        orderIndex,
        tags,
      })

      // 2. Save each run with its chapters and lessons
      for (let ri = 0; ri < runs.length; ri++) {
        const run = runs[ri]
        let runId = run.apiId
        if (!runId) {
          const newRun = await courseRunApi.create({
            courseId,
            code: run.code || `${courseCode.trim() || courseId}-RUN-0${ri + 1}`,
            status: run.status || "DRAFT",
            startsAt: run.startsAt ?? now,
            endsAt: run.endsAt ?? now,
            timezone: run.timezone ?? "UTC",
            metadata: {},
          })
          runId = newRun.id
        } else {
          await courseRunApi.update(runId, {
            courseId,
            code: run.code,
            status: run.status,
            startsAt: run.startsAt ?? now,
            endsAt: run.endsAt ?? now,
            timezone: run.timezone ?? "UTC",
            metadata: {},
          })
        }

        // Delete existing chapters then recreate
        const existingChapters = await chapterApi.getAll(runId)
        for (const ch of existingChapters) {
          await chapterApi.remove(ch.id)
        }
        for (let ci = 0; ci < run.chapters.length; ci++) {
          const ch = run.chapters[ci]
          const created = await chapterApi.create({
            courseRunId: runId,
            title: ch.title,
            description: null,
            orderIndex: ci,
          })
          for (let li = 0; li < ch.lessons.length; li++) {
            const l = ch.lessons[li]
            await lessonApi.create({
              chapterId: created.id,
              type: l.type,
              title: l.title,
              description: l.description || null,
              orderIndex: li,
              isHidden: false,
              isOptional: false,
              contentData: {},
            })
          }
        }
      }

      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch (e) {
      console.error("Failed to save:", e)
      setSaveState("idle")
    }
  }, [saveState, apiCourse, courseId, courseCode, title, description, level, thumbnailPreview, category, selectedProgramId, orderIndex, tags, runs])

  // ── Run / Chapter / Lesson helpers ──
  const updateRuns = (fn: (prev: Run[]) => Run[]) => setRuns(fn)

  const addChapter = (runId: number) => {
    const id = nextChapterId.current++
    const newTitle = `Chapter: New Chapter`
    updateRuns((prev) => prev.map((r) => r.id === runId
      ? { ...r, chapters: [...r.chapters, { id, title: newTitle, lessons: [] }] }
      : r
    ))
    setEditingChapterId(id)
    setEditingChapterTitle(newTitle)
  }

  const startEditChapter = (ch: Chapter) => { setEditingChapterId(ch.id); setEditingChapterTitle(ch.title) }

  const saveEditChapter = (runId: number, chId: number) => {
    updateRuns((prev) => prev.map((r) => r.id === runId
      ? { ...r, chapters: r.chapters.map((ch) => ch.id === chId ? { ...ch, title: editingChapterTitle || ch.title } : ch) }
      : r
    ))
    setEditingChapterId(null)
  }

  const deleteChapter = (runId: number, chId: number) => {
    updateRuns((prev) => prev.map((r) => r.id === runId
      ? { ...r, chapters: r.chapters.filter((ch) => ch.id !== chId) }
      : r
    ))
  }

  const addLesson = useCallback((runId: number, chapterId: number, lesson: Omit<LessonItem, "id">) => {
    setRuns((prev) => prev.map((r) => r.id === runId
      ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapterId ? { ...ch, lessons: [...ch.lessons, { ...lesson, id: nextLessonId.current++ }] } : ch) }
      : r
    ))
  }, [])

  const saveLesson = (runId: number, chapterId: number, lessonId: number, title: string, description: string, fileUrl?: string, fileName?: string) => {
    setRuns((prev) => prev.map((r) => r.id === runId
      ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapterId ? { ...ch, lessons: ch.lessons.map((l) => l.id === lessonId ? { ...l, title, description, fileUrl, fileName } : l) } : ch) }
      : r
    ))
  }

  const deleteLesson = (runId: number, chapterId: number, lessonId: number) => {
    setRuns((prev) => prev.map((r) => r.id === runId
      ? { ...r, chapters: r.chapters.map((ch) => ch.id === chapterId ? { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId) } : ch) }
      : r
    ))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput("")
  }
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  // Loading / 404 guard
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-slate-300 text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }
  if (!apiCourse) {
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
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">Edit Course</h2>
            <p className="text-slate-500 mt-2 font-body max-w-xl">Update course details, curriculum, and settings.</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Course Code <span className="text-error">*</span></label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                      placeholder="e.g. STRAT-001"
                      className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm font-mono text-slate-700 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Course Title <span className="text-error">*</span></label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 focus:outline-none transition-colors font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Course Description</label>
                  <MarkdownEditor
                    id="course-desc-edit"
                    value={description}
                    onChange={setDescription}
                    placeholder="Mô tả nội dung khóa học...&#10;&#10;## Highlights&#10;- Điểm nổi bật 1&#10;- Điểm nổi bật 2"
                    rows={8}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Category</label>
                  <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8">
                      <option value="STRATEGIC MASTERY">Strategic Mastery</option>
                      <option value="HUMAN CENTRICITY">Human Centricity</option>
                      <option value="FINANCE & OPS">Finance &amp; Ops</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Builder */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-[22px]">menu_book</span>
                </div>
                <h3 className="text-xl font-extrabold font-headline text-slate-900">Curriculum Builder</h3>
              </div>
              <div className="space-y-6">
                {runs.map((run, rIdx) => (
                  <div key={run.id} className="rounded-2xl border-2 border-slate-100 overflow-hidden">
                    {/* Run header */}
                    <div className="bg-secondary/5 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-secondary text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                          {String(rIdx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{run.code}</p>
                          <div className="flex gap-1.5 mt-1">
                            {(["DRAFT", "PUBLISHED"] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => setRuns((prev) => prev.map((r) => r.id === run.id ? { ...r, status: s } : r))}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border transition-all ${run.status === s ? (s === "PUBLISHED" ? "bg-primary-fixed text-on-primary-fixed border-primary-fixed" : "bg-slate-200 text-slate-600 border-slate-300") : "bg-transparent border-slate-200 text-slate-400 hover:border-slate-300"}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => addChapter(run.id)} className="flex items-center gap-1 text-secondary font-bold text-xs hover:opacity-75 transition-opacity">
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Add Chapter
                      </button>
                    </div>

                    {/* Chapters */}
                    <div className="p-4 space-y-3">
                      {run.chapters.map((ch) => (
                        <div key={ch.id} className="rounded-xl border border-slate-100 overflow-hidden">
                          <div className="bg-surface-container-low px-5 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="material-symbols-outlined text-slate-300 text-[18px] cursor-grab shrink-0">drag_indicator</span>
                              {editingChapterId === ch.id ? (
                                <input
                                  autoFocus
                                  value={editingChapterTitle}
                                  onChange={(e) => setEditingChapterTitle(e.target.value)}
                                  onBlur={() => saveEditChapter(run.id, ch.id)}
                                  onKeyDown={(e) => { if (e.key === "Enter") saveEditChapter(run.id, ch.id); if (e.key === "Escape") setEditingChapterId(null) }}
                                  className="flex-1 bg-white border border-secondary/30 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                                />
                              ) : (
                                <span className="font-bold text-slate-800 text-sm truncate">{ch.title}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => startEditChapter(ch)} className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button onClick={() => deleteChapter(run.id, ch.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                          {ch.lessons.length > 0 && (
                            <div className="divide-y divide-slate-50">
                              {ch.lessons.map((lesson) => {
                                const lessonKey = `${run.id}-${ch.id}-${lesson.id}`
                                const isExpanded = expandedLessons.has(lessonKey)
                                const hasDescription = lesson.description && lesson.description.trim().length > 0
                                return (
                                  <div key={lesson.id} className="px-5 py-3 group/lesson hover:bg-slate-50/60 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lessonIconColor[lesson.type] ?? "bg-slate-100 text-slate-400"}`}>
                                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{lessonIcon[lesson.type] ?? "article"}</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        {lesson.fileUrl ? (
                                          // If lesson has a file, make title a clickable link - open directly in browser
                                          <a
                                            href={lesson.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-primary cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                                            {lesson.title}
                                          </a>
                                        ) : (
                                          // Otherwise use the expand/collapse button
                                          <button
                                            onClick={() => {
                                              if (!hasDescription) return
                                              setExpandedLessons(prev => {
                                                const next = new Set(prev)
                                                if (next.has(lessonKey)) {
                                                  next.delete(lessonKey)
                                                } else {
                                                  next.add(lessonKey)
                                                }
                                                return next
                                              })
                                            }}
                                            className={`flex items-center gap-2 text-sm font-semibold text-slate-800 ${hasDescription ? 'cursor-pointer hover:text-secondary' : 'cursor-default'}`}
                                          >
                                            {lesson.title}
                                            {hasDescription && (
                                              <span className="material-symbols-outlined text-[16px] text-slate-400 transition-transform" style={{ fontVariationSettings: "'FILL' 1", transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                expand_more
                                              </span>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingLesson({ runId: run.id, chapterId: ch.id, lesson })} className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                                          <span className="material-symbols-outlined text-[15px]">edit</span>
                                        </button>
                                        <button onClick={() => deleteLesson(run.id, ch.id, lesson.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                                          <span className="material-symbols-outlined text-[15px]">delete</span>
                                        </button>
                                      </div>
                                    </div>
                                    {/* Show file link if lesson has a file */}
                                    {lesson.fileUrl && (
                                      <div className="mt-1 ml-12 flex items-center gap-3">
                                        <FileActionLinks
                                          url={lesson.fileUrl}
                                          fileName={lesson.fileName || `${lesson.title}.pdf`}
                                          openClassName="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                          downloadClassName="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )}
                                    {isExpanded && hasDescription && (
                                      <div className="mt-2 ml-12 text-[11px] text-slate-400 prose prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.description}</ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          <div className="px-5 py-3 flex flex-wrap gap-2 bg-white border-t border-slate-50">
                            <button onClick={() => setAddModal({ runId: run.id, chapterId: ch.id, type: "video" })} className="flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-secondary/50 hover:text-secondary rounded-lg text-xs font-bold transition-colors">
                              <span className="material-symbols-outlined text-[14px]">add</span>Add Video
                            </button>
                            <button onClick={() => setAddModal({ runId: run.id, chapterId: ch.id, type: "resource" })} className="flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary rounded-lg text-xs font-bold transition-colors">
                              <span className="material-symbols-outlined text-[14px]">add</span>Add Resource
                            </button>
                            <button onClick={() => setAddModal({ runId: run.id, chapterId: ch.id, type: "live" })} className="flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-tertiary/50 hover:text-tertiary rounded-lg text-xs font-bold transition-colors">
                              <span className="material-symbols-outlined text-[14px]">add</span>Add Live
                            </button>
                            <button onClick={() => setAddModal({ runId: run.id, chapterId: ch.id, type: "text" })} className="flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold transition-colors">
                              <span className="material-symbols-outlined text-[14px]">add</span>Add Text
                            </button>
                          </div>
                        </div>
                      ))}
                      {run.chapters.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                          <p className="text-slate-400 text-xs font-semibold">No chapters yet. Click <strong>Add Chapter</strong>.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {runs.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                    <span className="material-symbols-outlined text-slate-200 text-5xl block mb-3">menu_book</span>
                    <p className="text-slate-400 text-sm font-semibold">No runs found for this course.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Thumbnail */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
              <h3 className="text-sm font-extrabold font-headline text-slate-900 mb-4">Thumbnail</h3>
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

            {/* Course Settings */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6 space-y-5">
              <h3 className="text-sm font-extrabold font-headline text-slate-900">Course Settings</h3>

              {/* Level */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-3">Level</label>
                <div className="flex flex-wrap gap-2">
                  {(["Beginner", "Intermediate", "Advanced", "Expert"] as const).map((l) => (
                    <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${level === l ? "bg-secondary border-secondary text-white shadow-md" : "border-slate-200 text-slate-500 hover:border-secondary/40 hover:text-secondary"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Index */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Order Index</label>
                <input
                  type="number"
                  min={1}
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {/* Program */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Program</label>
                <div className="relative">
                  <select
                    value={selectedProgramId ?? ""}
                    onChange={(e) => setSelectedProgramId(e.target.value || null)}
                    className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                  >
                    <option value="">No Program</option>
                    {allPrograms.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.title}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-[10px] font-semibold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                    placeholder="Type tag + Enter"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                  <button onClick={addTag} className="px-3 py-2 bg-secondary/10 text-secondary rounded-xl text-xs font-bold hover:bg-secondary/20 transition-colors">Add</button>
                </div>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saveState !== "idle"}
              className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                saveState === "saved" ? "bg-secondary text-white" : "bg-primary-fixed text-on-primary-fixed hover:shadow-lg"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {saveState === "saved" ? "check_circle" : saveState === "saving" ? "autorenew" : "save"}
              </span>
              {saveState === "saved" ? "Saved!" : saveState === "saving" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {addModal?.type === "video" && <AddVideoModal key="v" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.runId, addModal.chapterId, l)} />}
        {addModal?.type === "resource" && <AddResourceModal key="r" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.runId, addModal.chapterId, l)} />}
        {addModal?.type === "live" && <AddLiveModal key="l" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.runId, addModal.chapterId, l)} />}
        {addModal?.type === "text" && <AddTextModal key="t" onClose={() => setAddModal(null)} onAdd={(l) => addLesson(addModal.runId, addModal.chapterId, l)} />}
        {editingLesson && <EditLessonModal key="el" lesson={editingLesson.lesson} onClose={() => setEditingLesson(null)} onSave={(t, d, url, name) => saveLesson(editingLesson.runId, editingLesson.chapterId, editingLesson.lesson.id, t, d, url, name)} />}
      </AnimatePresence>

      <SaveToast show={saveState === "saved"} />
    </>
  )
}
