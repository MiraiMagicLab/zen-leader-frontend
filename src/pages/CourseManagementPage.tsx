import { motion } from "framer-motion"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { courses } from "@/data/courses"

const actionIcons: Record<string, string> = {
  EDIT: "edit",
  STATS: "bar_chart",
  ARCHIVE: "archive",
  PUBLISH: "rocket_launch",
  DISCARD: "delete",
}

const actionColors: Record<string, string> = {
  EDIT: "text-slate-600 hover:text-secondary hover:bg-secondary/10",
  STATS: "text-slate-600 hover:text-tertiary hover:bg-tertiary/10",
  ARCHIVE: "text-slate-600 hover:text-slate-800 hover:bg-slate-100",
  PUBLISH: "text-slate-600 hover:text-primary-fixed-dim hover:bg-primary-fixed/10",
  DISCARD: "text-slate-600 hover:text-error hover:bg-error/10",
}

const categoryColors: Record<string, string> = {
  "STRATEGIC MASTERY": "bg-secondary/80",
  "HUMAN CENTRICITY": "bg-tertiary/80",
  "FINANCE & OPS": "bg-primary/80",
}

export default function CourseManagementPage() {
  const navigate = useNavigate()
  const [programFilter, setProgramFilter] = useState("All Leadership Programs")
  const [instructorFilter, setInstructorFilter] = useState("Any Specialist")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = courses.filter((c) => {
    if (statusFilter === "Published" && c.status !== "PUBLISHED") return false
    if (statusFilter === "Draft" && c.status !== "DRAFT") return false
    if (programFilter !== "All Leadership Programs") {
      const map: Record<string, string> = {
        "Strategic Mastery": "STRATEGIC MASTERY",
        "Human Centricity": "HUMAN CENTRICITY",
        "Finance & Ops": "FINANCE & OPS",
      }
      if (c.category !== map[programFilter]) return false
    }
    if (instructorFilter !== "Any Specialist" && c.instructor !== instructorFilter) return false
    return true
  })

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
          className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create New Course
        </button>
      </section>

      {/* Filters */}
      <section className="grid grid-cols-1 gap-6 items-start">

        {/* Filter Bar */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Program */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Program
              </label>
              <div className="relative">
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                >
                  <option>All Leadership Programs</option>
                  <option>Strategic Mastery</option>
                  <option>Human Centricity</option>
                  <option>Finance & Ops</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            {/* Instructor */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Instructor
              </label>
              <div className="relative">
                <select
                  value={instructorFilter}
                  onChange={(e) => setInstructorFilter(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                >
                  <option>Any Specialist</option>
                  <option>Dr. Aris Thorne</option>
                  <option>Sarah Jenkins</option>
                  <option>Michael Chen</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                >
                  <option>All Statuses</option>
                  <option>Published</option>
                  <option>Draft</option>
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
        {filtered.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden group hover:shadow-[0px_20px_48px_rgba(31,62,114,0.12)] transition-shadow"
          >
            {/* Cover Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {/* Category Badge */}
              <span className={`absolute top-3 left-3 text-[10px] font-bold text-white px-2.5 py-1 rounded ${categoryColors[course.category] ?? "bg-slate-600/80"} backdrop-blur-sm`}>
                {course.category}
              </span>
              {/* Status Badge */}
              <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm ${
                course.status === "PUBLISHED"
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-white/80 text-slate-600"
              }`}>
                {course.status}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-5">
              {/* Title */}
              <h4 className="text-base font-extrabold text-secondary font-headline leading-snug mb-3 group-hover:text-secondary transition-colors">
                {course.title}
              </h4>

              {/* Instructor */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-7 h-7 rounded-full ${course.instructorColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                  {course.instructorInitials}
                </div>
                <span className="text-sm text-slate-500 font-medium">{course.instructor}</span>
              </div>

              {/* Stats */}
              <div className="flex items-end justify-between mb-5 pb-5 border-b border-surface-container/30">
                <div>
                  <p className={`text-2xl font-extrabold font-headline ${course.enrolled === 0 ? "text-slate-300" : "text-slate-900"}`}>
                    {course.enrolled}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Enrolled
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-extrabold font-headline ${course.avgScore === null ? "text-slate-300" : "text-slate-900"}`}>
                    {course.avgScore !== null ? course.avgScore : "—"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Avg Score
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {course.actions.map((action) => (
                  <button
                    key={action}
                    onClick={() => action === "EDIT" ? navigate(`/dashboard/courses/${course.id}/edit`) : undefined}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-100 text-[10px] font-bold uppercase tracking-wide transition-all ${actionColors[action]}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{actionIcons[action]}</span>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pb-4">
        <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {[1, 2, 3].map((p) => (
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
        <span className="text-slate-400 text-sm font-bold px-1">...</span>
        <button
          onClick={() => setCurrentPage(8)}
          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
            currentPage === 8
              ? "bg-secondary text-white shadow-md"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          8
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Create New Course</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Course Title</label>
                <input className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. Advanced Decision Architectures" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Program</label>
                  <select className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30">
                    <option>Strategic Mastery</option>
                    <option>Human Centricity</option>
                    <option>Finance & Ops</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Instructor</label>
                  <select className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30">
                    <option>Dr. Aris Thorne</option>
                    <option>Sarah Jenkins</option>
                    <option>Michael Chen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea rows={3} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none" placeholder="Short description of the course..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Max Capacity</label>
                  <input type="number" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Initial Status</label>
                  <select className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30">
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-sm font-bold hover:opacity-90 transition-opacity">
                Create Course
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
