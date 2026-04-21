import { useCallback, useEffect, useState } from "react"
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle2,
  Download,
  Copy,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { userApi } from "@/lib/api"
import type { UserResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageLoading } from "@/components/common/PageLoading"
import { cn } from "@/lib/utils"

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function exportUsersCsv(rows: UserResponse[], filename: string) {
  const header = ["Display name", "Email", "Roles", "Verified", "Joined"]
  const lines = [
    header.join(","),
    ...rows.map((u) =>
      [
        escapeCsvCell(u.displayName),
        escapeCsvCell(u.email),
        escapeCsvCell(u.roles.join("; ")),
        escapeCsvCell(u.isVerified ? "yes" : "no"),
        escapeCsvCell(u.createdAt),
      ].join(","),
    ),
  ]
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const pageSize = 100
      const firstPage = await userApi.getUsers({
        page: 1,
        size: pageSize,
        direction: "DESC",
        field: "createdAt",
      })
      const allUsers = [...firstPage.data]

      if (firstPage.totalPages > 1) {
        const restPages = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
            userApi.getUsers({
              page: i + 2,
              size: pageSize,
              direction: "DESC",
              field: "createdAt",
            }),
          ),
        )
        restPages.forEach((page) => allUsers.push(...page.data))
      }

      setUsers(allUsers)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load users."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const updateUserInList = (nextUser: UserResponse) => {
    setUsers((prev) => prev.map((u) => (u.id === nextUser.id ? nextUser : u)))
  }

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied.`)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}.`)
    }
  }

  const handleRefreshUser = async (userId: string) => {
    try {
      const latest = await userApi.getById(userId)
      updateUserInList(latest)
      toast.success("User data refreshed.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh user."
      toast.error(message)
    }
  }

  const handleViewUserDetails = async (userId: string) => {
    try {
      const user = await userApi.getById(userId)
      updateUserInList(user)
      setSelectedUser(user)
      setDetailsOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load user details."
      toast.error(message)
    }
  }

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.error("No users to export.")
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    exportUsersCsv(filteredUsers, `zenleader-users-${stamp}.csv`)
    toast.success(`Exported ${filteredUsers.length} user(s).`)
  }

  if (loading && users.length === 0) {
    return <PageLoading />
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">User Management</h1>
          <p className="mt-2 text-base text-muted-foreground font-medium">
            Manage and monitor your community members and staff hierarchy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-10 px-4 font-medium"
            onClick={() => void fetchUsers()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            className="h-10 gap-2 px-4"
            onClick={handleExport}
            disabled={loading || filteredUsers.length === 0}
          >
            <Download className="h-5 w-5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Community",
            value: users.length,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/15",
          },
          {
            label: "Active Staff",
            value: users.filter((u) => u.roles.some((r) => r.toUpperCase().includes("ADMIN"))).length,
            icon: Shield,
            color: "text-primary",
            bg: "bg-primary/15",
          },
          {
            label: "Verified Users",
            value: users.filter((u) => u.isVerified).length,
            icon: CheckCircle2,
            color: "text-primary",
            bg: "bg-primary/15",
          },
          {
            label: "Recent Arrivals",
            value: users.filter((u) => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            icon: Calendar,
            color: "text-foreground",
            bg: "bg-muted/50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("rounded-md p-3", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col items-stretch justify-between gap-4 bg-muted/50 p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by identity or email address..."
              className="h-10 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="rounded-md bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
            Showing: <span className="text-primary">{filteredUsers.length}</span> / {users.length}
          </p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <Table>
            <TableHeader className="border-y border-border/40 bg-muted/60 text-xs uppercase text-muted-foreground">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-8 py-6 font-semibold">User</TableHead>
                <TableHead className="px-6 py-6 font-semibold">Roles</TableHead>
                <TableHead className="px-6 py-6 font-semibold">Status</TableHead>
                <TableHead className="px-6 py-6 font-semibold">Created</TableHead>
                <TableHead className="px-8 py-6 text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/20">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group border-none hover:bg-muted/40">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/5 bg-muted">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon className="h-6 w-6 text-muted-foreground/70" />
                          )}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-foreground">{user.displayName}</div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6 font-medium">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.length > 0 ? (
                          user.roles.map((role, idx) => (
                            <Badge key={idx} variant="outline" className="rounded-sm px-2 text-xs uppercase text-muted-foreground shadow-none">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs italic text-muted-foreground/70 font-medium tracking-tight">User</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      {user.isVerified ? (
                        <div className="flex items-center gap-2 text-primary">
                          <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs font-semibold uppercase">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground/70">
                          <span className="flex size-2 rounded-full bg-muted-foreground/70" />
                          <span className="text-xs font-semibold uppercase">Pending</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-6 text-sm font-bold text-muted-foreground/80 uppercase tracking-tight">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex size-10 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-border/40 hover:bg-muted">
                          <span className="sr-only">Open actions</span>
                          <MoreVertical className="h-5 w-5 shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-border p-2">
                          <DropdownMenuLabel className="px-4 py-3 text-xs text-muted-foreground/80">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="opacity-50" />
                          <DropdownMenuItem className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => void handleViewUserDetails(user.id)}>
                            <UserIcon className="h-5 w-5" />
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => void handleRefreshUser(user.id)}>
                            <RefreshCw className="h-5 w-5" />
                            Refresh user
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => void handleCopy(user.email, "Email")}>
                            <Mail className="h-5 w-5" />
                            Copy email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => void handleCopy(user.id, "User ID")}>
                            <Copy className="h-5 w-5" />
                            Copy user ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search className="size-16 mb-2 text-muted-foreground/70" />
                      <p className="text-xl font-semibold">No users found</p>
                      <p className="text-sm text-muted-foreground">Try changing your search filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 bg-muted/40 px-8 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
            {loading ? "Loading users..." : `Total users: ${users.length}`}
          </p>
        </div>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden rounded-xl border bg-card p-0">
          <div className="bg-muted/50 p-6 border-b border-border/50">
            <DialogHeader className="space-y-4">
              <div className="flex size-16 items-center justify-center rounded-xl bg-card text-primary ring-1 ring-border/50">
                <UserIcon className="size-8" />
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight">User Profile</DialogTitle>
              <DialogDescription className="text-sm font-medium leading-relaxed opacity-70">
                User details from the system.
              </DialogDescription>
            </DialogHeader>
          </div>

          <CardContent className="p-6 space-y-8">
            {selectedUser ? (
              <div className="space-y-8">
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-6 text-sm">
                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
                  <span className="text-lg font-semibold tracking-tight text-foreground">{selectedUser.displayName}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                  <span className="font-bold text-base text-foreground/80">{selectedUser.email}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">User ID</span>
                  <code className="text-xs font-mono font-medium bg-muted/50 p-2 rounded-lg break-all border border-border/40">{selectedUser.id}</code>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</span>
                  <span className="font-bold text-base text-foreground/80">{formatDate(selectedUser.createdAt)}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Sign-In</span>
                  <span className="font-bold text-base text-foreground/80">{selectedUser.lastSignInAt ? formatDate(selectedUser.lastSignInAt) : "Never"}</span>
                </div>

                <div className="pt-6 border-t border-border/40">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role) => (
                        <Badge key={role} variant="outline" className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-none">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm font-semibold italic text-muted-foreground/80">No role assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>

          <DialogFooter className="p-6 border-t border-border/40 bg-muted/30 flex gap-3">
            <Button variant="ghost" className="h-10 flex-1 rounded-xl text-sm font-medium text-muted-foreground" onClick={() => selectedUser && void handleRefreshUser(selectedUser.id)}>
              Refresh
            </Button>
            <Button
              className="h-10 flex-1 rounded-xl text-sm font-medium"
              onClick={() => selectedUser && void handleCopy(selectedUser.id, "User ID")}
            >
              Copy User ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
