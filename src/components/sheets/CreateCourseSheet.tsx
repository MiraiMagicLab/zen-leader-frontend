import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, BookOpen, Layers, Save, Loader2 } from "lucide-react"

import { courseApi, programApi, type CourseResponse, type ProgramResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

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

export default function CreateCourseSheet() {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()
  const [open, setOpen] = useState(true)

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
        setOrderIndex(courses.length + 1)
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

      toast.success("Course objective established.")
      navigate(`/dashboard/courses/${createdCourse.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create course.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate(`/dashboard/programs/${programId}`)
      }}
    >
      <SheetContent className="!w-full sm:!max-w-[1000px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Create course</SheetTitle>
          <SheetDescription>Add a new course to {program?.title || "the selected program"}.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="overflow-hidden border shadow-sm">
                <CardHeader className="bg-muted/30 border-b p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Course Identity</CardTitle>
                      <CardDescription>Define the foundational attributes of this course.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Objective Code *</Label>
                      <Input
                        value={courseCode}
                        onChange={(e) => {
                          setCourseCode(e.target.value.toUpperCase())
                          if (formErrors.courseCode) setFormErrors((prev) => ({ ...prev, courseCode: undefined }))
                        }}
                        className="h-11 rounded-xl font-bold bg-muted/20 focus:bg-background transition-colors"
                        placeholder="e.g. STRAT-101"
                      />
                      {formErrors.courseCode && <p className="text-xs font-bold text-destructive ml-1">{formErrors.courseCode}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Course Title *</Label>
                      <Input
                        value={courseTitle}
                        onChange={(e) => {
                          setCourseTitle(e.target.value)
                          if (formErrors.courseTitle) setFormErrors((prev) => ({ ...prev, courseTitle: undefined }))
                        }}
                        className="h-11 rounded-xl font-semibold"
                        placeholder="e.g. High Performance Culture"
                      />
                      {formErrors.courseTitle && <p className="text-xs font-bold text-destructive ml-1">{formErrors.courseTitle}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Target Sequence Index</Label>
                    <Input
                      type="number"
                      min={0}
                      value={orderIndex}
                      onChange={(e) => {
                        setOrderIndex(Number(e.target.value))
                        if (formErrors.orderIndex) setFormErrors((prev) => ({ ...prev, orderIndex: undefined }))
                      }}
                      className="h-11 rounded-xl font-medium w-32"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium italic ml-1">Controls the display priority within the program catalog.</p>
                    {formErrors.orderIndex && <p className="text-xs font-bold text-destructive ml-1">{formErrors.orderIndex}</p>}
                  </div>

                  <div className="pt-6 border-t flex justify-end">
                    <Button
                      size="lg"
                      onClick={() => void handleCreateCourse()}
                      disabled={isSaving}
                      className="min-w-[200px] font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      Initialize Course
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border shadow-sm h-fit">
                <CardHeader className="bg-muted/30 border-b p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Existing Catalog</CardTitle>
                      <CardDescription>{programCourses.length} courses currently assigned.</CardDescription>
                    </div>
                    <div className="p-2 bg-primary/5 text-primary rounded-lg">
                      <Layers className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {programCourses.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                        <Plus className="size-6 opacity-20" />
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground">Catalog is currently empty.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-6 text-[10px] font-bold uppercase">Code</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">Identity</TableHead>
                          <TableHead className="pr-6 text-right text-[10px] font-bold uppercase">Index</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programCourses
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((course) => (
                            <TableRow key={course.id} className="group border-none hover:bg-muted/40 transition-colors">
                              <TableCell className="pl-6 py-4">
                                <Badge variant="outline" className="font-bold text-[10px]">{course.code}</Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <p className="text-sm font-semibold text-foreground line-clamp-1">{course.title}</p>
                              </TableCell>
                              <TableCell className="pr-6 py-4 text-right font-bold text-xs text-muted-foreground/60">
                                {course.orderIndex}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleCreateCourse()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Create course
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

