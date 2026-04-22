import { useCallback, useEffect, useState } from "react"
import {
  Search,
  MoreVertical,
  User as UserIcon,
  Mail,
  Download,
  Copy,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { userApi } from "@/lib/api"
import type { UserResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { cn, formatNumber } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"
import { SmartPagination } from "@/components/common/SmartPagination"

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
  const [page, setPage] = useState(1)
  const limit = 10

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

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredUsers.length / limit)

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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="User Management"
        subtitle="Manage all users in the system including students, instructors, and staff."
        stats={[
          { label: "Total Users", value: formatNumber(users.length) },
          { label: "Students", value: formatNumber(users.filter(u => u.roles.includes("STUDENT")).length) || 0 }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => void fetchUsers()}
              disabled={loading}
            >
              <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="lg"
              onClick={handleExport}
              disabled={loading || filteredUsers.length === 0}
            >
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md bg-background border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 h-12">User</TableHead>
                <TableHead className="px-6 h-12">Roles</TableHead>
                <TableHead className="px-6 h-12">Status</TableHead>
                <TableHead className="px-6 h-12">Joined</TableHead>
                <TableHead className="px-6 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="group border-none hover:bg-muted/40">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/5 bg-muted">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon className="h-5 w-5 text-muted-foreground/70" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] uppercase px-1.5 py-0">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {user.isVerified ? (
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void handleViewUserDetails(user.id)}>
                            <UserIcon className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleRefreshUser(user.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleCopy(user.email, "Email")}>
                            <Mail className="mr-2 h-4 w-4" /> Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleCopy(user.id, "User ID")}>
                            <Copy className="mr-2 h-4 w-4" /> Copy ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <SmartPagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          onPageChange={setPage}
          itemName="users"
        />
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User profile</DialogTitle>
            <DialogDescription>Detailed account information from the system.</DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {selectedUser ? (
              <div className="space-y-8">
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-6 text-sm">
                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display Name</span>
                  <span className="text-lg font-semibold tracking-tight text-foreground">{selectedUser.displayName}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                  <span className="font-bold text-base text-foreground/80">{selectedUser.email}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">User ID</span>
                  <code className="text-xs font-mono font-medium bg-muted/50 p-2 rounded-lg break-all border border-border/40">{selectedUser.id}</code>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</span>
                  <span className="font-bold text-base text-foreground/80">{formatDate(selectedUser.createdAt)}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Sign In</span>
                  <span className="font-bold text-base text-foreground/80">{selectedUser.lastSignInAt ? formatDate(selectedUser.lastSignInAt) : "Never"}</span>
                </div>

                <div className="pt-6 border-t border-border/40">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm font-semibold italic text-muted-foreground/80">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => selectedUser && void handleRefreshUser(selectedUser.id)}>
              Refresh
            </Button>
            <Button
              onClick={() => selectedUser && void handleCopy(selectedUser.id, "User ID")}
            >
              Copy ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
