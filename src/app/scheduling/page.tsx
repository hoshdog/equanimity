import { SchedulingForm } from "./scheduling-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";


export default function SchedulingPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Scheduling</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>AI-Powered Scheduling</CardTitle>
            <CardDescription>
              Describe a task and let AI suggest the best technicians based on their skills and performance history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SchedulingForm />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
             <CardTitle>Team Calendar</CardTitle>
            <CardDescription>
              View your team's schedule at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
