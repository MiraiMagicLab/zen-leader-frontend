import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Plus, Search, CalendarDays, MapPin, Info, TriangleAlert } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoading } from "@/components/common/PageLoading"
import { eventApi, type EventResponse, type SpringPage } from "../lib/api"
import { cn, formatNumber } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"
import { SmartPagination } from "@/components/common/SmartPagination"

type PendingAction =
  | {
    kind: "delete"
    eventId: string
    title: string
  }
  | {
    kind: "publish" | "unpublish"
    eventId: string
    title: string
  }
  | null

export default function EventsPage() {
  const navigate = useNavigate()
  const [eventsData, setEventsData] = useState<SpringPage<EventResponse> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  const fetchEvents = useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const data = await eventApi.getAll(page, 10)
      setEventsData(data)
    } catch {
      toast.error("Failed to load events.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEvents(currentPage)
  }, [currentPage, fetchEvents])

  const executePendingAction = async () => {
    if (!pendingAction) return
    setIsActionSubmitting(true)
    try {
      if (pendingAction.kind === "delete") {
        await eventApi.remove(pendingAction.eventId)
        toast.success("Event deleted.")
      } else if (pendingAction.kind === "publish") {
        await eventApi.publish(pendingAction.eventId)
        toast.success("Event published.")
      } else if (pendingAction.kind === "unpublish") {
        await eventApi.unpublish(pendingAction.eventId)
        toast.success("Event moved to draft.")
      }
      fetchEvents(currentPage)
      setPendingAction(null)
    } catch {
      toast.error("Action failed.")
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const allEvents = useMemo(() => eventsData?.content ?? [], [eventsData])
  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allEvents.filter((event) => {
      if (query) {
        const haystack = [
          event.title,
          String(event.metadata?.category ?? event.sessionType ?? ""),
          String(event.metadata?.venue ?? event.roomCode ?? ""),
        ].join(" ").toLowerCase()
        if (!haystack.includes(query)) return false
      }

      if (selectedDate) {
        const eventDay = new Date(event.startTime).toISOString().slice(0, 10)
        if (eventDay !== selectedDate) return false
      }

      if (selectedCategory !== "ALL") {
        const category = String(event.metadata?.category ?? event.sessionType ?? "").toUpperCase()
        if (category !== selectedCategory) return false
      }

      if (selectedStatus !== "ALL" && event.status !== selectedStatus) {
        return false
      }

      return true
    })
  }, [allEvents, search, selectedDate, selectedCategory, selectedStatus])

  function getCategory(event: EventResponse) {
    return String(event.metadata?.category ?? event.sessionType ?? "OTHER").toUpperCase()
  }

  function getRegistration(event: EventResponse) {
    const registered = event.engagementStats?.interested ?? 0
    const capacity = Number(event.metadata?.capacity ?? 100)
    return { registered, capacity, isFull: registered >= capacity }
  }

  if (isLoading && allEvents.length === 0) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Event Management"
        subtitle="Track and manage workshops, summits, and webinars."
        stats={[
          { label: "Total Events", value: formatNumber(eventsData?.totalElements ?? 0) },
          { label: "Active", value: formatNumber(allEvents.filter(e => e.status === "PUBLISHED").length) }
        ]}
        actions={
          <Button
            onClick={() => navigate("/dashboard/events/create")}
            size="lg"
          >
            <Plus className="mr-2 size-5" />
            Create Event
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto"
            />
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full sm:w-[180px]">
              <option value="ALL">All Categories</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="SUMMIT">Summit</option>
              <option value="TALK">Talk</option>
              <option value="WEBINAR">Webinar</option>
            </Select>
            <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full sm:w-[180px]">
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Archived</option>
            </Select>
          </div>
        </div>

        <div className="rounded-md bg-background border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 h-12 w-16">STT</TableHead>
                <TableHead className="px-6 h-12">Event</TableHead>
                <TableHead className="px-6 h-12">Category</TableHead>
                <TableHead className="px-6 h-12">Status</TableHead>
                <TableHead className="px-6 h-12">Timeline</TableHead>
                <TableHead className="px-6 h-12">Location</TableHead>
                <TableHead className="px-6 h-12">Registration</TableHead>
                <TableHead className="px-6 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, idx) => {
                  const category = getCategory(event)
                  const registration = getRegistration(event)
                  const startTime = new Date(event.startTime)
                  const location = event.metadata?.locationType === "Physical"
                    ? String(event.metadata?.venue ?? event.roomCode ?? "TBA")
                    : "Online"

                  return (
                    <TableRow key={event.id} className="group border-none hover:bg-muted/40">
                      <TableCell className="px-6 py-4 text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <CalendarDays className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div
                              className="text-sm font-semibold text-foreground truncate max-w-[200px] cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                            >
                              {event.title}
                            </div>
                            {event.isOfficial && (
                              <Badge className="text-[9px] h-4 mt-0.5">Official</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px] uppercase">{category}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "size-1.5 rounded-full",
                            event.status === "PUBLISHED" ? "bg-primary" : "bg-muted-foreground/50"
                          )} />
                          <span className="text-xs font-medium">{event.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-xs font-semibold text-foreground">
                          {startTime.toLocaleDateString("en-US")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {startTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground max-w-[120px] truncate">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          {location}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="min-w-[100px] space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className={registration.isFull ? "text-destructive" : "text-muted-foreground"}>Progress</span>
                            <span>{registration.registered}/{registration.capacity}</span>
                          </div>
                          <Progress value={(registration.registered / registration.capacity) * 100} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                          >
                            <CalendarDays className="mr-2 size-4" />
                            Edit
                          </Button>
                          {event.status === "DRAFT" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setPendingAction({ kind: "publish", eventId: event.id, title: event.title })
                              }
                            >
                              <Info className="mr-2 size-4" />
                              Publish
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setPendingAction({ kind: "unpublish", eventId: event.id, title: event.title })
                              }
                            >
                              <Info className="mr-2 size-4" />
                              Draft
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setPendingAction({ kind: "delete", eventId: event.id, title: event.title })
                            }
                          >
                            <TriangleAlert className="mr-2 size-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <SmartPagination
          page={currentPage + 1}
          totalPages={eventsData?.totalPages ?? 0}
          totalItems={eventsData?.totalElements ?? 0}
          onPageChange={(p) => setCurrentPage(p - 1)}
          itemName="events"
        />
      </div>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <TriangleAlert className="size-6" />
            </div>
            <AlertDialogTitle>
              {pendingAction?.kind === "delete" ? "Delete Event?" : "Change Status?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "delete"
                ? `Are you sure you want to delete "${pendingAction.title}"? This action cannot be undone.`
                : `Please confirm the status change for "${pendingAction?.title ?? ""}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void executePendingAction() }}
              disabled={isActionSubmitting}
              className={pendingAction?.kind === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isActionSubmitting ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
