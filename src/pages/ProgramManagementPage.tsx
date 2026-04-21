import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import {
  BookOpen,
  FolderKanban,
  Layers3,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { formatNumber } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"
import { SmartPagination } from "@/components/common/SmartPagination"
import {
  ProgramUpsertSheet,
  type ProgramFormErrors,
  type ProgramFormState,
  type ProgramSheetMode,
} from "@/components/programs/ProgramUpsertSheet"

type Program = ProgramResponse
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
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000),
  thumbnailFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_THUMBNAIL_SIZE)
    .nullable(),
})

function validateProgramForm(form: ProgramFormState): ProgramFormErrors {
  const result = programFormSchema.safeParse(form)
  if (result.success) return {}
  const f = result.error.flatten().fieldErrors
  return {
    code: f.code?.[0],
    title: f.title?.[0],
    description: f.description?.[0],
    thumbnailFile: f.thumbnailFile?.[0],
  }
}

function countCourseRuns(program: Program) {
  return program.courses.reduce(
    (total, course) => total + course.courseRuns.length,
    0,
  )
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
function toProgramPayload(
  form: ProgramFormState,
  publishedAt?: string | null,
): ProgramUpsertRequest {
  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim(),
    description: form.description.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    isPublished: form.isPublished,
    publishedAt: form.isPublished
      ? (publishedAt ?? new Date().toISOString())
      : null,
  }
}

export default function ProgramManagementPage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetMode, setSheetMode] = useState<ProgramSheetMode>(null)
  const [filterSearch, setFilterSearch] = useState("")
  const [programForm, setProgramForm] =
    useState<ProgramFormState>(EMPTY_PROGRAM_FORM)
  const [programFormErrors, setProgramFormErrors] = useState<ProgramFormErrors>(
    {},
  )
  const [page, setPage] = useState(1)
  const limit = 10

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setPrograms(await programApi.getAll())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load programs.")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredPrograms = useMemo(
    () =>
      programs.filter((program) => {
        const search = filterSearch.trim().toLowerCase()
        return (
          !search ||
          program.title.toLowerCase().includes(search) ||
          program.code.toLowerCase().includes(search)
        )
      }),
    [filterSearch, programs],
  )
  useEffect(() => {
    setPage(1)
  }, [filterSearch])
  const paginatedPrograms = filteredPrograms.slice(
    (page - 1) * limit,
    page * limit,
  )
  const totalPages = Math.ceil(filteredPrograms.length / limit)

  async function resolveProgramThumbnailUrl() {
    return programForm.thumbnailFile
      ? (await assetApi.upload(programForm.thumbnailFile)).url
      : programForm.thumbnailUrl.trim() || null
  }
  async function handleCreateProgram() {
    const nextErrors = validateProgramForm(programForm)
    if (Object.keys(nextErrors).length)
      return void setProgramFormErrors(nextErrors)
    const thumbnailUrl = await resolveProgramThumbnailUrl()
    const created = await programApi.create(
      toProgramPayload({ ...programForm, thumbnailUrl: thumbnailUrl ?? "" }),
    )
    setPrograms((current) => [created, ...current])
    setSheetMode(null)
    toast.success("New program created.")
    navigate(`/dashboard/programs/${created.id}`)
  }
  async function handleSaveProgramSettings() {
    const editingProgram = programs.find((p) => p.code === programForm.code)
    if (!editingProgram) return
    const nextErrors = validateProgramForm(programForm)
    if (Object.keys(nextErrors).length)
      return void setProgramFormErrors(nextErrors)
    const thumbnailUrl = await resolveProgramThumbnailUrl()
    const updated = await programApi.update(
      editingProgram.id,
      toProgramPayload(
        { ...programForm, thumbnailUrl: thumbnailUrl ?? "" },
        editingProgram.publishedAt,
      ),
    )
    setPrograms((current) =>
      current.map((p) => (p.id === updated.id ? updated : p)),
    )
    setSheetMode(null)
    toast.success("Program updated.")
  }

  if (loading && programs.length === 0) return <PageLoading />

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Programs"
        subtitle="Manage top-level program containers and publication state."
        stats={[
          { label: "Programs", value: formatNumber(programs.length) },
          {
            label: "Published",
            value: formatNumber(programs.filter((p) => p.isPublished).length),
          },
        ]}
        actions={
          <Button
            onClick={() => {
              setProgramForm(EMPTY_PROGRAM_FORM)
              setSheetMode("create")
            }}
          >
            <Plus className="mr-2 size-4" /> Create Program
          </Button>
        }
      />
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search programs..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead>Program</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPrograms.length ? (
              paginatedPrograms.map((program) => (
                <TableRow key={program.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
                        <FolderKanban className="size-5" />
                      </div>
                      <div>
                        <button
                          className="font-semibold hover:text-primary"
                          onClick={() =>
                            navigate(`/dashboard/programs/${program.id}`)
                          }
                        >
                          {program.title}
                        </button>
                        <div className="text-xs text-muted-foreground font-mono">
                          {program.code}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{program.courses.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {countCourseRuns(program)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={program.isPublished ? "default" : "outline"}
                    >
                      {program.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/dashboard/programs/${program.id}`)
                          }
                        >
                          <BookOpen className="mr-2 size-4" /> View courses
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setProgramForm(toProgramFormState(program))
                            setSheetMode("settings")
                          }}
                        >
                          <Layers3 className="mr-2 size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={async () => {
                            if (!confirm("Delete this program?")) return
                            await programApi.remove(program.id)
                            setPrograms((current) =>
                              current.filter((p) => p.id !== program.id),
                            )
                            toast.success("Program deleted.")
                          }}
                        >
                          <Trash2 className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  No programs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <SmartPagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredPrograms.length}
        onPageChange={setPage}
        itemName="programs"
      />
      <ProgramUpsertSheet
        open={sheetMode !== null}
        mode={sheetMode}
        form={programForm}
        errors={programFormErrors}
        onChange={setProgramForm}
        onOpenChange={(open) => !open && setSheetMode(null)}
        onSubmit={
          sheetMode === "create"
            ? handleCreateProgram
            : handleSaveProgramSettings
        }
      />
    </div>
  )
}
