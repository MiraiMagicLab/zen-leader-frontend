import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Activity, Loader2, RefreshCw, Search, ShieldCheck, Upload, UploadCloud, UserPlus, UserX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import {
  enrollmentApi,
  type EnrollmentResponse,
  type UserResponse,
  type EnrollmentImportResponse
} from "@/lib/api"
import { cn } from "@/lib/utils"

interface EnrollmentTabProps {
  runId: string
  enrollments: EnrollmentResponse[]
  users: UserResponse[]
  loading: boolean
  onRefresh: () => void
}

function getInitials(name: string | null | undefined) {
  const source = (name ?? "").trim()
  if (!source) return "U"
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function EnrollmentTab({ runId, enrollments, users, loading, onRefresh }: EnrollmentTabProps) {
  const [query, setQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [directEmail, setDirectEmail] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<EnrollmentImportResponse | null>(null)

  const filteredUsers = users.filter((user) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      (user.displayName || "").toLowerCase().includes(q) ||
      (user.email || "").toLowerCase().includes(q)
    )
  })

  const handleManualEnroll = async () => {
    let targetUserId = selectedUserId
    const email = directEmail.trim().toLowerCase()

    if (!targetUserId && email) {
      const match = users.find(u => u.email?.toLowerCase() === email)
      if (!match) {
        toast.error("No user found with this email.")
        return
      }
      targetUserId = match.id
    }

    if (!targetUserId) {
      toast.error("Please select a user or enter an exact email.")
      return
    }

    setIsEnrolling(true)
    try {
      await enrollmentApi.manualEnroll({ userId: targetUserId, courseRunId: runId })
      toast.success("User enrolled successfully.")
      setSelectedUserId("")
      setDirectEmail("")
      setQuery("")
      onRefresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to enroll user."
      toast.error(message)
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleImport = async (file: File | null) => {
    if (!file) return
    setIsImporting(true)
    try {
      const result = await enrollmentApi.importByExcel(runId, file)
      setImportResult(result)
      toast.success(`Import complete: ${result.successCount} success, ${result.failedCount} failed.`)
      onRefresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed."
      toast.error(message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-sm rounded-xl">
            <CardHeader className="p-8 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">Active Roster</CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  {enrollments.length} learners currently participating in this cycle.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary" onClick={onRefresh}>
                <RefreshCw className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/70">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="text-xs font-medium uppercase">Updating roster...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                    <UserX className="size-7 text-muted-foreground/70" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">No active enrollments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="h-12 px-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Learner</TableHead>
                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                      <TableHead className="h-12 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Onboarding</TableHead>
                      <TableHead className="h-12 px-8 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date Join</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((en) => (
                      <TableRow key={en.id} className="hover:bg-muted/50 border-border/50 transition-colors group">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 rounded-xl ring-2 ring-background">
                              <AvatarImage src={en.userAvatarUrl ?? undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-bold">{getInitials(en.userDisplayName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="mb-1 font-semibold leading-none text-foreground">{en.userDisplayName}</span>
                              <span className="text-xs text-muted-foreground font-medium">{en.userEmail}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "rounded-full border-none px-3 py-0.5 text-xs font-semibold tracking-wide shadow-sm",
                            en.status === "ACTIVE" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {en.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold uppercase text-muted-foreground">
                          {en.enrolmentMethod}
                        </TableCell>
                        <TableCell className="px-8 py-4 text-right text-xs font-semibold text-muted-foreground">
                          {en.createdAt ? new Date(en.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-sm rounded-xl">
            <CardHeader className="p-8 pb-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserPlus className="size-4" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">Direct Access</CardTitle>
              <CardDescription className="text-muted-foreground font-medium pt-1">Grant instant access to a specific user.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-5">
              <div className="space-y-2">
                <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">User search</Label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-hover:text-primary group-focus-within:text-primary" />
                  <Input
                    placeholder="Name or email..."
                    className="h-10 rounded-xl border-border bg-muted/50 pl-10 text-sm font-medium focus:bg-background"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {query.trim() && (
                  <div className="custom-scrollbar mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-sm">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.slice(0, 5).map(u => (
                        <div
                          key={u.id}
                          onClick={() => { setSelectedUserId(u.id); setDirectEmail(u.email || ""); setQuery("") }}
                          className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b border-border/50 last:border-none"
                        >
                          <Avatar className="h-8 w-8 rounded-xl shrink-0">
                            <AvatarImage src={u.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-xs">{getInitials(u.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">{u.displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">No users found</p>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wide"><span className="bg-card px-4 text-muted-foreground/70">Selected user</span></div>
              </div>

              <div className="space-y-2">
                <Label className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Account</Label>
                <Input
                  placeholder="Selection will appear here"
                  value={directEmail}
                  readOnly
                  className="h-10 rounded-xl border-border bg-muted/50 text-sm font-medium text-muted-foreground"
                />
              </div>

              <Button
                className="h-10 w-full gap-2 rounded-xl text-sm font-semibold"
                onClick={handleManualEnroll}
                disabled={isEnrolling || !targetSelected(selectedUserId, directEmail)}
              >
                {isEnrolling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                {isEnrolling ? "Enrolling..." : "Enroll user"}
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-sm rounded-xl">
            <CardHeader className="p-8 pb-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Upload className="size-4" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">Bulk Pipeline</CardTitle>
              <CardDescription className="text-muted-foreground font-medium pt-1">Import mass learners via Excel.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <label className="group flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <UploadCloud className="mb-2 size-7 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">Select manifest (.xlsx)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
                  disabled={isImporting}
                />
              </label>

              {isImporting && (
                <div className="flex flex-row items-center justify-center gap-3 text-muted-foreground">
                  <Activity className="size-4 animate-spin" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Processing Import...</p>
                </div>
              )}

              {importResult && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3 rounded-xl border border-border bg-muted/60 p-6"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Import Summary</p>
                    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background p-3 shadow-sm">
                      <span className="text-xs font-semibold text-muted-foreground">Total Rows</span>
                      <span className="text-xs font-semibold text-foreground">{importResult.totalRows}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-background p-3 text-primary shadow-sm">
                      <span className="text-xs font-semibold">Success</span>
                      <span className="text-xs font-semibold">{importResult.successCount}</span>
                    </div>
                    {importResult.failedCount > 0 && (
                      <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-background p-3 text-destructive shadow-sm">
                        <span className="text-xs font-semibold">Failed</span>
                        <span className="text-xs font-semibold">{importResult.failedCount}</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function targetSelected(id: string, email: string) {
  return id.length > 0 || email.length > 0
}
