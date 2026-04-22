import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"

import { courseApi, courseRunApi, type CourseRunResponse } from "@/lib/api"
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
import { PageLoading } from "@/components/common/PageLoading"

type RunDraft = {
  code: string
  status: "DRAFT" | "PUBLISHED"
  startsAt: string
  endsAt: string
}

function toLocalDateTimeInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => `${n}`.padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditCourseRunDialog() {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [run, setRun] = useState<CourseRunResponse | null>(null)
  const [courseTitle, setCourseTitle] = useState("")
  const [form, setForm] = useState<RunDraft>({
    code: "",
    status: "DRAFT",
    startsAt: "",
    endsAt: "",
  })

  useEffect(() => {
    if (!runId) return
    const load = async () => {
      try {
        setLoading(true)
        const runData = await courseRunApi.getById(runId)
        setRun(runData)
        setForm({
          code: runData.code,
          status: (String(runData.status).toUpperCase() as RunDraft["status"]) || "DRAFT",
          startsAt: toLocalDateTimeInput(runData.startsAt),
          endsAt: toLocalDateTimeInput(runData.endsAt),
        })

        const course = await courseApi.getById(runData.courseId)
        setCourseTitle(course.title)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load course run.")
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [navigate, runId])

  const subtitle = useMemo(() => {
    if (!courseTitle) return "Update code, status, and schedule."
    return `Edit schedule for ${courseTitle}.`
  }, [courseTitle])

  const save = async () => {
    if (!runId || !run) return
    if (!form.code.trim() || !form.startsAt || !form.endsAt) {
      toast.error("Please complete all required fields.")
      return
    }

    setIsSaving(true)
    try {
      await courseRunApi.update(runId, {
        courseId: run.courseId,
        code: form.code.trim(),
        status: form.status,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        timezone: "UTC",
        metadata: run.metadata ?? {},
      })
      toast.success("Course run updated.")
      navigate(`/dashboard/runs/${runId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course run.")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <PageLoading />

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate(`/dashboard/runs/${runId}`)
      }}
    >
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit course run</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Pencil className="size-5 text-muted-foreground" />
            Run details
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="run-code">Code</Label>
              <Input
                id="run-code"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-status">Status</Label>
              <Select
                id="run-status"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as RunDraft["status"] }))
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
                value={form.startsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-ends">Ends at</Label>
              <Input
                id="run-ends"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

