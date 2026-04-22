import { useEffect, useMemo, useState, useCallback } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PageLoading } from "@/components/common/PageLoading"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { courseApi, programApi, type CourseResponse, type ProgramResponse } from "@/lib/api"
import { cn, formatNumber } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"
import { SmartPagination } from "@/components/common/SmartPagination"

type CategoryFilter = "ALL" | string

function sortCourses(courses: CourseResponse[]) {
  return [...courses].sort((a, b) => a.orderIndex - b.orderIndex)
}

function countLessons(course: CourseResponse) {
  return course.courseRuns.reduce(
    (total, run) => total + run.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.lessons.length, 0),
    0,
  )
}

function getLevelColor(level: string | null) {
  switch ((level ?? "").toUpperCase()) {
    case "BEGINNER": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "INTERMEDIATE": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "ADVANCED": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

export default function CourseManagementPage() {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()

  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [program, setProgram] = useState<ProgramResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
  const [page, setPage] = useState(1)
  const limit = 10

  const fetchData = useCallback(async () => {
    if (!programId) return
    setLoading(true)
    try {
      const [courseList, programDetail] = await Promise.all([
        courseApi.getAll(programId),
        programApi.getById(programId)
      ])
      setCourses(courseList)
      setProgram(programDetail)
    } catch {
      toast.error("Failed to load courses.")
    } finally {
      setLoading(false)
    }
  }, [programId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const categories = useMemo(() => Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[], [courses])

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return sortCourses(courses).filter((c) => {
      const matchesSearch = !keyword || c.title.toLowerCase().includes(keyword) || c.code.toLowerCase().includes(keyword)
      const matchesCategory = categoryFilter === "ALL" || c.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [categoryFilter, courses, search])

  useEffect(() => { setPage(1) }, [search, categoryFilter])

  const paginatedCourses = filteredCourses.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredCourses.length / limit)

  if (loading && courses.length === 0) return <PageLoading />

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/programs" className="hover:text-primary">Programs</Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{program?.code || "Program"}</span>
      </div>

      <PageHeader
        title={program?.title || "Program Detail"}
        subtitle={program?.description || "Manage the courses inside this program."}
        stats={[
          { label: "Courses", value: formatNumber(courses.length) },
          { label: "Runs", value: formatNumber(courses.reduce((t, c) => t + c.courseRuns.length, 0)) },
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard/programs")}>
              <ArrowLeft className="mr-2 size-4" />
              Programs
            </Button>
            <Button onClick={() => navigate(`/dashboard/programs/${programId}/courses/create`)}>
              <Plus className="mr-2 size-4" />
              Create Course
            </Button>
          </div>
        }
      />

      <Card className="border shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course code or title..." className="pl-9" />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-[220px]">
            <option value="ALL">All categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">STT</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCourses.length ? paginatedCourses.map((course, idx) => (
                <TableRow key={course.id} className="hover:bg-muted/40">
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * limit + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <BookOpen className="size-5 text-muted-foreground" />
                      <div>
                        <button className="font-semibold hover:text-primary" onClick={() => navigate(`/dashboard/courses/${course.id}`)}>{course.title}</button>
                        <div className="text-xs text-muted-foreground font-mono">{course.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{course.courseRuns.length}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{countLessons(course)}</Badge></TableCell>
                  <TableCell>{course.level ? <Badge variant="outline" className={cn("uppercase text-[10px]", getLevelColor(course.level))}>{course.level}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/courses/${course.id}`)}>
                          <Layers3 className="mr-2 size-4" /> Course detail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => {
                          if (!confirm("Delete this course?")) return
                          await courseApi.remove(course.id)
                          setCourses((prev) => prev.filter((item) => item.id !== course.id))
                          toast.success("Course deleted.")
                        }}>
                          <Trash2 className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No courses found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SmartPagination page={page} totalPages={totalPages} totalItems={filteredCourses.length} onPageChange={setPage} itemName="courses" />
    </div>
  )
}
