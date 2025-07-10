import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function LeavePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Team Leave Calendar</CardTitle>
                <CardDescription>View upcoming leave for your team.</CardDescription>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="range"
                    numberOfMonths={2}
                    className="rounded-md border p-0"
                />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>My Leave Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Annual Leave</span>
                    <span className="text-2xl font-bold">12</span>
                </div>
                 <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Sick Leave</span>
                    <span className="text-2xl font-bold">8</span>
                </div>
                 <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Banked Hours</span>
                    <span className="text-2xl font-bold">24.5</span>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
