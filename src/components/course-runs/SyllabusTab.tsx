import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Inbox,
  Link,
  Loader2,
  MoreVertical,
  Paperclip,
  Pencil,
  PlayCircle,
  Plus,
  PlusCircle,
  Settings,
  Star,
  Trash2,
  ClipboardList,
  Image as ImageIcon,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type ChapterResponse,
  type LessonResponse
} from "@/lib/api"
import {
  useChapters,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson
} from "@/lib/api/services/lms"
import MarkdownEditor from "@/components/MarkdownEditor"
import { LessonMediaUploader } from "./LessonMediaUploader"
import { cn } from "@/lib/utils"

interface SyllabusTabProps {
  runId: string
}

type LessonAttachment = {
  url?: string
  fileName?: string
  mimeType?: string
  size?: number
  publicId?: string
}

function toLessonAttachment(meta?: Record<string, unknown>): LessonAttachment | null {
  if (!meta) return null
  return {
    url: typeof meta.url === "string" ? meta.url : undefined,
    fileName: typeof meta.fileName === "string" ? meta.fileName : undefined,
    mimeType: typeof meta.mimeType === "string" ? meta.mimeType : undefined,
    size: typeof meta.size === "number" ? meta.size : undefined,
    publicId: typeof meta.publicId === "string" ? meta.publicId : undefined,
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const typeIconMap = {
  video: PlayCircle,
  article: FileText,
  photo: ImageIcon,
  document: FileText,
  resource: Link,
}

// Minimalist type styling using semantic tokens
const typeStyleMap: Record<string, string> = {
  video: "text-primary bg-primary/15",
  article: "text-muted-foreground bg-muted",
  photo: "text-primary bg-primary/15",
  document: "text-muted-foreground bg-muted",
  resource: "text-primary bg-primary/15",
}

// ─── Sortable Components ───────────────────────────────────────────────────

function SortableChapter({
  chapter,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  children
}: {
  chapter: ChapterResponse
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddLesson: () => void
  children?: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `chapter-${chapter.id}`,
    data: { type: "chapter", chapter }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("mb-4", isDragging && "z-50 opacity-50")}>
      <Card className={cn("overflow-hidden border-border shadow-sm", isDragging && "ring-2 ring-primary")}>
        <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors border-b border-border/50">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground/60 hover:text-foreground transition-colors">
              <GripVertical className="size-4" />
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
              {String(chapter.orderIndex + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
              <h4 className="font-bold text-foreground truncate">{chapter.title}</h4>
              <p className="text-xs text-muted-foreground">
                {chapter.lessons?.length || 0} lessons • {chapter.description || "No description"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={onAddLesson} className="h-8 gap-1.5 text-primary font-bold hover:bg-primary/15">
              <Plus className="size-4" />
              Lesson
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl border-border">
                <DropdownMenuItem onClick={onEdit} className="gap-2 font-semibold">
                  <Pencil className="size-4 text-muted-foreground" />
                  Edit Chapter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="gap-2 font-semibold text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="size-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onToggle}>
              <ChevronDown className={cn("size-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-4 space-y-2 bg-muted/50">
                {children}
                {(!chapter.lessons || chapter.lessons.length === 0) && (
                  <div className="rounded-xl border border-border/50 bg-background/70 py-8 text-center text-muted-foreground/80">
                    <Inbox className="mx-auto mb-2 size-8" />
                    <p className="text-xs font-semibold">No lessons in this chapter yet</p>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

function SortableLesson({
  lesson,
  onEdit,
  onDelete
}: {
  lesson: LessonResponse
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lesson-${lesson.id}`,
    data: { type: "lesson", lesson }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const LessonTypeIcon = typeIconMap[lesson.type as keyof typeof typeIconMap] ?? FileText
  const styleClass = typeStyleMap[lesson.type] || "text-muted-foreground bg-muted"

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors",
        isDragging && "z-50 opacity-50 ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div {...attributes} {...listeners} className="text-muted-foreground/20 cursor-grab hover:text-muted-foreground transition-colors">
          <GripVertical className="size-4" />
        </div>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", styleClass)}>
          <LessonTypeIcon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{lesson.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{lesson.type}</span>
            {lesson.isHidden && <Badge variant="secondary" className="h-4 px-1.5 text-xs font-semibold opacity-70">HIDDEN</Badge>}
            {lesson.isOptional && <Badge variant="outline" className="h-4 px-1.5 text-xs font-semibold opacity-70">OPTIONAL</Badge>}
            {Boolean(lesson.contentData?.fileAttachment) && <Paperclip className="size-3 text-primary/90" />}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/15" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SyllabusTab({ runId }: SyllabusTabProps) {
  const queryChapters = useChapters(runId)
  const chaptersData = queryChapters.data ?? []

  const createChapter = useCreateChapter()
  const updateChapter = useUpdateChapter()
  const deleteChapter = useDeleteChapter(runId)
  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()
  const deleteLesson = useDeleteLesson("")

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [editingChapter, setEditingChapter] = useState<ChapterResponse | null>(null)
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonResponse | null>(null)
  const [lessonSheetOpen, setLessonSheetOpen] = useState(false)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  const [chapterForm, setChapterForm] = useState({ title: "", description: "" })
  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "video",
    description: "",
    markdownContent: "",
    isHidden: false,
    isOptional: false,
    fileAttachment: null as LessonAttachment | null
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleOpenChapterDialog = (chapter?: ChapterResponse) => {
    if (chapter) {
      setEditingChapter(chapter)
      setChapterForm({ title: chapter.title, description: chapter.description || "" })
    } else {
      setEditingChapter(null)
      setChapterForm({ title: "", description: "" })
    }
    setChapterDialogOpen(true)
  }

  const handleSaveChapter = async () => {
    if (!chapterForm.title.trim()) return toast.error("Title is required")
    try {
      if (editingChapter) {
        await updateChapter.mutateAsync({
          id: editingChapter.id,
          data: { courseRunId: runId, ...chapterForm, orderIndex: editingChapter.orderIndex }
        })
        toast.success("Chapter updated")
      } else {
        await createChapter.mutateAsync({
          courseRunId: runId,
          ...chapterForm,
          orderIndex: chaptersData.length
        })
        toast.success("Chapter created")
      }
      setChapterDialogOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save chapter."
      toast.error(message)
    }
  }

  const handleOpenLessonSheet = (chapterId: string, lesson?: LessonResponse) => {
    setActiveChapterId(chapterId)
    if (lesson) {
      setEditingLesson(lesson)
      setLessonForm({
        title: lesson.title,
        type: lesson.type,
        description: lesson.description || "",
        markdownContent: (lesson.contentData?.markdownContent as string) || "",
        isHidden: lesson.isHidden,
        isOptional: lesson.isOptional,
        fileAttachment: toLessonAttachment(lesson.contentData?.fileAttachment as Record<string, unknown> | undefined)
      })
    } else {
      setEditingLesson(null)
      setLessonForm({
        title: "",
        type: "video",
        description: "",
        markdownContent: "",
        isHidden: false,
        isOptional: false,
        fileAttachment: null
      })
    }
    setLessonSheetOpen(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) return toast.error("Title is required")
    if (!activeChapterId) return

    const chapter = chaptersData.find(c => c.id === activeChapterId)
    const orderIndex = editingLesson ? editingLesson.orderIndex : (chapter?.lessons?.length || 0)

    try {
      const payload = {
        chapterId: activeChapterId,
        title: lessonForm.title,
        type: lessonForm.type,
        description: lessonForm.description,
        orderIndex,
        isHidden: lessonForm.isHidden,
        isOptional: lessonForm.isOptional,
        contentData: {
          markdownContent: lessonForm.markdownContent,
          fileAttachment: lessonForm.fileAttachment
        }
      }

      if (editingLesson) {
        await updateLesson.mutateAsync({ id: editingLesson.id, data: payload })
        toast.success("Lesson updated")
      } else {
        await createLesson.mutateAsync(payload)
        toast.success("Lesson added")
      }
      setLessonSheetOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save lesson."
      toast.error(message)
    }
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIdStr = active.id.toString()
    const overIdStr = over.id.toString()

    if (activeIdStr.startsWith("chapter") && overIdStr.startsWith("chapter")) {
      const oldIndex = chaptersData.findIndex(c => `chapter-${c.id}` === active.id)
      const newIndex = chaptersData.findIndex(c => `chapter-${c.id}` === over.id)
      const newChapters = arrayMove(chaptersData, oldIndex, newIndex)

      try {
        await Promise.all(newChapters.map((c, idx) =>
          updateChapter.mutateAsync({
            id: c.id,
            data: { courseRunId: runId, title: c.title, description: c.description, orderIndex: idx }
          })
        ))
      } catch {
        toast.error("Failed to reorder chapters")
      }
    } else if (activeIdStr.startsWith("lesson") && overIdStr.startsWith("lesson")) {
      const activeLesson = (active.data.current as { lesson?: LessonResponse } | undefined)?.lesson
      const overLesson = (over.data.current as { lesson?: LessonResponse } | undefined)?.lesson
      if (!activeLesson || !overLesson) return
      if (activeLesson.chapterId !== overLesson.chapterId) return

      const chapter = chaptersData.find(c => c.id === activeLesson.chapterId)
      if (!chapter) return

      const oldIndex = chapter.lessons.findIndex(l => `lesson-${l.id}` === active.id)
      const newIndex = chapter.lessons.findIndex(l => `lesson-${l.id}` === over.id)
      const newLessons = arrayMove(chapter.lessons, oldIndex, newIndex)

      try {
        await Promise.all(newLessons.map((l, idx) =>
          updateLesson.mutateAsync({
            id: l.id,
            data: {
              chapterId: l.chapterId,
              title: l.title,
              type: l.type,
              description: l.description,
              orderIndex: idx,
              isHidden: l.isHidden,
              isOptional: l.isOptional,
              contentData: l.contentData
            }
          })
        ))
      } catch {
        toast.error("Failed to reorder lessons")
      }
    }
  }

  if (queryChapters.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground/70">
        <Loader2 className="size-10 animate-spin" />
        <p className="text-sm font-semibold">Organizing syllabus...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ClipboardList className="size-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground tracking-tight">Syllabus Builder</h3>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Build your course outline</p>
          </div>
        </div>
        <Button onClick={() => handleOpenChapterDialog()} className="h-10 gap-2 rounded-xl px-5 font-medium">
          <PlusCircle className="size-4" />
          New Chapter
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={chaptersData.map(c => `chapter-${c.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {chaptersData.map((chapter) => (
              <SortableChapter
                key={chapter.id}
                chapter={chapter}
                isExpanded={!!expandedChapters[chapter.id]}
                onToggle={() => setExpandedChapters(prev => ({ ...prev, [chapter.id]: !prev[chapter.id] }))}
                onEdit={() => handleOpenChapterDialog(chapter)}
                onDelete={() => {
                  if (confirm("Remove chapter and all its lessons?")) {
                    deleteChapter.mutate(chapter.id)
                    toast.success("Chapter removed")
                  }
                }}
                onAddLesson={() => handleOpenLessonSheet(chapter.id)}
              >
                <SortableContext items={chapter.lessons?.map(l => `lesson-${l.id}`) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {chapter.lessons?.map((lesson) => (
                      <SortableLesson
                        key={lesson.id}
                        lesson={lesson}
                        onEdit={() => handleOpenLessonSheet(chapter.id, lesson)}
                        onDelete={() => {
                          if (confirm("Remove this lesson?")) {
                            deleteLesson.mutate(lesson.id, {
                              onSuccess: () => toast.success("Lesson removed")
                            })
                          }
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </SortableChapter>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border-border p-6">
          <DialogHeader>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {editingChapter ? <Pencil className="size-4" /> : <PlusCircle className="size-4" />}
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
              {editingChapter ? "Edit Chapter" : "Create Chapter"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Organize your curriculum into manageable sections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chapter Title</Label>
              <Input
                value={chapterForm.title}
                onChange={e => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Fundamental Concepts"
                className="h-10 rounded-xl border-border bg-muted/50 text-sm font-medium focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
              <Input
                value={chapterForm.description}
                onChange={e => setChapterForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief summary (optional)"
                className="h-10 rounded-xl border-border bg-muted/50 text-sm font-medium focus:bg-background"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 sm:justify-between">
            <Button variant="ghost" onClick={() => setChapterDialogOpen(false)} className="h-10 rounded-xl px-5 font-medium text-muted-foreground">Cancel</Button>
            <Button onClick={handleSaveChapter} disabled={updateChapter.isPending || createChapter.isPending} className="h-10 rounded-xl px-6 font-medium">
              {updateChapter.isPending || createChapter.isPending ? "Saving..." : editingChapter ? "Update Chapter" : "Create Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Sheet */}
      <Sheet open={lessonSheetOpen} onOpenChange={setLessonSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[760px] flex flex-col overflow-hidden border-border p-0 rounded-l-xl">
          <SheetHeader className="relative border-b border-border/20 bg-muted/50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", typeStyleMap[lessonForm.type] ?? "bg-muted text-muted-foreground")}>
                    {(() => {
                      const LessonFormTypeIcon = typeIconMap[lessonForm.type as keyof typeof typeIconMap] ?? FileText
                      return <LessonFormTypeIcon className="size-3.5" />
                    })()}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lessonForm.type} LESSON</span>
                </div>
                <SheetTitle className="text-2xl font-semibold text-foreground tracking-tight">
                  {editingLesson ? "Edit lesson" : "Create lesson"}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground font-medium pt-1">
                  Set lesson content and options.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="mb-6 h-11 space-x-1 rounded-xl bg-muted p-1">
                <TabsTrigger value="content" className="flex items-center gap-2 rounded-lg px-5 font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary">
                  <BookOpen className="size-4" />
                  Curriculum
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2 rounded-lg px-5 font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Settings className="size-4" />
                  Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-0 space-y-8 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson Title</Label>
                    <Input
                      value={lessonForm.title}
                      onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Introduction to Physics"
                      className="h-10 rounded-xl border-border bg-muted/50 text-sm font-medium focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content Type</Label>
                    <div className="relative group">
                      <select
                        value={lessonForm.type}
                        onChange={e => setLessonForm(p => ({ ...p, type: e.target.value }))}
                        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-muted/50 px-4 pr-10 text-sm font-medium hover:bg-background focus:ring-2 focus:ring-primary/35 outline-none"
                      >
                        <option value="video">Video Lecture</option>
                        <option value="article">Article / Reading</option>
                        <option value="photo">Visual Asset</option>
                        <option value="document">Technical Document</option>
                        <option value="resource">External Link</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary Media</Label>
                  <LessonMediaUploader
                    value={lessonForm.fileAttachment?.url}
                    fileName={lessonForm.fileAttachment?.fileName}
                    onChange={(url, meta) => setLessonForm((p) => ({ ...p, fileAttachment: url ? toLessonAttachment(meta) : null }))}
                    accept={lessonForm.type === "video" ? "video/*" : lessonForm.type === "photo" ? "image/*" : "application/pdf"}
                    label={lessonForm.type === "video" ? "Upload Video" : "Upload File"}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Written Content (Markdown)</Label>
                  <div className="overflow-hidden rounded-xl border border-border bg-background">
                    <MarkdownEditor
                      value={lessonForm.markdownContent}
                      onChange={val => setLessonForm(p => ({ ...p, markdownContent: val || "" }))}
                      height={400}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0 space-y-6 outline-none">
                <div className="space-y-2">
                  <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal Description</Label>
                  <Input
                    value={lessonForm.description}
                    onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Notes for instructors..."
                    className="h-10 rounded-xl border-border bg-muted/50 text-sm font-medium focus:bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={cn(
                      "cursor-pointer select-none rounded-xl border p-5 transition-colors",
                      lessonForm.isHidden ? "bg-destructive/10 border-destructive/30" : "bg-card border-border hover:border-muted-foreground/40"
                    )}
                    onClick={() => setLessonForm(p => ({ ...p, isHidden: !p.isHidden }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", lessonForm.isHidden ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground")}>
                        {lessonForm.isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Private Lesson</p>
                        <p className="text-xs font-medium leading-relaxed text-muted-foreground">Hidden from learner view.</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "cursor-pointer select-none rounded-xl border p-5 transition-colors",
                      lessonForm.isOptional ? "bg-primary/15 border-primary/30" : "bg-card border-border hover:border-muted-foreground/40"
                    )}
                    onClick={() => setLessonForm(p => ({ ...p, isOptional: !p.isOptional }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", lessonForm.isOptional ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Star className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Elective Task</p>
                        <p className="text-xs font-medium leading-relaxed text-muted-foreground">Does not affect completion.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center justify-between border-t border-border/20 bg-muted/60 p-6">
            <Button variant="ghost" onClick={() => setLessonSheetOpen(false)} className="h-10 rounded-xl px-6 font-medium text-muted-foreground hover:text-foreground">Discard</Button>
            <Button onClick={handleSaveLesson} disabled={updateLesson.isPending || createLesson.isPending} className="h-10 gap-2 rounded-xl px-7 font-medium">
              <CheckCircle2 className="size-4" />
              {updateLesson.isPending || createLesson.isPending ? "Saving..." : editingLesson ? "Save changes" : "Create lesson"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
