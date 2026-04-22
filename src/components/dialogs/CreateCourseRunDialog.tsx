import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Save, Loader2, Workflow } from "lucide-react"

import { courseApi, courseRunApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"

type RunDraft = {
  code: string
  status: "DRAFT" | "PUBLISHED"
  startsAt: string
  endsAt: string
}

function createDefaultRun(): RunDraft {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => `${n}`.padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return {
    code: "RUN-1",
    status: "DRAFT",
    startsAt: toLocalInput(now),
    endsAt: toLocalInput(oneHourLater),
  }
}

export default function CreateCourseRunDialog() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const [courseTitle, setCourseTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [run, setRun] = useState<RunDraft>(() => createDefaultRun())

  useEffect(() => {
    if (!courseId) return
    void courseApi
      .getById(courseId)
      .then((course) => setCourseTitle(course.title))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to load course.")
      })
  }, [courseId])

  const saveRun = async () => {
    if (!courseId) return
    if (!run.code.trim() || !run.startsAt || !run.endsAt) {
      toast.error("Please complete all required fields.")
      return
    }

    setIsSaving(true)
    try {
      const created = await courseRunApi.create({
        courseId,
        code: run.code.trim(),
        status: run.status,
        startsAt: new Date(run.startsAt).toISOString(),
        endsAt: new Date(run.endsAt).toISOString(),
        timezone: "UTC",
        metadata: {},
      })
      toast.success("Course run created.")
      navigate(`/dashboard/runs/${created.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create course run.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate(-1)
      }}
    >
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create course run</DialogTitle>
          <DialogDescription>
            Schedule a run for {courseTitle || "this course"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Workflow className="size-5 text-muted-foreground" />
            Run details
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="run-code">Code</Label>
              <Input
                id="run-code"
                value={run.code}
                onChange={(e) => setRun((prev) => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="run-status">Status</Label>
              <Select
                id="run-status"
                value={run.status}
                onChange={(e) =>
                  setRun((prev) => ({ ...prev, status: e.target.value as RunDraft["status"] }))
                }
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="run-starts">Starts at</Label>
              <Input
                id="run-starts"
                type="datetime-local"
                value={run.startsAt}
                onChange={(e) => setRun((prev) => ({ ...prev, startsAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="run-ends">Ends at</Label>
              <Input
                id="run-ends"
                type="datetime-local"
                value={run.endsAt}
                onChange={(e) => setRun((prev) => ({ ...prev, endsAt: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void saveRun()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Create run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

