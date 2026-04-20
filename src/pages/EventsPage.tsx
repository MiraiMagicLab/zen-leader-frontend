import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { MoreVertical } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { eventApi, type EventResponse, type SpringPage } from "../lib/api"

const typeStyles: Record<string, string> = {
  WORKSHOP: "text-secondary border border-secondary/30 bg-secondary/5",
  TALK: "text-tertiary border border-tertiary/30 bg-tertiary/5",
  SUMMIT: "text-primary border border-primary/30 bg-primary/5",
  WEBINAR: "text-error border border-error/30 bg-error/5",
}

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]

type PendingAction =
  | {
      kind: "delete"
      eventId: string
      title: string
    }
  | {
      kind: "publish" | "unpublish"
      eventId: string
      title: string
    }
  | null


export default function EventsPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [eventsData, setEventsData] = useState<SpringPage<EventResponse> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  useEffect(() => {
    fetchEvents(currentPage)
  }, [currentPage])

  const fetchEvents = async (page: number) => {
    setIsLoading(true)
    try {
      const data = await eventApi.getAll(page, 10)
      setEventsData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventApi.remove(id)
      fetchEvents(currentPage)
    } catch (err) {
      console.error("Failed to delete event", err)
      toast.error("Failed to delete event. Please try again.")
    }
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    setIsActionSubmitting(true)
    try {
      if (pendingAction.kind === "delete") {
        await handleDeleteEvent(pendingAction.eventId)
      } else if (pendingAction.kind === "publish") {
        await eventApi.publish(pendingAction.eventId)
        fetchEvents(currentPage)
      } else if (pendingAction.kind === "unpublish") {
        await eventApi.unpublish(pendingAction.eventId)
        fetchEvents(currentPage)
      }
      setPendingAction(null)
    } catch (err) {
      console.error(err)
      if (pendingAction.kind === "publish") {
        toast.error("Failed to publish event.")
      } else if (pendingAction.kind === "unpublish") {
        toast.error("Failed to unpublish event.")
      }
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const allEvents = eventsData?.content || []
  const filteredEvents = allEvents.filter(ev => {
    // 1. Date Filter
    if (selectedDate) {
      const evDate = new Date(ev.startTime)
      const dateMatches = evDate.getFullYear() === selectedDate.getFullYear() &&
                          evDate.getMonth() === selectedDate.getMonth() &&
                          evDate.getDate() === selectedDate.getDate()
      if (!dateMatches) return false
    }

    // 2. Category Filter
    if (selectedCategory !== "ALL") {
      const cat = String(ev.metadata?.category || "").toUpperCase()
      if (cat !== selectedCategory) return false
    }

    // 3. Status Filter
    if (selectedStatus !== "ALL") {
      if (ev.status !== selectedStatus) return false
    }

    return true
  })

  const eventDateStrings = new Set(allEvents.map(ev => new Date(ev.startTime).toDateString()))
  
  const getCalendarCells = () => {
    const year = currentMonth.getFullYear()
    const m = currentMonth.getMonth()
    const firstDay = new Date(year, m, 1).getDay()
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, m, 0).getDate()
    const cells = []
    
    // Prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, m - 1, daysInPrevMonth - i), isOut: true })
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(year, m, i), isOut: false })
    }
    // Next month (fill up to 42 cells = 6 weeks)
    const remaining = 42 - cells.length
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, m + 1, i), isOut: true })
    }
    return cells
  }

  const calendarCells = getCalendarCells()
  const todayStr = new Date().toDateString()

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900 uppercase">
            Event Management
          </h2>
          <p className="text-slate-500 mt-2 font-body">
            Curate and coordinate upcoming leadership summits and workshops.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/events/create")}
          className="flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create New Event
        </button>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left: Scheduled Events Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
          <div className="px-8 py-5 border-b border-surface-container/30">
            {/* Top row: title + count */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-secondary uppercase tracking-widest font-headline">
                Scheduled Events
              </h4>
              <span className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed text-[11px] font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-on-primary-fixed rounded-full animate-pulse"></span>
                {filteredEvents.length} EVENTS
              </span>
            </div>
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Category:</span>
                {(["ALL", "WORKSHOP", "SUMMIT", "TALK", "WEBINAR"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider transition-all ${
                      selectedCategory === cat
                        ? "bg-secondary text-white shadow-sm"
                        : "bg-surface-container text-slate-500 hover:bg-surface-container-high hover:text-slate-700"
                    }`}
                  >
                    {cat === "ALL" ? "All" : cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status:</span>
                {(["ALL", "PUBLISHED", "DRAFT", "COMPLETED"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider transition-all ${
                      selectedStatus === st
                        ? "bg-slate-800 text-white shadow-sm"
                        : "bg-surface-container text-slate-500 hover:bg-surface-container-high hover:text-slate-700"
                    }`}
                  >
                    {st === "ALL" ? "All" : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-surface-container-low text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                <tr>
                  <th className="px-8 py-4">Event Name</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date / Time</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-6 py-4">Registration</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-8 text-center text-slate-400">Loading events...</td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-8 text-center text-slate-400">No events found</td>
                  </tr>
                ) : filteredEvents.map((ev) => {
                  const registered = ev.engagementStats?.interested || 0;
                  const capacity = (ev.metadata?.capacity as number) || 100;
                  const pct = Math.round((registered / Math.max(capacity, 1)) * 100)
                  const isFull = pct >= 100
                  const isDraft = ev.status === "DRAFT"
                  const isCompleted = ev.status === "COMPLETED"
                  const startDate = new Date(ev.startTime)
                  const dateStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  const timeStr = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  
                  return (
                    <tr key={ev.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border border-slate-200">
                            {ev.thumbnailUrl ? (
                              <img src={ev.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300">event</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-secondary transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                              {ev.title}
                            </p>
                            {ev.isOfficial && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-primary-fixed bg-primary-fixed/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                <span className="material-symbols-outlined text-[10px]">verified</span>
                                ZEN LEADER OFFICIAL
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded ${typeStyles[String(ev.metadata?.category || ev.sessionType || "OTHER").toUpperCase()] ?? "text-slate-500 border border-slate-200 bg-slate-50"}`}
                        >
                          {String(ev.metadata?.category || ev.sessionType || "OTHER").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDraft ? "text-slate-400 border-slate-200 bg-slate-50" :
                          isCompleted ? "text-slate-500 border-slate-300 bg-slate-100" :
                          "text-primary border-primary/30 bg-primary/5"
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-700">{dateStr}</p>
                        <p className="text-[10px] mt-0.5 text-slate-400">
                          {timeStr}
                        </p>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="material-symbols-outlined text-[12px] text-slate-400">
                            {ev.metadata?.locationType === "Online" || ev.liveLink ? "videocam" : "location_on"}
                          </span>
                          {ev.metadata?.locationType === "Physical" ? (String(ev.metadata?.venue || ev.roomCode || "TBA")) : "Online"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isFull ? "bg-error" : isCompleted ? "bg-slate-300" : "bg-primary-fixed"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                            {registered} / {capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger nativeButton className="inline-flex w-full justify-end sm:w-auto">
                            <span className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                              <MoreVertical className="size-4" />
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Event actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isDraft ? (
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => setPendingAction({ kind: "publish", eventId: ev.id, title: ev.title })}
                              >
                                <span className="material-symbols-outlined text-[16px]">publish</span>
                                Publish
                              </DropdownMenuItem>
                            ) : ev.status === "PUBLISHED" ? (
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => setPendingAction({ kind: "unpublish", eventId: ev.id, title: ev.title })}
                              >
                                <span className="material-symbols-outlined text-[16px]">drafts</span>
                                Unpublish
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => navigate(`/dashboard/events/edit/${ev.id}`)}
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="gap-2"
                              onClick={() => setPendingAction({ kind: "delete", eventId: ev.id, title: ev.title })}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-4 border-t border-surface-container/30 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-bold text-slate-600">{filteredEvents.length}</span> of{" "}
              <span className="font-bold text-slate-600">{selectedDate ? filteredEvents.length : (eventsData?.totalElements || 0)}</span> events
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="ml-3 text-secondary hover:text-secondary-fixed hover:underline font-semibold border-l border-slate-300 pl-3">Show all dates</button>
              )}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0 || isLoading}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={(eventsData && currentPage >= eventsData.totalPages - 1) || isLoading}
                className="px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">

          {/* Calendar */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <div className="relative">
                <button 
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="text-sm font-bold text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                </button>
                
                {showMonthPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 flex gap-2 w-64 animate-in fade-in zoom-in duration-200">
                      {/* Months */}
                      <div className="flex-1 max-h-48 overflow-y-auto pr-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Month</div>
                        {Array.from({length: 12}).map((_, i) => {
                          const isCurrent = currentMonth.getMonth() === i
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setCurrentMonth(new Date(currentMonth.getFullYear(), i, 1))
                                setShowMonthPicker(false)
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${isCurrent ? 'bg-secondary text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {new Date(2000, i, 1).toLocaleDateString("en-US", { month: "short" })}
                            </button>
                          )
                        })}
                      </div>
                      <div className="w-px bg-slate-100" />
                      {/* Years */}
                      <div className="flex-1 max-h-48 overflow-y-auto pl-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Year</div>
                        {Array.from({length: 11}).map((_, i) => {
                          const y = new Date().getFullYear() - 5 + i
                          const isCurrent = currentMonth.getFullYear() === y
                          return (
                            <button
                              key={y}
                              onClick={() => {
                                setCurrentMonth(new Date(y, currentMonth.getMonth(), 1))
                                setShowMonthPicker(false)
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${isCurrent ? 'bg-secondary text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {y}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-1 relative z-20">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_left</span>
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center gap-y-1">
              {calendarCells.map((cell, i) => {
                const dateStr = cell.date.toDateString()
                const isToday = dateStr === todayStr
                const isSelected = selectedDate?.toDateString() === dateStr
                const hasEvent = eventDateStrings.has(dateStr)
                
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDate(null)
                      } else {
                        setSelectedDate(cell.date)
                        if (cell.isOut) {
                          setCurrentMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
                        }
                      }
                    }}
                    className={`text-xs py-1.5 rounded-lg font-medium transition-all relative
                      ${cell.isOut ? "text-slate-300" : ""}
                      ${isSelected ? "bg-secondary text-white font-bold shadow-md" : ""}
                      ${isToday && !isSelected ? "bg-slate-800 text-white font-bold" : ""}
                      ${hasEvent && !isSelected && !isToday ? "bg-primary-fixed/20 text-primary-fixed-dim font-bold" : ""}
                      ${!cell.isOut && !isToday && !isSelected && !hasEvent ? "text-slate-600 hover:bg-slate-100" : ""}
                    `}
                  >
                    {cell.date.getDate()}
                    {hasEvent && !isSelected && !isToday && (
                      <span className="block w-1 h-1 bg-primary-fixed-dim rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Create New Event</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Event Name</label>
                <input className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. Executive Flow Summit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Type</label>
                  <select className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30">
                    <option>WORKSHOP</option>
                    <option>TALK</option>
                    <option>SUMMIT</option>
                    <option>WEBINAR</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Capacity</label>
                  <input type="number" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. 100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Date</label>
                  <input type="date" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Time</label>
                  <input type="time" className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Location</label>
                <input className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="Online or City, State" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Create Event
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "delete"
                ? "Delete event?"
                : pendingAction?.kind === "publish"
                ? "Publish event?"
                : "Unpublish event?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "delete"
                ? `This will permanently delete "${pendingAction.title}". This action cannot be undone.`
                : pendingAction?.kind === "publish"
                ? `This will publish "${pendingAction.title}" and make it visible to users.`
                : `This will move "${pendingAction?.title ?? ""}" back to draft and hide it from users.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void executePendingAction()
              }}
              disabled={isActionSubmitting}
              className={pendingAction?.kind === "delete" ? "bg-destructive hover:bg-destructive/90 text-white" : undefined}
            >
              {isActionSubmitting
                ? "Processing..."
                : pendingAction?.kind === "delete"
                ? "Delete"
                : pendingAction?.kind === "publish"
                ? "Publish"
                : "Unpublish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
