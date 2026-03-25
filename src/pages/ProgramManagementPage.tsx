import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourseItem {
  id: number
  title: string
  duration: string
  type: "LIVE SESSION" | "SELF-PACED"
}

interface Program {
  id: number
  title: string
  target: string
  coursesCount: number
  duration: string
  status: "ACTIVE" | "DRAFT"
  value: number
  courses: CourseItem[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const initialPrograms: Program[] = [
  {
    id: 1,
    title: "Executive Leadership Excellence",
    target: "Senior Management",
    coursesCount: 8,
    duration: "12 Weeks",
    status: "ACTIVE",
    value: 2450,
    courses: [
      { id: 1, title: "Authentic Leadership in Crisis", duration: "2h 45m", type: "LIVE SESSION" },
      { id: 2, title: "EQ for High-Performance Teams", duration: "4h 20m", type: "SELF-PACED" },
      { id: 3, title: "Strategic Decision Architecture", duration: "1h 30m", type: "SELF-PACED" },
      { id: 4, title: "Fiscal Stewardship for CEOs", duration: "3h 10m", type: "SELF-PACED" },
      { id: 5, title: "Zen Leadership in Crisis", duration: "2h 00m", type: "LIVE SESSION" },
    ],
  },
  {
    id: 2,
    title: "Strategic Management Mastery",
    target: "High Potential Leaders",
    coursesCount: 5,
    duration: "6 Weeks",
    status: "ACTIVE",
    value: 1299,
    courses: [
      { id: 6, title: "Advanced Decision Architectures", duration: "3h 00m", type: "SELF-PACED" },
      { id: 7, title: "Revenue Intelligence for Leaders", duration: "2h 30m", type: "SELF-PACED" },
      { id: 8, title: "Scaling Culture Across Borders", duration: "1h 45m", type: "LIVE SESSION" },
    ],
  },
  {
    id: 3,
    title: "Mindful Communication Series",
    target: "All Employees",
    coursesCount: 3,
    duration: "2 Weeks",
    status: "DRAFT",
    value: 599,
    courses: [
      { id: 9, title: "The Empathy Quotient in Tech", duration: "2h 00m", type: "SELF-PACED" },
      { id: 10, title: "Active Listening for Leaders", duration: "1h 15m", type: "LIVE SESSION" },
    ],
  },
]

// ─── Create Program Modal ─────────────────────────────────────────────────────
function CreateProgramModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Program) => void }) {
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [duration, setDuration] = useState("")
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("DRAFT")

  const handleCreate = () => {
    if (!title.trim()) return
    onCreate({
      id: Date.now(),
      title: title.trim(),
      target: target || "All Employees",
      coursesCount: 0,
      duration: duration || "TBD",
      status,
      value: 0,
      courses: [],
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Program Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Executive Leadership Excellence" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Target Audience</label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Senior Management" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Duration</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 6 Weeks" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT")} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
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

// ─── Add Course to Program Modal ──────────────────────────────────────────────
function AddCourseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: CourseItem) => void }) {
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState("")
  const [type, setType] = useState<"LIVE SESSION" | "SELF-PACED">("SELF-PACED")

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
          <h3 className="text-lg font-extrabold font-headline text-slate-900">Add Course to Program</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-slate-400 text-[20px]">close</span></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Course Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced Decision Architectures" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Duration</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2h 30m" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as "LIVE SESSION" | "SELF-PACED")} className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20">
                <option value="SELF-PACED">Self-Paced</option>
                <option value="LIVE SESSION">Live Session</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { if (!title.trim()) return; onAdd({ id: Date.now(), title: title.trim(), duration: duration || "—", type }); onClose() }} className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm font-bold hover:opacity-90">Add Course</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Catalog catalog items ────────────────────────────────────────────────────
