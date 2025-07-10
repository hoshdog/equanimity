import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Users,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import { ProjectStatusChart } from '@/components/dashboard-charts';

export default function Dashboard() {
  const recentActivities = [
    { id: 1, user: 'Alice', action: 'approved leave request for Bob', time: '2m ago', type: 'Leave' },
    { id: 2, user: 'Charlie', action: 'added a new task to "Website Redesign"', time: '15m ago', type: 'Project' },
    { id: 3, user: 'System', action: 'payroll for May 2024 has been processed', time: '1h ago', type: 'Payroll' },
    { id: 4, user: 'David', action: 'submitted a new quote for "Mobile App"', time: '3h ago', type: 'Quote' },
    { id: 5, user: 'Eve', action: 'updated their employee profile', time: '5h ago', type: 'Employee' },
  ];

  const badgeVariant = (type: string) => {
    switch (type) {
      case 'Leave': return 'secondary';
      case 'Project': return 'default';
      case 'Payroll': return 'destructive';
      case 'Quote': return 'outline';
      default: return 'secondary';
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-muted-foreground">+5 new hires this quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">3 leave requests, 2 quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125,430</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Overview of current project statuses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ProjectStatusChart />
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent activities across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="font-medium">{activity.user}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {activity.action}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Badge variant={badgeVariant(activity.type)}>{activity.type}</Badge>
                    </TableCell>
                     <TableCell className="text-right text-muted-foreground">{activity.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
