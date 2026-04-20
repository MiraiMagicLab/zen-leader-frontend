import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  GitBranch,
  Layers3,
  MoreVertical,
  PencilLine,
  Plus,
  Repeat,
  Search,
  Trash2,
  BookOpen,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select } from "@/components/ui/select"
import { PageLoading } from "@/components/common/PageLoading"
import { courseApi, programApi, type CourseResponse, type ProgramResponse } from "@/lib/api"
import { cn } from "@/lib/utils"

type CategoryFilter = "ALL" | string

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

function getLevelColor(level: string | null) {
  switch ((level ?? "").toUpperCase()) {
    case "BEGINNER":
      return "bg-primary/10 text-primary border-primary/10"
    case "INTERMEDIATE":
      return "bg-primary/10 text-primary border-primary/10"
    case "ADVANCED":
    case "EXPERT":
    case "MASTER":
      return "bg-primary/10 text-primary border-primary/10"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function CourseManagementPage() {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()

  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [program, setProgram] = useState<ProgramResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
  const [deletingCourse, setDeletingCourse] = useState<CourseResponse | null>(null)

  useEffect(() => {
    if (!programId) return
    setLoading(true)
    Promise.all([courseApi.getAll(programId), programApi.getById(programId)])
      .then(([courseList, programDetail]) => {
        setCourses(courseList)
        setProgram(programDetail)
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load program courses.")
      })
      .finally(() => setLoading(false))
  }, [programId])

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
        (course.description ?? "").toLowerCase().includes(keyword)

      const matchesCategory = categoryFilter === "ALL" || course.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [categoryFilter, courses, search])

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
    return <PageLoading />
  }

  return (
    <>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <span className="flex size-1.5 rounded-full bg-primary animate-pulse"></span>
              {program?.code || "Program"}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {program?.title || "Program"} Courses
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Manage your educational hierarchy. {courses.length} courses detected.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard/programs")} 
                className="h-10 gap-2 px-4 font-medium"
            >
              <ArrowLeft className="size-4" />
              Programs
            </Button>
            <Button
                onClick={() => navigate(`/dashboard/programs/${programId}/courses/create`)} 
                className="gap-2 h-10 px-4"
            >
              <Plus className="size-5" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
                { label: "Active Runs", value: totalCourseRuns, icon: GitBranch, color: "text-primary", bg: "bg-primary/10" },
                { label: "Total Lessons", value: totalLessons, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
                { label: "Active Hierarchy", value: courses.length, icon: Layers3, color: "text-primary", bg: "bg-primary/10" }
            ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                        <stat.icon className="size-4" />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>

        {error ? (
          <Card className="rounded-xl border-error/20 bg-error/5">
            <CardContent className="py-3 text-sm text-error font-bold flex items-center gap-2">
                <AlertCircle className="size-4" />
                {error}
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold tracking-tight">Courses</CardTitle>
                <CardDescription className="font-medium">
                  {program?.title ? `${program.title} course catalog.` : "Browse all courses."}
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 min-w-0 lg:min-w-[500px]">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search title, code, or category..."
                    className="h-11 rounded-xl border-transparent bg-muted/50 pl-9 font-medium focus:border-primary/20 focus:bg-background"
                  />
                </div>

                <div className="w-full sm:w-[200px]">
                  <Select 
                    value={categoryFilter} 
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="h-11 rounded-xl border-input bg-background px-4 text-sm"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/40 bg-muted/30 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-8 py-5 font-semibold">Course</th>
                    <th className="px-6 py-5 font-semibold">Details</th>
                    <th className="px-6 py-5 text-center font-semibold">Lessons</th>
                    <th className="px-6 py-5 font-semibold">Level</th>
                    <th className="px-8 py-5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-40">
                            <BookOpen className="size-12 mb-2" />
                            <p className="text-base font-semibold">No results found</p>
                            <p className="text-sm font-medium">Try adjusting your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-8 py-6">
                            <div className="flex items-start gap-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/5 bg-primary/5 text-primary">
                                    <BookOpen className="size-5" />
                                </div>
                                <div className="space-y-1.5">
                                    <button 
                                        onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                                        className="text-left text-base font-semibold text-foreground hover:text-primary transition-colors"
                                    >
                                        {course.title}
                                    </button>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="rounded-md border-border/60 px-1.5 py-0 font-mono text-xs">{course.code}</Badge>
                                        {course.category ? (
                                            <Badge variant="outline" className="rounded-md border-transparent bg-muted/30 px-1.5 py-0 text-xs uppercase">
                                                {course.category}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-6">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground/70">Order: {course.orderIndex}</p>
                                <div className="flex items-center gap-1.5">
                                    <Repeat className="size-4 text-primary" />
                                    <p className="text-sm font-bold text-foreground/80">{course.courseRuns.length} Active Runs</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-muted/60 font-semibold text-foreground ring-1 ring-border/20">
                                {countLessons(course)}
                            </div>
                        </td>
                        <td className="px-6 py-6">
                          {course.level ? (
                            <Badge className={cn("rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wide shadow-none", getLevelColor(course.level))}>
                                {course.level}
                            </Badge>
                          ) : (
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/50 italic">Undefined</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex size-9 items-center justify-center rounded-xl hover:bg-muted">
                              <span className="sr-only">Open actions</span>
                                <MoreVertical className="size-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border p-2">
                              <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer gap-3 rounded-xl px-3 py-3 font-medium focus:bg-primary/5 focus:text-primary" 
                                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                              >
                                <Eye className="size-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="rounded-xl px-3 py-3 font-bold gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary" 
                                onClick={() => navigate(`/dashboard/courses/${course.id}/runs/create`)}
                              >
                                <Plus className="size-5" />
                                Create run
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="rounded-xl px-3 py-3 font-bold gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary" 
                                onClick={() => navigate(`/dashboard/courses/${course.id}/edit`)}
                              >
                                <PencilLine className="size-5" />
                                Edit course
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2" />
                              <DropdownMenuItem
                                variant="destructive"
                                className="rounded-xl px-3 py-3 font-bold gap-3 cursor-pointer"
                                onClick={() => setDeletingCourse(course)}
                              >
                                <Trash2 className="size-5" />
                                Delete Course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(deletingCourse)} onOpenChange={(open) => !open && setDeletingCourse(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] border-l-border bg-background p-0">
          <div className="h-full flex flex-col p-8 items-start justify-between">
              <div className="w-full">
                <SheetHeader className="space-y-3">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                        <Trash2 className="size-7" />
                    </div>
                    <SheetTitle className="text-xl font-semibold tracking-tight">Delete course</SheetTitle>
                    <SheetDescription className="text-sm font-medium leading-relaxed">
                        You are about to delete this course. All related runs, chapters, and lessons will also be removed.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-10 space-y-4">
                    <div className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Course to delete</p>
                        <p className="text-base font-semibold text-foreground tracking-tight">{deletingCourse?.title}</p>
                        <p className="text-sm font-mono text-muted-foreground opacity-70">{deletingCourse?.code}</p>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium px-2">Please confirm. This action cannot be undone.</p>
                </div>
              </div>

            <SheetFooter className="w-full border-t border-border pt-8 flex gap-3 sm:gap-3 items-center">
                <Button 
                    variant="ghost" 
                    className="h-10 flex-1 rounded-xl text-sm font-medium text-muted-foreground" 
                    onClick={() => setDeletingCourse(null)}
                >
                    Cancel
                </Button>
                <Button 
                    variant="destructive" 
                    className="h-10 flex-1 rounded-xl text-sm font-medium"
                    onClick={() => void handleDeleteCourse()}
                >
                    Confirm Delete
                </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