const catalogCourses = [
  { id: 101, title: "Advanced Decision Architectures", category: "STRATEGIC MASTERY", instructor: "Dr. Aris Thorne", duration: "3h 00m", type: "SELF-PACED" as const, enrolled: 428 },
  { id: 102, title: "The Empathy Quotient in Tech", category: "HUMAN CENTRICITY", instructor: "Sarah Jenkins", duration: "2h 00m", type: "SELF-PACED" as const, enrolled: 0 },
  { id: 103, title: "Fiscal Stewardship for CEOs", category: "FINANCE & OPS", instructor: "Michael Chen", duration: "3h 10m", type: "SELF-PACED" as const, enrolled: 812 },
  { id: 104, title: "Zen Leadership in Crisis", category: "STRATEGIC MASTERY", instructor: "Dr. Aris Thorne", duration: "2h 00m", type: "LIVE SESSION" as const, enrolled: 316 },
  { id: 105, title: "Scaling Culture Across Borders", category: "HUMAN CENTRICITY", instructor: "Sarah Jenkins", duration: "1h 45m", type: "LIVE SESSION" as const, enrolled: 0 },
  { id: 106, title: "Revenue Intelligence for Leaders", category: "FINANCE & OPS", instructor: "Michael Chen", duration: "2h 30m", type: "SELF-PACED" as const, enrolled: 540 },
  { id: 107, title: "Authentic Leadership in Crisis", category: "STRATEGIC MASTERY", instructor: "Dr. Marcus Aurelius", duration: "2h 45m", type: "LIVE SESSION" as const, enrolled: 204 },
  { id: 108, title: "EQ for High-Performance Teams", category: "HUMAN CENTRICITY", instructor: "Sarah Jenkins", duration: "4h 20m", type: "SELF-PACED" as const, enrolled: 375 },
]

const categoryBadge: Record<string, string> = {
  "STRATEGIC MASTERY": "bg-secondary/10 text-secondary",
  "HUMAN CENTRICITY": "bg-tertiary/10 text-tertiary",
  "FINANCE & OPS": "bg-primary/10 text-primary",
}

