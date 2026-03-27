import { authStorage } from "./storage"

// ─── Base ─────────────────────────────────────────────────────────────────────
const BASE = "/api/v1"

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PagingResponse<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  totalElement: number
  data: T[]
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...init?.headers as Record<string, string>,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const json: ApiResponse<T> = await res.json()
  return json.data
}

async function reqForm<T>(path: string, formData: FormData): Promise<T> {
  const token = authStorage.getToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { method: "POST", body: formData, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const json: ApiResponse<T> = await res.json()
  return json.data
}

// ─── Response types (mirrors backend DTOs) ────────────────────────────────────

export interface AuthenticationResponse {
  authenticated: boolean
  accessToken: string
  refreshToken: string
}

export interface IntrospectResponse {
  isValid: boolean
}

export interface UserResponse {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  isActive: boolean
  isVerified: boolean
  verifiedAt: string | null
  bannedUntil: string | null
  lastSignInAt: string | null
  appMetadata: Record<string, unknown>
  userMetadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface LessonFileAttachmentResponse {
  provider: string
  fileName: string
  mimeType: string
  size: number
  url: string
  publicId: string
  resourceType: string
}

export interface LessonFileUploadResponse {
  lessonId: string
  attachment: LessonFileAttachmentResponse
}

export interface LessonResponse {
  id: string
  chapterId: string
  chapterTitle: string
  type: string
  title: string
  description: string | null
  orderIndex: number
  isHidden: boolean
  isOptional: boolean
  contentData: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ChapterResponse {
  id: string
  courseRunId: string
  courseRunCode: string
  title: string
  description: string | null
  orderIndex: number
  lessons: LessonResponse[]
  createdAt: string
  updatedAt: string
}

export interface CourseRunResponse {
  id: string
  courseId: string
  code: string
  status: string
  startsAt: string | null
  endsAt: string | null
  timezone: string | null
  metadata: Record<string, unknown>
  chapters: ChapterResponse[]
  createdAt: string
  updatedAt: string
}

export interface CourseResponse {
  id: string
  code: string
  title: string
  description: string | null
  level: string | null
  thumbnailUrl: string | null
  category: string | null
  programId: string
  programCode: string | null
  orderIndex: number
  tags: string[]
  courseRuns: CourseRunResponse[]
  createdAt: string
  updatedAt: string
}

export interface ProgramResponse {
  id: string
  code: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  courses: CourseResponse[]
  createdAt: string
  updatedAt: string
}

export interface LessonFileUploadResponse {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  size: number
}

// ─── Request types (mirrors backend DTOs) ─────────────────────────────────────

export interface AuthenticationRequest {
  email: string
  passwordHash: string
}

export interface IntrospectRequest {
  token: string
}

export interface RegisterRequest {
  displayName: string
  email: string
  passwordHash: string
}

export interface ProgramUpsertRequest {
  code: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  isPublished?: boolean
  publishedAt?: string | null
}

export interface CourseUpsertRequest {
  code: string
  title: string
  description?: string | null
  level?: string | null
  thumbnailUrl?: string | null
  category?: string | null
  programId: string
  orderIndex: number
  tags?: string[]
}

export interface CourseRunUpsertRequest {
  courseId: string
  code: string
  status: string
  startsAt: string   // ISO 8601 — backend: Instant (@NotNull)
  endsAt: string     // ISO 8601 — backend: Instant (@NotNull)
  timezone: string
  metadata?: Record<string, unknown>
}

export interface ChapterUpsertRequest {
  courseRunId: string
  title: string
  description?: string | null
  orderIndex: number
}

export interface LessonUpsertRequest {
  chapterId: string
  type: string
  title: string
  description?: string | null
  orderIndex: number
  isHidden?: boolean
  isOptional?: boolean
  contentData?: Record<string, unknown>
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: AuthenticationRequest) =>
    req<AuthenticationResponse>("/auth/token", { method: "POST", body: JSON.stringify(data) }),

  introspect: (data: IntrospectRequest) =>
    req<IntrospectResponse>("/auth/introspect", { method: "POST", body: JSON.stringify(data) }),

  register: (data: RegisterRequest) =>
    req<void>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
}

// ─── User API ──────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () =>
    req<UserResponse>("/users/me"),

  getAll: (page = 1, size = 10, field = "createdAt", direction = "DESC") =>
    req<PagingResponse<UserResponse>>(`/users?page=${page}&size=${size}&field=${field}&direction=${direction}`),

  getById: (id: string) =>
    req<UserResponse>(`/users/${id}`),
}

// ─── Program API ───────────────────────────────────────────────────────────────
export const programApi = {
  getAll: () =>
    req<ProgramResponse[]>("/programs"),

  create: (data: ProgramUpsertRequest) =>
    req<ProgramResponse>("/programs", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: ProgramUpsertRequest) =>
    req<ProgramResponse>(`/programs/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getById: (id: string) =>
    req<ProgramResponse>(`/programs/${id}`),

  remove: (id: string) =>
    req<string>(`/programs/${id}`, { method: "DELETE" }),
}

// ─── Course API ────────────────────────────────────────────────────────────────
export const courseApi = {
  getAll: (programId?: string) =>
    req<CourseResponse[]>(programId ? `/courses?programId=${encodeURIComponent(programId)}` : "/courses"),

  getById: (id: string) =>
    req<CourseResponse>(`/courses/${id}`),

  create: (data: CourseUpsertRequest) =>
    req<CourseResponse>("/courses", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: CourseUpsertRequest) =>
    req<CourseResponse>(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: string) =>
    req<string>(`/courses/${id}`, { method: "DELETE" }),
}

// ─── CourseRun API ─────────────────────────────────────────────────────────────
export const courseRunApi = {
  getById: (id: string) =>
    req<CourseRunResponse>(`/course-runs/${id}`),

  getAll: (courseId?: string) =>
    req<CourseRunResponse[]>(courseId ? `/course-runs?courseId=${encodeURIComponent(courseId)}` : "/course-runs"),

  create: (data: CourseRunUpsertRequest) =>
    req<CourseRunResponse>("/course-runs", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: CourseRunUpsertRequest) =>
    req<CourseRunResponse>(`/course-runs/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: string) =>
    req<string>(`/course-runs/${id}`, { method: "DELETE" }),
}

// ─── Chapter API ───────────────────────────────────────────────────────────────
export const chapterApi = {
  getAll: (courseRunId?: string) =>
    req<ChapterResponse[]>(courseRunId ? `/chapters?courseRunId=${encodeURIComponent(courseRunId)}` : "/chapters"),

  create: (data: ChapterUpsertRequest) =>
    req<ChapterResponse>("/chapters", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: ChapterUpsertRequest) =>
    req<ChapterResponse>(`/chapters/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getById: (id: string) =>
    req<ChapterResponse>(`/chapters/${id}`),

  remove: (id: string) =>
    req<string>(`/chapters/${id}`, { method: "DELETE" }),
}

// ─── Lesson API ────────────────────────────────────────────────────────────────
export const lessonApi = {
  getAll: (chapterId?: string) =>
    req<LessonResponse[]>(chapterId ? `/lessons?chapterId=${encodeURIComponent(chapterId)}` : "/lessons"),

  getById: (id: string) =>
    req<LessonResponse>(`/lessons/${id}`),

  create: (data: LessonUpsertRequest) =>
    req<LessonResponse>("/lessons", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: LessonUpsertRequest) =>
    req<LessonResponse>(`/lessons/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: string) =>
    req<string>(`/lessons/${id}`, { method: "DELETE" }),

  uploadFile: (id: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return reqForm<LessonFileUploadResponse>(`/lessons/${id}/files`, form)
  },
}
