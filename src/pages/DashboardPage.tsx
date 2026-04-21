import { useNavigate } from "react-router-dom"
import { Calendar, CircleDollarSign, Ticket, TrendingUp, Users, ArrowUpRight, LayoutDashboard, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/common/PageHeader"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const navigate = useNavigate()

  const stats = [
    { label: "Active learners", value: "14,285", delta: "+12.4%", trend: "up", icon: Users },
    { label: "Monthly revenue", value: "$42,890", delta: "+8.1%", trend: "up", icon: CircleDollarSign },
    { label: "Completion rate", value: "68.2%", delta: "+2.0%", trend: "up", icon: TrendingUp },
    { label: "Open tickets", value: "14", delta: "3 high", trend: "neutral", icon: Ticket },
  ]

  const enrollments = [
    { name: "Elena Petrov", email: "elena.p@global.com", course: "Mindfulness Basics", date: "Oct 24, 2023", status: "Completed" },
    { name: "Marcus Chen", email: "m.chen@tech.org", course: "Digital Flow States", date: "Oct 23, 2023", status: "In progress" },
    { name: "Julian Darko", email: "j.darko@creative.co", course: "Zen Architectures", date: "Oct 22, 2023", status: "Pending" },
  ]

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's a high-level overview of your workspace performance."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className="h-10" onClick={() => navigate("/dashboard/events")}>
              <Calendar className="mr-2 size-4" />
              Schedule
            </Button>
            <Button className="h-10 px-6 font-semibold shadow-lg shadow-primary/20">
              <Zap className="mr-2 size-4" />
              Generate Report
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight text-foreground">{item.value}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn(
                      "font-bold text-[10px] px-1.5 py-0",
                      item.trend === "up" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-muted text-muted-foreground"
                    )}>
                      {item.delta}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium italic">vs last month</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary group-hover:scale-110 transition-transform">
                <item.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 overflow-hidden border shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent enrollments</CardTitle>
                <CardDescription>Real-time learner activity across your catalog.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => navigate("/dashboard/users")}>
                View All <ArrowUpRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6">User</TableHead>
                  <TableHead className="px-6">Course Path</TableHead>
                  <TableHead className="px-6">Date</TableHead>
                  <TableHead className="px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((row) => (
                  <TableRow key={row.email} className="group border-none hover:bg-muted/40">
                    <TableCell className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{row.name}</p>
                        <p className="text-[11px] text-muted-foreground">{row.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm font-medium">{row.course}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                      {row.date}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant={row.status === "Completed" ? "secondary" : "outline"} className="text-[10px] uppercase font-bold">
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Administrative shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button 
              className="w-full h-11 justify-start rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 border-none shadow-md shadow-primary/20 transition-all hover:scale-[1.01]" 
              onClick={() => navigate("/dashboard/programs")}
            >
              <LayoutDashboard className="mr-3 size-4" />
              Create New Course
            </Button>
            <Button className="w-full h-11 justify-start rounded-xl font-semibold bg-muted/30 hover:bg-muted/50 border-transparent shadow-none" variant="outline" onClick={() => navigate("/dashboard/users")}>
              <Users className="mr-3 size-4" />
              Review User Access
            </Button>
            <Button className="w-full h-11 justify-start rounded-xl font-semibold bg-muted/30 hover:bg-muted/50 border-transparent shadow-none" variant="outline" onClick={() => navigate("/dashboard/events")}>
              <Calendar className="mr-3 size-4" />
              Schedule Live Event
            </Button>
            <Separator className="my-3" />
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">System Health</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-foreground">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary/60 bg-primary/5 hover:bg-primary/[0.08] transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-1">
              <Zap className="size-3.5" /> Spotlight
            </div>
            <CardTitle className="text-base">Upcoming Masterclass</CardTitle>
            <CardDescription>October 28 • Executive Leadership</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-medium text-foreground/70 leading-relaxed">
            "Scaling empathy in remote high-stakes team environments" featuring Dr. Aris Thorne.
          </CardContent>
        </Card>
        
        <Card className="group cursor-pointer hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center justify-between">
              Trending Path
              <ArrowUpRight className="size-4 opacity-40" />
            </CardTitle>
            <CardDescription>Harmonizing Output Path</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm font-medium text-muted-foreground line-clamp-2">Our most popular strategic leadership course has seen a 40% surge in enrollment this week.</p>
             <Button variant="secondary" size="sm" className="w-full font-bold">Audit Content</Button>
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader>
             <CardTitle className="text-base">Zen Insight</CardTitle>
             <CardDescription>User Segmentation Analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-background p-3 border border-border/40 text-sm font-medium leading-relaxed">
              Churn risk forecast is up <span className="text-destructive font-bold">12%</span> in the Intermediate segment.
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground italic">Recommendation: Launch engagement campaign via email.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