function CourseCatalogTab({ programs, onAddToProgram }: {
  programs: Program[]
  onAddToProgram: (course: typeof catalogCourses[0], programId: number) => void
}) {
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("All")
  const [addingId, setAddingId] = useState<number | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<number>(programs[0]?.id ?? 0)

  const filtered = catalogCourses.filter((c) => {
    if (catFilter !== "All" && c.category !== catFilter) return false
    if (search.trim() && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Search + Filter bar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-5 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "STRATEGIC MASTERY", "HUMAN CENTRICITY", "FINANCE & OPS"].map((cat) => (
            <button key={cat} onClick={() => setCatFilter(cat)} className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all whitespace-nowrap ${catFilter === cat ? "bg-secondary border-secondary text-white" : "border-slate-200 text-slate-400 hover:border-secondary/40 hover:text-secondary"}`}>
              {cat === "All" ? "All" : cat.split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Select target program */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Add to:</p>
        <div className="flex gap-2 flex-wrap">
          {programs.map((p) => (
            <button key={p.id} onClick={() => setSelectedProgram(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedProgram === p.id ? "bg-secondary text-white border-secondary" : "border-slate-200 text-slate-500 hover:border-secondary/40"}`}>
              {p.title.length > 28 ? p.title.slice(0, 28) + "…" : p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((course) => (
          <div key={course.id} className="bg-surface-container-lowest rounded-2xl shadow-[0px_8px_24px_rgba(31,62,114,0.06)] p-5 flex flex-col gap-4 hover:shadow-[0px_12px_32px_rgba(31,62,114,0.1)] transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${categoryBadge[course.category] ?? "bg-slate-100 text-slate-500"}`}>
                {course.category.split(" ").map((w: string) => w[0] + w.slice(1).toLowerCase()).join(" ")}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${course.type === "LIVE SESSION" ? "bg-tertiary/10 text-tertiary" : "bg-slate-100 text-slate-500"}`}>
                {course.type}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 font-headline leading-snug">{course.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{course.instructor}</p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{course.duration}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">people</span>{course.enrolled} enrolled</span>
            </div>
            <button
              onClick={() => { onAddToProgram(course, selectedProgram); setAddingId(course.id); setTimeout(() => setAddingId(null), 1500) }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${addingId === course.id ? "bg-primary-fixed/20 text-on-primary-fixed-variant" : "bg-secondary/10 text-secondary hover:bg-secondary hover:text-white"}`}
            >
              <span className="material-symbols-outlined text-[16px]">{addingId === course.id ? "check_circle" : "add_circle"}</span>
              {addingId === course.id ? "Added!" : "Add to Program"}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center">
            <span className="material-symbols-outlined text-slate-200 text-5xl block mb-3">search_off</span>
            <p className="text-slate-400 text-sm font-semibold">No courses match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── User Access Tab ──────────────────────────────────────────────────────────
const accessUsers = [
  { id: 1, name: "Elena Petrov", email: "elena.p@global.com", role: "Learner", programs: ["Executive Leadership Excellence"], status: "Active", initials: "EP", color: "bg-secondary" },
  { id: 2, name: "Marcus Chen", email: "m.chen@tech.org", role: "Instructor", programs: ["Strategic Management Mastery", "Executive Leadership Excellence"], status: "Active", initials: "MC", color: "bg-primary" },
  { id: 3, name: "Julian Darko", email: "j.darko@creative.co", role: "Learner", programs: ["Mindful Communication Series"], status: "Inactive", initials: "JD", color: "bg-slate-400" },
  { id: 4, name: "Sarah Jenkins", email: "s.jenkins@zenleader.com", role: "Admin", programs: ["Executive Leadership Excellence", "Strategic Management Mastery", "Mindful Communication Series"], status: "Active", initials: "SJ", color: "bg-tertiary" },
  { id: 5, name: "Dr. Aris Thorne", email: "a.thorne@zenleader.com", role: "Instructor", programs: ["Strategic Management Mastery"], status: "Active", initials: "AT", color: "bg-secondary" },
]

const roleBadge: Record<string, string> = {
  Admin: "bg-secondary/15 text-secondary",
  Instructor: "bg-primary/15 text-primary",
  Learner: "bg-tertiary/15 text-tertiary",
}

function UserAccessTab() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  const filtered = accessUsers.filter((u) => {
    if (roleFilter !== "All" && u.role !== roleFilter) return false
    if (search.trim() && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-5 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div className="flex gap-2">
          {["All", "Admin", "Instructor", "Learner"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${roleFilter === r ? "bg-secondary border-secondary text-white" : "border-slate-200 text-slate-400 hover:border-secondary/40 hover:text-secondary"}`}>{r}</button>
          ))}
        </div>
        <button className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-4 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity whitespace-nowrap">
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Invite User
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-surface-container-low text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="col-span-3">User</span>
          <span className="col-span-2">Role</span>
          <span className="col-span-4">Programs Access</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-1"></span>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((user) => (
            <div key={user.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors">
              <div className="col-span-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${user.color} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>{user.initials}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${roleBadge[user.role] ?? "bg-slate-100 text-slate-500"}`}>{user.role}</span>
              </div>
              <div className="col-span-4 flex flex-wrap gap-1">
                {user.programs.map((prog) => (
                  <span key={prog} className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-md truncate max-w-[140px]">{prog}</span>
                ))}
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${user.status === "Active" ? "bg-secondary/10 text-secondary" : "bg-slate-100 text-slate-400"}`}>{user.status}</span>
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <button className="p-1.5 text-slate-300 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                <button className="p-1.5 text-slate-300 hover:text-error hover:bg-error/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[16px]">block</span></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-slate-200 text-4xl block mb-2">person_search</span>
              <p className="text-slate-400 text-sm font-semibold">No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── System Logs Tab ──────────────────────────────────────────────────────────
const logEntries = [
  { id: 1, action: "Program Created", detail: "Executive Leadership Excellence was created", user: "Admin User", time: "2026-03-25 09:14", type: "create", icon: "add_circle" },
  { id: 2, action: "Course Added", detail: "Authentic Leadership in Crisis added to Executive Leadership Excellence", user: "Admin User", time: "2026-03-25 09:20", type: "add", icon: "library_add" },
  { id: 3, action: "User Enrolled", detail: "Elena Petrov enrolled in Strategic Management Mastery", user: "System", time: "2026-03-24 14:32", type: "enroll", icon: "person_add" },
  { id: 4, action: "Status Changed", detail: "Mindful Communication Series changed to DRAFT", user: "Sarah Jenkins", time: "2026-03-24 11:05", type: "edit", icon: "edit" },
  { id: 5, action: "Course Removed", detail: "EQ for High-Performance Teams removed from Mindful Communication Series", user: "Admin User", time: "2026-03-23 16:47", type: "delete", icon: "remove_circle" },
  { id: 6, action: "Program Activated", detail: "Strategic Management Mastery set to ACTIVE", user: "Admin User", time: "2026-03-23 10:02", type: "create", icon: "rocket_launch" },
  { id: 7, action: "User Access Granted", detail: "Dr. Aris Thorne granted Instructor access to Strategic Management Mastery", user: "Admin User", time: "2026-03-22 15:30", type: "add", icon: "key" },
  { id: 8, action: "Program Exported", detail: "Executive Leadership Excellence report exported as PDF", user: "Admin User", time: "2026-03-22 09:10", type: "edit", icon: "download" },
]

const logTypeStyle: Record<string, string> = {
  create: "bg-secondary/10 text-secondary",
  add: "bg-primary/10 text-primary",
  edit: "bg-tertiary/10 text-tertiary",
  delete: "bg-error/10 text-error",
  enroll: "bg-primary-fixed/20 text-on-primary-fixed-variant",
}

function SystemLogsTab() {
  const [typeFilter, setTypeFilter] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = logEntries.filter((l) => {
    if (typeFilter !== "All" && l.type !== typeFilter.toLowerCase()) return false
    if (search.trim() && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.detail.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-5 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "Create", "Add", "Edit", "Delete", "Enroll"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${typeFilter === t ? "bg-secondary border-secondary text-white" : "border-slate-200 text-slate-400 hover:border-secondary/40 hover:text-secondary"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-base font-extrabold font-headline text-slate-900">Activity Log</h3>
          <span className="text-[11px] text-slate-400">{filtered.length} entries</span>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${logTypeStyle[log.type] ?? "bg-slate-100 text-slate-400"}`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{log.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.detail}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">person</span>{log.user}
                  </span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>{log.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-slate-200 text-4xl block mb-2">receipt_long</span>
              <p className="text-slate-400 text-sm font-semibold">No log entries match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgramManagementPage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>(initialPrograms)
  const [selectedId, setSelectedId] = useState<number>(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"registry" | "catalog" | "access" | "logs">("registry")

  // ── Filter state ──
  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "DRAFT">("ALL")
  const [filterSearch, setFilterSearch] = useState("")
  const [filterMinCourses, setFilterMinCourses] = useState<number | "">("")

  const filteredPrograms = programs.filter((p) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false
    if (filterSearch.trim() && !p.title.toLowerCase().includes(filterSearch.toLowerCase()) && !p.target.toLowerCase().includes(filterSearch.toLowerCase())) return false
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

  const handleCreateProgram = (p: Program) => {
    setPrograms((prev) => [...prev, p])
    setSelectedId(p.id)
  }

  const handleAddCourse = (c: CourseItem) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? { ...p, courses: [...p.courses, c], coursesCount: p.courses.length + 1 }
          : p
      )
    )
  }

  const handleRemoveCourse = (courseId: number) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? { ...p, courses: p.courses.filter((c) => c.id !== courseId), coursesCount: Math.max(0, p.courses.length - 1) }
          : p
      )
    )
  }

  const toggleStatus = (programId: number) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId
          ? { ...p, status: p.status === "ACTIVE" ? "DRAFT" : "ACTIVE" }
          : p
      )
    )
  }

  const totalEnrollment = 1208
  const completionRate = 84.2

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
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
            <button
              onClick={() => navigate("/dashboard/programs/create")}
              className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create New Program
            </button>
          </div>
        </section>

        {/* ── Sub Nav Tabs ── */}
        <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 w-fit">
          {([
            { key: "registry", label: "Program Registry", icon: "folder_special" },
            { key: "catalog", label: "Course Catalog", icon: "library_books" },
            { key: "access", label: "User Access", icon: "manage_accounts" },
            { key: "logs", label: "System Logs", icon: "receipt_long" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-secondary shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={activeTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Course Catalog ── */}
        {activeTab === "catalog" && <CourseCatalogTab programs={programs} onAddToProgram={(course, programId) => {
          setPrograms((prev) => prev.map((p) => p.id === programId ? { ...p, courses: [...p.courses, { id: Date.now(), title: course.title, duration: course.duration, type: course.type }], coursesCount: p.courses.length + 1 } : p))
        }} />}

        {/* ── Tab: User Access ── */}
        {activeTab === "access" && <UserAccessTab />}

        {/* ── Tab: System Logs ── */}
        {activeTab === "logs" && <SystemLogsTab />}

        {/* ── Main Grid (Registry tab) ── */}
        {activeTab === "registry" && <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Programs Table */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold font-headline text-slate-900">Active Programs</h3>
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
                      {/* Search */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Search</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">search</span>
                          <input
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            placeholder="Title or target audience..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Status</label>
                        <div className="flex gap-2">
                          {(["ALL", "ACTIVE", "DRAFT"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setFilterStatus(s)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                filterStatus === s
                                  ? s === "ACTIVE"
                                    ? "bg-secondary border-secondary text-white"
                                    : s === "DRAFT"
                                    ? "bg-slate-500 border-slate-500 text-white"
                                    : "bg-secondary border-secondary text-white"
                                  : "border-slate-200 text-slate-400 hover:border-secondary/40 hover:text-secondary"
                              }`}
                            >
                              {s === "ALL" ? "All" : s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Min Courses */}
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
                <span className="col-span-5">Program Title</span>
                <span className="col-span-2 text-center">Courses</span>
                <span className="col-span-2 text-center">Duration</span>
                <span className="col-span-2 text-center">Status</span>
                <span className="col-span-1"></span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-50">
                {filteredPrograms.length === 0 && (
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
                    <div className="col-span-5 pr-3">
                      <p className={`text-sm font-bold leading-snug ${selectedId === program.id ? "text-secondary" : "text-slate-800"}`}>
                        {program.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Target: {program.target}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-extrabold text-slate-900">{program.courses.length}</p>
                      <p className="text-[10px] text-slate-400">Courses</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-semibold text-slate-700">{program.duration}</p>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(program.id) }}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest transition-colors ${
                          program.status === "ACTIVE"
                            ? "bg-secondary/15 text-secondary hover:bg-secondary/25"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {program.status}
                      </button>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPrograms((prev) => prev.filter((p) => p.id !== program.id)) }}
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_12px_32px_rgba(31,62,114,0.06)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-secondary text-[20px]">trending_up</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Rate</p>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-extrabold font-headline text-slate-900">{completionRate}%</p>
                  <span className="text-sm font-bold text-secondary mb-1">+2.4%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_12px_32px_rgba(31,62,114,0.06)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">groups</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Enrollment</p>
                </div>
                <p className="text-3xl font-extrabold font-headline text-slate-900">{totalEnrollment.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-1">Current quarter</p>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="bg-secondary rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <p className="text-white font-extrabold font-headline text-lg">Ready to expand?</p>
                  <p className="text-secondary-container text-xs mt-0.5">Browse 42 additional courses available in the general management pool.</p>
                </div>
              </div>
              <button className="shrink-0 flex items-center gap-2 bg-white text-secondary font-bold text-sm px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors relative z-10 whitespace-nowrap">
                Open Course Catalog
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
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
                      <h3 className="text-xl font-extrabold font-headline text-slate-900 leading-tight">{selected.title}</h3>
                      <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Target: {selected.target}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 py-4 flex gap-3 border-b border-slate-50">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">settings</span>
                      Program Settings
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
                      {selected.courses.map((course, idx) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-secondary/20 hover:bg-secondary/5 transition-all group"
                        >
                          {/* Order badge */}
                          <span className="w-7 h-7 rounded-lg bg-surface-container-low text-slate-500 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{course.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="material-symbols-outlined text-slate-300 text-[14px]">schedule</span>
                              <span className="text-[11px] text-slate-400">{course.duration}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                course.type === "LIVE SESSION"
                                  ? "bg-tertiary/10 text-tertiary"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {course.type}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button className="p-1 text-slate-300 hover:text-slate-500 rounded cursor-grab">
                              <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                            </button>
                            <button
                              onClick={() => handleRemoveCourse(course.id)}
                              className="p-1 text-slate-300 hover:text-error rounded transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add placeholder */}
                      <button
                        onClick={() => setShowAddCourseModal(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-secondary/40 hover:text-secondary text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Course to Sequence
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {["bg-secondary", "bg-tertiary", "bg-primary"].map((color, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}>
                            {["AT", "SJ", "MC"][i]}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{Math.max(0, selected.courses.length - 3)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Program Value</p>
                        <p className="text-xl font-extrabold font-headline text-slate-900">${selected.value.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>}

      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreateModal && <CreateProgramModal key="create" onClose={() => setShowCreateModal(false)} onCreate={handleCreateProgram} />}
        {showAddCourseModal && <AddCourseModal key="add-course" onClose={() => setShowAddCourseModal(false)} onAdd={handleAddCourse} />}
      </AnimatePresence>
    </>
  )
}
