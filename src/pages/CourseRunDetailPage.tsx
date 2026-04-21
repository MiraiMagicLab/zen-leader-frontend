import { motion } from "framer-motion"
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

export default function CourseRunDetailPage() {
  const navigate = useNavigate()
  const { runId } = useParams<{ runId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "syllabus"

  // TanStack Query Hooks
  const queryRun = useCourseRun(runId)
  const run = queryRun.data

  const updateStatusMutation = useUpdateCourseRun()

  // Additional Queries (Enrollments, Course Info, Users)
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
    } catch (err: any) {
      toast.error(err.message)
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/courses" className="hover:text-primary transition-colors font-medium">Courses</Link>
        <ChevronRight className="size-4" />
        {queryCourse.data ? (
          <Link to={`/dashboard/courses/${queryCourse.data.id}`} className="hover:text-primary transition-colors truncate max-w-40 font-medium">
            {queryCourse.data.title}
          </Link>
        ) : (
          <span className="truncate max-w-40 font-medium">Course</span>
        )}
        <ChevronRight className="size-4" />
        <span className="text-foreground font-bold truncate max-w-50">{run.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant={run.status === "PUBLISHED" ? "default" : "secondary"}
              size="sm"
              onClick={toggleStatus}
              disabled={updateStatusMutation.isPending}
              className="h-7 rounded-full px-3 text-xs uppercase tracking-wide"
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                run.status === "PUBLISHED"
                  ? <CheckCircle2 className="size-3" />
                  : <AlertCircle className="size-3" />
              )}
              {run.status}
            </Button>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{run.code}</h2>
          <p className="text-muted-foreground font-medium text-sm">
            {run.startsAt ? `${formatDateTime(run.startsAt)} → ${formatDateTime(run.endsAt)}` : "No schedule defined"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryRun.refetch()}
            className="h-10 w-10 rounded-xl"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-10 px-4 rounded-xl font-bold flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Tabs list */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 h-11 w-full justify-start gap-1 rounded-lg border bg-muted/40 p-1">
          {[
            { value: "syllabus", icon: BookOpen, label: "Syllabus" },
            { value: "enrollment", icon: Users, label: "Students" },
            { value: "info", icon: Info, label: "Overview" },
          ].map(({ value, icon: TabIcon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-9 rounded-md px-4 font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <TabIcon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="outline-none">
          <TabsContent value="syllabus" className="outline-none">
            <SyllabusTab runId={run.id} />
          </TabsContent>

          <TabsContent value="enrollment" className="outline-none">
            <EnrollmentTab
              runId={run.id}
              enrollments={queryEnrollments.data ?? []}
              users={queryUsers.data ?? []}
              loading={queryEnrollments.isLoading}
              onRefresh={() => queryEnrollments.refetch()}
            />
          </TabsContent>

          <TabsContent value="info" className="outline-none">
            <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="bg-muted/40">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <IdCard className="size-4" />
                  </div>
                  <CardTitle>Run Information</CardTitle>
                  <CardDescription>System identifiers and records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Run ID</p>
                    <p className="break-all rounded-md border bg-muted p-3 font-mono text-sm text-foreground/80">{run.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timezone</p>
                      <p className="text-sm font-bold text-foreground">{run.timezone || "UTC"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created At</p>
                      <p className="text-sm font-bold text-foreground">{new Date(run.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-muted/40">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <CardTitle>Schedule Timeline</CardTitle>
                  <CardDescription>Important milestones for this run.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full bg-primary/60 shadow-lg shadow-primary/30" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Launch Date</p>
                        <p className="text-sm font-bold text-foreground">{formatDateTime(run.startsAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full bg-destructive/60 shadow-lg shadow-destructive/30" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completion Date</p>
                        <p className="text-sm font-bold text-foreground">{formatDateTime(run.endsAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  )
}
