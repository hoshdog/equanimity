// src/app/training/page.tsx
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
import { BrainCircuit, PlusCircle, Trash2, FileText, Save, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initialQuotingProfiles, QuotingProfile } from "@/lib/quoting-profiles";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormDialog } from "./profile-form-dialog";


const initialTrainingData = [
  { id: 1, task: "Fix HVAC unit", technician: "Alice", efficiency: 0.9, accuracy: 0.95, outcome: "Success" },
  { id: 2, task: "Repair plumbing leak", technician: "Bob", efficiency: 0.8, accuracy: 0.98, outcome: "Success" },
  { id: 3, task: "Install new lighting", technician: "Charlie", efficiency: 0.92, accuracy: 0.91, outcome: "Success" },
  { id: 4, task: "Fix HVAC unit", technician: "David", efficiency: 0.85, accuracy: 0.88, outcome: "Success" },
  { id: 5, task: "Repair plumbing leak", technician: "Eve", efficiency: 0.88, accuracy: 0.92, outcome: "Success" },
  { id: 6, task: "Install new lighting", technician: "Alice", efficiency: 0.95, accuracy: 0.96, outcome: "Success" },
  { id: 7, task: "Fix HVAC unit", technician: "Bob", efficiency: 0.75, accuracy: 0.80, outcome: "Rework Needed" },
];


function QuotingStandardsManager() {
  const [profiles, setProfiles] = useState<QuotingProfile[]>(initialQuotingProfiles);
  const { toast } = useToast();

  const handleProfileSaved = (savedProfile: QuotingProfile) => {
    const existingIndex = profiles.findIndex(p => p.id === savedProfile.id);
    if (existingIndex > -1) {
        setProfiles(profiles.map(p => p.id === savedProfile.id ? savedProfile : p));
        toast({ title: "Profile Updated", description: `"${savedProfile.name}" has been saved.` });
    } else {
        setProfiles([...profiles, savedProfile]);
        toast({ title: "Profile Created", description: `"${savedProfile.name}" has been created.` });
    }
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    if (profiles.length <= 1) {
        toast({ variant: 'destructive', title: "Cannot Delete", description: "You must have at least one quoting profile."});
        return;
    }
     if (window.confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        toast({ title: "Profile Deleted", description: `"${profileName}" has been deleted.` });
    }
  }

  return (
    <CardContent>
        <div className="flex justify-end mb-4">
            <ProfileFormDialog onProfileSaved={handleProfileSaved}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Profile
                </Button>
            </ProfileFormDialog>
        </div>
        <div className="space-y-2">
            {profiles.map(profile => (
                <Card key={profile.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                    <div>
                        <h4 className="font-semibold">{profile.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{profile.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ProfileFormDialog profile={profile} onProfileSaved={handleProfileSaved}>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </ProfileFormDialog>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProfile(profile.id, profile.name)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    </CardContent>
  );
}


export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState(initialTrainingData);
  
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
        <Tabs defaultValue="quoting">
            <TabsList className="grid w-full grid-cols-2 max-w-lg">
                <TabsTrigger value="quoting">
                    <FileText className="mr-2 h-4 w-4" />
                    Quoting Profiles
                </TabsTrigger>
                <TabsTrigger value="performance">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Technician Performance
                </TabsTrigger>
            </TabsList>
            <TabsContent value="quoting">
                <Card>
                    <CardHeader>
                        <CardTitle>Quoting Profiles</CardTitle>
                        <CardDescription>
                            Define the standard costs, labor rates, and AI instructions for generating quotes. This ensures accuracy and consistency.
                        </CardDescription>
                    </CardHeader>
                    <QuotingStandardsManager />
                </Card>
            </TabsContent>
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
        </Tabs>
    </div>
  );
}
