import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import {
  BookOpen,
  CalendarRange,
  FolderKanban,
  Layers3,
  MoreVertical,
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
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  assetApi,
  programApi,
  type ProgramResponse,
  type ProgramUpsertRequest,
} from "@/lib/api"

type Program = ProgramResponse
type ProgramSheetMode = "create" | "settings" | null
type ProgramFilterStatus = "ALL" | "PUBLISHED" | "DRAFT"
type ProgramFormErrors = Partial<Record<"code" | "title" | "description" | "thumbnailFile", string>>

type ProgramFormState = {
  code: string
  title: string
  description: string
  thumbnailUrl: string
  thumbnailFile: File | null
  isPublished: boolean
}

const EMPTY_PROGRAM_FORM: ProgramFormState = {
  code: "",
  title: "",
  description: "",
  thumbnailUrl: "",
  thumbnailFile: null,
  isPublished: false,
}

const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024
const programFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Program code must be at least 2 characters.")
    .max(50, "Program code must be at most 50 characters.")
    .regex(/^[A-Z0-9_-]+$/, "Program code can contain only uppercase letters, numbers, '-' and '_'"),
  title: z.string().trim().min(3, "Program title must be at least 3 characters.").max(120, "Program title must be at most 120 characters."),
  description: z.string().trim().max(2000, "Description must be at most 2000 characters."),
  thumbnailFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_THUMBNAIL_SIZE, "Thumbnail file size must be 5MB or smaller.")
    .nullable(),
})

function validateProgramForm(form: ProgramFormState): ProgramFormErrors {
  const result = programFormSchema.safeParse(form)
  if (result.success) return {}

  const flattened = result.error.flatten().fieldErrors
  return {
    code: flattened.code?.[0],
    title: flattened.title?.[0],
    description: flattened.description?.[0],
    thumbnailFile: flattened.thumbnailFile?.[0],
  }
}

function countCourseRuns(program: Program) {
  return program.courses.reduce((total, course) => total + course.courseRuns.length, 0)
}


