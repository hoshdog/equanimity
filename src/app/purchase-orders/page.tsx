// src/app/purchase-orders/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getPurchaseOrders } from '@/lib/purchase-orders';
import type { PurchaseOrder } from '@/lib/types';
import { PurchaseOrderFormDialog } from './po-form-dialog';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// TODO: Replace with dynamic org ID from user session
const ORG_ID = 'test-org';


const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'text-green-600 bg-green-100/80 border-green-200/80';
      case 'Sent': return 'text-blue-600 bg-blue-100/80 border-blue-200/80';
      case 'Partially Received': return 'text-yellow-600 bg-yellow-100/80 border-yellow-200/80';
      case 'Cancelled': return 'text-red-600 bg-red-100/80 border-red-200/80';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200/80';
    }
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'orgs', ORG_ID, 'purchaseOrders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)));
        setLoading(false);
    }, (error) => {
        console.error("Failed to fetch POs:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load purchase orders.' });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const handlePOCreated = (newPO: PurchaseOrder) => {
    // Listener will handle this
  };

  const handleRowClick = (po: PurchaseOrder) => {
    router.push(`/projects/${po.projectId}`);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
        <PurchaseOrderFormDialog onPOCreated={handlePOCreated} orgId={ORG_ID} />
      </div>
       <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
          <CardDescription>
            A list of all purchase orders across all projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(po => (
                  <TableRow key={po.id} onClick={() => handleRowClick(po)} className="cursor-pointer">
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{po.projectName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(po.status)}>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${po.totalValue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
