import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function PayrollPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
        <Button>
          Run Payroll
        </Button>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Automated Payroll</CardTitle>
          <CardDescription>
            Automate payroll calculations, tax deductions, and compliance with Australian Fair Work standards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Banknote className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Automated payroll feature coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
