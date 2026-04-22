import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, Clock3, Search, Workflow } from "lucide-react"

import { courseRunApi, courseApi, type CourseRunResponse, type CourseResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search run code or course title..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md bg-background border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-6 h-12 w-16">STT</TableHead>
              <TableHead className="px-6 h-12">Run</TableHead>
              <TableHead className="px-6 h-12">Course</TableHead>
              <TableHead className="px-6 h-12">Schedule</TableHead>
              <TableHead className="px-6 h-12">Chapters</TableHead>
              <TableHead className="px-6 h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filtered.length ? filtered.map((run, idx) => {
                const course = courseMap.get(run.courseId)
                return (
                  <TableRow key={run.id} className="hover:bg-muted/40">
                    <TableCell className="px-6 py-4 text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold">{run.code}</div>
                        <Badge variant={run.status === "PUBLISHED" ? "default" : "secondary"}>{run.status}</Badge>
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
                        <Clock3 className="size-4" /> {formatRange(run.startsAt, run.endsAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary">{run.chapters.length}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
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
      </div>
    </div>
  )
}
