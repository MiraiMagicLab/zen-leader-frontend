import { Suspense, lazy } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { TooltipProvider } from "@/components/ui/tooltip"
import { authStorage } from "@/lib/storage"

const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const SettingsPage = lazy(() => import("./pages/SettingsPage"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const EventsPage = lazy(() => import("./pages/EventsPage"))
const CreateEventPage = lazy(() => import("./pages/CreateEventPage"))
const EditEventPage = lazy(() => import("./pages/EditEventPage"))
const CourseManagementPage = lazy(() => import("./pages/CourseManagementPage"))
const CreateCoursePage = lazy(() => import("./pages/CreateCoursePage"))
const EditCoursePage = lazy(() => import("./pages/EditCoursePage"))
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"))
const CourseRunDetailPage = lazy(() => import("./pages/CourseRunDetailPage"))
const ProgramManagementPage = lazy(() => import("./pages/ProgramManagementPage"))
const CreateProgramPage = lazy(() => import("./pages/CreateProgramPage"))
const UsersPage = lazy(() => import("./pages/UsersPage"))

function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
        Loading page...
      </div>
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = authStorage.getToken()
  const user = authStorage.getUser()
  
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Check for admin role
  const roles = user?.roles || []
  const isAdmin = roles.some(r => r.toUpperCase() === "ADMIN" || r.toUpperCase() === "ROLE_ADMIN" || r.toUpperCase() === "SUPER_ADMIN")

  if (!isAdmin) {
    // If not admin, logout and redirect to login
    authStorage.clearAuth()
    return <Navigate to="/login?error=unauthorized" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <TooltipProvider>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/create" element={<CreateEventPage />} />
            <Route path="events/edit/:id" element={<EditEventPage />} />
            <Route path="courses" element={<CourseManagementPage />} />
            <Route path="courses/create" element={<CreateCoursePage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="runs/:runId" element={<CourseRunDetailPage />} />
            <Route path="courses/:id/edit" element={<EditCoursePage />} />
            <Route path="programs" element={<ProgramManagementPage />} />
            <Route path="programs/create" element={<CreateProgramPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<div className="p-8"><h2 className="text-2xl font-bold">Profile Page</h2><p className="text-slate-500">Feature coming soon...</p></div>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </TooltipProvider>
  )
}

export default App
