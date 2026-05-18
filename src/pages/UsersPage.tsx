import { useEffect, useState } from "react"
import {
  Search,
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
import { formatUtcDate } from "@/lib/time"

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

const LIMIT = 10

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1)
      setSearchQuery(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await userApi.getUsers({
          page,
          size: LIMIT,
          direction: "DESC",
          field: "createdAt",
          keyword: searchQuery || undefined,
        })

        if (cancelled) return

        setUsers(response.data)
        setTotalPages(response.totalPages)
        setTotalUsers(response.totalElement)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Failed to load users."
        toast.error(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchUsers()

    return () => {
      cancelled = true
    }
  }, [page, reloadToken, searchQuery])

  const updateUserInList = (nextUser: UserResponse) => {
    setUsers((prev) => prev.map((u) => (u.id === nextUser.id ? nextUser : u)))
    setSelectedUser((prev) => (prev?.id === nextUser.id ? nextUser : prev))
  }

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied.`)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}.`)
    }
  }

  const handleRefreshPage = () => {
    setReloadToken((prev) => prev + 1)
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
    if (users.length === 0) {
      toast.error("No users to export.")
      return
    }

    const stamp = new Date().toISOString().slice(0, 10)
    exportUsersCsv(users, `zenleader-users-page-${page}-${stamp}.csv`)
    toast.success(`Exported ${users.length} user(s) from the current page.`)
  }

  if (loading && users.length === 0) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="User Management"
        subtitle="Browse user accounts from the backend with server-side search and pagination."
        stats={[
          { label: "Total Users", value: formatNumber(totalUsers) },
          { label: "Verified On Page", value: formatNumber(users.filter((u) => u.isVerified).length) },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleRefreshPage}
              disabled={loading}
            >
              <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="lg"
              onClick={handleExport}
              disabled={loading || users.length === 0}
            >
              <Download className="mr-2 size-4" />
              Export Page CSV
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1 group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-12 px-6">User</TableHead>
                <TableHead className="h-12 px-6">Roles</TableHead>
                <TableHead className="h-12 px-6">Status</TableHead>
                <TableHead className="h-12 px-6">Joined</TableHead>
                <TableHead className="h-12 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
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
                          <Badge key={idx} variant="secondary" className="px-1.5 py-0 text-[10px] uppercase">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {user.isVerified ? (
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {formatUtcDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => void handleViewUserDetails(user.id)}>
                          <UserIcon className="mr-2 size-4" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRefreshUser(user.id)}
                        >
                          <RefreshCw className="mr-2 size-4" />
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleCopy(user.email, "Email")}
                        >
                          <Mail className="mr-2 size-4" />
                          Copy email
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleCopy(user.id, "User ID")}
                        >
                          <Copy className="mr-2 size-4" />
                          Copy ID
                        </Button>
                      </div>
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
          totalItems={totalUsers}
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
                  <span className="text-base font-bold text-foreground/80">{selectedUser.email}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">User ID</span>
                  <code className="break-all rounded-lg border border-border/40 bg-muted/50 p-2 font-mono text-xs font-medium">{selectedUser.id}</code>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</span>
                  <span className="text-base font-bold text-foreground/80">{formatUtcDate(selectedUser.createdAt)}</span>

                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Sign In</span>
                  <span className="text-base font-bold text-foreground/80">
                    {selectedUser.lastSignInAt ? formatUtcDate(selectedUser.lastSignInAt) : "Never"}
                  </span>
                </div>

                <div className="border-t border-border/40 pt-6">
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
            <Button onClick={() => selectedUser && void handleCopy(selectedUser.id, "User ID")}>
              Copy ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
