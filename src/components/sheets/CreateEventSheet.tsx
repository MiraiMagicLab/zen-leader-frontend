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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type EventFormErrors = Partial<Record<"eventName" | "startAt" | "endAt", string>>

const createEventSchema = z.object({
  eventName: z.string().trim().min(3, "Event name must be at least 3 characters."),
  startAt: z.string().min(1, "Please select a start date & time."),
  endAt: z.string().min(1, "Please select an end date & time."),
})

export default function CreateEventSheet() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)

  // Backend fields
  const [eventName, setEventName] = useState("")
  const [summary, setSummary] = useState("") // backend: description
  const [description, setDescription] = useState("")
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")

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
      startAt,
      endAt,
    })
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      setFormErrors({
        eventName: fieldErrors.eventName?.[0],
        startAt: fieldErrors.startAt?.[0],
        endAt: fieldErrors.endAt?.[0],
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

      const startDt = new Date(startAt)
      const endDt = new Date(endAt)

      const payload = {
        title: eventName.trim(),
        description: summary,
        content: description,
        startTime: startDt.toISOString(),
        endTime: endDt.toISOString(),
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

              <div className="space-y-2">
                <Label htmlFor="event-summary">Summary</Label>
                <Input id="event-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Optional" />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="event-start">Start</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    aria-invalid={Boolean(formErrors.startAt)}
                  />
                  {formErrors.startAt ? <p className="text-xs text-destructive">{formErrors.startAt}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">End</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    aria-invalid={Boolean(formErrors.endAt)}
                  />
                  {formErrors.endAt ? <p className="text-xs text-destructive">{formErrors.endAt}</p> : null}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="event-banner">Thumbnail (optional)</Label>
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

