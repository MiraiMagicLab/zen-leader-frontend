import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { courseApi, courseRunApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function CreateCourseRunPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const nextRunId = useRef(1)

  const [courseTitle, setCourseTitle] = useState("")
  const [programId, setProgramId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [runs, setRuns] = useState<RunDraft[]>([createDefaultRun(1, nextRunId.current++)])

  useEffect(() => {
    if (!courseId) return
    void courseApi
      .getById(courseId)
      .then((course) => {
        setCourseTitle(course.title)
        setProgramId(course.programId)
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
      for (const run of runs) {
        await courseRunApi.create({
          courseId,
          code: run.code.trim(),
          status: run.status,
          startsAt: new Date(run.startsAt).toISOString(),
          endsAt: new Date(run.endsAt).toISOString(),
          timezone: run.timezone.trim(),
          metadata: {},
        })
      }

      toast.success("Course runs created successfully.")
      navigate(`/dashboard/courses/${courseId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create course runs.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link to={programId ? `/dashboard/programs/${programId}/courses` : "/dashboard/programs"} className="underline">
            Courses
          </Link>{" "}
          / Create runs
        </p>
        <h1 className="text-2xl font-semibold">Create runs</h1>
        <p className="text-sm text-muted-foreground">
          Create course runs for: {courseTitle || "Selected course"}.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course run list</CardTitle>
            <CardDescription>Create one or more runs for this course.</CardDescription>
          </div>
          <Button variant="outline" onClick={addRun}>
            Add run
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {runs.map((run, index) => (
            <div key={run.id} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Run {index + 1}</p>
                <Button variant="destructive" onClick={() => removeRun(run.id)} disabled={runs.length === 1}>
                  Delete
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Run code *</Label>
                  <Input value={run.code} onChange={(e) => updateRun(run.id, { code: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={run.status} onChange={(e) => updateRun(run.id, { status: e.target.value as RunDraft["status"] })}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Starts at *</Label>
                  <Input type="datetime-local" value={run.startsAt} onChange={(e) => updateRun(run.id, { startsAt: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Ends at *</Label>
                  <Input type="datetime-local" value={run.endsAt} onChange={(e) => updateRun(run.id, { endsAt: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Timezone *</Label>
                  <Input value={run.timezone} onChange={(e) => updateRun(run.id, { timezone: e.target.value })} placeholder="UTC" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={() => void saveRuns()} disabled={isSaving}>
          {isSaving ? "Creating..." : "Create runs"}
        </Button>
      </div>
    </div>
  )
}
