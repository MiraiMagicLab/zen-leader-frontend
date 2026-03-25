export interface CourseData {
  id: number
  title: string
  category: string
  status: "PUBLISHED" | "DRAFT"
  instructor: string
  instructorInitials: string
  instructorColor: string
  enrolled: number
  avgScore: number | null
  image: string
  actions: string[]
  description?: string
  price?: number
  duration?: string
  difficulty?: "Beginner" | "Intermediate" | "Expert"
}

export const courses: CourseData[] = [
  {
    id: 1,
    title: "Advanced Decision Architectures",
    category: "STRATEGIC MASTERY",
    status: "PUBLISHED",
    instructor: "Dr. Aris Thorne",
    instructorInitials: "AT",
    instructorColor: "bg-secondary",
    enrolled: 428,
    avgScore: 8.4,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
    actions: ["EDIT", "STATS", "ARCHIVE"],
    description: "Master the art of structured decision-making in high-stakes environments.",
    price: 299,
    duration: "10 Hours",
    difficulty: "Expert",
  },
  {
    id: 2,
    title: "The Empathy Quotient in Tech",
    category: "HUMAN CENTRICITY",
    status: "DRAFT",
    instructor: "Sarah Jenkins",
    instructorInitials: "SJ",
    instructorColor: "bg-tertiary",
    enrolled: 0,
    avgScore: null,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
    actions: ["EDIT", "PUBLISH", "DISCARD"],
    description: "Build empathetic leadership skills tailored for technology-driven teams.",
    price: 199,
    duration: "8 Hours",
    difficulty: "Intermediate",
  },
  {
    id: 3,
    title: "Fiscal Stewardship for CEOs",
    category: "FINANCE & OPS",
    status: "PUBLISHED",
    instructor: "Michael Chen",
    instructorInitials: "MC",
    instructorColor: "bg-primary",
    enrolled: 812,
    avgScore: 9.2,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
    actions: ["EDIT", "STATS", "ARCHIVE"],
    description: "A deep dive into financial strategy and responsible capital allocation for C-suite executives.",
    price: 399,
    duration: "14 Hours",
    difficulty: "Expert",
  },
  {
    id: 4,
    title: "Zen Leadership in Crisis",
    category: "STRATEGIC MASTERY",
    status: "PUBLISHED",
    instructor: "Dr. Aris Thorne",
    instructorInitials: "AT",
    instructorColor: "bg-secondary",
    enrolled: 316,
    avgScore: 7.9,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    actions: ["EDIT", "STATS", "ARCHIVE"],
    description: "Develop calm, decisive leadership capabilities for navigating organizational turbulence.",
    price: 249,
    duration: "12 Hours",
    difficulty: "Intermediate",
  },
  {
    id: 5,
    title: "Scaling Culture Across Borders",
    category: "HUMAN CENTRICITY",
    status: "DRAFT",
    instructor: "Sarah Jenkins",
    instructorInitials: "SJ",
    instructorColor: "bg-tertiary",
    enrolled: 0,
    avgScore: null,
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80",
    actions: ["EDIT", "PUBLISH", "DISCARD"],
    description: "A practical guide to maintaining a unified culture in distributed, multicultural organizations.",
    price: 179,
    duration: "6 Hours",
    difficulty: "Beginner",
  },
  {
    id: 6,
    title: "Revenue Intelligence for Leaders",
    category: "FINANCE & OPS",
    status: "PUBLISHED",
    instructor: "Michael Chen",
    instructorInitials: "MC",
    instructorColor: "bg-primary",
    enrolled: 540,
    avgScore: 8.7,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    actions: ["EDIT", "STATS", "ARCHIVE"],
    description: "Leverage data and market signals to drive sustainable revenue growth.",
    price: 349,
    duration: "11 Hours",
    difficulty: "Expert",
  },
]

export const categoryDisplayMap: Record<string, string> = {
  "STRATEGIC MASTERY": "Strategic Management",
  "HUMAN CENTRICITY": "Human Centricity",
  "FINANCE & OPS": "Finance & Ops",
}

export const categoryReverseMap: Record<string, string> = {
  "Strategic Management": "STRATEGIC MASTERY",
  "Human Centricity": "HUMAN CENTRICITY",
  "Finance & Ops": "FINANCE & OPS",
}
