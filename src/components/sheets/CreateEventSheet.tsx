import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import {
  ChevronDown,
  Clock3,
  FileText,
  Info,
  MapPin,
  Rocket,
  Upload,
  User,
  Users,
  Video,
  Loader2,
  CalendarDays,
} from "lucide-react"
import { eventApi, assetApi } from "@/lib/api"
import MarkdownEditor from "@/components/MarkdownEditor"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type EventFormErrors = Partial<Record<"eventName" | "eventDate" | "startTime" | "endTime" | "venue", string>>

const createEventSchema = z
  .object({
    eventName: z.string().trim().min(3, "Event name must be at least 3 characters."),
    eventDate: z.string().min(1, "Please select an event date."),
    startTime: z.string().min(1, "Please select a start time."),
    endTime: z.string().min(1, "Please select an end time."),
    locationType: z.enum(["Physical", "Online"]),
    venue: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.locationType === "Physical" && !value.venue.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["venue"],
        message: "Please enter a venue for physical events.",
      })
    }
  })

export default function CreateEventSheet() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)

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

  // Location
  const [locationType, setLocationType] = useState<"Physical" | "Online">("Physical")
  const [venue, setVenue] = useState("")

  // Registration
  const [capacity, setCapacity] = useState(50)
  const [formErrors, setFormErrors] = useState<EventFormErrors>({})

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
    const validation = createEventSchema.safeParse({
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
      toast.error("Please resolve validation issues.")
      return
    }
    setFormErrors({})

    setIsSubmitting(true)
    try {
      let finalThumbnailUrl = undefined
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
          speaker,
        },
        publishImmediately: status === "open",
        thumbnailUrl: finalThumbnailUrl,
      }

      await eventApi.create(payload)
      toast.success(status === "open" ? "Event published successfully." : "Event saved as draft.")
      navigate("/dashboard/events")
    } catch (err) {
      console.error(err)
      toast.error("Failed to launch event.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate("/dashboard/events")
      }}
    >
      <SheetContent className="!w-full sm:!max-w-[900px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Create event</SheetTitle>
          <SheetDescription>Configure and publish a new event.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                {/* Main Info */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Info className="size-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Event Identity</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Designation</Label>
                      <input
                        value={eventName}
                        aria-invalid={Boolean(formErrors.eventName)}
                        placeholder="Mastering Agility: Leadership in 2026"
                        onChange={(e) => {
                          setEventName(e.target.value)
                          if (formErrors.eventName) setFormErrors((prev) => ({ ...prev, eventName: undefined }))
                        }}
                        className="w-full border-b border-border bg-transparent px-1 py-3 text-2xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                      />
                      {formErrors.eventName && <p className="text-xs font-bold text-destructive mt-2 ml-1">{formErrors.eventName}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Category</Label>
                        <div className="relative">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-input bg-muted/20 px-3 py-2.5 pr-8 text-sm font-semibold text-foreground cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          >
                            <option>Workshop</option>
                            <option>Talk</option>
                            <option>Summit</option>
                            <option>Webinar</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Brief Abstract</Label>
                        <input
                          value={summary}
                          placeholder="Concise summary for catalogs..."
                          onChange={(e) => setSummary(e.target.value)}
                          className="w-full h-11 rounded-xl border border-input bg-muted/20 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speaker and Content */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Narrative & Expert</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Prime Expert</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                          <input
                            type="text"
                            value={speaker}
                            placeholder="Who is delivering?"
                            onChange={(e) => setSpeaker(e.target.value)}
                            className="w-full h-11 bg-muted/20 border border-input rounded-xl py-2 pl-9 pr-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Banner Visual</Label>
                        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => bannerRef.current?.click()}
                          className="relative group min-h-[44px] w-full flex-col gap-1 overflow-hidden rounded-xl border border-input bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          {bannerPreview ? (
                            <>
                              <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="size-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Upload className="size-4 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground">Select Resource</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Full Exposition</Label>
                      <div className="rounded-xl overflow-hidden border border-input focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <MarkdownEditor value={description} onChange={setDescription} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Scheduling */}
                <div className="rounded-xl border bg-secondary/30 p-6 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-6 text-primary">
                    <CalendarDays className="size-5" />
                    <h3 className="text-base font-bold text-foreground">Timeline</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Date</Label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Start</Label>
                        <div className="relative">
                          <Clock3 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm pr-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">End</Label>
                        <div className="relative">
                          <Clock3 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm pr-8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin className="size-5" />
                      <h3 className="text-base font-bold text-foreground">Presence</h3>
                    </div>
                    <div className="flex rounded-lg bg-muted p-1">
                      {(["Physical", "Online"] as const).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          variant="ghost"
                          onClick={() => setLocationType(t)}
                          className={cn(
                            "h-7 px-3 text-[10px] uppercase font-bold transition-all",
                            locationType === t ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
                          )}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {locationType === "Physical" ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder="Exact geo location..."
                          className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 pl-9 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-primary/5 p-4 border border-primary/20 flex gap-3 items-center">
                      <Video className="size-5 text-primary" />
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tight">Virtual Stream Link to be generated</p>
                    </div>
                  )}
                </div>

                {/* Registration */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-primary">
                    <Users className="size-5" />
                    <h3 className="text-base font-bold text-foreground">Attendance</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Max Capacity</Label>
                      <Badge variant="secondary" className="px-3 py-0.5 font-bold">
                        {capacity} Seats
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCapacity(Math.max(10, capacity - 10))}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        −
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min={10}
                          max={1000}
                          step={10}
                          value={capacity}
                          onChange={(e) => setCapacity(Number(e.target.value))}
                          className="w-full accent-primary cursor-pointer mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCapacity(capacity + 10)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => saveEvent("draft")} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button type="button" onClick={() => saveEvent("open")} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Rocket className="mr-2 size-4" />}
            Publish
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