function toProgramFormState(program: Program): ProgramFormState {
  return {
    code: program.code,
    title: program.title,
    description: program.description ?? "",
    thumbnailUrl: program.thumbnailUrl ?? "",
    thumbnailFile: null,
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

function ProgramForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  errors,
}: {
  form: ProgramFormState
  onChange: (next: ProgramFormState) => void
  onSubmit: () => void
  submitLabel: string
  errors: ProgramFormErrors
}) {
  const isInvalid = !form.code.trim() || !form.title.trim()
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!form.thumbnailFile) {
      setThumbnailPreview(null)
      return
    }

    const url = URL.createObjectURL(form.thumbnailFile)
    setThumbnailPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.thumbnailFile])

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isInvalid) onSubmit()
      }}
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="program-code">Program code</Label>
          <Input
            id="program-code"
            value={form.code}
            aria-invalid={Boolean(errors.code)}
            onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })}
            placeholder="EXEC-LEAD-2026"
          />
          {errors.code ? <p className="text-xs text-destructive">{errors.code}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-title">Program title</Label>
          <Input
            id="program-title"
            value={form.title}
            aria-invalid={Boolean(errors.title)}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="Zenith Executive Leadership"
          />
          {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-thumbnail">Thumbnail</Label>
          <div className="space-y-3">
            {(thumbnailPreview || form.thumbnailUrl) ? (
              <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                <img
                  alt="Program thumbnail preview"
                  src={thumbnailPreview ?? form.thumbnailUrl}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                No thumbnail uploaded yet
              </div>
            )}

            <Input
              id="program-thumbnail"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                onChange({ ...form, thumbnailFile: file })
              }}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...form, thumbnailFile: null, thumbnailUrl: "" })}
              >
                Clear
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Upload one image file. If you do not upload a new file, the existing thumbnail is kept in edit mode.
              </p>
            </div>
            {errors.thumbnailFile ? <p className="text-xs text-destructive">{errors.thumbnailFile}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description">Description</Label>
          <Textarea
            id="program-description"
            value={form.description}
            aria-invalid={Boolean(errors.description)}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="Describe the program, audience, and expected outcomes."
            className="min-h-28"
          />
          {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingProgramId, setEditingProgramId] = useState("")
  const [sheetMode, setSheetMode] = useState<ProgramSheetMode>(null)

  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<ProgramFilterStatus>("ALL")

  const [programForm, setProgramForm] = useState<ProgramFormState>(EMPTY_PROGRAM_FORM)
  const [programFormErrors, setProgramFormErrors] = useState<ProgramFormErrors>({})

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const programList = await programApi.getAll()
      setPrograms(programList)
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

      return matchesSearch && matchesStatus
    })
  }, [filterSearch, filterStatus, programs])

  const totalCourses = programs.reduce((total, program) => total + program.courses.length, 0)
  const totalCourseRuns = programs.reduce((total, program) => total + countCourseRuns(program), 0)
  const publishedPrograms = programs.filter((program) => program.isPublished).length

  async function resolveProgramThumbnailUrl(): Promise<string | null> {
    if (programForm.thumbnailFile) {
      const uploaded = await assetApi.upload(programForm.thumbnailFile)
      return uploaded.url
    }

    return programForm.thumbnailUrl.trim() || null
  }

  async function handleCreateProgram() {
    const nextErrors = validateProgramForm(programForm)
    if (Object.keys(nextErrors).length > 0) {
      setProgramFormErrors(nextErrors)
      return
    }
    setProgramFormErrors({})

    const thumbnailUrl = await resolveProgramThumbnailUrl()
    const created = await programApi.create(toProgramPayload({ ...programForm, thumbnailUrl: thumbnailUrl ?? "" }))
    setPrograms((current) => [created, ...current])
    setProgramForm(EMPTY_PROGRAM_FORM)
    setSheetMode(null)
  }

  async function handleSaveProgramSettings() {
    if (!editingProgramId) return
    const editingProgram = programs.find((program) => program.id === editingProgramId)
    if (!editingProgram) return
    const nextErrors = validateProgramForm(programForm)
    if (Object.keys(nextErrors).length > 0) {
      setProgramFormErrors(nextErrors)
      return
    }
    setProgramFormErrors({})

    const thumbnailUrl = await resolveProgramThumbnailUrl()
    const updated = await programApi.update(
      editingProgram.id,
      toProgramPayload({ ...programForm, thumbnailUrl: thumbnailUrl ?? "" }, editingProgram.publishedAt),
    )

    setPrograms((current) => current.map((program) => (program.id === updated.id ? updated : program)))
    setEditingProgramId("")
    setSheetMode(null)
  }

  async function handleDeleteProgram(programId: string) {
    await programApi.remove(programId)
    setPrograms((current) => current.filter((program) => program.id !== programId))
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

  function openCreateSheet() {
    setProgramForm(EMPTY_PROGRAM_FORM)
    setProgramFormErrors({})
    setEditingProgramId("")
    setSheetMode("create")
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
                  Manage programs in a clean table view. Open the dedicated detail page to manage related
                  courses and course runs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={openCreateSheet} className="gap-2">
                <Plus className="size-4 shrink-0" />
                New program
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

        <div className="space-y-6">
          <Card className="border-border/80">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Programs</CardTitle>
                  <CardDescription>Program list table. Open detail page to manage courses of each program.</CardDescription>
                </div>
                <Badge variant="outline">{publishedPrograms} published</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
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
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-xl border border-border/70">
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px] text-left text-sm sm:min-w-[800px]">
                    <TableHeader className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <TableRow className="border-b border-border/60 hover:bg-transparent">
                        <TableHead className="px-4 py-3 font-medium">Program</TableHead>
                        <TableHead className="px-4 py-3 font-medium text-center sm:text-left">Courses</TableHead>
                        <TableHead className="px-4 py-3 font-medium text-center sm:text-left">Course runs</TableHead>
                        <TableHead className="px-4 py-3 font-medium">Visibility</TableHead>
                        <TableHead className="px-4 py-3 text-right font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrograms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                            No program matches the current LMS filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPrograms.map((program) => {
                          return (
                            <TableRow key={program.id} className="border-t border-border/60 transition-colors hover:bg-muted/40">
                                <TableCell className="px-4 py-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
                                      <FolderKanban className="size-5" />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                      <p className="truncate font-medium text-foreground">{program.title}</p>
                                      <p className="font-mono text-xs text-muted-foreground">{program.code}</p>
                                      {program.description ? (
                                        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                          {program.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-4 text-center font-medium text-foreground sm:text-left">
                                  {program.courses.length}
                                </TableCell>
                                <TableCell className="px-4 py-4 text-center font-medium text-foreground sm:text-left">
                                  {countCourseRuns(program)}
                                </TableCell>
                                <TableCell className="px-4 py-4">
                                  <div className="flex items-start">
                                    <Badge variant={program.isPublished ? "secondary" : "outline"}>
                                      {program.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-4 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger nativeButton className="inline-flex w-full justify-end sm:w-auto">
                                      <span className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                                        <MoreVertical className="size-4" />
                                      </span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                      <DropdownMenuLabel>Program actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="gap-2"
                                        onClick={() =>
                                          navigate(`/dashboard/courses?programId=${encodeURIComponent(program.id)}`)
                                        }
                                      >
                                        <BookOpen className="size-4 shrink-0" />
                                        Manage courses
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="gap-2"
                                        onClick={() => {
                                          setEditingProgramId(program.id)
                                          setProgramForm(toProgramFormState(program))
                                          setProgramFormErrors({})
                                          setSheetMode("settings")
                                        }}
                                      >
                                        <Layers3 className="size-4 shrink-0" />
                                        Edit program
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="gap-2"
                                        onClick={() => {
                                          void runAsyncAction(async () => {
                                            await handleTogglePublished(program)
                                          })
                                        }}
                                      >
                                        <CalendarRange className="size-4 shrink-0" />
                                        {program.isPublished ? "Unpublish program" : "Publish program"}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        variant="destructive"
                                        className="gap-2"
                                        onClick={() => {
                                          void runAsyncAction(async () => {
                                            await handleDeleteProgram(program.id)
                                          })
                                        }}
                                      >
                                        <Trash2 className="size-4 shrink-0" />
                                        Delete program
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                errors={programFormErrors}
                onSubmit={() => {
                  void runAsyncAction(handleCreateProgram)
                }}
                submitLabel="Create Program"
              />
            </>
          ) : null}

          {sheetMode === "settings" && editingProgramId ? (
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
                errors={programFormErrors}
                onSubmit={() => {
                  void runAsyncAction(handleSaveProgramSettings)
                }}
                submitLabel="Save Changes"
              />
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
