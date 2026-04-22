import { Link, useNavigate, useParams } from "react-router-dom"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { courseApi, enrollmentApi } from "@/lib/api"
import { useCourseRun, useUpdateCourseRun } from "@/lib/api/services/lms"
import { SyllabusTab } from "@/components/course-runs/SyllabusTab"
import { PageLoading } from "@/components/common/PageLoading"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatNumber } from "@/lib/utils"
import { formatUtcDateTime } from "@/lib/time"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function CourseRunDetailPage() {
  const navigate = useNavigate()
  const { runId } = useParams<{ runId: string }>()
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)

  const queryRun = useCourseRun(runId)
  const run = queryRun.data
  const updateStatusMutation = useUpdateCourseRun()

  const queryCourse = useQuery({
    queryKey: ["course", run?.courseId],
    queryFn: () => courseApi.getById(run!.courseId),
    enabled: !!run?.courseId,
  })

  const queryEnrollments = useQuery({
    queryKey: ["enrollments", runId],
    queryFn: () => enrollmentApi.getByCourseRun(runId!),
    enabled: !!runId,
  })

  const nextStatus = useMemo(() => {
    if (!run) return null
    return run.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
  }, [run])

  const toggleStatus = async () => {
    if (!run || updateStatusMutation.isPending) return
    if (!nextStatus) return
    try {
      await updateStatusMutation.mutateAsync({
        id: run.id,
        data: {
          courseId: run.courseId,
          code: run.code,
          status: nextStatus,
          startsAt: run.startsAt || new Date().toISOString(),
          endsAt: run.endsAt || new Date().toISOString(),
          timezone: run.timezone ?? "UTC",
          metadata: run.metadata ?? {},
        },
      })
      toast.success(`Status updated to ${nextStatus}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status."
      toast.error(message)
    }
  }

  if (queryRun.isLoading) return <PageLoading />

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="size-14 text-muted" />
        <p className="text-muted-foreground font-semibold">Course run not found.</p>
        <Button variant="link" onClick={() => navigate(-1)} className="font-bold">
          Go back
        </Button>
      </div>
    )
  }

  const subtitle =
    run.startsAt && run.endsAt
      ? `${formatUtcDateTime(run.startsAt)} → ${formatUtcDateTime(run.endsAt)}`
      : "No schedule defined"

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/programs" className="hover:text-primary transition-colors">
          Programs
        </Link>
        <ChevronRight className="size-4" />
        {queryCourse.data ? (
          <>
            <Link
              to={`/dashboard/programs/${queryCourse.data.programId}`}
              className="hover:text-primary transition-colors"
            >
              Program
            </Link>
            <ChevronRight className="size-4" />
            <Link
              to={`/dashboard/courses/${queryCourse.data.id}`}
              className="max-w-[220px] truncate hover:text-primary transition-colors"
            >
              {queryCourse.data.title}
            </Link>
            <ChevronRight className="size-4" />
          </>
        ) : null}
        <span className="text-foreground font-semibold">{run.code}</span>
      </div>

      <PageHeader
        title={run.code}
        subtitle={subtitle}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/dashboard/runs/${run.id}/edit`)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
            <Button
              variant={run.status === "PUBLISHED" ? "default" : "secondary"}
              onClick={() => setConfirmStatusOpen(true)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : run.status === "PUBLISHED" ? (
                <CheckCircle2 className="mr-2 size-4" />
              ) : (
                <AlertCircle className="mr-2 size-4" />
              )}
              {run.status === "PUBLISHED" ? "Published" : "Draft"}
            </Button>
            <Button variant="outline" size="icon" onClick={() => queryRun.refetch()} aria-label="Refresh">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        }
      />

      <ScrollArea className="w-full">
        <div className="pb-10 space-y-6">
          <SyllabusTab runId={run.id} />

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div>Students: {formatNumber(queryEnrollments.data?.length ?? 0)}</div>
              <div>Chapters: {formatNumber(run.chapters.length)}</div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <AlertDialog open={confirmStatusOpen} onOpenChange={setConfirmStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change status?</AlertDialogTitle>
            <AlertDialogDescription>
              {nextStatus
                ? `This will update the course run status to ${nextStatus}.`
                : "This will update the course run status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateStatusMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                void toggleStatus().finally(() => setConfirmStatusOpen(false))
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

