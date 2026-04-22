import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, CalendarRange, ChevronRight, Clock3, Search, Workflow } from "lucide-react"

import { courseRunApi, courseApi, type CourseRunResponse, type CourseResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { PageLoading } from "@/components/common/PageLoading"
import { formatNumber } from "@/lib/utils"

function formatRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Not scheduled"
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${startsAt ? fmt.format(new Date(startsAt)) : "TBD"} → ${endsAt ? fmt.format(new Date(endsAt)) : "TBD"}`
}

export default function CourseRunManagementPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<CourseRunResponse[]>([])
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let mounted = true
    Promise.all([courseRunApi.getAll(), courseApi.getAll()])
      .then(([runList, courseList]) => {
        if (!mounted) return
        setRuns(runList)
        setCourses(courseList)
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return runs.filter((run) => {
      const course = courseMap.get(run.courseId)
      return !keyword || run.code.toLowerCase().includes(keyword) || course?.title.toLowerCase().includes(keyword) || course?.code.toLowerCase().includes(keyword)
    })
  }, [courseMap, runs, search])

  if (loading) return <PageLoading />

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/programs" className="hover:text-primary">Programs</Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">Course Runs</span>
      </div>

      <PageHeader
        title="Course Runs"
        subtitle="Manage scheduled cohorts, operating windows, and curriculum workbenches."
        stats={[{ label: "Runs", value: formatNumber(runs.length) }, { label: "Courses", value: formatNumber(courses.length) }]}
        actions={<Button onClick={() => navigate("/dashboard/programs")}><Workflow className="mr-2 size-4" /> Browse Courses</Button>}
      />

      <Card className="border shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search run code or course title..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">STT</TableHead>
                <TableHead>Run</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Chapters</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? filtered.map((run, idx) => {
                const course = courseMap.get(run.courseId)
                return (
                  <TableRow key={run.id} className="hover:bg-muted/40">
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold">{run.code}</div>
                        <Badge variant={run.status === "PUBLISHED" ? "default" : "secondary"}>{run.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">{course?.title ?? "Unknown course"}</div>
                        <div className="text-xs text-muted-foreground">{course?.code ?? run.courseId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock3 className="size-4" /> {formatRange(run.startsAt, run.endsAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{run.chapters.length}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => navigate(`/dashboard/runs/${run.id}`)}>Open detail</Button>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No course runs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
