import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Calendar, CircleDollarSign, Ticket, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

export default function DashboardPage() {
  const navigate = useNavigate()

  const stats = [
    { label: "Active learners", value: "14,285", delta: "+12.4%", icon: Users },
    { label: "Monthly revenue", value: "$42,890", delta: "+8.1%", icon: CircleDollarSign },
    { label: "Completion rate", value: "68.2%", delta: "+2.0%", icon: TrendingUp },
    { label: "Open tickets", value: "14", delta: "3 high", icon: Ticket },
  ]

  const enrollments = [
    { name: "Elena Petrov", email: "elena.p@global.com", course: "Mindfulness Basics", date: "Oct 24, 2023", status: "Completed" },
    { name: "Marcus Chen", email: "m.chen@tech.org", course: "Digital Flow States", date: "Oct 23, 2023", status: "In progress" },
    { name: "Julian Darko", email: "j.darko@creative.co", course: "Zen Architectures", date: "Oct 22, 2023", status: "Pending" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1400px] space-y-6"
    >
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of learners, revenue, and operations.
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => navigate("/dashboard/events")}>
          <Calendar className="size-4" />
          View Events
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
                <Badge variant="outline" className="font-medium">
                  {item.delta}
                </Badge>
              </div>
              <item.icon className="size-4 text-primary" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent enrollments</CardTitle>
            <CardDescription>Latest learner activity across programs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((row) => (
                  <TableRow key={row.email}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{row.course}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "Completed" ? "secondary" : "outline"}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Daily administration shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/dashboard/programs")}>
              Create New Course
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/dashboard/users")}>
              Review Users
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/dashboard/events")}>
              Publish Event
            </Button>
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground">
              System status: <span className="font-medium text-foreground">Operational</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming live event</CardTitle>
            <CardDescription>Oct 28 - Masterclass</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Scaling empathy in remote high-stakes team environments.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trending course</CardTitle>
            <CardDescription>The Zen Leader: Harmonizing Output</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm">Audit Content</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zen insight</CardTitle>
            <CardDescription>Intermediate Learners segment</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Churn risk forecast is up 12%. Recommend launching an engagement campaign this week.
          </CardContent>
        </Card>
      </section>
    </motion.div>
  )
}
