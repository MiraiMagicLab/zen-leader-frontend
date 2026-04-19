import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { authStorage } from "@/lib/storage"

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/dashboard/programs", label: "Programs", icon: "folder_special", end: false },
  { to: "/dashboard/courses", label: "Course Management", icon: "school", end: false },
  { to: "/dashboard/events", label: "Events", icon: "event", end: false },
  { to: "/dashboard/users", label: "Users", icon: "group", end: false },
] as const

export function DashboardLayout() {
  const navigate = useNavigate()
  const user = authStorage.getUser()

  const displayName = user?.displayName || "Zen User"
  const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`

  const handleLogout = () => {
    authStorage.clearAuth()
    navigate("/login")
  }

  const roleLabel = user?.roles?.some(r => r.toUpperCase().includes("ADMIN"))
    ? "ADMINISTRATOR"
    : (user?.roles?.[0] || "USER")

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="px-3 py-5">
          <h1 className="font-headline text-xl font-bold text-foreground tracking-tight">Zenleader</h1>
          <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Management Portal</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive} className="font-label text-sm">
                      <span
                        className="material-symbols-outlined"
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="px-3 pb-4">
          <Separator />
          <Button onClick={handleLogout} variant="ghost" className="justify-start gap-2 text-sm">
            <span className="material-symbols-outlined">logout</span>
            <span>Log Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-surface">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/80 px-4 py-3 backdrop-blur-[20px] lg:px-8">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">LMS Admin Dashboard</p>
          </div>
          <button
            className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-slate-50"
            onClick={() => navigate("/dashboard/profile")}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-on-surface leading-tight">{displayName}</p>
              <p className="text-[10px] font-bold text-primary-fixed-dim bg-primary/5 px-2 py-0.5 rounded mt-0.5 uppercase tracking-wider">{roleLabel}</p>
            </div>
            <img alt="User Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed shadow-sm" src={avatarUrl} />
          </button>
        </header>

        <div className="flex-1 w-full p-6 lg:p-10">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
