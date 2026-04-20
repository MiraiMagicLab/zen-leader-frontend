import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  BookCopy,
  CalendarRange,
  ChevronRight,
  Layers3,
  PencilLine,
  Plus,
  Search,
  Trash2,
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
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { courseApi, programApi, type CourseResponse, type ProgramResponse } from "@/lib/api"

type CategoryFilter = "ALL" | string
type ProgramFilter = "ALL" | string

function sortCourses(courses: CourseResponse[]) {
  return [...courses].sort((a, b) => {
    if (a.programCode !== b.programCode) {
      return (a.programCode ?? "").localeCompare(b.programCode ?? "")
    }
    return a.orderIndex - b.orderIndex
  })
}

function countLessons(course: CourseResponse) {
  return course.courseRuns.reduce(
    (total, run) => total + run.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0),
    0,
  )
}

function getRunStatusSummary(course: CourseResponse) {
  const statuses = new Set(course.courseRuns.map((run) => run.status))
  return statuses.size === 0 ? "No runs" : Array.from(statuses).join(", ")
}

function getLevelVariant(level: string | null) {
  switch ((level ?? "").toUpperCase()) {
    case "BEGINNER":
      return "secondary" as const
    case "ADVANCED":
    case "EXPERT":
      return "default" as const
    default:
      return "outline" as const
  }
}

export default function CourseManagementPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [programs, setPrograms] = useState<ProgramResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [programFilter, setProgramFilter] = useState<ProgramFilter>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
  const [deletingCourse, setDeletingCourse] = useState<CourseResponse | null>(null)

  useEffect(() => {
    Promise.all([courseApi.getAll(), programApi.getAll()])
      .then(([courseList, programList]) => {
        setCourses(courseList)
        setPrograms(programList)
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load course list.")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const programIdParam = searchParams.get("programId")
    if (programIdParam) {
      setProgramFilter(programIdParam)
    }
  }, [searchParams])

  const categories = useMemo(() => {
    return Array.from(new Set(courses.map((course) => course.category).filter(Boolean))) as string[]
  }, [courses])

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return sortCourses(courses).filter((course) => {
      const matchesSearch =
        !keyword ||
        course.title.toLowerCase().includes(keyword) ||
        course.code.toLowerCase().includes(keyword) ||
        (course.description ?? "").toLowerCase().includes(keyword) ||
        (course.programCode ?? "").toLowerCase().includes(keyword)

      const matchesProgram = programFilter === "ALL" || course.programId === programFilter
      const matchesCategory = categoryFilter === "ALL" || course.category === categoryFilter

      return matchesSearch && matchesProgram && matchesCategory
    })
  }, [categoryFilter, courses, programFilter, search])

  const totalCourseRuns = courses.reduce((total, course) => total + course.courseRuns.length, 0)
  const totalLessons = courses.reduce((total, course) => total + countLessons(course), 0)

  async function handleDeleteCourse() {
    if (!deletingCourse) return

    try {
      await courseApi.remove(deletingCourse.id)
      setCourses((current) => current.filter((course) => course.id !== deletingCourse.id))
      setDeletingCourse(null)
      setError(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete course.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading course library</CardTitle>
            <CardDescription>Resolving courses, programs, and course runs.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[calc(var(--radius-xl)+6px)] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_10%,white),color-mix(in_srgb,var(--color-tertiary-fixed)_20%,white))] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="secondary" className="bg-background/80 text-foreground">
                Course Library
              </Badge>
              <div className="space-y-2">
                <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
                  Courses inside the LMS hierarchy
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-foreground/80">
                  Courses belong to a program and each course can own multiple course runs. This screen keeps that
                  relationship visible instead of treating courses as isolated records.
                </p>
              </div>
            </div>

            <Button onClick={() => navigate("/dashboard/courses/create")} className="gap-2">
              <Plus className="size-4 shrink-0" />
              New course
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Card className="bg-background/90">
              <CardContent className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{courses.length}</p>
                </div>
                <BookCopy className="size-5 text-secondary" />
              </CardContent>
            </Card>
            <Card className="bg-background/90">
              <CardContent className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-muted-foreground">Course runs</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{totalCourseRuns}</p>
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
          </div>
        </section>

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-1 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="gap-4">
            <div>
              <CardTitle>Course list</CardTitle>
              <CardDescription>Filter by program and category, then drill down into course detail and runs.</CardDescription>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by course title, code, program, or description"
                  className="pl-8"
                />
              </div>

              <Select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
                <option value="ALL">All programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </Select>

              <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {filteredCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                No course matches the current filters.
              </div>
            ) : (
              filteredCourses.map((course) => (
                <Card key={course.id} className="border-border/80">
                  <CardContent className="space-y-4 py-1">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{course.code}</Badge>
                          {course.programCode ? <Badge variant="outline">{course.programCode}</Badge> : null}
                          {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
                          {course.level ? <Badge variant={getLevelVariant(course.level)}>{course.level}</Badge> : null}
                        </div>

                        <div>
                          <p className="font-headline text-xl font-semibold text-foreground">{course.title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {course.description || "No description for this course yet."}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}
                        >
                          <PencilLine className="size-4 shrink-0" />
                          Edit course
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                        >
                          View course detail
                          <ChevronRight className="size-4 shrink-0" />
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingCourse(course)}
                        >
                          <Trash2 className="size-4 shrink-0" />
                          Delete course
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Program</p>
                        <p className="mt-2 font-medium text-foreground">{course.programCode || "Unassigned"}</p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Order index</p>
                        <p className="mt-2 font-medium text-foreground">{course.orderIndex}</p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Course runs</p>
                        <p className="mt-2 font-medium text-foreground">{course.courseRuns.length}</p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Lessons</p>
                        <p className="mt-2 font-medium text-foreground">{countLessons(course)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">Course run summary</p>
                        <p className="text-xs text-muted-foreground">{getRunStatusSummary(course)}</p>
                      </div>

                      {course.courseRuns.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                          This course does not have any course runs yet.
                        </div>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          {course.courseRuns.map((run) => (
                            <button
                              key={run.id}
                              type="button"
                              onClick={() => navigate(`/dashboard/runs/${run.id}`)}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/30"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{run.code}</p>
                                  <Badge variant="outline">{run.status}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {run.chapters.length} chapters
                                </p>
                              </div>
                              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                                Open run
                                <ChevronRight className="size-4" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(deletingCourse)} onOpenChange={(open) => !open && setDeletingCourse(null)}>
        <SheetContent side="right" className="w-full max-w-lg bg-background">
          <SheetHeader>
            <SheetTitle>Delete Course</SheetTitle>
            <SheetDescription>
              This action removes the selected course from the LMS. Continue only if you also want its course-run tree gone.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 py-2">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-foreground">{deletingCourse?.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{deletingCourse?.code}</p>
            </div>
          </div>

          <SheetFooter className="border-t border-border">
            <Button variant="outline" onClick={() => setDeletingCourse(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteCourse()}>
              Delete Course
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
