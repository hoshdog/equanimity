import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">HR Compliance</h2>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>AI Compliance Assistant</CardTitle>
          <CardDescription>
            Paste new labor laws or regulations below, and AI will generate a set of action items for the HR department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-4">
            <Textarea placeholder="Paste new regulations here..." rows={10} />
            <Button>Generate Action Items</Button>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg mt-6">
            <ShieldCheck className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Action items will be generated here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
