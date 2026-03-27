export interface CourseData {
  id: string
  code: string
  title: string
  category: string
  level: string
  thumbnailUrl: string
  description?: string
  tags: string[]
  orderIndex: number
  programId: string | null
  programCode?: string
  actions: string[]
}

export const courses: CourseData[] = []
