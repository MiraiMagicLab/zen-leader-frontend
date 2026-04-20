import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BookCopy,
  CalendarRange,
  ChevronRight,
  Layers3,
  PencilLine,
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
import { Separator } from "@/components/ui/separator"
import { courseApi, type CourseResponse } from "@/lib/api"

function countLessons(course: CourseResponse) {
  return course.courseRuns.reduce(
    (total, run) => total + run.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0),
    0,
  )
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Schedule not set"

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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading course detail</CardTitle>
            <CardDescription>Resolving course structure and its runs.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/dashboard/courses")}>
          <ArrowLeft />
          Back to Courses
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-1 text-sm text-destructive">
            {error || "Course not found."}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/dashboard/programs")} className="transition-colors hover:text-foreground">
          Programs
        </button>
        <ChevronRight className="size-4" />
        <button onClick={() => navigate("/dashboard/courses")} className="transition-colors hover:text-foreground">
          Courses
        </button>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{course.title}</span>
      </div>

      <section className="rounded-[calc(var(--radius-xl)+6px)] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_10%,white),color-mix(in_srgb,var(--color-primary-fixed)_18%,white))] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-background/80">
                {course.code}
              </Badge>
              {course.programCode ? <Badge variant="outline">{course.programCode}</Badge> : null}
              {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
              {course.level ? <Badge variant="secondary">{course.level}</Badge> : null}
            </div>

            <div className="space-y-2">
              <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">{course.title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-foreground/80">
                {course.description || "No description for this course yet."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/courses")}>
              <ArrowLeft />
              Back
            </Button>
            <Button onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}>
              <PencilLine />
              Edit Course
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card className="bg-background/90">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Course runs</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{course.courseRuns.length}</p>
              </div>
              <CalendarRange className="size-5 text-secondary" />
            </CardContent>
          </Card>
          <Card className="bg-background/90">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Lessons</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{totalLessons}</p>
              </div>
              <Layers3 className="size-5 text-secondary" />
            </CardContent>
          </Card>
          <Card className="bg-background/90">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Order index</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{course.orderIndex}</p>
              </div>
              <BookCopy className="size-5 text-secondary" />
            </CardContent>
          </Card>
          <Card className="bg-background/90">
            <CardContent className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-muted-foreground">Tags</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {course.tags.length ? course.tags.join(", ") : "No tags"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Course run flow</CardTitle>
            <CardDescription>
              This is the next level in the LMS hierarchy. Each run has its own chapters and lessons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {course.courseRuns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                This course does not have any course runs yet.
              </div>
            ) : (
              course.courseRuns.map((run) => {
                const lessonCount = run.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)

                return (
                  <Card key={run.id} className="border-border/80">
                    <CardContent className="space-y-4 py-1">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{run.code}</p>
                            <Badge variant={getRunBadgeVariant(run.status)}>{run.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDateRange(run.startsAt, run.endsAt)}
                          </p>
                        </div>

                        <Button variant="outline" onClick={() => navigate(`/dashboard/runs/${run.id}`)}>
                          Open Run
                          <ChevronRight />
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Chapters</p>
                          <p className="mt-2 font-medium text-foreground">{run.chapters.length}</p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Lessons</p>
                          <p className="mt-2 font-medium text-foreground">{lessonCount}</p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Timezone</p>
                          <p className="mt-2 font-medium text-foreground">{run.timezone || "Not set"}</p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Capacity</p>
                          <p className="mt-2 font-medium text-foreground">{run.capacity ?? "Unlimited"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course metadata</CardTitle>
            <CardDescription>Summary of the parent course in the LMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Program</span>
                <span className="font-medium text-foreground">{course.programCode || "Unassigned"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{course.category || "Not set"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="font-medium text-foreground">{course.level || "Not set"}</span>
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

            <Separator />

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-foreground">Flow note</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Course is still only the middle layer. Operational learning content is actually attached to each
                course run.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
