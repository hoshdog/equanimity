
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, PlusCircle, Trash2, FileText, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const initialTrainingData = [
  { id: 1, task: "Fix HVAC unit", technician: "Alice", efficiency: 0.9, accuracy: 0.95, outcome: "Success" },
  { id: 2, task: "Repair plumbing leak", technician: "Bob", efficiency: 0.8, accuracy: 0.98, outcome: "Success" },
  { id: 3, task: "Install new lighting", technician: "Charlie", efficiency: 0.92, accuracy: 0.91, outcome: "Success" },
  { id: 4, task: "Fix HVAC unit", technician: "David", efficiency: 0.85, accuracy: 0.88, outcome: "Success" },
  { id: 5, task: "Repair plumbing leak", technician: "Eve", efficiency: 0.88, accuracy: 0.92, outcome: "Success" },
  { id: 6, task: "Install new lighting", technician: "Alice", efficiency: 0.95, accuracy: 0.96, outcome: "Success" },
  { id: 7, task: "Fix HVAC unit", technician: "Bob", efficiency: 0.75, accuracy: 0.80, outcome: "Rework Needed" },
];

const initialQuotingStandards = `Standard Labor Rate: $95/hour
Apprentice Labor Rate: $55/hour
Call-out Fee: $120 (includes first 30 minutes of labor)
Standard GPO (Supply & Install): $85 per unit
Standard Downlight (Supply & Install): $75 per unit
Wire per meter: $2.50
`;

export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState(initialTrainingData);
  const [quotingStandards, setQuotingStandards] = useState(initialQuotingStandards);

  const getOutcomeVariant = (outcome: string) => {
    if (outcome === "Success") return "default";
    if (outcome === "Rework Needed") return "destructive";
    return "secondary";
  };
  
  const handleDelete = (id: number) => {
    setTrainingData(trainingData.filter(item => item.id !== id));
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Training</h2>
      </div>
        <Tabs defaultValue="performance">
            <TabsList className="grid w-full grid-cols-2 max-w-lg">
                <TabsTrigger value="performance">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Technician Performance
                </TabsTrigger>
                <TabsTrigger value="quoting">
                    <FileText className="mr-2 h-4 w-4" />
                    Quoting Standards
                </TabsTrigger>
            </TabsList>
            <TabsContent value="performance">
                <Card>
                    <CardHeader>
                        <CardTitle>Technician Performance History</CardTitle>
                        <CardDescription>
                        This data is used by the AI to suggest the best technicians for new tasks. Add, edit, or remove records to improve scheduling accuracy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-end mb-4">
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Record
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Task Description</TableHead>
                                <TableHead>Technician</TableHead>
                                <TableHead className="text-center">Efficiency</TableHead>
                                <TableHead className="text-center">Accuracy</TableHead>
                                <TableHead className="text-center">Outcome</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {trainingData.map((item) => (
                                <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.task}</TableCell>
                                <TableCell>{item.technician}</TableCell>
                                <TableCell className="text-center">{item.efficiency.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{item.accuracy.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={getOutcomeVariant(item.outcome)}>{item.outcome}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="quoting">
                <Card>
                    <CardHeader>
                        <CardTitle>Quoting Standards</CardTitle>
                        <CardDescription>
                            Define the standard costs, labor rates, and rules the AI should use when generating quotes. This helps ensure accuracy and consistency.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea 
                            value={quotingStandards}
                            onChange={(e) => setQuotingStandards(e.target.value)}
                            rows={12}
                            placeholder="Enter your quoting standards here. For example:\nStandard Labor Rate: $90/hour\n..."
                        />
                        <div className="flex justify-end">
                            <Button>
                                <Save className="mr-2 h-4 w-4"/>
                                Save Standards
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
