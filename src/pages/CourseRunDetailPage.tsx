import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  courseRunApi,
  courseApi,
  chapterApi,
  lessonApi,
  type CourseRunResponse,
  type CourseResponse,
  type ChapterResponse,
  type LessonResponse,
} from "@/lib/api";
import { PageLoading } from "@/components/common/PageLoading";
import { PageHeader } from "@/components/common/PageHeader";
import { formatNumber } from "@/lib/utils";
import MarkdownEditor from "@/components/MarkdownEditor";

type SheetMode = "create" | "edit";

type ChapterForm = {
  title: string;
  description: string;
};

type LessonForm = {
  title: string;
  type: string;
  description: string;
  markdownContent: string;
  isHidden: boolean;
  isOptional: boolean;
};

type DeleteTarget =
  | { type: "chapter"; id: string; title: string }
  | { type: "lesson"; id: string; title: string; chapterId: string }
  | null;

export default function CourseRunDetailPage() {
  const navigate = useNavigate();
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<CourseRunResponse | null>(null);
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [lessonsByChapter, setLessonsByChapter] = useState<
    Record<string, LessonResponse[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [chapterSheetOpen, setChapterSheetOpen] = useState(false);
  const [chapterSheetMode, setChapterSheetMode] = useState<SheetMode>("create");
  const [editingChapter, setEditingChapter] = useState<ChapterResponse | null>(
    null,
  );
  const [chapterForm, setChapterForm] = useState<ChapterForm>({
    title: "",
    description: "",
  });
  const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
  const [lessonSheetMode, setLessonSheetMode] = useState<SheetMode>("create");
  const [editingLesson, setEditingLesson] = useState<LessonResponse | null>(
    null,
  );
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>({
    title: "",
    type: "TEXT",
    description: "",
    markdownContent: "",
    isHidden: false,
    isOptional: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [savingChapter, setSavingChapter] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const runData = await courseRunApi.getById(runId);
      const courseData = await courseApi.getById(runData.courseId);
      const chapterData = await chapterApi.getAll(runId);
      const lessonMap: Record<string, LessonResponse[]> = {};
      await Promise.all(
        chapterData.map(async (chapter) => {
          lessonMap[chapter.id] = await lessonApi.getAll(chapter.id);
        }),
      );
      setRun(runData);
      setCourse(courseData);
      setChapters(chapterData);
      setLessonsByChapter(lessonMap);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load course run.",
      );
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(
    () => ({
      chapters: chapters.length,
      lessons: Object.values(lessonsByChapter).reduce(
        (t, arr) => t + arr.length,
        0,
      ),
    }),
    [chapters, lessonsByChapter],
  );

  const openCreateChapterSheet = () => {
    setChapterSheetMode("create");
    setEditingChapter(null);
    setChapterForm({ title: "", description: "" });
    setChapterSheetOpen(true);
  };

  const openEditChapterSheet = (chapter: ChapterResponse) => {
    setChapterSheetMode("edit");
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description ?? "",
    });
    setChapterSheetOpen(true);
  };

  const saveChapter = async () => {
    if (!runId) return;
    if (!chapterForm.title.trim()) {
      toast.error("Chapter title is required.");
      return;
    }
    try {
      setSavingChapter(true);
      if (chapterSheetMode === "create") {
        const created = await chapterApi.create({
          courseRunId: runId,
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || null,
          orderIndex: chapters.length + 1,
        });
        setChapters((prev) => [...prev, created]);
        setLessonsByChapter((prev) => ({ ...prev, [created.id]: [] }));
        toast.success("Chapter created.");
      } else if (editingChapter) {
        const updated = await chapterApi.update(editingChapter.id, {
          courseRunId: runId,
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || null,
          orderIndex: editingChapter.orderIndex,
        });
        setChapters((prev) =>
          prev.map((chapter) =>
            chapter.id === updated.id ? { ...chapter, ...updated } : chapter,
          ),
        );
        toast.success("Chapter updated.");
      }
      setChapterSheetOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save chapter.");
    } finally {
      setSavingChapter(false);
    }
  };

  const openCreateLessonSheet = (chapterId: string) => {
    setLessonSheetMode("create");
    setActiveChapterId(chapterId);
    setEditingLesson(null);
    setLessonForm({
      title: "",
      type: "TEXT",
      description: "",
      markdownContent: "",
      isHidden: false,
      isOptional: false,
    });
    setLessonSheetOpen(true);
  };

  const openEditLessonSheet = (chapterId: string, lesson: LessonResponse) => {
    setLessonSheetMode("edit");
    setActiveChapterId(chapterId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      type: lesson.type || "TEXT",
      description: lesson.description ?? "",
      markdownContent:
        typeof lesson.contentData?.markdownContent === "string"
          ? lesson.contentData.markdownContent
          : "",
      isHidden: lesson.isHidden,
      isOptional: lesson.isOptional,
    });
    setLessonSheetOpen(true);
  };

  const saveLesson = async () => {
    if (!activeChapterId) return;
    if (!lessonForm.title.trim()) {
      toast.error("Lesson title is required.");
      return;
    }
    try {
      setSavingLesson(true);
      if (lessonSheetMode === "create") {
        const created = await lessonApi.create({
          chapterId: activeChapterId,
          title: lessonForm.title.trim(),
          type: lessonForm.type,
          description: lessonForm.description.trim() || null,
          orderIndex: (lessonsByChapter[activeChapterId]?.length ?? 0) + 1,
          isHidden: lessonForm.isHidden,
          isOptional: lessonForm.isOptional,
          contentData: {
            markdownContent: lessonForm.markdownContent,
          },
        });
        setLessonsByChapter((prev) => ({
          ...prev,
          [activeChapterId]: [...(prev[activeChapterId] ?? []), created],
        }));
        toast.success("Lesson created.");
      } else if (editingLesson) {
        const updated = await lessonApi.update(editingLesson.id, {
          chapterId: activeChapterId,
          title: lessonForm.title.trim(),
          type: lessonForm.type,
          description: lessonForm.description.trim() || null,
          orderIndex: editingLesson.orderIndex,
          isHidden: lessonForm.isHidden,
          isOptional: lessonForm.isOptional,
          contentData: {
            ...editingLesson.contentData,
            markdownContent: lessonForm.markdownContent,
          },
        });
        setLessonsByChapter((prev) => ({
          ...prev,
          [activeChapterId]: (prev[activeChapterId] ?? []).map((lesson) =>
            lesson.id === updated.id ? updated : lesson,
          ),
        }));
        toast.success("Lesson updated.");
      }
      setLessonSheetOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save lesson.");
    } finally {
      setSavingLesson(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === "chapter") {
        await chapterApi.remove(deleteTarget.id);
        setChapters((prev) =>
          prev.filter((chapter) => chapter.id !== deleteTarget.id),
        );
        setLessonsByChapter((prev) => {
          const next = { ...prev };
          delete next[deleteTarget.id];
          return next;
        });
        toast.success("Chapter deleted.");
      } else {
        await lessonApi.remove(deleteTarget.id);
        setLessonsByChapter((prev) => ({
          ...prev,
          [deleteTarget.chapterId]: (prev[deleteTarget.chapterId] ?? []).filter(
            (lesson) => lesson.id !== deleteTarget.id,
          ),
        }));
        toast.success("Lesson deleted.");
      }
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoading />;
  if (!run)
    return <div className="p-10 text-center">Course run not found.</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/programs" className="hover:text-primary">
          Programs
        </Link>
        <ChevronRight className="size-4" />
        <Link
          to={course ? `/dashboard/programs/${course.programId}` : "#"}
          className="hover:text-primary"
        >
          {course?.programCode || "Program"}
        </Link>
        <ChevronRight className="size-4" />
        <Link
          to={course ? `/dashboard/courses/${course.id}` : "#"}
          className="hover:text-primary"
        >
          {course?.title || "Course"}
        </Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{run.code}</span>
      </div>

      <PageHeader
        title={run.code}
        subtitle={course?.title || "Course run detail and curriculum builder."}
        stats={[
          { label: "Chapters", value: formatNumber(summary.chapters) },
          { label: "Lessons", value: formatNumber(summary.lessons) },
          { label: "Status", value: run.status },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/courses/${course?.id}`)}
            >
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button onClick={openCreateChapterSheet}>
              <Plus className="mr-2 size-4" /> Create Chapter
            </Button>
          </div>
        }
      />

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Curriculum Builder</CardTitle>
              <CardDescription>
                Manage chapters and lessons with sheets.
              </CardDescription>
            </div>
            <Badge variant="outline">{run.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Chapter</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.length ? (
                chapters.map((chapter) => (
                  <TableRow
                    key={chapter.id}
                    className="align-top hover:bg-muted/40"
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{chapter.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {chapter.description || "No description"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {(lessonsByChapter[chapter.id] ?? []).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="rounded-lg border bg-background p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.type}
                                </p>
                                {typeof lesson.contentData?.markdownContent ===
                                  "string" &&
                                  lesson.contentData.markdownContent.trim() && (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                                      {lesson.contentData.markdownContent}
                                    </p>
                                  )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openEditLessonSheet(chapter.id, lesson)
                                    }
                                  >
                                    <Pencil className="mr-2 size-4" /> Edit
                                    lesson
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "lesson",
                                        id: lesson.id,
                                        title: lesson.title,
                                        chapterId: chapter.id,
                                      })
                                    }
                                  >
                                    <Trash2 className="mr-2 size-4" /> Delete
                                    lesson
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                        {!(lessonsByChapter[chapter.id] ?? []).length && (
                          <span className="text-sm text-muted-foreground">
                            No lessons yet.
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{chapter.orderIndex}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => openCreateLessonSheet(chapter.id)}
                          >
                            <Plus className="mr-2 size-4" /> Create lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditChapterSheet(chapter)}
                          >
                            <Pencil className="mr-2 size-4" /> Edit chapter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                type: "chapter",
                                id: chapter.id,
                                title: chapter.title,
                              })
                            }
                          >
                            <Trash2 className="mr-2 size-4" /> Delete chapter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No chapters yet. Create your first chapter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={chapterSheetOpen} onOpenChange={setChapterSheetOpen}>
        <SheetContent
          side="right"
          className="!w-full sm:!max-w-[800px] max-h-screen p-0 flex flex-col overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>
              {chapterSheetMode === "create"
                ? "Create chapter"
                : "Edit chapter"}
            </SheetTitle>
            <SheetDescription>Configure chapter metadata.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chapter title
              </p>
              <Input
                value={chapterForm.title}
                onChange={(e) =>
                  setChapterForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter chapter title"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <Textarea
                value={chapterForm.description}
                onChange={(e) =>
                  setChapterForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Short chapter description"
                className="min-h-32"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/20 shrink-0">
            <Button
              variant="outline"
              onClick={() => setChapterSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveChapter()} disabled={savingChapter}>
              {savingChapter ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {chapterSheetMode === "create"
                ? "Create chapter"
                : "Save chapter"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={lessonSheetOpen} onOpenChange={setLessonSheetOpen}>
        <SheetContent
          side="right"
          className="!w-full sm:!max-w-[800px] max-h-screen p-0 flex flex-col overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>
              {lessonSheetMode === "create" ? "Create lesson" : "Edit lesson"}
            </SheetTitle>
            <SheetDescription>
              Edit lesson content using markdown editor.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lesson title
                </p>
                <Input
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter lesson title"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Type
                </p>
                <Select
                  value={lessonForm.type}
                  onChange={(e) =>
                    setLessonForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="TEXT">Text</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="QUIZ">Quiz</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <Textarea
                value={lessonForm.description}
                onChange={(e) =>
                  setLessonForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Short lesson description"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Markdown content
              </p>
              <div className="rounded-md border overflow-hidden">
                <MarkdownEditor
                  value={lessonForm.markdownContent}
                  onChange={(val) =>
                    setLessonForm((prev) => ({ ...prev, markdownContent: val }))
                  }
                  height={360}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                type="button"
                variant={lessonForm.isHidden ? "default" : "outline"}
                onClick={() =>
                  setLessonForm((prev) => ({
                    ...prev,
                    isHidden: !prev.isHidden,
                  }))
                }
              >
                {lessonForm.isHidden ? "Hidden" : "Visible"}
              </Button>
              <Button
                type="button"
                variant={lessonForm.isOptional ? "default" : "outline"}
                onClick={() =>
                  setLessonForm((prev) => ({
                    ...prev,
                    isOptional: !prev.isOptional,
                  }))
                }
              >
                {lessonForm.isOptional ? "Optional" : "Required"}
              </Button>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/20 shrink-0">
            <Button variant="outline" onClick={() => setLessonSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveLesson()} disabled={savingLesson}>
              {savingLesson ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {lessonSheetMode === "create" ? "Create lesson" : "Save lesson"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "chapter"
                ? "Delete chapter?"
                : "Delete lesson?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "chapter"
                ? `This will remove chapter "${deleteTarget.title}" and related lessons.`
                : `This will remove lesson "${deleteTarget?.title ?? ""}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
