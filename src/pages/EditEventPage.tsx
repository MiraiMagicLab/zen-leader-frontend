import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import {
  ChevronDown,
  FileText,
  Info,
  MapPin,
  Save,
  Upload,
  User,
  Users,
  Video,
  Loader2,
  CalendarDays
} from "lucide-react"
import { eventApi, assetApi } from "../lib/api"
import MarkdownEditor from "../components/MarkdownEditor"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/common/PageLoading"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

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

  useEffect(() => {
    if (!id) return
    const loadEvent = async () => {
      try {
        const ev = await eventApi.getById(id)
        setEventName(ev.title)
        setSummary(ev.description || "")

        const startDt = new Date(ev.startTime)
        const endDt = new Date(ev.endTime)

        const pDate = startDt.toLocaleDateString('en-CA')
        setEventDate(pDate)

        const pStart = startDt.toTimeString().slice(0, 5)
        const pEnd = endDt.toTimeString().slice(0, 5)
        setStartTime(pStart)
        setEndTime(pEnd)

        setBannerPreview(ev.thumbnailUrl)

        if (ev.content) {
          setDescription(ev.content)
        }

        if (ev.metadata?.category) {
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
      toast.error("Please resolve validation issues.")
      return
    }
    setFormErrors({})

    if (!id) return;
    setIsSubmitting(true)
    try {
      let finalThumbnailUrl = bannerPreview || undefined

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
      toast.success("Event configurations synchronized.")
      navigate("/dashboard/events")
    } catch (err) {
      console.error(err)
      toast.error("Synchronization failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <PageLoading />
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
          <SheetTitle>Edit event</SheetTitle>
          <SheetDescription>Update event details and synchronize changes.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Info className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Event Context</h3>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Title</Label>
                <input
                  value={eventName}
                  aria-invalid={Boolean(formErrors.eventName)}
                  onChange={(e) => {
                    setEventName(e.target.value)
                    if (formErrors.eventName) setFormErrors((prev) => ({ ...prev, eventName: undefined }))
                  }}
                  className="w-full border-b border-border bg-transparent px-1 py-3 text-lg font-bold text-foreground focus:border-primary focus:outline-none transition-colors"
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
                        className="w-full appearance-none rounded-xl border border-input bg-muted/20 px-3 py-2.5 pr-8 text-sm font-semibold text-foreground cursor-pointer focus:ring-2 focus:ring-primary/20"
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
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full h-11 rounded-xl border border-input bg-muted/20 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                    />
                 </div>
               </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Curriculum & Media</h3>
            </div>
            <div className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Expert/Speaker</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                        type="text"
                        value={speaker}
                        onChange={(e) => setSpeaker(e.target.value)}
                        className="w-full h-11 bg-muted/20 border border-input rounded-xl py-2 pl-9 pr-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Banner Resource</Label>
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
                                <span className="text-xs font-bold text-muted-foreground">Select New Banner</span>
                            </div>
                        )}
                    </Button>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Global Narrative</Label>
                  <div className="rounded-xl overflow-hidden border border-input">
                    <MarkdownEditor value={description} onChange={setDescription} />
                  </div>
               </div>
            </div>
          </div>
        </div>

              <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
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
                        className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm font-semibold"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Start</Label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm font-semibold"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">End</Label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm font-semibold"
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary">
                    <MapPin className="size-5" />
                    <h3 className="text-base font-bold text-foreground">Location</h3>
                </div>
                <div className="flex rounded-lg bg-muted p-1">
                    {(["Physical", "Online"] as const).map((t) => (
                    <Button
                        key={t}
                        type="button"
                        variant="ghost"
                        onClick={() => setLocationType(t)}
                        className={cn(
                            "h-7 px-3 text-[10px] uppercase font-bold",
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
                    <input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="Secure venue details..."
                        className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-xs font-bold"
                    />
                 </div>
             ) : (
                <div className="rounded-xl bg-primary/5 p-4 border border-primary/20 flex gap-3 items-center">
                    <Video className="size-5 text-primary" />
                    <p className="text-[10px] font-bold text-primary uppercase">Virtual Session Active</p>
                </div>
             )}
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <Users className="size-5" />
              <h3 className="text-base font-bold text-foreground">Registration</h3>
            </div>
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Capacity</Label>
                  <Badge className="font-bold">{capacity} Seats</Badge>
               </div>
               <input
                  type="range"
                  min={10} max={1000} step={10}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full accent-primary"
                />
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
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
