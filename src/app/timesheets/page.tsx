import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, PlusCircle } from "lucide-react";

export default function TimesheetsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Timesheets</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Timesheet Suggestions</CardTitle>
          <CardDescription>
            Use location tracking to get AI-generated timesheet suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Clock className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">AI suggestion feature coming soon.</p>
            <Button variant="secondary" className="mt-4">
                Enable Location Tracking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
