import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  courseRunApi, 
  chapterApi, 
  lessonApi, 
  assetApi,
  type ChapterUpsertRequest,
  type LessonUpsertRequest
} from "@/lib/api"

// --- Course Run Hooks ---

export function useCourseRun(id?: string) {
  return useQuery({
    queryKey: ["course-run", id],
    queryFn: () => courseRunApi.getById(id!),
    enabled: !!id,
  })
}

export function useUpdateCourseRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      courseRunApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["course-run", id] })
      qc.invalidateQueries({ queryKey: ["course-runs"] })
    },
  })
}

// --- Chapter Hooks ---

export function useChapters(courseRunId?: string) {
  return useQuery({
    queryKey: ["chapters", courseRunId],
    queryFn: () => chapterApi.getAll(courseRunId),
    enabled: !!courseRunId,
  })
}

export function useCreateChapter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChapterUpsertRequest) => chapterApi.create(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["chapters", variables.courseRunId] })
      qc.invalidateQueries({ queryKey: ["course-run", variables.courseRunId] })
    },
  })
}

export function useUpdateChapter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChapterUpsertRequest }) => 
      chapterApi.update(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["chapters", variables.data.courseRunId] })
      qc.invalidateQueries({ queryKey: ["course-run", variables.data.courseRunId] })
    },
  })
}

export function useDeleteChapter(courseRunId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chapterApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapters", courseRunId] })
      qc.invalidateQueries({ queryKey: ["course-run", courseRunId] })
    },
  })
}

// --- Lesson Hooks ---

export function useLessons(chapterId?: string) {
  return useQuery({
    queryKey: ["lessons", chapterId],
    queryFn: () => lessonApi.getAll(chapterId),
    enabled: !!chapterId,
  })
}

export function useCreateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LessonUpsertRequest) => lessonApi.create(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lessons", variables.chapterId] })
      qc.invalidateQueries({ queryKey: ["chapters"] })
      qc.invalidateQueries({ queryKey: ["course-run"] })
    },
  })
}

export function useUpdateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LessonUpsertRequest }) => 
      lessonApi.update(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lessons", variables.data.chapterId] })
      qc.invalidateQueries({ queryKey: ["chapters"] })
      qc.invalidateQueries({ queryKey: ["course-run"] })
    },
  })
}

export function useDeleteLesson(chapterId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => lessonApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", chapterId] })
      qc.invalidateQueries({ queryKey: ["chapters"] })
      qc.invalidateQueries({ queryKey: ["course-run"] })
    },
  })
}

// --- Asset Hooks ---

export function useUploadLessonAsset() {
  return useMutation({
    mutationFn: (file: File) => assetApi.uploadLessonAsset(file),
  })
}
