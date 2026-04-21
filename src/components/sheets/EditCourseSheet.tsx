import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronLeft, Image as ImageIcon, Loader2, Save, Sparkles, FileText } from "lucide-react"

import { assetApi, courseApi, type CourseResponse } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageLoading } from "@/components/common/PageLoading"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type SaveState = "idle" | "saving" | "saved" | "error"
type EditCourseFormErrors = Partial<Record<"courseCode" | "title" | "selectedProgramId" | "orderIndex", string>>

const editCourseSchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(2, "Course code must be at least 2 characters.")
    .max(50, "Course code must be at most 50 characters.")
    .regex(/^[A-Z0-9_-]+$/, "Course code can contain only uppercase letters, numbers, '-' and '_'."),
  title: z.string().trim().min(3, "Course title must be at least 3 characters.").max(160, "Course title must be at most 160 characters."),
  selectedProgramId: z.string().trim().min(1, "Program is required."),
  orderIndex: z.number().int("Order index must be an integer.").min(0, "Order index must be 0 or greater."),
})

function validateEditCourseForm(input: {
  courseCode: string
  title: string
  selectedProgramId: string | null
  orderIndex: number
}): EditCourseFormErrors {
  const result = editCourseSchema.safeParse({
    courseCode: input.courseCode,
    title: input.title,
    selectedProgramId: input.selectedProgramId ?? "",
    orderIndex: input.orderIndex,
  })
  if (result.success) return {}
  const flattened = result.error.flatten().fieldErrors
  return {
    courseCode: flattened.courseCode?.[0],
    title: flattened.title?.[0],
    selectedProgramId: flattened.selectedProgramId?.[0],
    orderIndex: flattened.orderIndex?.[0],
  }
}

export default function EditCourseSheet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const courseId = id ?? ""

  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [apiCourse, setApiCourse] = useState<CourseResponse | null>(null)
  const [formErrors, setFormErrors] = useState<EditCourseFormErrors>({})

  const [courseCode, setCourseCode] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [level, setLevel] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [orderIndex, setOrderIndex] = useState(0)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")

  useEffect(() => {
    if (!courseId) return
    courseApi.getById(courseId)
      .then((course) => {
        setApiCourse(course)
        setCourseCode(course.code)
        setTitle(course.title)
        setDescription(course.description ?? "")
        setCategory(course.category ?? "")
        setLevel(course.level ?? "")
        setTags(course.tags ?? [])
        setOrderIndex(course.orderIndex)
        setSelectedProgramId(course.programId)
        setThumbnailPreview(course.thumbnailUrl)
      })
      .catch(() => setApiCourse(null))
      .finally(() => setLoading(false))
  }, [courseId])

  const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsThumbnailUploading(true)
    try {
      const uploaded = await assetApi.upload(file)
      setThumbnailPreview(uploaded.url)
    } catch {
      toast.error("Thumbnail upload failed.")
    } finally {
      setIsThumbnailUploading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (!apiCourse || saveState === "saving") return

    const errors = validateEditCourseForm({ courseCode, title, selectedProgramId, orderIndex })
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Please fix validation errors before saving.")
      return
    }
    setFormErrors({})

    setSaveState("saving")
    try {
      await courseApi.update(courseId, {
        code: courseCode.trim(),
        title: title.trim(),
        description: description.trim() || null,
        level: level.trim() || null,
        thumbnailUrl: thumbnailPreview,
        category: category.trim() || null,
        programId: selectedProgramId!,
        orderIndex,
        tags,
      })
      setSaveState("saved")
      toast.success("Course updated.")
      setTimeout(() => setSaveState("idle"), 1200)
    } catch {
      setSaveState("error")
      toast.error("Failed to update course.")
    }
  }, [apiCourse, saveState, courseCode, title, selectedProgramId, orderIndex, courseId, description, level, thumbnailPreview, category, tags])

  if (loading) return <PageLoading className="min-h-screen" />
  if (!apiCourse) return <PageLoading className="min-h-screen" />

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) navigate(-1)
      }}
    >
      <SheetContent className="!w-full sm:!max-w-[980px] max-h-screen p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Edit course</SheetTitle>
          <SheetDescription>Update course metadata only. Course runs and syllabus are managed in run detail.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <div className="mx-auto max-w-[1200px] space-y-8 pb-20">
              <div className="mb-6 border-b border-border/40 pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" className="size-10 rounded-xl" onClick={() => navigate(-1)}>
                      <ChevronLeft className="size-6" />
                    </Button>
                    <div>
                      <h1 className="line-clamp-1 text-2xl font-semibold tracking-tight text-foreground">{title || "Untitled course"}</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{courseCode || "NO-CODE"}</Badge>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{category || "General"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" className="h-10 px-4 text-sm font-medium" onClick={handleSave}>Save draft</Button>
                    <Button onClick={handleSave} disabled={saveState === "saving"} className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold">
                      {saveState === "saving" ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                      Save changes
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-8">
                  <Card className="overflow-hidden border bg-card shadow-sm rounded-xl">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/30">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <ImageIcon className="size-5 text-primary" />
                        Thumbnail
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div
                        className={cn(
                          "relative aspect-video w-full overflow-hidden border border-border/40 group rounded-xl",
                          !thumbnailPreview && "bg-muted/60 flex items-center justify-center",
                        )}
                      >
                        {thumbnailPreview ? (
                          <>
                            <img src={thumbnailPreview} className="h-full w-full object-cover" alt="Course" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                              <Sparkles className="text-white size-8" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                            <ImageIcon className="mb-2 size-8 text-muted-foreground/70 mx-auto" />
                            <p className="text-xs font-medium text-muted-foreground/80">Upload image</p>
                          </div>
                        )}
                        {isThumbnailUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                            <Loader2 className="animate-spin text-primary" />
                          </div>
                        )}
                        <input ref={thumbnailInputRef} type="file" className="hidden" accept="image/*" onChange={handleThumbnailChange} />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course code</Label>
                          <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value.toUpperCase())} className="h-10 rounded-xl border-transparent bg-muted/60 font-mono font-semibold" />
                          {formErrors.courseCode ? <p className="text-xs text-destructive font-bold ml-1">{formErrors.courseCode}</p> : null}
                        </div>
                        <div className="space-y-2">
                          <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hierarchy position</Label>
                          <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} className="h-10 rounded-xl border-transparent bg-muted/60 font-semibold" />
                          {formErrors.orderIndex ? <p className="text-xs text-destructive font-bold ml-1">{formErrors.orderIndex}</p> : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-8 space-y-8">
                  <Card className="overflow-hidden border bg-card shadow-sm rounded-xl">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/30">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                        <FileText className="size-5 text-primary" />
                        Course details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl border-transparent bg-muted/60 text-base font-semibold" />
                        {formErrors.title ? <p className="text-xs text-destructive font-bold ml-1">{formErrors.title}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[220px] rounded-xl bg-muted/60 border-transparent font-medium leading-relaxed" />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</Label>
                          <Input value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-xl border-transparent bg-muted/60" />
                        </div>
                        <div className="space-y-2">
                          <Label className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level</Label>
                          <Input value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 rounded-xl border-transparent bg-muted/60" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
