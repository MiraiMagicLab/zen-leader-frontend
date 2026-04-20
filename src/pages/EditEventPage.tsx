import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  FileText,
  Info,
  MapPin,
  Save,
  Upload,
  User,
  Users,
  Video,
} from "lucide-react"
import { eventApi, assetApi } from "../lib/api"
import MarkdownEditor from "../components/MarkdownEditor"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/common/PageLoading"

const TIMEZONES = [
  "GMT-5 (Eastern Time)",
  "GMT-6 (Central Time)",
  "GMT-7 (Mountain Time)",
  "GMT-8 (Pacific Time)",
  "GMT+0 (UTC)",
  "GMT+7 (Indochina Time)",
]

type EventFormErrors = Partial<Record<"eventName" | "eventDate" | "startTime" | "endTime" | "venue", string>>

const editEventSchema = z.object({
  eventName: z.string().trim().min(3, "Event name must be at least 3 characters."),
  eventDate: z.string().min(1, "Please select an event date."),
  startTime: z.string().min(1, "Please select a start time."),
  endTime: z.string().min(1, "Please select an end time."),
  locationType: z.enum(["Physical", "Online"]),
  venue: z.string(),
}).superRefine((value, ctx) => {
  if (value.locationType === "Physical" && !value.venue.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["venue"],
      message: "Please enter a venue for physical events.",
    })
  }
})

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
  const [bannerFile, setBannerFile] = useState<File | null>(null)
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
  const [formErrors, setFormErrors] = useState<EventFormErrors>({})

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
        }

        if (ev.metadata?.speaker) {
          setSpeaker(String(ev.metadata.speaker))
        }

        if (ev.metadata?.capacity) {
          setCapacity(Number(ev.metadata.capacity))
        }

        if (ev.metadata?.locationType) {
          setLocationType(String(ev.metadata.locationType) as "Physical" | "Online")
        }

        if (ev.metadata?.venue) {
          setVenue(String(ev.metadata.venue))
        }
      } catch (err) {
        console.error(err)
        toast.error("Failed to load event details.")
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
    setBannerFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setBannerPreview(ev.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }



  const saveEvent = async (status: "open" | "draft") => {
    const validation = editEventSchema.safeParse({
      eventName,
      eventDate,
      startTime,
      endTime,
      locationType,
      venue,
    })
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      setFormErrors({
        eventName: fieldErrors.eventName?.[0],
        eventDate: fieldErrors.eventDate?.[0],
        startTime: fieldErrors.startTime?.[0],
        endTime: fieldErrors.endTime?.[0],
        venue: fieldErrors.venue?.[0],
      })
      toast.error("Please fix form errors before saving.")
      return
    }
    setFormErrors({})

    if (!id) return;
    setIsSubmitting(true)
    try {
      let finalThumbnailUrl = bannerPreview || undefined

      // If we have a new file, upload it first
      if (bannerFile) {
        const uploadRes = await assetApi.upload(bannerFile)
        finalThumbnailUrl = uploadRes.url
      }

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
        thumbnailUrl: finalThumbnailUrl
      }

      await eventApi.update(id, payload)
      navigate("/dashboard/events")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update event.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <PageLoading />
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/dashboard/events")}
          className="mb-3 h-8 gap-1 px-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Edit Event
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the settings and details of your event.
        </p>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Event Essentials */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Info className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Event Essentials</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Name</label>
                <input
                  value={eventName}
                  aria-invalid={Boolean(formErrors.eventName)}
                  onChange={(e) => {
                    setEventName(e.target.value)
                    if (formErrors.eventName) setFormErrors((prev) => ({ ...prev, eventName: undefined }))
                  }}
                  placeholder="e.g. Q4 Executive Leadership Summit"
                  className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                />
                {formErrors.eventName ? <p className="mt-1 text-xs text-error">{formErrors.eventName}</p> : null}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
                  <div className="relative border-b border-border focus-within:border-primary transition-colors">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-transparent py-2 pr-8 text-sm font-medium text-foreground focus:outline-none"
                    >
                      <option>Workshop</option>
                      <option>Talk</option>
                      <option>Summit</option>
                      <option>Webinar</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Short Summary</label>
                  <input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="One sentence pitch..."
                    className="w-full border-b border-border bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Speaker & Content */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Speaker & Content</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Speaker */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Speaker / Instructor</label>
                  <div className="relative border-b border-border focus-within:border-primary transition-colors">
                    <User className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder="e.g. Dr. Aris Thorne, Sarah Jenkins..."
                      className="w-full bg-transparent py-2 pl-6 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Banner Image</label>
                  <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => bannerRef.current?.click()}
                    className="relative group min-h-20 w-full flex-col gap-1 overflow-hidden rounded-xl border border-border bg-muted/20 py-4 hover:bg-muted/30"
                  >
                    {bannerPreview ? (
                      <>
                        <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="size-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="size-6 text-muted-foreground/60" />
                        <span className="text-xs font-medium text-muted-foreground">Upload banner (16:9)</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Description</label>
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Craft a narrative that inspires participation...\n\n## Highlights\n- Point one\n- Point two"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Date & Time */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clock3 className="size-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Date & Time</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Date</label>
                <input
                  type="date"
                  value={eventDate}
                  aria-invalid={Boolean(formErrors.eventDate)}
                  onChange={(e) => {
                    setEventDate(e.target.value)
                    if (formErrors.eventDate) setFormErrors((prev) => ({ ...prev, eventDate: undefined }))
                  }}
                  className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                {formErrors.eventDate ? <p className="mt-1 text-xs text-error">{formErrors.eventDate}</p> : null}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    aria-invalid={Boolean(formErrors.startTime)}
                    onChange={(e) => {
                      setStartTime(e.target.value)
                      if (formErrors.startTime) setFormErrors((prev) => ({ ...prev, startTime: undefined }))
                    }}
                    className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  {formErrors.startTime ? <p className="mt-1 text-xs text-error">{formErrors.startTime}</p> : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    aria-invalid={Boolean(formErrors.endTime)}
                    onChange={(e) => {
                      setEndTime(e.target.value)
                      if (formErrors.endTime) setFormErrors((prev) => ({ ...prev, endTime: undefined }))
                    }}
                    className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  {formErrors.endTime ? <p className="mt-1 text-xs text-error">{formErrors.endTime}</p> : null}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Zone</label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-input bg-muted px-3 py-2 pr-9 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Location</h3>
              </div>
              <div className="flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
                {(["Physical", "Online"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="ghost"
                    onClick={() => setLocationType(t)}
                    className={`h-8 flex-1 px-3 ${locationType === t ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            {locationType === "Physical" ? (
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={venue}
                    aria-invalid={Boolean(formErrors.venue)}
                    onChange={(e) => {
                      setVenue(e.target.value)
                      if (formErrors.venue) setFormErrors((prev) => ({ ...prev, venue: undefined }))
                    }}
                    placeholder="Enter venue address..."
                    className="w-full rounded-xl border border-input bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                {formErrors.venue ? <p className="mt-1 text-xs text-error">{formErrors.venue}</p> : null}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-4">
                <Video className="size-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Online Event</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">A meeting link will be sent to registered attendees.</p>
                </div>
              </div>
            )}
          </div>

          {/* Registration */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Users className="size-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Registration</h3>
            </div>
            <div className="space-y-4">
              {/* Capacity stepper */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max Capacity</label>
                <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCapacity(Math.max(1, capacity - 1))}
                    className="text-lg leading-none"
                  >
                    −
                  </Button>
                  <div className="flex-1 flex items-center justify-center">
                    <input
                      type="number"
                      min={0}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                      className="w-16 rounded bg-transparent text-right text-base font-semibold text-foreground outline-none transition-colors focus:bg-background -moz-appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="ml-1 text-xs font-normal text-muted-foreground">seats</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCapacity(capacity + 1)}
                    className="text-lg leading-none"
                  >
                    +
                  </Button>
                </div>
                <input
                  type="range"
                  min={10} max={1000} step={10}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full mt-2 accent-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t pt-4 pb-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/dashboard/events")}
          className="h-10 px-4 text-sm font-semibold"
        >
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveEvent("draft")}
            disabled={isSubmitting}
            className="h-10 px-5 text-sm font-semibold"
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={() => saveEvent("open")}
            disabled={isSubmitting}
            className="h-10 gap-2 px-5 text-sm font-semibold"
          >
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
