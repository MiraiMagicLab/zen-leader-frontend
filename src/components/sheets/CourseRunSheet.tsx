import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  Users,
  IdCard,
} from "lucide-react"
import {
  courseApi,
  userApi,
  enrollmentApi
} from "@/lib/api"
import {
  useCourseRun,
  useUpdateCourseRun
} from "@/lib/api/services/lms"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SyllabusTab } from "@/components/course-runs/SyllabusTab"
import { EnrollmentTab } from "@/components/course-runs/EnrollmentTab"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/common/PageLoading"
import { PageHeader } from "@/components/common/PageHeader"
import { formatNumber } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useState } from "react"

export default function CourseRunSheet() {
  const navigate = useNavigate()
  const { runId } = useParams<{ runId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "syllabus"
  const [open, setOpen] = useState(true)

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

  const queryUsers = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.getUsers({ page: 1, size: 200 }).then(p => p.data),
  })

  const toggleStatus = async () => {
    if (!run || updateStatusMutation.isPending) return
    const nextStatus = run.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    try {
      await updateStatusMutation.mutateAsync({
        id: run.id,
        data: {
          ...run,
          status: nextStatus,
          startsAt: run.startsAt || new Date().toISOString(),
          endsAt: run.endsAt || new Date().toISOString(),
        }
      })
      toast.success(`Status updated to ${nextStatus}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status."
      toast.error(message)
    }
  }

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const formatDateTime = (val: string | null) => {
    if (!val) return "—"
    return new Date(val).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  if (queryRun.isLoading) {
    return <PageLoading />
  }

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

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate(-1)
      }}
    >
      <SheetContent className="!w-full sm:!max-w-[900px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>{run.code}</SheetTitle>
          <SheetDescription>
            {run.startsAt ? `${formatDateTime(run.startsAt)} → ${formatDateTime(run.endsAt)}` : "No schedule defined"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 flex flex-col gap-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard/programs" className="hover:text-primary transition-colors">Programs</Link>
              <ChevronRight className="size-4" />
              {queryCourse.data && (
                <>
                  <Link to={`/dashboard/programs/${queryCourse.data.programId}`} className="hover:text-primary transition-colors">
                    Program
                  </Link>
                  <ChevronRight className="size-4" />
                  <Link to={`/dashboard/courses/${queryCourse.data.id}`} className="max-w-[200px] truncate hover:text-primary transition-colors">
                    {queryCourse.data.title}
                  </Link>
                  <ChevronRight className="size-4" />
                </>
              )}
              <span className="text-foreground font-bold">{run.code}</span>
            </div>

            <PageHeader
              title={run.code}
              subtitle={run.startsAt ? `${formatDateTime(run.startsAt)} → ${formatDateTime(run.endsAt)}` : "No schedule defined"}
              stats={[
                { label: "Students", value: formatNumber(queryEnrollments.data?.length ?? 0) },
                { label: "Chapters", value: formatNumber(run.chapters.length) }
              ]}
              actions={
                <div className="flex gap-3">
                  <Button
                    variant={run.status === "PUBLISHED" ? "default" : "secondary"}
                    onClick={toggleStatus}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      run.status === "PUBLISHED"
                        ? <CheckCircle2 className="mr-2 size-4" />
                        : <AlertCircle className="mr-2 size-4" />
                    )}
                    {run.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => queryRun.refetch()}>
                    <RefreshCw className="size-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                  </Button>
                </div>
              }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6 h-12 w-full justify-start">
                <TabsTrigger value="syllabus" className="flex-1 lg:flex-none">
                  <BookOpen className="mr-2 size-4" />
                  Syllabus
                </TabsTrigger>
                <TabsTrigger value="enrollment" className="flex-1 lg:flex-none">
                  <Users className="mr-2 size-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="info" className="flex-1 lg:flex-none">
                  <Info className="mr-2 size-4" />
                  Overview
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="syllabus" className="focus-visible:outline-none">
                  <SyllabusTab runId={run.id} />
                </TabsContent>

                <TabsContent value="enrollment" className="focus-visible:outline-none">
                  <EnrollmentTab
                    runId={run.id}
                    enrollments={queryEnrollments.data ?? []}
                    users={queryUsers.data ?? []}
                    loading={queryEnrollments.isLoading}
                    onRefresh={() => queryEnrollments.refetch()}
                  />
                </TabsContent>

                <TabsContent value="info" className="focus-visible:outline-none">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <IdCard className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">System Identifiers</CardTitle>
                            <CardDescription>Internal record details</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Run ID</p>
                          <code className="block p-3 rounded-lg bg-muted text-xs font-mono break-all border">{run.id}</code>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Timezone</p>
                            <p className="text-sm font-semibold">{run.timezone || "UTC+7"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created At</p>
                            <p className="text-sm font-semibold">{new Date(run.createdAt).toLocaleDateString("en-US")}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Calendar className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Schedule Timeline</CardTitle>
                            <CardDescription>Important program milestones</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 flex size-2 rounded-full bg-primary" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Launch Date</p>
                            <p className="text-sm font-semibold">{formatDateTime(run.startsAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="mt-1 flex size-2 rounded-full bg-destructive" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Completion Date</p>
                            <p className="text-sm font-semibold">{formatDateTime(run.endsAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
