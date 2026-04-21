import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BookCopy, CalendarRange, ChevronRight, Layers3, Workflow, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { courseApi, type CourseResponse } from "@/lib/api"
import { PageLoading } from "@/components/common/PageLoading"
import { PageHeader } from "@/components/common/PageHeader"
import { formatNumber } from "@/lib/utils"

function countLessons(course: CourseResponse) {
  return course.courseRuns.reduce((total, run) => total + run.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0), 0)
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Not scheduled"
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${startsAt ? formatter.format(new Date(startsAt)) : "TBD"} - ${endsAt ? formatter.format(new Date(endsAt)) : "TBD"}`
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

  const totalLessons = useMemo(() => (course ? countLessons(course) : 0), [course])

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
        stats={[
          { label: "Code", value: course.code },
          { label: "Runs", value: formatNumber(course.courseRuns.length) },
          { label: "Lessons", value: formatNumber(totalLessons) },
        ]}
        actions={<div className="flex gap-3"><Button variant="outline" onClick={() => navigate(`/dashboard/programs/${course.programId}`)}><ArrowLeft className="mr-2 size-4" /> Back</Button><Button onClick={() => navigate(`/dashboard/courses/${course.id}/runs/create`)}><Workflow className="mr-2 size-4" /> Create Run</Button></div>}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Course Runs", value: course.courseRuns.length, icon: CalendarRange },
          { label: "Total Lessons", value: totalLessons, icon: Layers3 },
          { label: "Tags", value: course.tags.length || "-", icon: BookCopy },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><stat.icon className="size-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-base">Course Runs</CardTitle>
          <CardDescription>Manage each run from this course.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow><TableHead>Run</TableHead><TableHead>Status</TableHead><TableHead>Schedule</TableHead><TableHead>Chapters</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {course.courseRuns.length ? course.courseRuns.map((run) => (
                <TableRow key={run.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div>
                      <div className="font-semibold">{run.code}</div>
                      <div className="text-xs text-muted-foreground">{run.id}</div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={run.status === "PUBLISHED" ? "default" : "outline"}>{run.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateRange(run.startsAt, run.endsAt)}</TableCell>
                  <TableCell><Badge variant="secondary">{run.chapters.length}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" onClick={() => navigate(`/dashboard/runs/${run.id}`)}>
                      <ExternalLink className="mr-2 size-4" /> Open
                    </Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No runs created yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30"><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Category</p><p className="mt-1 font-medium">{course.category || "—"}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Level</p><p className="mt-1 font-medium">{course.level || "—"}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Order index</p><p className="mt-1 font-medium">{course.orderIndex}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Program</p><p className="mt-1 font-medium">{course.programCode || course.programId}</p></div>
        </CardContent>
      </Card>
    </div>
  )
}
