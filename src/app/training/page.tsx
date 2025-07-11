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
import { BrainCircuit, PlusCircle, Trash2, FileText, Save, Pencil, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialQuotingProfiles, QuotingProfile } from "@/lib/quoting-profiles";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


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
  const [selectedProfile, setSelectedProfile] = useState<QuotingProfile | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();

  const handleSelectProfile = (profile: QuotingProfile) => {
    setSelectedProfile(profile);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    const newId = `profile-${Date.now()}`;
    setSelectedProfile({
      id: newId,
      name: "New Quoting Profile",
      description: "",
      persona: "You are a helpful quoting assistant.",
      instructions: "",
      standards: ""
    });
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
    setIsCreatingNew(false);
  };

  const handleFieldChange = (field: keyof QuotingProfile, value: string) => {
    if (selectedProfile) {
      setSelectedProfile({ ...selectedProfile, [field]: value });
    }
  };

  const handleSaveProfile = () => {
    if (!selectedProfile) return;

    if (isCreatingNew) {
      setProfiles([...profiles, selectedProfile]);
      toast({ title: "Profile Created", description: `"${selectedProfile.name}" has been created.` });
    } else {
      setProfiles(profiles.map(p => p.id === selectedProfile.id ? selectedProfile : p));
      toast({ title: "Profile Updated", description: `"${selectedProfile.name}" has been saved.` });
    }
    setIsCreatingNew(false);
    setSelectedProfile(null);
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    if (profiles.length <= 1) {
        toast({ variant: 'destructive', title: "Cannot Delete", description: "You must have at least one quoting profile."});
        return;
    }
     if (window.confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        if (selectedProfile?.id === profileId) {
            setSelectedProfile(null);
        }
        toast({ title: "Profile Deleted", description: `"${profileName}" has been deleted.` });
    }
  }

  if (selectedProfile) {
    return (
      <CardContent>
          <Button variant="ghost" onClick={handleBackToList} className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Profiles
          </Button>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{isCreatingNew ? 'Create New Profile' : `Editing: ${selectedProfile.name}`}</h3>
            <div className="space-y-2">
                <Label htmlFor="profileName">Profile Name</Label>
                <Input id="profileName" value={selectedProfile.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="profileDescription">Description</Label>
                <Textarea id="profileDescription" value={selectedProfile.description} onChange={(e) => handleFieldChange('description', e.target.value)} rows={2} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="profilePersona">AI Persona</Label>
                <Textarea id="profilePersona" value={selectedProfile.persona} onChange={(e) => handleFieldChange('persona', e.target.value)} rows={3} placeholder="e.g., You are an expert electrical estimator..."/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="profileInstructions">Special Instructions</Label>
                <Textarea id="profileInstructions" value={selectedProfile.instructions} onChange={(e) => handleFieldChange('instructions', e.target.value)} rows={4} placeholder="e.g., Always include a 5% contingency..."/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="profileStandards">Costing & Labor Standards</Label>
                <Textarea id="profileStandards" value={selectedProfile.standards} onChange={(e) => handleFieldChange('standards', e.target.value)} rows={8} />
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                </Button>
            </div>
          </div>
      </CardContent>
    )
  }

  return (
    <CardContent>
        <div className="flex justify-end mb-4">
            <Button onClick={handleCreateNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Profile
            </Button>
        </div>
        <div className="space-y-2">
            {profiles.map(profile => (
                <Card key={profile.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                    <div>
                        <h4 className="font-semibold">{profile.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{profile.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleSelectProfile(profile)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
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
