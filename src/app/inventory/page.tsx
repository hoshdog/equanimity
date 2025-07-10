import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Supplier Parts List Import</CardTitle>
          <CardDescription>
            Import supplier parts from an Excel file. AI will help match them to existing parts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Drag & drop your Excel file here or click to browse.</p>
            <Button className="mt-4">
                Import File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
