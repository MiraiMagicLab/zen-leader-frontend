import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import {
  Save,
  Loader2,
} from "lucide-react"
import { eventApi, assetApi } from "@/lib/api"
import MarkdownEditor from "@/components/MarkdownEditor"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/common/PageLoading"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type EventFormErrors = Partial<Record<"eventName" | "startAt" | "endAt", string>>

const editEventSchema = z.object({
  eventName: z.string().trim().min(3, "Event name must be at least 3 characters."),
  startAt: z.string().min(1, "Please select a start date & time."),
  endAt: z.string().min(1, "Please select an end date & time."),
})

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditEventSheet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)

  // Backend fields
  const [eventName, setEventName] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // Date & Time
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")

  const [formErrors, setFormErrors] = useState<EventFormErrors>({})

  useEffect(() => {
    if (!id) return
    const loadEvent = async () => {
      try {
        const ev = await eventApi.getById(id)
        setEventName(ev.title)
        setSummary(ev.description || "")

        setStartAt(toLocalDateTimeInput(ev.startTime))
        setEndAt(toLocalDateTimeInput(ev.endTime))

        setBannerPreview(ev.thumbnailUrl)

        if (ev.content) {
          setDescription(ev.content)
        }
      } catch (err) {
        console.error(err)
        toast.error("Failed to load event details.")
        navigate("/dashboard/events")
      } finally {
        setIsLoading(false)
      }
    }
    void loadEvent()
  }, [id, navigate])

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const saveEvent = async (status: "open" | "draft") => {
    const validation = editEventSchema.safeParse({
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

    if (!id) return
    setIsSubmitting(true)
    try {
      let finalThumbnailUrl = bannerPreview || undefined

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
      <SheetContent side="right" className="!w-full sm:!max-w-[800px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Edit event</SheetTitle>
          <SheetDescription>Update event details and synchronize changes.</SheetDescription>
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
                />
                {formErrors.eventName ? <p className="text-xs text-destructive">{formErrors.eventName}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-summary">Summary</Label>
                <Input id="event-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
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
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

