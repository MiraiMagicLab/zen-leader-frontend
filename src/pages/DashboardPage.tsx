import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  LayoutDashboard,
  ArrowUpRight,
  Users,
  BookOpen,
  GraduationCap,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { eventApi, programApi, courseRunApi, userApi } from "@/lib/api"
import type { UserResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/common/PageHeader"
import { PageLoading } from "@/components/common/PageLoading"
import { cn, formatNumber } from "@/lib/utils"
import { formatUtcDate } from "@/lib/time"

type DashboardSnapshot = {
  totalUsers: number
  totalPrograms: number
  totalRuns: number
  totalEvents: number
  recentUsers: UserResponse[]
}

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  totalUsers: 0,
  totalPrograms: 0,
  totalRuns: 0,
  totalEvents: 0,
  recentUsers: [],
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT)
  const [loading, setLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        setLoading(true)

        const [usersPage, programs, runs, eventsPage] = await Promise.all([
          userApi.getUsers({ page: 1, size: 5, field: "createdAt", direction: "DESC" }),
          programApi.getAll(),
          courseRunApi.getAll(),
          eventApi.getAll(0, 1, true),
        ])

        if (cancelled) return

        setSnapshot({
          totalUsers: usersPage.totalElement,
          totalPrograms: programs.length,
          totalRuns: runs.length,
          totalEvents: eventsPage.totalElements,
          recentUsers: usersPage.data,
        })
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Failed to load dashboard."
        toast.error(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [refreshToken])

  if (loading && snapshot.totalUsers === 0 && snapshot.totalPrograms === 0 && snapshot.totalRuns === 0 && snapshot.totalEvents === 0) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Dashboard"
        subtitle="Live admin snapshot from the APIs that are currently available in the system."
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => setRefreshToken((prev) => prev + 1)}
              disabled={loading}
            >
              <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" className="h-10" onClick={() => navigate("/dashboard/events")}>
              <Calendar className="mr-2 size-4" />
              Events
            </Button>
            <Button className="h-10 px-6 font-semibold" onClick={() => navigate("/dashboard/programs")}>
              <LayoutDashboard className="mr-2 size-4" />
              Programs
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-primary" />
              Users
            </CardTitle>
            <CardDescription>Current total returned by the users API.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{formatNumber(snapshot.totalUsers)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LayoutDashboard className="size-4 text-primary" />
              Programs
            </CardTitle>
            <CardDescription>Programs available for admin management.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{formatNumber(snapshot.totalPrograms)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="size-4 text-primary" />
              Course Runs
            </CardTitle>
            <CardDescription>All runs currently exposed by the LMS endpoints.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{formatNumber(snapshot.totalRuns)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-primary" />
              Events
            </CardTitle>
            <CardDescription>Includes drafts because admin pages can manage both states.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{formatNumber(snapshot.totalEvents)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Newest accounts</CardTitle>
                <CardDescription>Latest user records from the backend, sorted by creation time.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="font-bold text-primary" onClick={() => navigate("/dashboard/users")}>
                View All <ArrowUpRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6">User</TableHead>
                  <TableHead className="px-6">Roles</TableHead>
                  <TableHead className="px-6">Joined</TableHead>
                  <TableHead className="px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.recentUsers.length > 0 ? (
                  snapshot.recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="px-1.5 py-0 text-[10px] uppercase">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {formatUtcDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={user.isVerified ? "border-primary/20 bg-primary/5 text-primary" : "text-muted-foreground"}>
                          {user.isVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No users available yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Shortcuts for the main admin workflows that are already wired.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button className="h-11 w-full justify-start rounded-xl font-semibold" onClick={() => navigate("/dashboard/programs")}>
              <LayoutDashboard className="mr-3 size-4" />
              Manage Programs & Courses
            </Button>
            <Button className="h-11 w-full justify-start rounded-xl font-semibold" variant="outline" onClick={() => navigate("/dashboard/users")}>
              <Users className="mr-3 size-4" />
              Manage Users
            </Button>
            <Button className="h-11 w-full justify-start rounded-xl font-semibold" variant="outline" onClick={() => navigate("/dashboard/events")}>
              <Calendar className="mr-3 size-4" />
              Manage Events
            </Button>
            <Separator className="my-3" />
            <div className="space-y-3 rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <GraduationCap className="size-4 text-primary" />
                Data coverage note
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This dashboard is intentionally limited to counts and newest users because the project does not expose a
                dedicated activity-feed API yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
