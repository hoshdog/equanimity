// src/app/settings/billing-profiles/page.tsx
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
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { initialQuotingProfiles, QuotingProfile } from "@/lib/quoting-profiles";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormDialog } from "./profile-form-dialog";

export default function BillingProfilesPage() {
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
        toast({ variant: 'destructive', title: "Cannot Delete", description: "You must have at least one billing profile."});
        return;
    }
     if (window.confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        toast({ title: "Profile Deleted", description: `"${profileName}" has been deleted.` });
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Billing Profiles</CardTitle>
            <CardDescription>
                Define the standard costs, labor rates, and AI instructions for generating quotes and jobs. This ensures accuracy and consistency across your team.
            </CardDescription>
        </CardHeader>
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
    </Card>
  );
}
