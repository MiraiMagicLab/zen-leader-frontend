import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import {
  BookOpen,
  FolderKanban,
  Layers3,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { formatUtcDate } from "@/lib/time"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sheetMode, setSheetMode] = useState<ProgramSheetMode>(null)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
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
      ? (await assetApi.uploadLessonAsset(programForm.thumbnailFile)).url
      : programForm.thumbnailUrl.trim() || null
  }
  async function handleCreateProgram() {
    if (isSubmitting) return
    const nextErrors = validateProgramForm(programForm)
    if (Object.keys(nextErrors).length)
      return void setProgramFormErrors(nextErrors)
    setIsSubmitting(true)
    try {
      const thumbnailUrl = await resolveProgramThumbnailUrl()
      const created = await programApi.create(
        toProgramPayload({ ...programForm, thumbnailUrl: thumbnailUrl ?? "" }),
      )
      setPrograms((current) => [created, ...current])
      setSheetMode(null)
      toast.success("New program created.")
      navigate(`/dashboard/programs/${created.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create program.")
    } finally {
      setIsSubmitting(false)
    }
  }
  async function handleSaveProgramSettings() {
    if (isSubmitting) return
    const editingProgram = programs.find((p) => p.code === programForm.code)
    if (!editingProgram) return
    const nextErrors = validateProgramForm(programForm)
    if (Object.keys(nextErrors).length)
      return void setProgramFormErrors(nextErrors)
    setIsSubmitting(true)
    try {
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update program.")
    } finally {
      setIsSubmitting(false)
    }
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search programs..."
            className="pl-9"
          />
        </div>
      </div>
      <div className="rounded-md bg-background border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-6 h-12 w-16">STT</TableHead>
              <TableHead className="px-6 h-12">Program</TableHead>
              <TableHead className="px-6 h-12">Created</TableHead>
              <TableHead className="px-6 h-12">Updated</TableHead>
              <TableHead className="px-6 h-12">Status</TableHead>
              <TableHead className="px-6 h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {paginatedPrograms.length ? (
                paginatedPrograms.map((program, idx) => (
                  <TableRow key={program.id} className="hover:bg-muted/40">
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted">
                          {program.thumbnailUrl ? (
                            <img
                              src={program.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FolderKanban className="h-5 w-5 text-muted-foreground/70" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
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
                          {program.description ? (
                            <div className="text-xs text-muted-foreground truncate">
                              {program.description}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {formatUtcDate(program.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {formatUtcDate(program.updatedAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant={program.isPublished ? "default" : "secondary"}
                      >
                        {program.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/programs/${program.id}`)}
                        >
                          <BookOpen className="mr-2 size-4" />
                          Courses
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setProgramForm(toProgramFormState(program))
                            setSheetMode("settings")
                          }}
                        >
                          <Layers3 className="mr-2 size-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setProgramToDelete(program)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
        isSubmitting={isSubmitting}
        onSubmit={
          sheetMode === "create"
            ? handleCreateProgram
            : handleSaveProgramSettings
        }
      />

      <AlertDialog open={!!programToDelete} onOpenChange={(open) => (!open ? setProgramToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete program?</AlertDialogTitle>
            <AlertDialogDescription>
              {programToDelete
                ? `This will permanently delete "${programToDelete.title}".`
                : "This will permanently delete the program."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (!programToDelete) return
                void programApi
                  .remove(programToDelete.id)
                  .then(() => {
                    setPrograms((current) => current.filter((p) => p.id !== programToDelete.id))
                    toast.success("Program deleted.")
                    setProgramToDelete(null)
                  })
                  .catch((err) => {
                    const message = err instanceof Error ? err.message : "Failed to delete program."
                    toast.error(message)
                  })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
