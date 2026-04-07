// ─── localStorage keys ───────────────────────────────────────────────────────
const KEYS = {
  courses: "zl_courses",
  programs: "zl_programs",
  token: "zl_token",
  user: "zl_user",
} as const

export interface AuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  roles: string[]
  appMetadata?: Record<string, unknown>
}

// ─── Curriculum types (embedded in StoredCourse for localStorage) ─────────
// Maps to: LessonResponse
export interface StoredLesson {
  id: string
  chapterId: string
  chapterTitle: string
  type: string          // maps to LessonResponse.type ("video" | "photo" | "document" | "text")
  title: string
  description: string
  orderIndex: number
  isHidden: boolean
  isOptional: boolean
  contentData: Record<string, unknown>  // maps to Map<String, Object>
  fileUrl?: string      // UI-only: local blob URL, not sent to backend
  createdAt: string     // ISO 8601 (backend: Instant)
  updatedAt: string     // ISO 8601 (backend: Instant)
}

// Maps to: ChapterResponse
export interface StoredChapter {
  id: string
  courseRunId: string
  courseRunCode: string
  title: string
  description: string
  orderIndex: number
  lessons: StoredLesson[]
  createdAt: string     // ISO 8601 (backend: Instant)
  updatedAt: string     // ISO 8601 (backend: Instant)
}

// Maps to: CourseRunResponse
export interface StoredCourseRun {
  id: string
  courseId: string
  code: string
  status: string        // "DRAFT" | "PUBLISHED"
  startsAt: string      // ISO 8601 string (backend: Instant)
  endsAt: string        // ISO 8601 string (backend: Instant)
  timezone: string
  metadata: Record<string, unknown>  // maps to Map<String, Object>
  chapters: StoredChapter[]
  createdAt: string     // ISO 8601 (backend: Instant)
  updatedAt: string     // ISO 8601 (backend: Instant)
  collapsed: boolean    // UI-only field, not in backend
}

// ─── Stored Course ─────────────────────────────────────────────────────────
// Maps to: CourseResponse & CourseUpsertRequest
export interface StoredCourse {
  id: string
  code: string
  title: string
  description: string
  level: string         // CourseResponse.level — "Beginner" | "Intermediate" | "Advanced" | "Expert"
  thumbnailUrl: string | null
  category: string      // CourseResponse.category — "STRATEGIC MASTERY" | "HUMAN CENTRICITY" | "FINANCE & OPS"
  programId: string | null    // FK to Program (CourseResponse.programId)
  programCode: string | null  // denormalized (CourseResponse.programCode)
  orderIndex: number
  tags: string[]        // CourseResponse.tags — List<String>
  courseRuns: StoredCourseRun[]
  createdAt: string     // ISO 8601 (backend: Instant)
  updatedAt: string     // ISO 8601 (backend: Instant)
}

// ─── Stored Program ───────────────────────────────────────────────────────────
// Maps to: ProgramResponse & ProgramUpsertRequest
//
// NOTE: backend ProgramResponse.courses = List<CourseResponse> (full objects)
// We store lightweight refs here for localStorage efficiency.
// When integrating real API, map CourseResponse → StoredCourseRef when saving.
export interface StoredCourseRef {
  id: string
  code: string
  title: string
  category: string      // CourseResponse.category (for display in AddCourseModal)
  orderIndex: number
}

// Maps to: ProgramResponse
export interface StoredProgram {
  id: string
  code: string
  title: string
  description: string
  thumbnailUrl: string | null
  isPublished: boolean
  publishedAt: string | null  // ISO 8601 (backend: Instant)
  courses: StoredCourseRef[]  // lightweight refs; backend sends full CourseResponse[]
  createdAt: string           // ISO 8601 (backend: Instant)
  updatedAt: string           // ISO 8601 (backend: Instant)
}

// ─── Generic helpers ─────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Courses API ─────────────────────────────────────────────────────────────
export const courseStorage = {
  getAll(): StoredCourse[] {
    return load<StoredCourse[]>(KEYS.courses, [])
  },

  upsert(course: StoredCourse): void {
    const all = courseStorage.getAll()
    const idx = all.findIndex((c) => c.id === course.id)
    if (idx >= 0) all[idx] = course
    else all.unshift(course)
    save(KEYS.courses, all)
  },

  remove(id: string): void {
    save(KEYS.courses, courseStorage.getAll().filter((c) => c.id !== id))
  },
}

// ─── Programs API ─────────────────────────────────────────────────────────────
export const programStorage = {
  getAll(): StoredProgram[] {
    return load<StoredProgram[]>(KEYS.programs, [])
  },

  upsert(program: StoredProgram): void {
    const all = programStorage.getAll()
    const idx = all.findIndex((p) => p.id === program.id)
    if (idx >= 0) all[idx] = program
    else all.unshift(program)
    save(KEYS.programs, all)
  },

  remove(id: string): void {
    save(KEYS.programs, programStorage.getAll().filter((p) => p.id !== id))
  },
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(KEYS.token)
  },
  setToken(token: string): void {
    localStorage.setItem(KEYS.token, token)
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(KEYS.user)
    return raw ? JSON.parse(raw) as AuthUser : null
  },
  setUser(user: AuthUser): void {
    localStorage.setItem(KEYS.user, JSON.stringify(user))
  },
  clearAuth(): void {
    localStorage.removeItem(KEYS.token)
    localStorage.removeItem(KEYS.user)
  },
  clearToken(): void {
    localStorage.removeItem(KEYS.token)
  },
}
