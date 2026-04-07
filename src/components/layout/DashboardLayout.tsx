import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { authStorage } from "@/lib/storage"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-label text-sm ${
    isActive
      ? "text-slate-900 font-bold border-r-4 border-primary-fixed bg-surface-container-low"
      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
  }`

const navIconClass = (isActive: boolean) =>
  `material-symbols-outlined ${isActive ? "text-primary-fixed-dim" : ""}`

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
    <div className="bg-surface text-on-surface font-body antialiased flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r-0 bg-white shadow-[0px_12px_32px_rgba(31,62,114,0.06)] flex-col py-8 px-6 z-20">
        {/* Brand Header */}
        <div className="mb-10">
          <h1 className="text-xl font-bold text-slate-900 font-headline tracking-tight">Zenleader</h1>
          <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mt-1">Management Portal</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          <NavLink to="/dashboard" end className={navLinkClass}>
            {({ isActive }) => (<>
              <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
              <span>Dashboard</span>
            </>)}
          </NavLink>
          <NavLink to="/dashboard/courses" className={navLinkClass}>
            {({ isActive }) => (<>
              <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>school</span>
              <span>Course Management</span>
            </>)}
          </NavLink>
          <NavLink to="/dashboard/programs" className={navLinkClass}>
            {({ isActive }) => (<>
              <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>folder_special</span>
              <span>Programs</span>
            </>)}
          </NavLink>
          <NavLink to="/dashboard/events" className={navLinkClass}>
            {({ isActive }) => (<>
              <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>event</span>
              <span>Events</span>
            </>)}
          </NavLink>
        </nav>
        

        {/* Footer Navigation */}
        <div className="mt-auto border-t border-outline-variant/20 pt-6 space-y-1">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label text-sm">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen relative flex flex-col">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-[20px] border-b border-transparent flex justify-between items-center px-6 lg:px-10 py-4">
          <div className="flex-1 max-w-xl flex items-center gap-2">
            {/* Mobile Sidebar Toggle */}
            <Sheet>
              <SheetTrigger className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                <span className="material-symbols-outlined">menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-6 bg-white h-full flex flex-col">
                  <div className="mb-10">
                    <h1 className="text-xl font-bold text-slate-900 font-headline tracking-tight">Zenleader</h1>
                    <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mt-1">Management Portal</p>
                  </div>
                  <nav className="flex-1 space-y-1">
                    <NavLink to="/dashboard" end className={navLinkClass}>
                      {({ isActive }) => (<>
                        <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
                        <span>Dashboard</span>
                      </>)}
                    </NavLink>
                    <NavLink to="/dashboard/courses" className={navLinkClass}>
                      {({ isActive }) => (<>
                        <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>school</span>
                        <span>Course Management</span>
                      </>)}
                    </NavLink>
                    <NavLink to="/dashboard/programs" className={navLinkClass}>
                      {({ isActive }) => (<>
                        <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>folder_special</span>
                        <span>Programs</span>
                      </>)}
                    </NavLink>
                    <NavLink to="/dashboard/events" className={navLinkClass}>
                      {({ isActive }) => (<>
                        <span className={navIconClass(isActive)} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>event</span>
                        <span>Events</span>
                      </>)}
                    </NavLink>
                  </nav>

                  <div className="mt-auto border-t border-outline-variant/20 pt-6 space-y-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200">
                      <span className="material-symbols-outlined">logout</span>
                      <span className="font-label text-sm">Log Out</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative group flex-1 hidden sm:block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary/20 rounded-full py-2.5 pl-12 pr-4 text-sm placeholder:text-outline/60" placeholder="Search parameters, members, or courses..." type="text" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-secondary">
              <button className="relative hover:bg-surface-container p-2 rounded-full transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
              <button className="hover:bg-surface-container p-2 rounded-full transition-colors hidden sm:block">
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
              <button className="hover:bg-surface-container p-2 rounded-full transition-colors hidden sm:block">
                <span className="material-symbols-outlined">grid_view</span>
              </button>
            </div>
            <div className="h-8 w-px bg-outline-variant/30"></div>
            <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-slate-50 rounded-lg p-1 transition-colors" onClick={() => navigate("/dashboard/profile")}>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-tight">{displayName}</p>
                <p className="text-[10px] font-bold text-primary-fixed-dim bg-primary/5 px-2 py-0.5 rounded mt-0.5 uppercase tracking-wider">{roleLabel}</p>
              </div>
              <img alt="User Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed shadow-sm" src={avatarUrl} />
            </div>
          </div>
        </header>

        {/* DASHBOARD CANVAS / OUTLET */}
        <div className="flex-1 w-full p-6 lg:p-10 bg-surface">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
