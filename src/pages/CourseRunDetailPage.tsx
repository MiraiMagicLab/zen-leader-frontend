import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Eye, Layers3, PlayCircle, Upload, UserPlus, Users } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import FileActionLinks from "@/components/FileActionLinks"
import {
  courseApi,
  courseRunApi,
  enrollmentApi,
  type CourseResponse,
  type CourseRunResponse,
  type EnrollmentImportResponse,
  type EnrollmentResponse,
  type LessonResponse,
  type UserResponse,
  userApi,
} from "@/lib/api"
import { getLessonAsset } from "@/lib/lessonContent"
import { cn } from "@/lib/utils"

function getInitials(name: string | null | undefined) {
  const source = (name ?? "").trim()
  if (!source) return "U"
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Schedule not set"

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const startText = startsAt ? formatter.format(new Date(startsAt)) : "TBD"
  const endText = endsAt ? formatter.format(new Date(endsAt)) : "TBD"
  return `${startText} - ${endText}`
}

function countLessons(run: CourseRunResponse) {
  return run.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)
}

function getRunStatusVariant(status: string) {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
    case "OPEN":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function getLessonVisual(type: string) {
  switch (type) {
    case "video":
      return { icon: PlayCircle, className: "bg-secondary/10 text-secondary" }
    case "photo":
      return { icon: Eye, className: "bg-primary/10 text-primary" }
    default:
      return { icon: Layers3, className: "bg-muted text-muted-foreground" }
  }
}

function LessonPreviewDialog({
  lesson,
  open,
  onOpenChange,
}: {
  lesson: LessonResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!lesson) return null

  const asset = getLessonAsset(lesson.contentData)
  const fileUrl = asset.url
  const fileName = asset.fileName || lesson.title
  const openLabel = lesson.type === "video" ? "Open Video" : lesson.type === "photo" ? "Open Image" : "Open File"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
          <DialogDescription>{lesson.description || "Lesson asset preview."}</DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4">
          {fileUrl ? (
            lesson.type === "video" ? (
              <video controls src={fileUrl} className="max-h-[65vh] w-full rounded-xl bg-black" />
            ) : lesson.type === "photo" ? (
              <img src={fileUrl} alt={lesson.title} className="max-h-[65vh] w-full rounded-xl object-contain" />
            ) : (
              <div className="rounded-xl border border-border bg-muted/20 p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Upload className="size-12 text-muted-foreground" />
                  <p className="max-w-md text-sm text-muted-foreground">
                    This lesson contains an attached file. Open it in a new tab or download it directly.
                  </p>
                  <FileActionLinks
                    url={fileUrl}
                    fileName={fileName}
                    openClassName="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    downloadClassName="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    openLabel={openLabel}
                    downloadLabel="Download"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              No file uploaded for this lesson yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EnrollmentDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  runId: string
  enrollments: EnrollmentResponse[]
  users: UserResponse[]
  loadingEnrollments: boolean
  addingEnrollment: boolean
  importingEnrollments: boolean
  enrollmentError: string
  importResult: EnrollmentImportResponse | null
  enrollmentUserQuery: string
  setEnrollmentUserQuery: (value: string) => void
  selectedUserId: string
  setSelectedUserId: (value: string) => void
  directEmail: string
  setDirectEmail: (value: string) => void
  onManualEnroll: () => void
  onImportFile: (file: File | null) => void
}) {
  const {
    open,
    onOpenChange,
    runId,
    enrollments,
    users,
    loadingEnrollments,
    addingEnrollment,
    importingEnrollments,
    enrollmentError,
    importResult,
    enrollmentUserQuery,
    setEnrollmentUserQuery,
    selectedUserId,
    setSelectedUserId,
    directEmail,
    setDirectEmail,
    onManualEnroll,
    onImportFile,
  } = props

  const enrollmentUserOptions = users.filter((user) => {
    if (!enrollmentUserQuery.trim()) return true
    const query = enrollmentUserQuery.trim().toLowerCase()
    return user.displayName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Enrollments</DialogTitle>
          <DialogDescription>
            Assign users to course run <span className="font-medium text-foreground">{runId}</span> manually or import from Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-4 pb-4">
          <Card>
            <CardContent className="space-y-4 py-1">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Excel import</p>
                <p className="text-sm text-muted-foreground">
                  Header columns supported: <code>email</code>, <code>order_no</code>, <code>amount</code>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  <Upload className="size-4" />
                  Upload Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    disabled={importingEnrollments}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      onImportFile(file)
                      event.currentTarget.value = ""
                    }}
                  />
                </label>
                {importingEnrollments ? <span className="text-sm text-muted-foreground">Importing...</span> : null}
              </div>

              {importResult ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground">
                  Imported rows: {importResult.totalRows} | Success: {importResult.successCount} | Skipped: {importResult.skippedCount} | Failed: {importResult.failedCount}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-1">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Manual enrollment</p>
                <p className="text-sm text-muted-foreground">
                  Search a user or paste an exact email, then add that user into this course run.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={enrollmentUserQuery}
                  onChange={(event) => setEnrollmentUserQuery(event.target.value)}
                  placeholder="Search users by name or email"
                />
                <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="md:col-span-2">
                  <option value="">Select user to enroll</option>
                  {enrollmentUserOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} ({user.email})
                    </option>
                  ))}
                </Select>
                <Input
                  value={directEmail}
                  onChange={(event) => setDirectEmail(event.target.value)}
                  placeholder="Or enter exact email"
                  className="md:col-span-2"
                />
                <div className="flex items-center text-xs text-muted-foreground">
                  Useful when pasting emails from billing sheets.
                </div>
              </div>

              {enrollmentError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {enrollmentError}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrolled users</CardTitle>
              <CardDescription>{enrollments.length} records loaded for this run.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingEnrollments ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  Loading enrollments...
                </div>
              ) : enrollments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  No enrolled users yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <AvatarImage src={row.userAvatarUrl ?? undefined} alt={row.userDisplayName ?? row.userId} />
                              <AvatarFallback>{getInitials(row.userDisplayName ?? row.userEmail ?? row.userId)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{row.userDisplayName ?? row.userId}</p>
                              <p className="text-xs text-muted-foreground">{row.userId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{row.userEmail ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "ACTIVE" ? "secondary" : "outline"}>{row.status}</Badge>
                        </TableCell>
                        <TableCell>{row.enrolmentMethod ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button disabled={addingEnrollment} onClick={onManualEnroll}>
            <UserPlus />
            {addingEnrollment ? "Adding..." : "Add Enrollment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CourseRunDetailPage() {
  const navigate = useNavigate()
  const { runId } = useParams<{ runId: string }>()

  const [run, setRun] = useState<CourseRunResponse | null>(null)
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewLesson, setPreviewLesson] = useState<LessonResponse | null>(null)
  const [openEnrollmentDialog, setOpenEnrollmentDialog] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [addingEnrollment, setAddingEnrollment] = useState(false)
  const [importingEnrollments, setImportingEnrollments] = useState(false)
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [enrollmentUserQuery, setEnrollmentUserQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [directEmail, setDirectEmail] = useState("")
  const [enrollmentError, setEnrollmentError] = useState("")
  const [importResult, setImportResult] = useState<EnrollmentImportResponse | null>(null)

  useEffect(() => {
    if (!runId) return

    courseRunApi.getById(runId)
      .then(async (courseRun) => {
        setRun(courseRun)
        try {
          setCourse(await courseApi.getById(courseRun.courseId))
        } catch {
          setCourse(null)
        }
      })
      .catch(() => {
        setRun(null)
        setCourse(null)
      })
      .finally(() => setLoading(false))
  }, [runId])

  async function loadEnrollments(targetRunId: string) {
    setLoadingEnrollments(true)
    try {
      setEnrollments(await enrollmentApi.getByCourseRun(targetRunId))
    } finally {
      setLoadingEnrollments(false)
    }
  }

  async function loadUsers() {
    const page = await userApi.getUsers({ page: 1, size: 200 })
    setUsers(page.data)
  }

  async function openManageEnrollments() {
    if (!runId) return
    setOpenEnrollmentDialog(true)
    await Promise.all([loadEnrollments(runId), loadUsers()])
  }

  async function handleManualEnroll() {
    if (!runId || addingEnrollment) return

    let targetUserId = selectedUserId
    const normalizedEmail = directEmail.trim().toLowerCase()

    if (!targetUserId && normalizedEmail) {
      const matchedUser = users.find((user) => user.email.toLowerCase() === normalizedEmail)
      if (!matchedUser) {
        setEnrollmentError("Email does not match any user in the system.")
        return
      }
      targetUserId = matchedUser.id
    }

    if (!targetUserId) {
      setEnrollmentError("Select a user or provide an exact email.")
      return
    }

    setAddingEnrollment(true)
    setEnrollmentError("")
    try {
      await enrollmentApi.manualEnroll({ userId: targetUserId, courseRunId: runId })
      await loadEnrollments(runId)
      setSelectedUserId("")
      setEnrollmentUserQuery("")
      setDirectEmail("")
    } catch (error) {
      setEnrollmentError(error instanceof Error ? error.message : "Failed to add enrollment.")
    } finally {
      setAddingEnrollment(false)
    }
  }

  async function handleImportEnrollments(file: File | null) {
    if (!runId || !file || importingEnrollments) return
    setImportingEnrollments(true)
    setEnrollmentError("")
    try {
      const result = await enrollmentApi.importByExcel(runId, file)
      setImportResult(result)
      await loadEnrollments(runId)
    } catch (error) {
      setEnrollmentError(error instanceof Error ? error.message : "Import failed.")
    } finally {
      setImportingEnrollments(false)
    }
  }

  async function toggleStatus() {
    if (!run || publishing) return

    const nextStatus = run.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    setPublishing(true)
    try {
      await courseRunApi.update(run.id, {
        courseId: run.courseId,
        code: run.code,
        status: nextStatus,
        startsAt: run.startsAt ?? new Date().toISOString(),
        endsAt: run.endsAt ?? new Date().toISOString(),
        timezone: run.timezone ?? "UTC",
        metadata: run.metadata ?? {},
      })
      setRun((current) => (current ? { ...current, status: nextStatus } : current))
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading course run</CardTitle>
            <CardDescription>Resolving chapters, lessons, and enrollment state.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Go Back
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-1 text-sm text-destructive">Course run not found.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard/courses" className="transition-colors hover:text-foreground">Courses</Link>
          <span>/</span>
          {course ? (
            <Link to={`/dashboard/courses/${course.id}`} className="transition-colors hover:text-foreground">{course.title}</Link>
          ) : (
            <span>Course</span>
          )}
          <span>/</span>
          <span className="font-medium text-foreground">{run.code}</span>
        </div>

        <section className="rounded-[calc(var(--radius-xl)+6px)] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_10%,white),color-mix(in_srgb,var(--color-secondary-container)_45%,white))] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getRunStatusVariant(run.status)}>{run.status}</Badge>
                <Badge variant="outline">{run.code}</Badge>
                {run.timezone ? <Badge variant="outline">{run.timezone}</Badge> : null}
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">{run.code}</h1>
                <p className="text-sm leading-6 text-foreground/80">{formatDateRange(run.startsAt, run.endsAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft />
                Back
              </Button>
              <Button variant="outline" disabled={publishing} onClick={() => void toggleStatus()}>
                {publishing ? "Updating..." : run.status === "PUBLISHED" ? "Move To Draft" : "Publish Run"}
              </Button>
              <Button onClick={() => void openManageEnrollments()}>
                <Users />
                Manage Enrollments
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Card className="bg-background/90"><CardContent className="py-1"><p className="text-sm text-muted-foreground">Chapters</p><p className="mt-1 text-2xl font-semibold text-foreground">{run.chapters.length}</p></CardContent></Card>
            <Card className="bg-background/90"><CardContent className="py-1"><p className="text-sm text-muted-foreground">Lessons</p><p className="mt-1 text-2xl font-semibold text-foreground">{countLessons(run)}</p></CardContent></Card>
            <Card className="bg-background/90"><CardContent className="py-1"><p className="text-sm text-muted-foreground">Capacity</p><p className="mt-1 text-2xl font-semibold text-foreground">{run.capacity ?? "∞"}</p></CardContent></Card>
            <Card className="bg-background/90"><CardContent className="py-1"><p className="text-sm text-muted-foreground">Enrollment window</p><p className="mt-1 text-sm font-semibold text-foreground">{formatDateRange(run.enrollmentStartDate, run.enrollmentEndDate)}</p></CardContent></Card>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum by chapter</CardTitle>
              <CardDescription>Chapter and lesson content is attached to this course run.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {run.chapters.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                  No chapters in this run yet.
                </div>
              ) : (
                <Accordion>
                  {run.chapters
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((chapter, index) => (
                      <AccordionItem key={chapter.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{chapter.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {chapter.lessons.length} lesson{chapter.lessons.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {chapter.lessons.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                                No lessons in this chapter yet.
                              </div>
                            ) : (
                              chapter.lessons
                                .slice()
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((lesson) => {
                                  const asset = getLessonAsset(lesson.contentData)
                                  const hasFile = Boolean(asset.url)
                                  const visual = getLessonVisual(lesson.type)
                                  const Icon = visual.icon

                                  return (
                                    <div key={lesson.id} className="flex items-center gap-4 rounded-xl border border-border/70 bg-background px-4 py-3">
                                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", visual.className)}>
                                        <Icon className="size-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-medium text-foreground">{lesson.title}</p>
                                          <Badge variant="outline">{lesson.type}</Badge>
                                          {lesson.isOptional ? <Badge variant="outline">Optional</Badge> : null}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{lesson.description || "No lesson description."}</p>
                                      </div>
                                      {hasFile ? (
                                        <Button variant="outline" onClick={() => setPreviewLesson(lesson)}>
                                          <Eye />
                                          Preview
                                        </Button>
                                      ) : null}
                                    </div>
                                  )
                                })
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Run metadata</CardTitle>
                <CardDescription>Operational fields for this run.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Timezone</span><span className="font-medium text-foreground">{run.timezone || "Not set"}</span></div>
                  <Separator />
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Prerequisite run</span><span className="font-medium text-foreground">{run.prerequisiteCourseRunId || "None"}</span></div>
                  <Separator />
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Created</span><span className="font-medium text-foreground">{new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(run.createdAt))}</span></div>
                  <Separator />
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Updated</span><span className="font-medium text-foreground">{new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(run.updatedAt))}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parent course</CardTitle>
                <CardDescription>Context for where this run sits in the LMS.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <p className="font-medium text-foreground">{course?.title || "Unknown course"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{course?.code || run.courseId}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => course && navigate(`/dashboard/courses/${course.id}`)} disabled={!course}>
                  Open Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LessonPreviewDialog lesson={previewLesson} open={Boolean(previewLesson)} onOpenChange={(open) => !open && setPreviewLesson(null)} />
      <EnrollmentDialog
        open={openEnrollmentDialog}
        onOpenChange={setOpenEnrollmentDialog}
        runId={run.id}
        enrollments={enrollments}
        users={users}
        loadingEnrollments={loadingEnrollments}
        addingEnrollment={addingEnrollment}
        importingEnrollments={importingEnrollments}
        enrollmentError={enrollmentError}
        importResult={importResult}
        enrollmentUserQuery={enrollmentUserQuery}
        setEnrollmentUserQuery={setEnrollmentUserQuery}
        selectedUserId={selectedUserId}
        setSelectedUserId={(value) => { setSelectedUserId(value); setEnrollmentError("") }}
        directEmail={directEmail}
        setDirectEmail={(value) => { setDirectEmail(value); setEnrollmentError("") }}
        onManualEnroll={() => void handleManualEnroll()}
        onImportFile={(file) => void handleImportEnrollments(file)}
      />
    </>
  )
}
