import { Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import DashboardPage from "./pages/DashboardPage"
import SettingsPage from "./pages/SettingsPage"
import LoginPage from "./pages/LoginPage"
import EventsPage from "./pages/EventsPage"
import CreateEventPage from "./pages/CreateEventPage"
import EditEventPage from "./pages/EditEventPage"
import CourseManagementPage from "./pages/CourseManagementPage"
import CreateCoursePage from "./pages/CreateCoursePage"
import EditCoursePage from "./pages/EditCoursePage"
import CourseDetailPage from "./pages/CourseDetailPage"
import CourseRunDetailPage from "./pages/CourseRunDetailPage"
import ProgramManagementPage from "./pages/ProgramManagementPage"
import CreateProgramPage from "./pages/CreateProgramPage"
import UsersPage from "./pages/UsersPage"
import { authStorage } from "@/lib/storage"

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
  )
}

export default App
