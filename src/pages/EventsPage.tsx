import { motion } from "framer-motion"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const events = [
  {
    id: "EV-2024-001",
    name: "Foundational Flow Summit",
    type: "WORKSHOP",
    date: "Oct 12, 2024",
    time: "09:00 AM EST",
    location: "Online",
    locationIcon: "videocam",
    registered: 128,
    capacity: 150,
    status: "open",
  },
  {
    id: "EV-2024-004",
    name: "Radical Candor Dialogue",
    type: "TALK",
    date: "Oct 15, 2024",
    time: "02:00 PM EST",
    location: "New York, NY",
    locationIcon: "location_on",
    registered: 22,
    capacity: 50,
    status: "open",
  },
  {
    id: "EV-2023-098",
    name: "Q3 Leadership Retrospective",
    type: "WORKSHOP",
    date: "Sep 28, 2024",
    time: "Closed",
    location: "Online",
    locationIcon: "videocam",
    registered: 48,
    capacity: 50,
    status: "closed",
  },
  {
    id: "EV-2024-007",
    name: "Executive Resilience Bootcamp",
    type: "SUMMIT",
    date: "Nov 3, 2024",
    time: "10:00 AM EST",
    location: "Chicago, IL",
    locationIcon: "location_on",
    registered: 64,
    capacity: 100,
    status: "open",
  },
]

const typeStyles: Record<string, string> = {
  WORKSHOP: "text-secondary border border-secondary/30 bg-secondary/5",
  TALK: "text-tertiary border border-tertiary/30 bg-tertiary/5",
  SUMMIT: "text-primary border border-primary/30 bg-primary/5",
  WEBINAR: "text-error border border-error/30 bg-error/5",
}

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
const CALENDAR_CELLS = [
  [29, 30, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
]
const HIGHLIGHTED = [12, 15]
const TODAY = 15

export default function EventsPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const localEvents = JSON.parse(localStorage.getItem("localEvents") ?? "[]")
  const allEvents = [...events, ...localEvents]

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
          className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create New Event
        </button>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left: Scheduled Events Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
          <div className="px-8 py-5 border-b border-surface-container/30 flex items-center justify-between">
            <h4 className="text-base font-bold text-secondary uppercase tracking-widest font-headline">
              Scheduled Events
            </h4>
            <span className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed text-[11px] font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-on-primary-fixed rounded-full animate-pulse"></span>
              4 ACTIVE SUMMITS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Event Name</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Date / Time</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-6 py-4">Registration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/20">
                {allEvents.map((ev) => {
                  const pct = Math.round((ev.registered / ev.capacity) * 100)
                  const isFull = pct >= 100
                  const isClosed = ev.status === "closed"
                  return (
                    <tr key={ev.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-secondary transition-colors">
                          {ev.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ID: {ev.id}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded ${typeStyles[ev.type] ?? "text-slate-500 border border-slate-200 bg-slate-50"}`}
                        >
                          {ev.type}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-sm font-semibold text-slate-700">{ev.date}</p>
                        <p className={`text-[11px] mt-0.5 ${isClosed ? "text-error font-bold" : "text-slate-400"}`}>
                          {ev.time}
                        </p>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {ev.locationIcon}
                          </span>
                          {ev.location}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isFull ? "bg-error" : isClosed ? "bg-slate-300" : "bg-primary-fixed"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {ev.registered} / {ev.capacity}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-4 border-t border-surface-container/30 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-bold text-slate-600">{events.length}</span> of{" "}
              <span className="font-bold text-slate-600">12</span> events
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity">
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
              <h5 className="text-sm font-bold text-secondary uppercase tracking-widest">October 2024</h5>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_left</span>
                </button>
                <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
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
              {CALENDAR_CELLS.flat().map((day, i) => {
                const isOut = i < 2
                const isToday = day === TODAY && !isOut
                const isHighlighted = HIGHLIGHTED.includes(day) && !isOut
                return (
                  <button
                    key={i}
                    className={`text-xs py-1.5 rounded-lg font-medium transition-all
                      ${isOut ? "text-slate-300" : ""}
                      ${isToday ? "bg-secondary text-white font-bold" : ""}
                      ${isHighlighted && !isToday ? "bg-primary-fixed/20 text-primary-fixed-dim font-bold" : ""}
                      ${!isOut && !isToday && !isHighlighted ? "text-slate-600 hover:bg-slate-100" : ""}
                    `}
                  >
                    {day}
                    {isHighlighted && !isToday && (
                      <span className="block w-1 h-1 bg-primary-fixed-dim rounded-full mx-auto mt-0.5" />
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
    </motion.div>
  )
}
