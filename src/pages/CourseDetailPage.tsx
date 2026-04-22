import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ChevronRight, Workflow, ExternalLink, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { courseApi, type CourseResponse } from "@/lib/api"
import { PageLoading } from "@/components/common/PageLoading"
import { PageHeader } from "@/components/common/PageHeader"
import { formatUtcDate } from "@/lib/time"

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Not scheduled"
  return `${startsAt ? formatUtcDate(startsAt) : "TBD"} - ${endsAt ? formatUtcDate(endsAt) : "TBD"}`
}

export default function CourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const courseId = id ?? ""
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    courseApi.getById(courseId).then(setCourse).finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <PageLoading />
  if (!course) return <div className="p-10 text-center">Course not found.</div>

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/programs" className="hover:text-primary">Programs</Link>
        <ChevronRight className="size-4" />
        <Link to={`/dashboard/programs/${course.programId}`} className="hover:text-primary">{course.programCode || "Program"}</Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{course.title}</span>
      </div>

      <PageHeader
        title={course.title}
        subtitle={course.description || "Course overview and run management."}
        actions={
          <Button onClick={() => navigate(`/dashboard/courses/${course.id}/runs/create`)}>
            <Workflow className="mr-2 size-4" /> Create Run
          </Button>
        }
      />

      <div className="rounded-md bg-background border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-6 h-12 w-16">STT</TableHead>
              <TableHead className="px-6 h-12">Run</TableHead>
              <TableHead className="px-6 h-12">Status</TableHead>
              <TableHead className="px-6 h-12">Schedule</TableHead>
              <TableHead className="px-6 h-12">Chapters</TableHead>
              <TableHead className="px-6 h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {course.courseRuns.length ? (
              course.courseRuns.map((run, idx) => (
                <TableRow key={run.id} className="hover:bg-muted/40">
                  <TableCell className="px-6 py-4 text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold">{run.code}</div>
                      <div className="text-xs text-muted-foreground">{run.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant={run.status === "PUBLISHED" ? "default" : "secondary"}>{run.status}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDateRange(run.startsAt, run.endsAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="secondary">{run.chapters.length}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/dashboard/runs/${run.id}/edit`)}
                      >
                        <Pencil className="mr-2 size-4" /> Edit
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/dashboard/runs/${run.id}`)}>
                        <ExternalLink className="mr-2 size-4" /> Open
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No runs created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
