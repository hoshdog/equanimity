import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, PlusCircle } from "lucide-react";

export default function PurchaseOrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Intelligent PO Management</CardTitle>
          <CardDescription>
            Automate follow-ups and extract data from delivery dockets using AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">AI features for purchase orders coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
