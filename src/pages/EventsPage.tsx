import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { MoreVertical, Plus, Search, CalendarDays, MapPin, Info, TriangleAlert } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoading } from "@/components/common/PageLoading"
import { eventApi, type EventResponse, type SpringPage } from "../lib/api"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    fetchEvents(currentPage)
  }, [currentPage])

  const fetchEvents = async (page: number) => {
    setIsLoading(true)
    try {
      const data = await eventApi.getAll(page, 10)
      setEventsData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventApi.remove(id)
      fetchEvents(currentPage)
      toast.success("Event deleted.")
    } catch (err) {
      console.error("Failed to delete event", err)
      toast.error("Delete failed.")
    }
  }

  const executePendingAction = async () => {
    if (!pendingAction) return
    setIsActionSubmitting(true)
    try {
      if (pendingAction.kind === "delete") {
        await handleDeleteEvent(pendingAction.eventId)
      } else if (pendingAction.kind === "publish") {
        await eventApi.publish(pendingAction.eventId)
        fetchEvents(currentPage)
        toast.success("Event published.")
      } else if (pendingAction.kind === "unpublish") {
        await eventApi.unpublish(pendingAction.eventId)
        fetchEvents(currentPage)
        toast.success("Event moved to draft.")
      }
      setPendingAction(null)
    } catch (err) {
      console.error(err)
      toast.error("Action failed.")
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const allEvents = eventsData?.content ?? []
  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allEvents.filter((event) => {
      if (query) {
        const haystack = [
          event.title,
          String(event.metadata?.category ?? event.sessionType ?? ""),
          String(event.metadata?.venue ?? event.roomCode ?? ""),
        ]
          .join(" ")
          .toLowerCase()
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
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Event Management</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Manage all events in one place. {eventsData?.totalElements ?? 0} total events.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/events/create")}
          size="lg"
          className="gap-2"
        >
          <Plus className="size-6" />
          Create Event
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-6 pb-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-3">
                Event list
                <Badge variant="outline" className="rounded-full border-border/40 px-3 py-1 text-xs">{filteredEvents.length} items</Badge>
              </CardTitle>
              <CardDescription className="text-sm font-medium opacity-70">
                Browse, filter, and manage events.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto min-w-[70%]">
              <div className="relative group">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title or venue..."
                  className="h-10 rounded-xl border-transparent bg-muted/60 pl-10 font-medium focus:border-primary/20 focus:bg-background"
                />
              </div>

              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-10 rounded-xl border-transparent bg-muted/60 px-4 font-medium focus:border-primary/20 focus:bg-background"
              />

              <div className="relative">
                <Select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-10 rounded-xl border-input bg-background px-4 text-xs font-medium uppercase tracking-wide"
                >
                  <option value="ALL">All Categories</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="SUMMIT">Summit</option>
                  <option value="TALK">Talk</option>
                  <option value="WEBINAR">Webinar</option>
                </Select>
              </div>

              <div className="relative">
                <Select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-10 rounded-xl border-input bg-background px-4 text-xs font-medium uppercase tracking-wide"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Archived</option>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <Table className="w-full text-left">
              <TableHeader className="border-y border-border/40 bg-muted/60 text-xs uppercase text-muted-foreground">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="px-8 py-6 font-semibold">Event</TableHead>
                  <TableHead className="px-6 py-6 font-semibold">Category</TableHead>
                  <TableHead className="px-6 py-6 font-semibold">Status</TableHead>
                  <TableHead className="px-6 py-6 font-semibold">Date & Time</TableHead>
                  <TableHead className="px-6 py-6 font-semibold">Location</TableHead>
                  <TableHead className="px-6 py-6 font-semibold">Registrations</TableHead>
                  <TableHead className="px-8 py-6 text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/20">
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <CalendarDays className="size-16 mb-2 text-muted-foreground/70" />
                        <p className="text-xl font-semibold">No matching events</p>
                        <p className="text-sm text-muted-foreground">Try changing your filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const category = getCategory(event)
                    const registration = getRegistration(event)
                    const startTime = new Date(event.startTime)
                    const location =
                      event.metadata?.locationType === "Physical"
                        ? String(event.metadata?.venue ?? event.roomCode ?? "TBA")
                        : "Online / Digital"

                    return (
                      <TableRow key={event.id} className="group border-none hover:bg-muted/40">
                        <TableCell className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                              <CalendarDays className="size-6 shrink-0" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <button
                                type="button"
                                className="line-clamp-1 text-left text-base font-semibold text-foreground hover:text-primary transition-colors"
                                onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                              >
                                {event.title}
                              </button>
                              {event.isOfficial ? (
                                <Badge className="rounded-sm border-none bg-primary px-2 py-0.5 text-xs text-primary-foreground">Official</Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-7">
                          <Badge variant="outline" className="border-border/60 text-xs uppercase">{category}</Badge>
                        </TableCell>
                        <TableCell className="px-6 py-7">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "flex size-2 rounded-full",
                              event.status === "PUBLISHED" ? "bg-primary animate-pulse" : "bg-muted-foreground/70"
                            )} />
                            <span className={cn(
                              "text-xs font-semibold uppercase tracking-wide",
                              event.status === "PUBLISHED" ? "text-primary" : "text-muted-foreground/80"
                            )}>{event.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-7">
                          <div className="space-y-1">
                            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              {startTime.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                              {startTime.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-7">
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <MapPin className="size-4 text-muted-foreground/70" />
                            {location}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-7">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1 flex-1 min-w-[80px]">
                              <div className="flex justify-between text-xs font-semibold uppercase tracking-wide">
                                <span className={registration.isFull ? "text-error" : "text-muted-foreground"}>Registrations</span>
                                <span className="text-foreground">{registration.registered}/{registration.capacity}</span>
                              </div>
                              <Progress
                                value={Math.min(100, (registration.registered / registration.capacity) * 100)}
                                className="h-2"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-7 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex size-10 items-center justify-center rounded-xl border border-transparent hover:border-border/40 hover:bg-muted transition-colors">
                              <span className="sr-only">Open actions</span>
                              <MoreVertical className="size-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-xl border-border p-2">
                              <DropdownMenuLabel className="px-4 py-3 text-xs uppercase text-muted-foreground/80">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="opacity-50" />
                              {event.status === "DRAFT" ? (
                                <DropdownMenuItem
                                  className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium text-primary focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  onClick={() => setPendingAction({ kind: "publish", eventId: event.id, title: event.title })}
                                >
                                  <Info className="size-5 shrink-0" />
                                  Publish event
                                </DropdownMenuItem>
                              ) : event.status === "PUBLISHED" ? (
                                <DropdownMenuItem
                                  className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium opacity-80 focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  onClick={() =>
                                    setPendingAction({ kind: "unpublish", eventId: event.id, title: event.title })
                                  }
                                >
                                  <Info className="size-5 shrink-0" />
                                  Move to draft
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                className="cursor-pointer gap-4 rounded-xl px-4 py-4 font-medium focus:bg-primary/15 focus:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                              >
                                <CalendarDays className="size-5 shrink-0" />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2 opacity-50" />
                              <DropdownMenuItem
                                variant="destructive"
                                className="rounded-xl px-4 py-4 font-bold gap-4 cursor-pointer"
                                onClick={() => setPendingAction({ kind: "delete", eventId: event.id, title: event.title })}
                              >
                                <MoreVertical className="size-5 shrink-0 rotate-90" />
                                Delete event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-2 pb-10">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          Showing {filteredEvents.length} / {eventsData?.totalElements ?? 0} events
        </p>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="h-10 px-4 text-xs uppercase"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
            disabled={currentPage === 0 || isLoading}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="h-10 border-border/60 px-5 text-xs uppercase"
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={(eventsData ? currentPage >= eventsData.totalPages - 1 : true) || isLoading}
          >
            Forward
          </Button>
        </div>
      </div>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent className="rounded-xl border bg-card p-8">
          <AlertDialogHeader className="space-y-4">
            <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-error/10 text-error">
              <TriangleAlert className="size-8" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              {pendingAction?.kind === "delete"
                ? "Delete this event?"
                : pendingAction?.kind === "publish"
                  ? "Publish this event?"
                  : "Move to draft?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              {pendingAction?.kind === "delete"
                ? `This will permanently remove "${pendingAction.title}". This action cannot be undone.`
                : pendingAction?.kind === "publish"
                  ? `This will publish "${pendingAction.title}" and make it visible to users.`
                  : `This will move "${pendingAction?.title ?? ""}" back to draft.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel disabled={isActionSubmitting} className="h-10 rounded-xl border-border/40 text-sm font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void executePendingAction()
              }}
              disabled={isActionSubmitting}
              className={cn(
                "h-10 rounded-xl px-5 text-sm font-medium",
                pendingAction?.kind === "delete" ? "bg-error hover:bg-error/90 text-white shadow-error/20" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
              )}
            >
              {isActionSubmitting
                ? "Processing..."
                : pendingAction?.kind === "delete"
                  ? "Delete"
                  : pendingAction?.kind === "publish"
                    ? "Publish"
                    : "Move to draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
