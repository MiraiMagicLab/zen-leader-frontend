import { useEffect, useMemo, useState, useCallback } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  BookOpen,
  ChevronRight,
  Layers3,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
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
import { PageHeader } from "@/components/common/PageHeader"
import { SmartPagination } from "@/components/common/SmartPagination"

type CourseStatusFilter = "ALL" | "PUBLISHED" | "DRAFT"

function sortCourses(courses: CourseResponse[]) {
  return [...courses].sort((a, b) => a.orderIndex - b.orderIndex)
}

export default function CourseManagementPage() {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()

  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [program, setProgram] = useState<ProgramResponse | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>("ALL")
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

  const getDerivedStatus = useCallback((course: CourseResponse): CourseStatusFilter => {
    const hasPublishedRun = course.courseRuns.some((run) => (run.status ?? "").toUpperCase() === "PUBLISHED")
    return hasPublishedRun ? "PUBLISHED" : "DRAFT"
  }, [])

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return sortCourses(courses).filter((c) => {
      const matchesSearch =
        !keyword ||
        c.title.toLowerCase().includes(keyword) ||
        c.code.toLowerCase().includes(keyword)
      const derivedStatus = getDerivedStatus(c)
      const matchesStatus = statusFilter === "ALL" || derivedStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [courses, getDerivedStatus, search, statusFilter])

  useEffect(() => { setPage(1) }, [search, statusFilter])

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
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate(`/dashboard/programs/${programId}/courses/create`)}>
              <Plus className="mr-2 size-4" />
              Create Course
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course title..."
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CourseStatusFilter)}
          className="w-full sm:w-[220px]"
        >
          <option value="ALL">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </Select>
      </div>

      <div className="rounded-md bg-background border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-6 h-12 w-16">STT</TableHead>
              <TableHead className="px-6 h-12">Course</TableHead>
              <TableHead className="px-6 h-12">Level</TableHead>
              <TableHead className="px-6 h-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {paginatedCourses.length ? paginatedCourses.map((course, idx) => (
                <TableRow key={course.id} className="hover:bg-muted/40">
                  <TableCell className="px-6 py-4 text-muted-foreground">
                    {(page - 1) * limit + idx + 1}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="size-5 text-muted-foreground" />
                      <div>
                        <button className="font-semibold hover:text-primary" onClick={() => navigate(`/dashboard/courses/${course.id}`)}>{course.title}</button>
                        <div className="text-xs text-muted-foreground font-mono">{course.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {course.level ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {course.level}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                      >
                        <Layers3 className="mr-2 size-4" />
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setCourseToDelete(course)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No courses found.</TableCell></TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      <SmartPagination page={page} totalPages={totalPages} totalItems={filteredCourses.length} onPageChange={setPage} itemName="courses" />

      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => (!open ? setCourseToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              {courseToDelete ? `This will permanently delete "${courseToDelete.title}".` : "This will permanently delete the course."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (!courseToDelete) return
                void courseApi
                  .remove(courseToDelete.id)
                  .then(() => {
                    setCourses((prev) => prev.filter((item) => item.id !== courseToDelete.id))
                    toast.success("Course deleted.")
                    setCourseToDelete(null)
                  })
                  .catch((err) => {
                    const message = err instanceof Error ? err.message : "Failed to delete course."
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
