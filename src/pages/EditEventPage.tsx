import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { eventApi } from "../lib/api"
import MarkdownEditor from "../components/MarkdownEditor"

const TIMEZONES = [
  "GMT-5 (Eastern Time)",
  "GMT-6 (Central Time)",
  "GMT-7 (Mountain Time)",
  "GMT-8 (Pacific Time)",
  "GMT+0 (UTC)",
  "GMT+7 (Indochina Time)",
]

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Event Essentials
  const [eventName, setEventName] = useState("")
  const [category, setCategory] = useState("Workshop")
  const [summary, setSummary] = useState("")

  // Speaker & Content
  const [speaker, setSpeaker] = useState("")
  const [description, setDescription] = useState("")
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // Date & Time
  const [eventDate, setEventDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [timezone, setTimezone] = useState("GMT-5 (Eastern Time)")

  // Location
  const [locationType, setLocationType] = useState<"Physical" | "Online">("Physical")
  const [venue, setVenue] = useState("")

  // Registration
  const [capacity, setCapacity] = useState(50)

  useEffect(() => {
    if (!id) return
    const loadEvent = async () => {
      try {
        const ev = await eventApi.getById(id)
        setEventName(ev.title)
        setSummary(ev.description || "")
        
        // Ensure dates are parsed correctly
        const startDt = new Date(ev.startTime)
        const endDt = new Date(ev.endTime)

        // yyyy-mm-dd
        const pDate = startDt.toLocaleDateString('en-CA') // ensures standard format without tz-shifts
        setEventDate(pDate)

        // hh:mm
        const pStart = startDt.toTimeString().slice(0, 5)
        const pEnd = endDt.toTimeString().slice(0, 5)
        setStartTime(pStart)
        setEndTime(pEnd)

        setBannerPreview(ev.thumbnailUrl)
        
        if (ev.content) {
          setDescription(ev.content)
        }

        if (ev.metadata?.category) {
          // It's saved as uppercase inside metadata, we can just Capitalize it or use as is
          const c = String(ev.metadata.category)
          setCategory(c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
        } else if (ev.sessionType) {
          const cap = ev.sessionType.charAt(0).toUpperCase() + ev.sessionType.slice(1).toLowerCase().replace(/_/g, ' ')
          setCategory(cap)
        }

        if (ev.metadata?.speaker) {
          setSpeaker(String(ev.metadata.speaker))
        }

        if (ev.metadata?.capacity) {
          setCapacity(Number(ev.metadata.capacity))
        }

        if (ev.metadata?.locationType) {
          setLocationType(String(ev.metadata.locationType) as "Physical" | "Online")
        } else if (ev.liveLink) {
          setLocationType("Online")
        } else if (ev.roomCode) {
          setLocationType("Physical")
        }

        if (ev.metadata?.venue) {
          setVenue(String(ev.metadata.venue))
        } else if (ev.liveLink) {
          setVenue(ev.liveLink)
        } else if (ev.roomCode) {
          setVenue(ev.roomCode)
        }
      } catch (err) {
        console.error(err)
        alert("Failed to load event details")
        navigate("/dashboard/events")
      } finally {
        setIsLoading(false)
      }
    }
    loadEvent()
  }, [id, navigate])

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setBannerPreview(ev.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }



  const saveEvent = async (status: "open" | "draft") => {
    if (!eventName.trim() || !eventDate || !startTime || !endTime) {
      alert("Please fill in event name, date, start and end times.")
      return
    }

    if (!id) return;
    setIsSubmitting(true)
    try {
      const startDt = new Date(`${eventDate}T${startTime}:00`)
      const endDt = new Date(`${eventDate}T${endTime}:00`)

      const payload = {
        title: eventName.trim(),
        description: summary,
        content: description,
        startTime: startDt.toISOString(),
        endTime: endDt.toISOString(),
        metadata: {
          category: category.toUpperCase(),
          locationType,
          venue: locationType === "Physical" ? venue : "Online",
          capacity,
          speaker
        },
        publishImmediately: status === "open",
        thumbnailUrl: bannerPreview || undefined
      }

      await eventApi.update(id, payload)
      navigate("/dashboard/events")
    } catch (err) {
      console.error(err)
      alert("Failed to update event")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading Configuration...</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <section>
        <button
          onClick={() => navigate("/dashboard/events")}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm font-semibold mb-3 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Events
        </button>
        <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">
          Edit Event
        </h2>
        <p className="text-slate-500 mt-2 font-body">
          Update the settings and details of your event.
        </p>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Event Essentials */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              </div>
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Event Essentials</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Event Name</label>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Q4 Executive Leadership Summit"
                  className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Category</label>
                  <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-transparent py-3 text-sm font-semibold text-slate-700 focus:outline-none pr-8"
                    >
                      <option>Workshop</option>
                      <option>Talk</option>
                      <option>Summit</option>
                      <option>Webinar</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Short Summary</label>
                  <input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="One sentence pitch..."
                    className="w-full border-b-2 border-slate-200 focus:border-secondary bg-transparent px-0 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Speaker & Content */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <h3 className="text-xl font-extrabold font-headline text-slate-900">Speaker & Content</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Speaker */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Speaker / Instructor</label>
                  <div className="relative border-b-2 border-slate-200 focus-within:border-secondary transition-colors">
                    <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 text-[18px]">person</span>
                    <input
                      type="text"
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder="e.g. Dr. Aris Thorne, Sarah Jenkins..."
                      className="w-full bg-transparent py-3 pl-6 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Banner Image</label>
                  <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                  <button
                    onClick={() => bannerRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-secondary/40 rounded-xl py-4 flex flex-col items-center justify-center gap-1 overflow-hidden relative group transition-colors"
                    style={{ minHeight: 80 }}
                  >
                    {bannerPreview ? (
                      <>
                        <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-slate-300 text-2xl">cloud_upload</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload Banner (16:9)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Event Description</label>
                <MarkdownEditor
                  id="event-desc"
                  value={description}
                  onChange={setDescription}
                  placeholder="Craft a narrative that inspires participation...\n\n## Highlights\n- Point one\n- Point two"
                  rows={8}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Date & Time */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              <h3 className="text-base font-extrabold font-headline text-slate-900">Date & Time</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Select Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Time Zone</label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/20 pr-9"
                  >
                    {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <h3 className="text-base font-extrabold font-headline text-slate-900">Location</h3>
              </div>
              <div className="flex bg-surface-container-low rounded-lg p-0.5 text-[11px] font-bold">
                {(["Physical", "Online"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setLocationType(t)}
                    className={`flex-1 px-3 py-1.5 rounded-md transition-all ${locationType === t ? "bg-secondary text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {locationType === "Physical" ? (
              <div className="space-y-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">place</span>
                  <input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Enter venue address..."
                    className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-primary-fixed/10 rounded-xl px-4 py-4">
                <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">videocam</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Online Event</p>
                  <p className="text-xs text-slate-400 mt-0.5">A meeting link will be sent to registered attendees.</p>
                </div>
              </div>
            )}
          </div>

          {/* Registration */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <h3 className="text-base font-extrabold font-headline text-slate-900">Registration</h3>
            </div>
            <div className="space-y-4">
              {/* Capacity stepper */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Max Capacity</label>
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setCapacity(Math.max(1, capacity - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold transition-colors text-lg leading-none"
                  >−</button>
                  <div className="flex-1 flex items-center justify-center">
                    <input
                      type="number"
                      min={0}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                      className="w-16 text-right text-base font-bold text-slate-800 bg-transparent outline-none focus:bg-white rounded transition-colors -moz-appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-normal text-slate-400 ml-1">seats</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCapacity(capacity + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold transition-colors text-lg leading-none"
                  >+</button>
                </div>
                <input
                  type="range"
                  min={10} max={1000} step={10}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full mt-2 accent-secondary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 pb-8 border-t border-slate-100">
        <button
          onClick={() => navigate("/dashboard/events")}
          className="text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveEvent("draft")}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={() => saveEvent("open")}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
