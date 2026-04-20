import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"

import { courseApi, programApi, type CourseResponse, type ProgramResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type CourseFormErrors = Partial<Record<"courseCode" | "courseTitle" | "orderIndex", string>>

const createCourseSchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(2, "Course code must be at least 2 characters.")
    .max(50, "Course code must be at most 50 characters.")
    .regex(/^[A-Z0-9_-]+$/, "Course code can contain only uppercase letters, numbers, '-' and '_'."),
  courseTitle: z
    .string()
    .trim()
    .min(3, "Course title must be at least 3 characters.")
    .max(160, "Course title must be at most 160 characters."),
  orderIndex: z.number().int("Order index must be an integer.").min(0, "Order index must be 0 or greater."),
})

function validateForm(input: {
  courseCode: string
  courseTitle: string
  orderIndex: number
}): CourseFormErrors {
  const result = createCourseSchema.safeParse({
    courseCode: input.courseCode,
    courseTitle: input.courseTitle,
    orderIndex: input.orderIndex,
  })
  if (result.success) return {}

  const flattened = result.error.flatten().fieldErrors
  return {
    courseCode: flattened.courseCode?.[0],
    courseTitle: flattened.courseTitle?.[0],
    orderIndex: flattened.orderIndex?.[0],
  }
}

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()

  const [program, setProgram] = useState<ProgramResponse | null>(null)
  const [programCourses, setProgramCourses] = useState<CourseResponse[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<CourseFormErrors>({})

  const [courseTitle, setCourseTitle] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [orderIndex, setOrderIndex] = useState(0)

  useEffect(() => {
    if (!programId) return
    void Promise.all([programApi.getById(programId), courseApi.getAll(programId)])
      .then(([programDetail, courses]) => {
        setProgram(programDetail)
        setProgramCourses(courses)
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to load program data.")
      })
  }, [programId])

  const handleCreateCourse = async () => {
    if (isSaving) return

    const errors = validateForm({
      courseCode,
      courseTitle,
      orderIndex,
    })
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    if (!programId) {
      toast.error("Program not found.")
      return
    }

    setIsSaving(true)
    try {
      const createdCourse = await courseApi.create({
        code: courseCode.trim(),
        title: courseTitle.trim(),
        description: null,
        level: null,
        thumbnailUrl: null,
        category: null,
        programId,
        orderIndex,
        tags: [],
      })

      toast.success("Course created successfully.")
      setProgramCourses((current) => [...current, createdCourse])
      navigate(`/dashboard/courses/${createdCourse.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create course.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link to="/dashboard/programs" className="underline">
            Programs
          </Link>{" "}
          /{" "}
          <Link to={`/dashboard/programs/${programId}/courses`} className="underline">
            {program?.title || "Program courses"}
          </Link>{" "}
          / Create course
        </p>
        <h1 className="text-2xl font-semibold">Create course</h1>
        <p className="text-sm text-muted-foreground">
          Program: {program?.title || "Loading..."} ({program?.code || "-"})
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Course information</CardTitle>
            <CardDescription>Create a course directly under the selected program.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-code">Course code *</Label>
                <Input
                  id="course-code"
                  value={courseCode}
                  aria-invalid={Boolean(formErrors.courseCode)}
                  onChange={(e) => {
                    setCourseCode(e.target.value.toUpperCase())
                    if (formErrors.courseCode) setFormErrors((prev) => ({ ...prev, courseCode: undefined }))
                  }}
                  placeholder="STRAT-001"
                />
                {formErrors.courseCode ? <p className="text-xs text-destructive">{formErrors.courseCode}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-title">Course title *</Label>
                <Input
                  id="course-title"
                  value={courseTitle}
                  aria-invalid={Boolean(formErrors.courseTitle)}
                  onChange={(e) => {
                    setCourseTitle(e.target.value)
                    if (formErrors.courseTitle) setFormErrors((prev) => ({ ...prev, courseTitle: undefined }))
                  }}
                  placeholder="Leadership Fundamentals"
                />
                {formErrors.courseTitle ? <p className="text-xs text-destructive">{formErrors.courseTitle}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-name">Program</Label>
              <Input id="program-name" value={program ? `${program.title} (${program.code})` : "Loading..."} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-index">Order index *</Label>
              <Input
                id="order-index"
                type="number"
                min={0}
                value={orderIndex}
                aria-invalid={Boolean(formErrors.orderIndex)}
                onChange={(e) => {
                  setOrderIndex(Number(e.target.value))
                  if (formErrors.orderIndex) setFormErrors((prev) => ({ ...prev, orderIndex: undefined }))
                }}
              />
              {formErrors.orderIndex ? <p className="text-xs text-destructive">{formErrors.orderIndex}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current courses</CardTitle>
            <CardDescription>
              {programCourses.length} courses in this program.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {programCourses.length === 0 ? (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                This program has no courses yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Runs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.code}</TableCell>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell className="text-right">{course.courseRuns.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/programs/${programId}/courses`)}>
          Cancel
        </Button>
        <Button onClick={() => void handleCreateCourse()} disabled={isSaving}>
          {isSaving ? "Creating..." : "Create course"}
        </Button>
      </div>
    </div>
  )
}
