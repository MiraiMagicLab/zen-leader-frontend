import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { AlertCircle, BookOpen, CalendarRange, FolderKanban, ImageOff, Layers3, MoreVertical, Plus, Search, Trash2 } from "lucide-react"

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"
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
import { PageLoading } from "@/components/common/PageLoading"
import { cn } from "@/lib/utils"

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
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 pb-4 no-scrollbar">
        <div className="space-y-2">
          <Label htmlFor="program-code" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program code</Label>
          <Input
            id="program-code"
            value={form.code}
            aria-invalid={Boolean(errors.code)}
            onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })}
            placeholder="EXEC-LEAD-2026"
            className="h-10 rounded-xl border-transparent bg-muted/50 font-mono font-semibold focus:border-primary/20 focus:bg-background"
          />
          {errors.code ? <p className="text-xs text-error font-bold ml-1">{errors.code}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-title" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program title</Label>
          <Input
            id="program-title"
            value={form.title}
            aria-invalid={Boolean(errors.title)}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="Zenith Executive Leadership"
            className="h-10 rounded-xl border-transparent bg-muted/50 font-semibold focus:border-primary/20 focus:bg-background"
          />
          {errors.title ? <p className="text-xs text-error font-bold ml-1">{errors.title}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-thumbnail" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program thumbnail</Label>
          <div className="space-y-4">
            {(thumbnailPreview || form.thumbnailUrl) ? (
              <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/50">
                <img
                  alt="Program thumbnail preview"
                  src={thumbnailPreview ?? form.thumbnailUrl}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/40 p-4 text-center text-sm">
                <ImageOff className="mb-3 size-8 text-muted-foreground/70" />
                <p className="text-muted-foreground font-bold tracking-tight">No representation image.</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/80">Please upload a visual baseline.</p>
              </div>
            )}

            <div className="relative">
              <Input
                id="program-thumbnail"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  onChange({ ...form, thumbnailFile: file })
                }}
                className="h-10 cursor-pointer rounded-xl border-transparent bg-muted/50 file:mr-4 file:rounded-md file:border-none file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:uppercase file:text-primary-foreground focus:border-primary/20 focus:bg-background"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl font-bold h-9 text-error hover:bg-error/10 hover:text-error"
                onClick={() => onChange({ ...form, thumbnailFile: null, thumbnailUrl: "" })}
              >
                Reset Visuals
              </Button>
              <p className="self-center text-xs italic text-muted-foreground">
                Max 5MB. Existing images are preserved if no new file is uploaded.
              </p>
            </div>
            {errors.thumbnailFile ? <p className="text-xs text-error font-bold ml-1">{errors.thumbnailFile}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description" className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
          <Textarea
            id="program-description"
            value={form.description}
            aria-invalid={Boolean(errors.description)}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="Describe the program and who it is for."
            className="min-h-[140px] rounded-xl border-transparent bg-muted/50 font-medium leading-relaxed focus:border-primary/20 focus:bg-background"
          />
          {errors.description ? <p className="text-xs text-error font-bold ml-1">{errors.description}</p> : null}
        </div>

        <div className="mt-4 rounded-xl border border-border/40 bg-muted/60 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="program-published" className="text-sm font-semibold text-foreground">Public Visibility</Label>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Published programs are accessible in the LMS hierarchy and can host active course runs.
              </p>
            </div>
            <Switch
              id="program-published"
              checked={form.isPublished}
              onCheckedChange={(checked) => onChange({ ...form, isPublished: checked })}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

      <SheetFooter className="mt-8 border-t border-border pt-8">
        <Button
          type="submit"
          disabled={isInvalid}
          className="h-10 w-full rounded-xl text-xs font-semibold uppercase tracking-wide"
        >
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
    return <PageLoading />
  }

  return (
    <>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Program Management</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Top-level hierarchy management. {programs.length} programs registered, {publishedPrograms} active.
            </p>
          </div>
          <Button
            onClick={openCreateSheet}
            size="lg"
            className="gap-2"
          >
            <Plus className="size-6" />
            New Program
          </Button>
        </div>

        {error ? (
          <Card className="border-error/20 bg-error/5 rounded-xl shadow-sm">
            <CardContent className="py-4 text-sm text-error font-bold flex items-center gap-3">
              <AlertCircle className="size-4" />
              {error}
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <CardHeader className="p-6 pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold tracking-tight">Programs</CardTitle>
                <CardDescription className="text-sm font-medium opacity-70">
                  Manage program information and visibility.
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 min-w-0 lg:min-w-[600px]">
                <div className="relative flex-1 group">
                  <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={filterSearch}
                    onChange={(event) => setFilterSearch(event.target.value)}
                    placeholder="Search by code or title..."
                    className="h-10 rounded-xl border-transparent bg-muted/40 pl-10 font-medium focus:border-primary/20 focus:bg-background"
                  />
                </div>

                <div className="w-full sm:w-[220px]">
                  <Select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value as ProgramFilterStatus)}
                    className="h-10 rounded-xl border-input bg-background px-4 text-sm"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <Table className="w-full text-left">
                <TableHeader className="border-y border-border/40 bg-muted/60 text-xs uppercase text-muted-foreground">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="px-8 py-6 font-semibold">Program</TableHead>
                    <TableHead className="px-6 py-6 text-center font-semibold sm:text-left">Courses</TableHead>
                    <TableHead className="px-6 py-6 text-center font-semibold sm:text-left">Runs</TableHead>
                    <TableHead className="px-6 py-6 font-semibold">Status</TableHead>
                    <TableHead className="px-8 py-6 text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/20">
                  {filteredPrograms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <FolderKanban className="size-16 mb-2 text-muted-foreground/70" />
                          <p className="text-xl font-semibold">No matching programs</p>
                          <p className="text-sm text-muted-foreground">Try changing your search or filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrograms.map((program) => {
                      return (
                        <TableRow key={program.id} className="group border-none hover:bg-muted/40">
                          <TableCell className="px-8 py-7">
                            <div className="flex items-start gap-5">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                                <FolderKanban className="size-6 shrink-0" />
                              </div>
                              <div className="min-w-0 space-y-2">
                                <button
                                  type="button"
                                  className="truncate text-left text-base font-semibold text-foreground hover:text-primary transition-colors"
                                  onClick={() => navigate(`/dashboard/programs/${program.id}/courses`)}
                                >
                                  {program.title}
                                </button>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="rounded-md border-border/60 px-2 py-0 font-mono text-xs text-muted-foreground/80">{program.code}</Badge>
                                  {program.isPublished ? (
                                    <Badge className="rounded-sm border-none bg-primary/15 px-2 py-0.5 text-xs text-primary">Active</Badge>
                                  ) : null}
                                </div>
                                {program.description ? (
                                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80 font-medium font-body max-w-[400px]">
                                    {program.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-7 text-center sm:text-left">
                            <div className="inline-flex size-10 rounded-xl bg-muted/40 items-center justify-center font-semibold text-foreground ring-1 ring-border/20">
                              {program.courses.length}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-7 text-center sm:text-left">
                            <div className="inline-flex size-10 rounded-xl bg-muted/40 items-center justify-center font-semibold text-foreground ring-1 ring-border/20">
                              {countCourseRuns(program)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-7">
                            <div className="flex items-start">
                              <Badge variant={program.isPublished ? "secondary" : "outline"} className={cn(
                                "rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide shadow-none",
                                program.isPublished ? "bg-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground/80 border-border"
                              )}>
                                {program.isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-8 py-7 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex size-10 items-center justify-center rounded-xl border border-transparent hover:bg-muted hover:border-border/40 transition-colors">
                                <span className="sr-only">Open actions</span>
                                <MoreVertical className="size-5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64 rounded-xl border-border p-2">
                                <DropdownMenuLabel className="px-4 py-3 text-xs text-muted-foreground/80">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="opacity-50" />
                                <DropdownMenuItem
                                  className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  onClick={() =>
                                    navigate(`/dashboard/programs/${program.id}/courses`)
                                  }
                                >
                                  <BookOpen className="size-5 shrink-0" />
                                  Open courses
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  onClick={() => {
                                    setEditingProgramId(program.id)
                                    setProgramForm(toProgramFormState(program))
                                    setProgramFormErrors({})
                                    setSheetMode("settings")
                                  }}
                                >
                                  <Layers3 className="size-5 shrink-0" />
                                  Edit program
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  onClick={() => {
                                    void runAsyncAction(async () => {
                                      await handleTogglePublished(program)
                                    })
                                  }}
                                >
                                  <CalendarRange className="size-5 shrink-0" />
                                  {program.isPublished ? "Move to draft" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 opacity-50" />
                                <DropdownMenuItem
                                  variant="destructive"
                                  className="rounded-xl px-4 py-4 font-bold gap-4 cursor-pointer"
                                  onClick={() => {
                                    void runAsyncAction(async () => {
                                      await handleDeleteProgram(program.id)
                                    })
                                  }}
                                >
                                  <Trash2 className="size-5 shrink-0" />
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
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetMode !== null} onOpenChange={(open) => !open && setSheetMode(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[540px] border-l-border bg-background p-0">
          <div className="h-full flex flex-col p-6 items-start">
            <div className="w-full mb-8">
              <SheetHeader className="space-y-4">
                <div className="flex size-16 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <FolderKanban className="size-8" />
                </div>
                <SheetTitle className="text-2xl font-semibold tracking-tight">
                  {sheetMode === "create" ? "Create Program" : "Edit Program"}
                </SheetTitle>
                <SheetDescription className="text-sm font-medium leading-relaxed max-w-[420px]">
                  {sheetMode === "create"
                    ? "Add a new program to organize courses and runs."
                    : "Update program details and visibility settings."}
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="flex-1 w-full no-scrollbar">
              {sheetMode === "create" ? (
                <ProgramForm
                  form={programForm}
                  onChange={setProgramForm}
                  errors={programFormErrors}
                  onSubmit={() => {
                    void runAsyncAction(handleCreateProgram)
                  }}
                  submitLabel="Create Program"
                />
              ) : null}

              {sheetMode === "settings" && editingProgramId ? (
                <ProgramForm
                  form={programForm}
                  onChange={setProgramForm}
                  errors={programFormErrors}
                  onSubmit={() => {
                    void runAsyncAction(handleSaveProgramSettings)
                  }}
                  submitLabel="Save Changes"
                />
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
