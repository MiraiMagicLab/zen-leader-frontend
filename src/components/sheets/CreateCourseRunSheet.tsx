import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Plus, Save, Loader2, Workflow, Trash2 } from "lucide-react"

import { courseApi, courseRunApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select } from "@/components/ui/select"

type RunDraft = {
  id: number
  code: string
  status: "DRAFT" | "PUBLISHED"
  startsAt: string
  endsAt: string
  timezone: string
}

function createDefaultRun(index: number, id: number): RunDraft {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => `${n}`.padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return {
    id,
    code: `RUN-${index}`,
    status: "DRAFT",
    startsAt: toLocalInput(now),
    endsAt: toLocalInput(oneHourLater),
    timezone: "UTC",
  }
}

export default function CreateCourseRunSheet() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const nextRunId = useRef(2)
  const [open, setOpen] = useState(true)

  const [courseTitle, setCourseTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [runs, setRuns] = useState<RunDraft[]>(() => [createDefaultRun(1, 1)])

  useEffect(() => {
    if (!courseId) return
    void courseApi
      .getById(courseId)
      .then((course) => {
        setCourseTitle(course.title)
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to load course.")
      })
  }, [courseId])

  const addRun = () => {
    const nextIndex = runs.length + 1
    setRuns((prev) => [...prev, createDefaultRun(nextIndex, nextRunId.current++)])
  }

  const removeRun = (id: number) => {
    setRuns((prev) => prev.filter((run) => run.id !== id))
  }

  const updateRun = (id: number, patch: Partial<RunDraft>) => {
    setRuns((prev) => prev.map((run) => (run.id === id ? { ...run, ...patch } : run)))
  }

  const saveRuns = async () => {
    if (!courseId) return
    if (runs.length === 0) {
      toast.error("Please add at least one course run.")
      return
    }

    const hasInvalid = runs.some((run) => !run.code.trim() || !run.startsAt || !run.endsAt || !run.timezone.trim())
    if (hasInvalid) {
      toast.error("Please complete all required fields in course runs.")
      return
    }

    setIsSaving(true)
    try {
      const createdRuns: { id: string; code: string }[] = []
      for (const run of runs) {
        const created = await courseRunApi.create({
          courseId,
          code: run.code.trim(),
          status: run.status,
          startsAt: new Date(run.startsAt).toISOString(),
          endsAt: new Date(run.endsAt).toISOString(),
          timezone: run.timezone.trim(),
          metadata: {},
        })
        createdRuns.push({ id: created.id, code: created.code })
      }

      toast.success(`${runs.length} cohorts successfully initialized.`)
      if (createdRuns.length > 0) {
        navigate(`/dashboard/runs/${createdRuns[0].id}`)
      } else {
        navigate(`/dashboard/courses/${courseId}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create course runs.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate(-1)
      }}
    >
      <SheetContent className="!w-full sm:!max-w-[800px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Create course runs</SheetTitle>
          <SheetDescription>Schedule cohorts for {courseTitle || "this course"}.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-muted/30 border-b p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Workflow className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Cohort queue</CardTitle>
                      <CardDescription>Configure multiple operational schedules in a single session.</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" onClick={addRun}>
                    <Plus className="mr-2 size-4" />
                    Add cohort
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {runs.map((run, index) => (
                  <div key={run.id} className="rounded-lg border bg-card p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <h4 className="text-sm font-semibold">Cohort</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRun(run.id)}
                        disabled={runs.length === 1}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`run-code-${run.id}`}>Code</Label>
                        <Input id={`run-code-${run.id}`} value={run.code} onChange={(e) => updateRun(run.id, { code: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`run-status-${run.id}`}>Status</Label>
                        <Select
                          id={`run-status-${run.id}`}
                          value={run.status}
                          onChange={(e) => updateRun(run.id, { status: e.target.value as RunDraft["status"] })}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`run-starts-${run.id}`}>Starts at</Label>
                        <Input id={`run-starts-${run.id}`} type="datetime-local" value={run.startsAt} onChange={(e) => updateRun(run.id, { startsAt: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`run-ends-${run.id}`}>Ends at</Label>
                        <Input id={`run-ends-${run.id}`} type="datetime-local" value={run.endsAt} onChange={(e) => updateRun(run.id, { endsAt: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`run-timezone-${run.id}`}>Timezone</Label>
                        <Input id={`run-timezone-${run.id}`} value={run.timezone} onChange={(e) => updateRun(run.id, { timezone: e.target.value })} placeholder="UTC" />
                      </div>
                    </div>
                  </div>
                ))}

                {runs.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-sm font-semibold text-muted-foreground">Queue is empty. Add a cohort to begin.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void saveRuns()} disabled={isSaving || runs.length === 0}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Create runs
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

