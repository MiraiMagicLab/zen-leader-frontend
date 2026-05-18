import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Plus, Search, CalendarDays, MapPin, Pencil, Send, SquarePen, Trash2, TriangleAlert } from "lucide-react"
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
import { eventApi, type EventResponse } from "../lib/api"
import { formatUtcDateTime, formatLocalDateInput } from "@/lib/time"
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

const PAGE_SIZE = 10

export default function EventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const firstPage = await eventApi.getAll(0, PAGE_SIZE)
      const allEvents = [...firstPage.content]

      if (firstPage.totalPages > 1) {
        const restPages = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, index) => eventApi.getAll(index + 1, PAGE_SIZE)),
        )
        restPages.forEach((page) => allEvents.push(...page.content))
      }

      setEvents(allEvents)
    } catch {
      toast.error("Failed to load events.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents])

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
      await fetchEvents()
      setPendingAction(null)
    } catch {
      toast.error("Action failed.")
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return events.filter((event) => {
      if (query) {
        const haystack = [
          event.title,
          String(event.metadata?.category ?? event.sessionType ?? ""),
          String(event.metadata?.venue ?? event.roomCode ?? ""),
        ].join(" ").toLowerCase()
        if (!haystack.includes(query)) return false
      }

      if (selectedDate) {
        const eventDay = formatLocalDateInput(event.startTime)
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
  }, [events, search, selectedDate, selectedCategory, selectedStatus])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedDate, selectedCategory, selectedStatus])

  const paginatedEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))

  function getCategory(event: EventResponse) {
    return String(event.metadata?.category ?? event.sessionType ?? "OTHER").toUpperCase()
  }

  function getRegistration(event: EventResponse) {
    const registered = event.engagementStats?.interested ?? 0
    const capacity = Number(event.metadata?.capacity ?? 100)
    return { registered, capacity, isFull: registered >= capacity }
  }

  if (isLoading && events.length === 0) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Event Management"
        subtitle="Track and manage workshops, summits, and webinars."
        stats={[
          { label: "Total Events", value: formatNumber(events.length) },
          { label: "Active", value: formatNumber(events.filter((e) => e.status === "PUBLISHED").length) },
        ]}
        actions={
          <Button
            onClick={() => navigate("/dashboard/events/create")}
            size="lg"
            className="whitespace-nowrap"
          >
            <Plus className="mr-2 size-5" />
            Create Event
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 xl:w-auto">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full xl:w-[190px]"
            />
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full xl:w-[180px]">
              <option value="ALL">All Categories</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="SUMMIT">Summit</option>
              <option value="TALK">Talk</option>
              <option value="WEBINAR">Webinar</option>
            </Select>
            <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full xl:w-[180px]">
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Archived</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border bg-background">
          <Table className="min-w-[980px] xl:min-w-0">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 h-12 w-16">STT</TableHead>
                <TableHead className="px-6 h-12">Event</TableHead>
                <TableHead className="px-6 h-12">Meta</TableHead>
                <TableHead className="px-6 h-12">Timeline</TableHead>
                <TableHead className="px-6 h-12">Location</TableHead>
                <TableHead className="px-6 h-12">Registration</TableHead>
                <TableHead className="px-4 h-12 w-[132px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map((event, idx) => {
                  const category = getCategory(event)
                  const registration = getRegistration(event)
                  const location = event.metadata?.locationType === "Physical"
                    ? String(event.metadata?.venue ?? event.roomCode ?? "TBA")
                    : "Online"

                  return (
                    <TableRow key={event.id} className="group border-none hover:bg-muted/40">
                      <TableCell className="px-6 py-4 text-muted-foreground">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/10 text-primary">
                            {event.thumbnailUrl ? (
                              <img
                                src={event.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <CalendarDays className="size-5" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px] xl:max-w-[280px]">
                            <div
                              className="truncate text-sm font-semibold text-foreground cursor-pointer transition-colors hover:text-primary"
                              onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                            >
                              {event.title}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {event.isOfficial ? (
                                <Badge className="h-4 text-[9px]">
                                  Official
                                </Badge>
                              ) : null}
                              {event.isOngoing ? (
                                <Badge variant="secondary" className="h-4 text-[9px]">
                                  Live
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="space-y-2">
                          <Badge variant="outline" className="text-[10px] uppercase">{category}</Badge>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                event.status === "PUBLISHED" ? "bg-primary" : "bg-muted-foreground/50",
                              )}
                            />
                            <span className="text-xs font-medium">{event.status}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-xs font-semibold text-foreground whitespace-nowrap">
                          {formatUtcDateTime(event.startTime)}
                        </div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                          to {formatUtcDateTime(event.endTime)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex max-w-[96px] items-center gap-1.5 truncate text-xs font-medium text-foreground xl:max-w-[120px]">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          {location}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="min-w-[84px] space-y-1.5 xl:min-w-[100px]">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className={registration.isFull ? "text-destructive" : "text-muted-foreground"}>Progress</span>
                            <span>{registration.registered}/{registration.capacity}</span>
                          </div>
                          <Progress value={(registration.registered / registration.capacity) * 100} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            title="Edit event"
                            aria-label={`Edit ${event.title}`}
                            onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {event.status === "DRAFT" ? (
                            <Button
                              size="icon"
                              variant="secondary"
                              title="Publish event"
                              aria-label={`Publish ${event.title}`}
                              onClick={() =>
                                setPendingAction({ kind: "publish", eventId: event.id, title: event.title })
                              }
                            >
                              <Send className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="secondary"
                              title="Move to draft"
                              aria-label={`Move ${event.title} to draft`}
                              onClick={() =>
                                setPendingAction({ kind: "unpublish", eventId: event.id, title: event.title })
                              }
                            >
                              <SquarePen className="size-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="destructive"
                            title="Delete event"
                            aria-label={`Delete ${event.title}`}
                            onClick={() =>
                              setPendingAction({ kind: "delete", eventId: event.id, title: event.title })
                            }
                          >
                            <Trash2 className="size-4" />
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
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredEvents.length}
          onPageChange={setCurrentPage}
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
              onClick={(e) => {
                e.preventDefault()
                void executePendingAction()
              }}
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
