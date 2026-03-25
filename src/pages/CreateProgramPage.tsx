import { motion } from "framer-motion"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"

// ─── Mock course catalog ───────────────────────────────────────────────────────
const COURSE_CATALOG = [
  { id: 1, title: "Foundations of Executive Presence", type: "Core Module", hours: "4.5 Hours" },
  { id: 2, title: "Mastering Crisis Management", type: "Case Study", hours: "3 Hours" },
  { id: 3, title: "Advanced Financial Foresight", type: "Specialization", hours: "6 Hours" },
  { id: 4, title: "Authentic Leadership in Crisis", type: "Live Session", hours: "2.5 Hours" },
  { id: 5, title: "EQ for High-Performance Teams", type: "Self-Paced", hours: "4 Hours" },
  { id: 6, title: "Strategic Decision Architecture", type: "Self-Paced", hours: "1.5 Hours" },
  { id: 7, title: "Fiscal Stewardship for CEOs", type: "Self-Paced", hours: "3 Hours" },
  { id: 8, title: "Scaling Culture Across Borders", type: "Live Session", hours: "2 Hours" },
]

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Executive"]
const CATEGORIES = ["Leadership", "Management", "Finance", "Communication", "Strategy", "Operations"]

interface SelectedCourse {
  id: number
  title: string
  type: string
  hours: string
}

export default function CreateProgramPage() {
  const navigate = useNavigate()

  // Program Identity
  const [title, setTitle] = useState("")
  const [shortDesc, setShortDesc] = useState("")
  const [category, setCategory] = useState("Leadership")
  const [overview, setOverview] = useState("")

  // Media
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // Curriculum
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([
    COURSE_CATALOG[0],
    COURSE_CATALOG[1],
    COURSE_CATALOG[2],
  ])
  const [courseSearch, setCourseSearch] = useState("")
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Settings
  const [price, setPrice] = useState("1499")
  const [enrollmentLimit, setEnrollmentLimit] = useState("50")
  const [difficulty, setDifficulty] = useState("Executive")
  const [isPrivate, setIsPrivate] = useState(false)

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerPreview(URL.createObjectURL(file))
  }

  const addCourse = (course: SelectedCourse) => {
    if (selectedCourses.length >= 8) return
    if (selectedCourses.find((c) => c.id === course.id)) return
    setSelectedCourses((prev) => [...prev, course])
    setShowCoursePicker(false)
    setCourseSearch("")
  }

  const removeCourse = (id: number) => {
    setSelectedCourses((prev) => prev.filter((c) => c.id !== id))
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setSelectedCourses((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const saveProgram = (status: "draft" | "published") => {
    const existing = JSON.parse(localStorage.getItem("localPrograms") ?? "[]")
    const newProgram = {
      id: Date.now(),
      title: title.trim() || "Untitled Program",
      shortDesc,
      category,
      overview,
      courses: selectedCourses,
      price: Number(price) || 0,
      enrollmentLimit: Number(enrollmentLimit) || 0,
      difficulty,
      isPrivate,
      status,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("localPrograms", JSON.stringify([...existing, newProgram]))
    navigate("/dashboard/programs")
  }

  const filteredCatalog = COURSE_CATALOG.filter(
    (c) =>
      !selectedCourses.find((s) => s.id === c.id) &&
      c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

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
              onClick={() => saveProgram("draft")}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={() => saveProgram("published")}
              className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Publish Program
            </button>
          </div>
        </div>
      </section>

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
              {/* Program Title */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Program Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Strategic Leadership Excellence 2024"
                  className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                />
              </div>

              {/* Short Desc + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Short Description</label>
                  <input
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="The 'elevator pitch' for the program..."
                    className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Category</label>
                  <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8"
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Full Overview */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Full Program Overview</label>
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={6}
                  placeholder="Provide a detailed roadmap, learning objectives, and outcomes..."
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
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Program Media</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Preview / Upload area */}
              <div
                className="relative w-full sm:w-48 shrink-0 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 cursor-pointer group hover:border-secondary/40 transition-colors"
                style={{ aspectRatio: "3/2" }}
                onClick={() => bannerRef.current?.click()}
              >
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
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
                <p className="text-base font-bold text-slate-800 mb-1">Upload a high-resolution banner</p>
                <p className="text-sm text-slate-500 mb-4">
                  Recommended size: 1200 × 800px. JPG or PNG. Max 5MB. This will be the main visual anchor for students in the library.
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

          {/* Curriculum Builder */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schema</span>
                <h3 className="text-base font-extrabold font-headline text-slate-900">Curriculum Builder</h3>
              </div>
              {selectedCourses.length > 0 && (
                <span className="text-[10px] font-bold bg-secondary text-white rounded-lg px-2.5 py-1 uppercase tracking-widest">
                  {selectedCourses.length} Course{selectedCourses.length > 1 ? "s" : ""} Selected
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                value={courseSearch}
                onChange={(e) => { setCourseSearch(e.target.value); setShowCoursePicker(true) }}
                onFocus={() => setShowCoursePicker(true)}
                placeholder="Search courses to add..."
                className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">CMD+K</span>
            </div>

            {/* Dropdown picker */}
            {showCoursePicker && filteredCatalog.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-lg">
                {filteredCatalog.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => addCourse(course)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low text-left transition-colors border-b border-slate-100 last:border-0"
                    disabled={selectedCourses.length >= 8}
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">add_circle</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{course.title}</p>
                      <p className="text-[11px] text-slate-400">{course.type} • {course.hours}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showCoursePicker && (
              <div className="fixed inset-0 z-10" onClick={() => { setShowCoursePicker(false); setCourseSearch("") }} />
            )}

            {/* Course list */}
            <div className="space-y-2 relative z-20">
              {selectedCourses.map((course, index) => (
                <div
                  key={course.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                    dragIndex === index
                      ? "border-secondary/40 bg-secondary/5 shadow-md"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-300 text-[18px] shrink-0">drag_indicator</span>
                  <span className="text-[11px] font-bold text-secondary w-5 shrink-0">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-tight truncate">{course.title}</p>
                    <p className="text-[11px] text-slate-400">{course.type} • {course.hours}</p>
                  </div>
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-slate-300 hover:text-red-400 text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>

            {selectedCourses.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">No courses added yet. Search above to add.</p>
            )}

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Add up to 8 courses per program
            </p>

            <button
              onClick={() => { setCourseSearch(""); setShowCoursePicker(true) }}
              className="flex items-center gap-1.5 mx-auto mt-2 text-[11px] font-bold text-secondary uppercase tracking-widest hover:underline transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">search</span>
              Browse All Courses
            </button>
          </div>

          {/* Program Settings */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
              <h3 className="text-base font-extrabold font-headline text-slate-900">Program Settings</h3>
            </div>

            <div className="space-y-5">
              {/* Price */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Price (USD)</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min={0}
                    className="flex-1 bg-secondary/10 text-secondary font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-right"
                  />
                </div>
              </div>

              {/* Enrollment Limit */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Enrollment Limit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={enrollmentLimit}
                    onChange={(e) => setEnrollmentLimit(e.target.value)}
                    min={1}
                    className="flex-1 bg-secondary/10 text-secondary font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-right"
                  />
                  <span className="text-slate-400 text-sm font-semibold">Seats</span>
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Difficulty Level</label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        difficulty === level
                          ? "bg-secondary text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Program Toggle */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-700">Private Program</span>
                  <button
                    onClick={() => setIsPrivate((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                      isPrivate ? "bg-secondary" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        isPrivate ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Only invited organizations and members will see this program in their hub.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
