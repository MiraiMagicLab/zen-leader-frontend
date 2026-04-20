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
  XCircle,
  Download,
  Copy,
  RefreshCw,
  UserCog,
  Ban,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"

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
  const [manageOpen, setManageOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedVerified, setSelectedVerified] = useState(false)
  const [selectedActive, setSelectedActive] = useState(false)
  const [manageNotice, setManageNotice] = useState<string | null>(null)

  const roleOptions = ["admin", "mentor", "member"]

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

  const seedManageForm = (user: UserResponse) => {
    setSelectedRoles(user.roles.map((role) => role.toLowerCase()))
    setSelectedVerified(user.isVerified)
    setSelectedActive(user.isActive)
    setManageNotice(null)
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

  const handleOpenManage = (user: UserResponse) => {
    setSelectedUser(user)
    seedManageForm(user)
    setManageOpen(true)
  }

  const handleOpenDeactivate = (user: UserResponse) => {
    setSelectedUser(user)
    setDeactivateOpen(true)
  }

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  const handleSaveManageChanges = () => {
    setManageNotice(
      "Backend hien tai chua expose endpoint cap nhat role/active/verified cho user khac. UI da san sang va se active ngay khi backend bo sung API.",
    )
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

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">User management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor your community members and staff.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => void fetchUsers()} disabled={loading}>
            Refresh
          </Button>
          <Button className="gap-2" onClick={handleExport} disabled={loading || filteredUsers.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total users",
            value: users.length,
            icon: Users,
            iconClass: "text-blue-600",
            iconBg: "bg-blue-500/10",
          },
          {
            label: "Active admins",
            value: users.filter((u) => u.roles.some((r) => r.toUpperCase().includes("ADMIN"))).length,
            icon: Shield,
            iconClass: "text-violet-600",
            iconBg: "bg-violet-500/10",
          },
          {
            label: "Verified",
            value: users.filter((u) => u.isVerified).length,
            icon: CheckCircle2,
            iconClass: "text-emerald-600",
            iconBg: "bg-emerald-500/10",
          },
          {
            label: "New (7 days)",
            value: users.filter((u) => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            icon: Calendar,
            iconClass: "text-orange-600",
            iconBg: "bg-orange-500/10",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-xl p-3 ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconClass}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <div className="flex flex-col items-stretch justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="h-11 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6">User</TableHead>
              <TableHead className="px-6">Role</TableHead>
              <TableHead className="px-6">Status</TableHead>
              <TableHead className="px-6">Joined</TableHead>
              <TableHead className="px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="px-6 py-4">
                    <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{user.displayName}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] font-medium">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs italic text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {user.isVerified ? (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-semibold">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-semibold">Unverified</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger nativeButton className="inline-flex w-full justify-end sm:w-auto">
                        <span className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                          <MoreVertical className="h-4 w-4 shrink-0" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>User actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={() => void handleViewUserDetails(user.id)}>
                          <UserIcon className="h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => void handleRefreshUser(user.id)}>
                          <RefreshCw className="h-4 w-4" />
                          Refresh user
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleOpenManage(user)}>
                          <UserCog className="h-4 w-4" />
                          Manage access
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => void handleCopy(user.email, "Email")}>
                          <Mail className="h-4 w-4" />
                          Copy email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => void handleCopy(user.id, "User ID")}>
                          <Copy className="h-4 w-4" />
                          Copy user ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          className="gap-2"
                          onClick={() => handleOpenDeactivate(user)}
                        >
                          <Ban className="h-4 w-4" />
                          Deactivate user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No users match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <p className="text-xs font-medium text-muted-foreground">
            {loading ? "Loading…" : `${users.length} user(s) loaded from the server`}
          </p>
        </div>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>Thong tin chi tiet tai thoi diem hien tai tu backend.</DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Display name</span>
                <span className="font-medium">{selectedUser.displayName}</span>
                <span className="text-muted-foreground">Email</span>
                <span>{selectedUser.email}</span>
                <span className="text-muted-foreground">User ID</span>
                <span className="break-all">{selectedUser.id}</span>
                <span className="text-muted-foreground">Created at</span>
                <span>{formatDate(selectedUser.createdAt)}</span>
                <span className="text-muted-foreground">Last sign-in</span>
                <span>{selectedUser.lastSignInAt ? formatDate(selectedUser.lastSignInAt) : "Never"}</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No role assigned</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedUser && void handleRefreshUser(selectedUser.id)}>
              Refresh data
            </Button>
            <Button onClick={() => selectedUser && void handleCopy(selectedUser.id, "User ID")}>Copy ID</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage access</DialogTitle>
            <DialogDescription>Cap nhat role va trang thai user (UI da day du, cho backend endpoint).</DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">{selectedUser.displayName}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((role) => {
                    const active = selectedRoles.includes(role)
                    return (
                      <Button
                        key={role}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleRole(role)}
                      >
                        {role.toUpperCase()}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Verified account</p>
                    <p className="text-xs text-muted-foreground">Danh dau da xac minh email/tai khoan.</p>
                  </div>
                  <Switch checked={selectedVerified} onCheckedChange={setSelectedVerified} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Active account</p>
                    <p className="text-xs text-muted-foreground">Tat se khoa user tren he thong.</p>
                  </div>
                  <Switch checked={selectedActive} onCheckedChange={setSelectedActive} />
                </div>
              </div>

              {manageNotice ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {manageNotice}
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSaveManageChanges}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser
                ? `Ban dang yeu cau deactivate ${selectedUser.displayName}.`
                : "Ban dang yeu cau deactivate user."}{" "}
              Backend hien chua co endpoint deactivate/activate user, nen hien tai chua the thuc thi thao tac nay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                toast.message("Chua the deactivate", {
                  description: "Can backend bo sung endpoint de xu ly thao tac nay.",
                })
              }
            >
              Da hieu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
