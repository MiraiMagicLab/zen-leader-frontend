import { motion } from "framer-motion"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { programApi } from "@/lib/api"

export default function CreateProgramPage() {
  const navigate = useNavigate()

  const [code, setCode] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const saveProgram = async (publish: boolean) => {
    if (!title.trim()) { setError("Title is required."); return }
    if (!code.trim()) { setError("Code is required."); return }
    setIsSaving(true)
    setError(null)
    try {
      await programApi.create({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || null,
        thumbnailUrl: bannerPreview,
        isPublished: publish,
        publishedAt: publish ? new Date().toISOString() : null,
      })
      navigate("/dashboard/programs")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save program.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <section>
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          <button
            onClick={() => navigate("/dashboard/programs")}
            className="hover:text-secondary transition-colors"
          >
            Programs
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-500">Create New</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">
              Establish New Program
            </h2>
            <p className="text-slate-500 mt-2 font-body max-w-lg">
              Configure high-level executive development programs by curating existing courses into a cohesive curriculum path.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => saveProgram(false)}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Draft"}
            </button>
            <button
              onClick={() => saveProgram(true)}
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Publish Program"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Program Identity */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              </div>
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Program Identity</h3>
            </div>

            <div className="space-y-6">
              {/* Code */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                  Program Code <span className="text-error">*</span>
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EXEC-LDR-2024"
                  className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">Unique identifier — must be unique across all programs.</p>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">
                  Program Title <span className="text-error">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Strategic Leadership Excellence 2024"
                  className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Provide a detailed overview, learning objectives, and outcomes..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none bg-surface-container-low transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Program Media */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
              </div>
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Thumbnail</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div
                className="relative w-full sm:w-48 shrink-0 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 cursor-pointer group hover:border-secondary/40 transition-colors"
                style={{ aspectRatio: "3/2" }}
                onClick={() => bannerRef.current?.click()}
              >
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-2 p-4">
                    <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">Upload Cover</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-base font-bold text-slate-800 mb-1">Upload a high-resolution thumbnail</p>
                <p className="text-sm text-slate-500 mb-4">
                  Recommended size: 1200 × 800px. JPG or PNG. Max 5MB.
                </p>
                <button
                  onClick={() => bannerRef.current?.click()}
                  className="text-[11px] font-bold text-secondary uppercase tracking-widest hover:underline transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Publish Settings */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
              <h3 className="text-base font-extrabold font-headline text-slate-900">Publish Settings</h3>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-700">
                  Status: {isPublished ? "Published" : "Draft"}
                </span>
                <button
                  onClick={() => setIsPublished((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    isPublished ? "bg-secondary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      isPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Published programs are visible to enrolled organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
