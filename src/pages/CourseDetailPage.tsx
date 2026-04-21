import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BookCopy,
  CalendarRange,
  ChevronRight,
  Layers3,
  PencilLine,
  Workflow,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { courseApi, type CourseResponse } from "@/lib/api"
import { PageLoading } from "@/components/common/PageLoading"

function countLessons(course: CourseResponse) {
  return course.courseRuns.reduce(
    (total, run) => total + run.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0),
    0,
  )
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "-"

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const startText = startsAt ? formatter.format(new Date(startsAt)) : "TBD"
  const endText = endsAt ? formatter.format(new Date(endsAt)) : "TBD"
  return `${startText} - ${endText}`
}

function getRunBadgeVariant(status: string) {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
    case "OPEN":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export default function CourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const courseId = id ?? ""

  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return

    courseApi.getById(courseId)
      .then((data) => {
        setCourse(data)
        setError(null)
      })
      .catch((loadError) => {
        setCourse(null)
        setError(loadError instanceof Error ? loadError.message : "Failed to load course detail.")
      })
      .finally(() => setLoading(false))
  }, [courseId])

  const totalLessons = useMemo(() => (course ? countLessons(course) : 0), [course])

  if (loading) {
    return <PageLoading />
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/dashboard/programs")}>
          <ArrowLeft />
          Back to programs
        </Button>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-1 text-sm text-destructive">
            {error || "Course not found."}
          </CardContent>
        </Card>
      </div>
    )
  }

  const programCoursesPath = `/dashboard/programs/${course.programId}/courses`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/dashboard/programs")} className="transition-colors hover:text-foreground">
          Programs
        </button>
        <ChevronRight className="size-4" />
        <button onClick={() => navigate(programCoursesPath)} className="transition-colors hover:text-foreground">
          Courses
        </button>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{course.title}</span>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{course.code}</Badge>
              {course.programCode ? <Badge variant="outline">{course.programCode}</Badge> : null}
              {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
              {course.level ? <Badge variant="outline">{course.level}</Badge> : null}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              {course.description ? <CardDescription className="max-w-2xl">{course.description}</CardDescription> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(programCoursesPath)}>
              <ArrowLeft />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/dashboard/courses/${course.id}/runs/create`)}>
              <Workflow />
              Create runs
            </Button>
            <Button onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}>
              <PencilLine />
              Edit course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Card className="bg-muted/50">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Course runs</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{course.courseRuns.length}</p>
              </div>
              <CalendarRange className="size-5 text-primary" />
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Lessons</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{totalLessons}</p>
              </div>
              <Layers3 className="size-5 text-primary" />
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Order index</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{course.orderIndex}</p>
              </div>
              <BookCopy className="size-5 text-primary" />
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="py-1">
              <p className="text-sm text-muted-foreground">Tags</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {course.tags.length ? course.tags.join(", ") : "-"}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Course runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {course.courseRuns.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                No course runs.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Chapters</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {course.courseRuns.map((run) => {
                    const lessonCount = run.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)

                    return (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.code}</TableCell>
                        <TableCell>
                          <Badge variant={getRunBadgeVariant(run.status)}>{run.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateRange(run.startsAt, run.endsAt)}</TableCell>
                        <TableCell>{run.chapters.length}</TableCell>
                        <TableCell>{lessonCount}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="outline" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/runs/${run.id}`)}>
                                Open run
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Program</span>
                <span className="font-medium text-foreground">{course.programCode || "-"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{course.category || "-"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="font-medium text-foreground">{course.level || "-"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(course.createdAt))}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="font-medium text-foreground">
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(course.updatedAt))}
                </span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
