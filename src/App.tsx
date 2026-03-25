import { Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import DashboardPage from "./pages/DashboardPage"
import SettingsPage from "./pages/SettingsPage"
import LoginPage from "./pages/LoginPage"
import CommunityPage from "./pages/CommunityPage"
import EventsPage from "./pages/EventsPage"
import CreateEventPage from "./pages/CreateEventPage"
import CourseManagementPage from "./pages/CourseManagementPage"
import CreateCoursePage from "./pages/CreateCoursePage"
import EditCoursePage from "./pages/EditCoursePage"
import ProgramManagementPage from "./pages/ProgramManagementPage"
import CreateProgramPage from "./pages/CreateProgramPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="courses" element={<CourseManagementPage />} />
        <Route path="courses/create" element={<CreateCoursePage />} />
        <Route path="courses/:id/edit" element={<EditCoursePage />} />
        <Route path="programs" element={<ProgramManagementPage />} />
        <Route path="programs/create" element={<CreateProgramPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<div className="p-8"><h2 className="text-2xl font-bold">Profile Page</h2><p className="text-slate-500">Feature coming soon...</p></div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
