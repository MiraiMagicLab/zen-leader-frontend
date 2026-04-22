import { Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { authStorage } from "@/lib/storage"
import DashboardPage from "./pages/DashboardPage"
import SettingsPage from "./pages/SettingsPage"
import LoginPage from "./pages/LoginPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import EventsPage from "./pages/EventsPage"
import CourseManagementPage from "./pages/CourseManagementPage"
import CourseDetailPage from "./pages/CourseDetailPage"
import CourseRunManagementPage from "./pages/CourseRunManagementPage"
import CourseRunDetailPage from "./pages/CourseRunDetailPage"
import ProgramManagementPage from "./pages/ProgramManagementPage"
import ProfilePage from "./pages/ProfilePage"
import UsersPage from "./pages/UsersPage"
import CreateEventSheet from "@/components/sheets/CreateEventSheet"
import EditEventSheet from "@/components/sheets/EditEventSheet"
import CreateCourseSheet from "@/components/sheets/CreateCourseSheet"
import EditCourseSheet from "./components/sheets/EditCourseSheet"
import CreateCourseRunDialog from "@/components/dialogs/CreateCourseRunDialog"
import EditCourseRunDialog from "@/components/dialogs/EditCourseRunDialog"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = authStorage.getToken()
  const user = authStorage.getUser()
  
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Check for admin role
  const roles = user?.roles || []
  const isAdmin = roles.some((role) => role.toUpperCase() === "ADMIN")

  if (!isAdmin) {
    // If not admin, logout and redirect to login
    authStorage.clearAuth()
    return <Navigate to="/login?error=unauthorized" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="zenleader-ui-theme">
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            <Route path="events/create" element={<CreateEventSheet />} />
            <Route path="events/edit/:id" element={<EditEventSheet />} />
            <Route path="programs/:programId" element={<CourseManagementPage />} />
            <Route path="programs/:programId/courses/create" element={<CreateCourseSheet />} />
            <Route path="courses/:id/runs/create" element={<CreateCourseRunDialog />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="runs" element={<CourseRunManagementPage />} />
            <Route path="runs/:runId" element={<CourseRunDetailPage />} />
            <Route path="runs/:runId/edit" element={<EditCourseRunDialog />} />
            <Route path="courses/:id/edit" element={<EditCourseSheet />} />
            <Route path="programs" element={<ProgramManagementPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
