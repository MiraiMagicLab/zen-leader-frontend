import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { assetApi, courseApi, programApi, type ProgramResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

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
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<CourseFormErrors>({})

  const [courseTitle, setCourseTitle] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [orderIndex, setOrderIndex] = useState(0)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false)

  useEffect(() => {
    if (!programId) return
    void programApi
      .getById(programId)
      .then((programDetail) => {
        setProgram(programDetail)
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
      let thumbnailUrl: string | null = null
      if (thumbnailFile) {
        setIsThumbnailUploading(true)
        try {
          const uploaded = await assetApi.uploadLessonAsset(thumbnailFile)
          thumbnailUrl = uploaded.url
        } finally {
          setIsThumbnailUploading(false)
        }
      }

      const createdCourse = await courseApi.create({
        code: courseCode.trim(),
        title: courseTitle.trim(),
        description: null,
        level: null,
        thumbnailUrl,
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
      <SheetContent side="right" className="!w-full sm:!max-w-[800px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Create course</SheetTitle>
          <SheetDescription>Add a new course to {program?.title || "the selected program"}.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="course-thumbnail">Thumbnail (optional)</Label>
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail preview"
                  className="aspect-video w-full rounded-lg border object-cover"
                />
              ) : null}
              <Input
                id="course-thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setThumbnailFile(file)
                  setThumbnailPreviewUrl(file ? URL.createObjectURL(file) : null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-code">Course code</Label>
              <Input
                id="course-code"
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value.toUpperCase())
                  if (formErrors.courseCode) setFormErrors((prev) => ({ ...prev, courseCode: undefined }))
                }}
                placeholder="STRAT-101"
              />
              {formErrors.courseCode ? <p className="text-xs text-destructive">{formErrors.courseCode}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-title">Course title</Label>
              <Input
                id="course-title"
                value={courseTitle}
                onChange={(e) => {
                  setCourseTitle(e.target.value)
                  if (formErrors.courseTitle) setFormErrors((prev) => ({ ...prev, courseTitle: undefined }))
                }}
                placeholder="High Performance Culture"
              />
              {formErrors.courseTitle ? <p className="text-xs text-destructive">{formErrors.courseTitle}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-index">Order index</Label>
              <Input
                id="order-index"
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => {
                  setOrderIndex(Number(e.target.value))
                  if (formErrors.orderIndex) setFormErrors((prev) => ({ ...prev, orderIndex: undefined }))
                }}
              />
              {formErrors.orderIndex ? <p className="text-xs text-destructive">{formErrors.orderIndex}</p> : null}
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleCreateCourse()} disabled={isSaving || isThumbnailUploading}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Create course
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

