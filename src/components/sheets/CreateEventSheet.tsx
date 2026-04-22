import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Rocket } from "lucide-react"
import { eventApi, assetApi } from "@/lib/api"
import MarkdownEditor from "@/components/MarkdownEditor"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
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
    setBannerPreview(URL.createObjectURL(file))
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
        const uploadRes = await assetApi.uploadLessonAsset(bannerFile)
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
      <SheetContent side="right" className="!w-full sm:!max-w-[800px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Create event</SheetTitle>
          <SheetDescription>Configure and publish a new event.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={eventName}
                  aria-invalid={Boolean(formErrors.eventName)}
                  onChange={(e) => {
                    setEventName(e.target.value)
                    if (formErrors.eventName) setFormErrors((prev) => ({ ...prev, eventName: undefined }))
                  }}
                  placeholder="Mastering Agility: Leadership in 2026"
                />
                {formErrors.eventName ? <p className="text-xs text-destructive">{formErrors.eventName}</p> : null}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-category">Category</Label>
                  <Select id="event-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Workshop</option>
                    <option>Talk</option>
                    <option>Summit</option>
                    <option>Webinar</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-speaker">Speaker</Label>
                  <Input id="event-speaker" value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-summary">Summary</Label>
                <Input id="event-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Optional" />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input id="event-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} aria-invalid={Boolean(formErrors.eventDate)} />
                  {formErrors.eventDate ? <p className="text-xs text-destructive">{formErrors.eventDate}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-start">Start</Label>
                  <Input id="event-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} aria-invalid={Boolean(formErrors.startTime)} />
                  {formErrors.startTime ? <p className="text-xs text-destructive">{formErrors.startTime}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">End</Label>
                  <Input id="event-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-invalid={Boolean(formErrors.endTime)} />
                  {formErrors.endTime ? <p className="text-xs text-destructive">{formErrors.endTime}</p> : null}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-location-type">Location type</Label>
                  <Select
                    id="event-location-type"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as "Physical" | "Online")}
                  >
                    <option value="Physical">Physical</option>
                    <option value="Online">Online</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-venue">Venue</Label>
                  <Input
                    id="event-venue"
                    value={venue}
                    onChange={(e) => {
                      setVenue(e.target.value)
                      if (formErrors.venue) setFormErrors((prev) => ({ ...prev, venue: undefined }))
                    }}
                    disabled={locationType !== "Physical"}
                    placeholder={locationType === "Physical" ? "Enter venue" : "Online event"}
                    aria-invalid={Boolean(formErrors.venue)}
                  />
                  {formErrors.venue ? <p className="text-xs text-destructive">{formErrors.venue}</p> : null}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-capacity">Capacity</Label>
                  <Input
                    id="event-capacity"
                    type="number"
                    min={0}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-banner">Banner (optional)</Label>
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="aspect-video w-full rounded-lg border object-cover" />
                  ) : null}
                  <Input ref={bannerRef} id="event-banner" type="file" accept="image/*" onChange={handleBanner} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-content">Content</Label>
                <div className="rounded-lg border overflow-hidden">
                  <MarkdownEditor value={description} onChange={setDescription} />
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

