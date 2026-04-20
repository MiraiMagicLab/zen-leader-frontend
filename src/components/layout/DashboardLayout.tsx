import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { CalendarDays, FolderKanban, LayoutDashboard, LogOut, Users } from "lucide-react"
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
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authStorage } from "@/lib/storage"
import { cn } from "@/lib/utils"
import zenleaderLogo from "@/assets/logo-zenleader.png"

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/programs", label: "Programs", icon: FolderKanban, end: false },
  { to: "/dashboard/events", label: "Events", icon: CalendarDays, end: false },
  { to: "/dashboard/users", label: "Users", icon: Users, end: false },
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
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="px-3 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/5 bg-primary/10 p-1">
              <img src={zenleaderLogo} alt="Zenleader" className="h-7 w-7 object-contain" />
            </span>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <h1 className="font-headline text-xl font-extrabold text-foreground tracking-tight">Zenleader</h1>
              <p className="text-xs font-medium text-primary/80">Admin Panel</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 rounded-xl px-3 text-sm font-medium",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden ml-2">{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="px-3 pb-6">
          <Separator className="mb-4 opacity-50" />
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="h-10 justify-start gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              <LogOut className="size-4" />
            </span>
            <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border/50 bg-background px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted" />
            <Separator orientation="vertical" className="h-6 opacity-30 hidden sm:block" />
            <p className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 sm:block">Zen Leader Dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <Separator orientation="vertical" className="h-6 opacity-30" />
            
            <Button
              variant="ghost"
              className="h-auto gap-3 rounded-xl border border-transparent px-2 py-1.5 pr-3 hover:border-border/50"
              onClick={() => navigate("/dashboard/profile")}
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold leading-tight text-foreground">{displayName}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">{roleLabel}</p>
              </div>
              <Avatar className="size-10 rounded-xl ring-2 ring-primary/10">
                <AvatarImage alt="User Profile" src={avatarUrl} />
                <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full p-6 sm:p-8 lg:p-12">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
