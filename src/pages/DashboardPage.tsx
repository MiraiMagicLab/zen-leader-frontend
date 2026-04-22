import { useNavigate } from "react-router-dom"
import { Calendar, LayoutDashboard, ArrowUpRight, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/common/PageHeader"

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Dashboard"
        subtitle="Overview for admin operations. Metrics & activity will appear here once requirements and data sources are confirmed."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className="h-10" onClick={() => navigate("/dashboard/events")}>
              <Calendar className="mr-2 size-4" />
              Events
            </Button>
            <Button className="h-10 px-6 font-semibold" onClick={() => navigate("/dashboard/programs")}>
              <LayoutDashboard className="mr-2 size-4" />
              Programs
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Learners</CardTitle>
            <CardDescription>Will be shown after metrics are defined.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data configured yet.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue</CardTitle>
            <CardDescription>Depends on billing/integration scope.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data configured yet.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completions</CardTitle>
            <CardDescription>Requires learning progress requirements.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data configured yet.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Support</CardTitle>
            <CardDescription>Optional — only if ticketing is in scope.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data configured yet.</CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent activity</CardTitle>
                <CardDescription>This will show real activity once the activity feed is defined.</CardDescription>
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
                  <TableHead className="px-6">Action</TableHead>
                  <TableHead className="px-6">Time</TableHead>
                  <TableHead className="px-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No activity data yet.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Administrative shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button className="w-full h-11 justify-start rounded-xl font-semibold" onClick={() => navigate("/dashboard/programs")}>
              <LayoutDashboard className="mr-3 size-4" />
              Manage Programs & Courses
            </Button>
            <Button className="w-full h-11 justify-start rounded-xl font-semibold" variant="outline" onClick={() => navigate("/dashboard/users")}>
              <Users className="mr-3 size-4" />
              Manage Users
            </Button>
            <Button className="w-full h-11 justify-start rounded-xl font-semibold" variant="outline" onClick={() => navigate("/dashboard/events")}>
              <Calendar className="mr-3 size-4" />
              Manage Events
            </Button>
            <Separator className="my-3" />
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">System Health</span>
              <span className="text-xs font-semibold text-muted-foreground">Not configured</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

