import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, Clock3, RefreshCw, Search, Workflow } from "lucide-react"
import { toast } from "sonner"

import { courseApi, courseRunApi, type CourseResponse, type CourseRunResponse } from "@/lib/api"
import { PageHeader } from "@/components/common/PageHeader"
import { PageLoading } from "@/components/common/PageLoading"
import { SmartPagination } from "@/components/common/SmartPagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, formatNumber } from "@/lib/utils"

function formatRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Not scheduled"
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${startsAt ? fmt.format(new Date(startsAt)) : "TBD"} -> ${endsAt ? fmt.format(new Date(endsAt)) : "TBD"}`
}

const PAGE_SIZE = 10

export default function CourseRunManagementPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<CourseRunResponse[]>([])
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [runList, courseList] = await Promise.all([courseRunApi.getAll(), courseApi.getAll()])
        if (!mounted) return
        setRuns(runList)
        setCourses(courseList)
      } catch (loadError) {
        if (!mounted) return
        const message = loadError instanceof Error ? loadError.message : "Failed to load course runs."
        setError(message)
        toast.error(message)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [refreshToken])

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])

  const filteredRuns = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return runs.filter((run) => {
      const course = courseMap.get(run.courseId)
      return (
        !keyword ||
        run.code.toLowerCase().includes(keyword) ||
        course?.title.toLowerCase().includes(keyword) ||
        course?.code.toLowerCase().includes(keyword)
      )
    })
  }, [courseMap, runs, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.ceil(filteredRuns.length / PAGE_SIZE)
  const paginatedRuns = filteredRuns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading && runs.length === 0) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/programs" className="hover:text-primary">Programs</Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">Course Runs</span>
      </div>

      <PageHeader
        title="Course Runs"
        subtitle="Manage scheduled cohorts, operating windows, and course run access in one place."
        stats={[
          { label: "Runs", value: formatNumber(runs.length) },
          { label: "Courses", value: formatNumber(courses.length) },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setRefreshToken((prev) => prev + 1)}
              disabled={loading}
            >
              <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/dashboard/programs")}>
              <Workflow className="mr-2 size-4" />
              Browse Courses
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <div className="group relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search run code or course title..."
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="h-12 w-16 px-6">STT</TableHead>
              <TableHead className="h-12 px-6">Run</TableHead>
              <TableHead className="h-12 px-6">Course</TableHead>
              <TableHead className="h-12 px-6">Schedule</TableHead>
              <TableHead className="h-12 px-6">Chapters</TableHead>
              <TableHead className="h-12 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRuns.length ? (
              paginatedRuns.map((run, idx) => {
                const course = courseMap.get(run.courseId)
                return (
                  <TableRow key={run.id} className="hover:bg-muted/40">
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold">{run.code}</div>
                        <Badge variant={run.status === "PUBLISHED" ? "default" : "secondary"}>
                          {run.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="font-medium">{course?.title ?? "Unknown course"}</div>
                        <div className="text-xs text-muted-foreground">{course?.code ?? run.courseId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock3 className="size-4" />
                        {formatRange(run.startsAt, run.endsAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary">{run.chapters.length}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button variant="outline" onClick={() => navigate(`/dashboard/runs/${run.id}`)}>
                        Open detail
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No course runs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SmartPagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredRuns.length}
        onPageChange={setPage}
        itemName="course runs"
      />
    </div>
  )
}
