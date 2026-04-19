import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  BookCopy,
  CalendarRange,
  ChevronRight,
  FolderKanban,
  Layers3,
  Plus,
  Search,
  Settings2,
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
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  courseApi,
  programApi,
  type CourseResponse,
  type ProgramResponse,
  type ProgramUpsertRequest,
} from "@/lib/api"
import { cn } from "@/lib/utils"

type Program = ProgramResponse
type Course = CourseResponse
type ProgramSheetMode = "create" | "settings" | "add-course" | null
type ProgramFilterStatus = "ALL" | "PUBLISHED" | "DRAFT"

type ProgramFormState = {
  code: string
  title: string
  description: string
  thumbnailUrl: string
  isPublished: boolean
}

const EMPTY_PROGRAM_FORM: ProgramFormState = {
  code: "",
  title: "",
  description: "",
  thumbnailUrl: "",
  isPublished: false,
}

function sortCourses(courses: Course[]) {
  return [...courses].sort((a, b) => a.orderIndex - b.orderIndex)
}

function countCourseRuns(program: Program) {
  return program.courses.reduce((total, course) => total + course.courseRuns.length, 0)
}

function countLessons(course: Course) {
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

function toProgramFormState(program: Program): ProgramFormState {
  return {
    code: program.code,
    title: program.title,
    description: program.description ?? "",
    thumbnailUrl: program.thumbnailUrl ?? "",
    isPublished: program.isPublished,
  }
}

function toProgramPayload(form: ProgramFormState, publishedAt?: string | null): ProgramUpsertRequest {
  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim(),
    description: form.description.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    isPublished: form.isPublished,
    publishedAt: form.isPublished ? publishedAt ?? new Date().toISOString() : null,
  }
}

function getRunBadgeVariant(status: string) {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
    case "OPEN":
      return "secondary" as const
    case "DRAFT":
      return "outline" as const
    default:
      return "outline" as const
  }
}

function ProgramForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
}: {
  form: ProgramFormState
  onChange: (next: ProgramFormState) => void
  onSubmit: () => void
  submitLabel: string
}) {
  const isInvalid = !form.code.trim() || !form.title.trim()

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isInvalid) onSubmit()
      }}
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="program-code">Program code</Label>
          <Input
            id="program-code"
            value={form.code}
            onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })}
            placeholder="EXEC-LEAD-2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-title">Program title</Label>
          <Input
            id="program-title"
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="Zenith Executive Leadership"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-thumbnail">Thumbnail URL</Label>
          <Input
            id="program-thumbnail"
            value={form.thumbnailUrl}
            onChange={(event) => onChange({ ...form, thumbnailUrl: event.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description">Description</Label>
          <Textarea
            id="program-description"
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="Describe the program, audience, and expected outcomes."
            className="min-h-28"
          />
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="program-published">Published</Label>
              <p className="text-sm text-muted-foreground">
                Published programs are visible in the LMS hierarchy and can host active course runs.
              </p>
            </div>
            <Switch
              id="program-published"
              checked={form.isPublished}
              onCheckedChange={(checked) => onChange({ ...form, isPublished: checked })}
            />
          </div>
        </div>
      </div>

      <SheetFooter className="border-t border-border">
        <Button type="submit" disabled={isInvalid}>
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}

export default function ProgramManagementPage() {
  const navigate = useNavigate()

  const [programs, setPrograms] = useState<Program[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState("")
  const [sheetMode, setSheetMode] = useState<ProgramSheetMode>(null)

  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<ProgramFilterStatus>("ALL")
  const [filterMinCourses, setFilterMinCourses] = useState("")
  const [courseSearch, setCourseSearch] = useState("")

  const [programForm, setProgramForm] = useState<ProgramFormState>(EMPTY_PROGRAM_FORM)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [programList, courseList] = await Promise.all([programApi.getAll(), courseApi.getAll()])
      setPrograms(programList)
      setAllCourses(courseList)
      setSelectedId((current) => current || programList[0]?.id || "")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load LMS program flow.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const search = filterSearch.trim().toLowerCase()
      const matchesSearch =
        !search ||
        program.title.toLowerCase().includes(search) ||
        program.code.toLowerCase().includes(search) ||
        (program.description ?? "").toLowerCase().includes(search)

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "PUBLISHED" ? program.isPublished : !program.isPublished)

      const matchesMinCourses =
        !filterMinCourses.trim() || program.courses.length >= Number(filterMinCourses)

      return matchesSearch && matchesStatus && matchesMinCourses
    })
  }, [filterMinCourses, filterSearch, filterStatus, programs])

  const selectedProgram = useMemo(
    () => filteredPrograms.find((program) => program.id === selectedId) ?? programs.find((program) => program.id === selectedId) ?? null,
    [filteredPrograms, programs, selectedId],
  )

  const availableCourses = useMemo(() => {
    if (!selectedProgram) return []

    const existingIds = new Set(selectedProgram.courses.map((course) => course.id))
    const search = courseSearch.trim().toLowerCase()

    return allCourses.filter((course) => {
      if (existingIds.has(course.id)) return false
      if (!search) return true

      return (
        course.title.toLowerCase().includes(search) ||
        course.code.toLowerCase().includes(search) ||
        (course.category ?? "").toLowerCase().includes(search)
      )
    })
  }, [allCourses, courseSearch, selectedProgram])

  useEffect(() => {
    if (!selectedId && filteredPrograms[0]) {
      setSelectedId(filteredPrograms[0].id)
    }
  }, [filteredPrograms, selectedId])

  const totalCourses = programs.reduce((total, program) => total + program.courses.length, 0)
  const totalCourseRuns = programs.reduce((total, program) => total + countCourseRuns(program), 0)
  const publishedPrograms = programs.filter((program) => program.isPublished).length

  async function handleCreateProgram() {
    const created = await programApi.create(toProgramPayload(programForm))
    setPrograms((current) => [created, ...current])
    setSelectedId(created.id)
    setProgramForm(EMPTY_PROGRAM_FORM)
    setSheetMode(null)
  }

  async function handleSaveProgramSettings() {
    if (!selectedProgram) return

    const updated = await programApi.update(
      selectedProgram.id,
      toProgramPayload(programForm, selectedProgram.publishedAt),
    )

    setPrograms((current) => current.map((program) => (program.id === updated.id ? updated : program)))
    setSheetMode(null)
  }

  async function handleDeleteProgram(programId: string) {
    await programApi.remove(programId)
    setPrograms((current) => {
      const next = current.filter((program) => program.id !== programId)
      if (selectedId === programId) {
        setSelectedId(next[0]?.id ?? "")
      }
      return next
    })
  }

  async function handleTogglePublished(program: Program) {
    const updated = await programApi.update(program.id, {
      code: program.code,
      title: program.title,
      description: program.description,
      thumbnailUrl: program.thumbnailUrl,
      isPublished: !program.isPublished,
      publishedAt: !program.isPublished ? new Date().toISOString() : null,
    })

    setPrograms((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  async function handleAddCourse(course: Course) {
    if (!selectedProgram) return

    const nextOrderIndex = selectedProgram.courses.length
    await courseApi.update(course.id, {
      code: course.code,
      title: course.title,
      description: course.description,
      level: course.level,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      programId: selectedProgram.id,
      orderIndex: nextOrderIndex,
      tags: course.tags,
    })

    setCourseSearch("")
    setSheetMode(null)
    await loadData()
  }

  function openCreateSheet() {
    setProgramForm(EMPTY_PROGRAM_FORM)
    setSheetMode("create")
  }

  function openSettingsSheet() {
    if (!selectedProgram) return
    setProgramForm(toProgramFormState(selectedProgram))
    setSheetMode("settings")
  }

  async function runAsyncAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "An unexpected error occurred.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle>Loading LMS flow</CardTitle>
            <CardDescription>Resolving programs, courses, and course runs from backend.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[calc(var(--radius-xl)+6px)] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_10%,white),color-mix(in_srgb,var(--color-primary-fixed)_26%,white))] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="secondary" className="bg-background/80 text-foreground">
                LMS Flow
              </Badge>
              <div className="space-y-2">
                <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
                  Program → Course → Course Run
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-foreground/80">
                  Backend đang trả đúng hierarchy cho LMS. Trang này bây giờ render lại flow đó theo dạng
                  quản trị: bảng program ở bên trái, drill-down course và course run ở bên phải.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard/courses")}>
                <BookCopy />
                Manage Courses
              </Button>
              <Button onClick={openCreateSheet}>
                <Plus />
                New Program
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Card className="bg-background/90">
              <CardContent className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-muted-foreground">Programs</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{programs.length}</p>
                </div>
                <FolderKanban className="size-5 text-secondary" />
              </CardContent>
            </Card>
            <Card className="bg-background/90">
              <CardContent className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{totalCourses}</p>
                </div>
                <Layers3 className="size-5 text-secondary" />
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
          </div>
        </section>

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-1 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
          <Card className="border-border/80">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Programs</CardTitle>
                  <CardDescription>List view for program containers in the LMS.</CardDescription>
                </div>
                <Badge variant="outline">{publishedPrograms} published</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_140px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filterSearch}
                    onChange={(event) => setFilterSearch(event.target.value)}
                    placeholder="Search program title, code, or description"
                    className="pl-8"
                  />
                </div>

                <Select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value as ProgramFilterStatus)}
                >
                  <option value="ALL">All status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </Select>

                <Input
                  type="number"
                  min="0"
                  value={filterMinCourses}
                  onChange={(event) => setFilterMinCourses(event.target.value)}
                  placeholder="Min courses"
                />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-xl border border-border/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Program</th>
                        <th className="px-4 py-3 font-medium">Courses</th>
                        <th className="px-4 py-3 font-medium">Course runs</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrograms.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                            No program matches the current LMS filters.
                          </td>
                        </tr>
                      ) : (
                        filteredPrograms.map((program) => {
                          const isSelected = selectedProgram?.id === program.id

                          return (
                            <tr
                              key={program.id}
                              className={cn(
                                "cursor-pointer border-t border-border/60 transition-colors hover:bg-muted/40",
                                isSelected && "bg-secondary/10",
                              )}
                              onClick={() => setSelectedId(program.id)}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
                                    <FolderKanban className="size-5" />
                                  </div>
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate font-medium text-foreground">{program.title}</p>
                                      {isSelected ? <Badge variant="secondary">Selected</Badge> : null}
                                    </div>
                                    <p className="font-mono text-xs text-muted-foreground">{program.code}</p>
                                    {program.description ? (
                                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                        {program.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-foreground">{program.courses.length}</td>
                              <td className="px-4 py-4 font-medium text-foreground">{countCourseRuns(program)}</td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void runAsyncAction(async () => {
                                      await handleTogglePublished(program)
                                    })
                                  }}
                                >
                                  <Badge variant={program.isPublished ? "secondary" : "outline"}>
                                    {program.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                </button>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setSelectedId(program.id)
                                      setProgramForm(toProgramFormState(program))
                                      setSheetMode("settings")
                                    }}
                                  >
                                    <Settings2 />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      void runAsyncAction(async () => {
                                        await handleDeleteProgram(program.id)
                                      })
                                    }}
                                  >
                                    <Trash2 />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Program Detail Flow</CardTitle>
                  <CardDescription>
                    Click one program to inspect its courses and the course runs inside each course.
                  </CardDescription>
                </div>
                {selectedProgram ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={openSettingsSheet}>
                      <Settings2 />
                      Settings
                    </Button>
                    <Button onClick={() => setSheetMode("add-course")}>
                      <Plus />
                      Add Course
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {!selectedProgram ? (
                <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                  Select a program from the table to inspect its LMS hierarchy.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_14%,white),color-mix(in_srgb,var(--color-secondary-container)_52%,white))] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-background/80">
                            {selectedProgram.code}
                          </Badge>
                          <Badge variant={selectedProgram.isPublished ? "secondary" : "outline"}>
                            {selectedProgram.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div>
                          <h2 className="font-headline text-2xl font-semibold text-foreground">
                            {selectedProgram.title}
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/75">
                            {selectedProgram.description || "No description yet for this program."}
                          </p>
                        </div>
                      </div>

                      <Button variant="ghost" onClick={() => navigate("/dashboard/courses")}>
                        Open Course Library
                        <ArrowRight />
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Courses</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {selectedProgram.courses.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Course runs</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {countCourseRuns(selectedProgram)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Published at</p>
                        <p className="mt-2 text-base font-medium text-foreground">
                          {selectedProgram.publishedAt
                            ? new Intl.DateTimeFormat("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }).format(new Date(selectedProgram.publishedAt))
                            : "Not published"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="courses" className="gap-4">
                    <TabsList variant="line">
                      <TabsTrigger value="courses">Courses</TabsTrigger>
                      <TabsTrigger value="structure">Structure Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="courses" className="space-y-4">
                      {selectedProgram.courses.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                          This program has no courses yet. Add a course, then each course can own multiple course runs.
                        </div>
                      ) : (
                        sortCourses(selectedProgram.courses).map((course, index) => (
                          <Card key={course.id} className="border-border/80">
                            <CardHeader>
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">Course {index + 1}</Badge>
                                    <Badge variant="outline">{course.code}</Badge>
                                    {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
                                    {course.level ? <Badge variant="outline">{course.level}</Badge> : null}
                                  </div>
                                  <div>
                                    <CardTitle>{course.title}</CardTitle>
                                    <CardDescription className="mt-1">
                                      {course.description || "No course description."}
                                    </CardDescription>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">{course.courseRuns.length} runs</Badge>
                                  <Badge variant="outline">{countLessons(course)} lessons</Badge>
                                  <Button
                                    variant="outline"
                                    onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                                  >
                                    Course Detail
                                    <ChevronRight />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Order index</p>
                                  <p className="mt-2 font-medium text-foreground">{course.orderIndex}</p>
                                </div>
                                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tags</p>
                                  <p className="mt-2 font-medium text-foreground">
                                    {course.tags.length ? course.tags.join(", ") : "No tags"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Course runs</p>
                                  <p className="mt-2 font-medium text-foreground">{course.courseRuns.length}</p>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">Course run list</p>
                                  <p className="text-xs text-muted-foreground">
                                    Course owns many runs. Chapters and lessons live under each run.
                                  </p>
                                </div>

                                {course.courseRuns.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                                    No course runs yet for this course.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {course.courseRuns.map((run) => {
                                      const lessonCount = run.chapters.reduce(
                                        (total, chapter) => total + chapter.lessons.length,
                                        0,
                                      )

                                      return (
                                        <button
                                          key={run.id}
                                          type="button"
                                          onClick={() => navigate(`/dashboard/runs/${run.id}`)}
                                          className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/30"
                                        >
                                          <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="font-medium text-foreground">{run.code}</p>
                                              <Badge variant={getRunBadgeVariant(run.status)}>{run.status}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              {formatDateRange(run.startsAt, run.endsAt)}
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <div className="hidden text-right md:block">
                                              <p className="text-xs text-muted-foreground">Chapters</p>
                                              <p className="font-medium text-foreground">{run.chapters.length}</p>
                                            </div>
                                            <div className="hidden text-right md:block">
                                              <p className="text-xs text-muted-foreground">Lessons</p>
                                              <p className="font-medium text-foreground">{lessonCount}</p>
                                            </div>
                                            <ChevronRight className="size-4 text-muted-foreground" />
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="structure">
                      <Card className="border-border/80 bg-muted/10">
                        <CardContent className="space-y-4 py-1">
                          <div>
                            <p className="font-medium text-foreground">Confirmed backend flow</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              `ProgramResponse` contains `courses[]`, each `CourseResponse` contains `courseRuns[]`,
                              and each `CourseRunResponse` contains `chapters[]`. This is the real LMS hierarchy from
                              `zenleader-backend`.
                            </p>
                          </div>
                          <Separator />
                          <div>
                            <p className="font-medium text-foreground">Content ownership</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Chapters and lessons are tied to `courseRun`, not directly to `course`. So two different
                              runs of the same course can have different structure and schedule.
                            </p>
                          </div>
                          <Separator />
                          <div>
                            <p className="font-medium text-foreground">UI implication</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              The admin flow should always start with selecting a program, then drill into its courses,
                              then inspect or manage runs inside each course. This page now follows that order.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={sheetMode !== null} onOpenChange={(open) => !open && setSheetMode(null)}>
        <SheetContent side="right" className="w-full max-w-xl border-border bg-background sm:max-w-xl">
          {sheetMode === "create" ? (
            <>
              <SheetHeader>
                <SheetTitle>Create Program</SheetTitle>
                <SheetDescription>
                  Create a new top-level LMS program. Courses and course runs will be attached under it.
                </SheetDescription>
              </SheetHeader>
              <ProgramForm
                form={programForm}
                onChange={setProgramForm}
                onSubmit={() => {
                  void runAsyncAction(handleCreateProgram)
                }}
                submitLabel="Create Program"
              />
            </>
          ) : null}

          {sheetMode === "settings" && selectedProgram ? (
            <>
              <SheetHeader>
                <SheetTitle>Edit Program</SheetTitle>
                <SheetDescription>
                  Update the selected program while preserving the existing course and course run hierarchy.
                </SheetDescription>
              </SheetHeader>
              <ProgramForm
                form={programForm}
                onChange={setProgramForm}
                onSubmit={() => {
                  void runAsyncAction(handleSaveProgramSettings)
                }}
                submitLabel="Save Changes"
              />
            </>
          ) : null}

          {sheetMode === "add-course" && selectedProgram ? (
            <>
              <SheetHeader>
                <SheetTitle>Add Course To Program</SheetTitle>
                <SheetDescription>
                  Reassign a course into <span className="font-medium text-foreground">{selectedProgram.title}</span>.
                  Each selected course keeps its existing course runs.
                </SheetDescription>
              </SheetHeader>

              <div className="flex h-full flex-col">
                <div className="space-y-4 px-4 pb-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={courseSearch}
                      onChange={(event) => setCourseSearch(event.target.value)}
                      placeholder="Search by course title, code, or category"
                      className="pl-8"
                    />
                  </div>

                  <div className="space-y-2 overflow-y-auto">
                    {availableCourses.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                        No available course matches this search.
                      </div>
                    ) : (
                      availableCourses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            void runAsyncAction(async () => {
                              await handleAddCourse(course)
                            })
                          }}
                          className="flex w-full items-start justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/30"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">{course.title}</p>
                              <Badge variant="outline">{course.code}</Badge>
                              {course.category ? <Badge variant="outline">{course.category}</Badge> : null}
                            </div>
                            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {course.description || "No description"}
                            </p>
                          </div>

                          <div className="ml-4 shrink-0 text-right">
                            <p className="text-xs text-muted-foreground">Runs</p>
                            <p className="font-medium text-foreground">{course.courseRuns.length}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
