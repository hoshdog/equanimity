// src/app/training/profile-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { QuotingProfile } from '@/lib/quoting-profiles';
import { ProfileForm } from './profile-form';

const profileSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Profile name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  defaults: z.object({
      desiredMargin: z.coerce.number().min(0, "Margin can't be negative.").max(100, "Margin can't exceed 100."),
      overheadRate: z.coerce.number().min(0, "Overheads can't be negative."),
      callOutFee: z.coerce.number().min(0, "Call-out fee can't be negative.").optional(),
  }),
  persona: z.string().min(10, "Persona description is required."),
  instructions: z.string().optional(),
  standards: z.string().min(10, "Costing and labor standards are required."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormDialogProps {
  children: React.ReactNode;
  profile?: QuotingProfile;
  onProfileSaved: (profile: QuotingProfile) => void;
}

const getDefaultValues = (): ProfileFormValues => ({
  id: `profile-${Date.now()}`,
  name: "",
  description: "",
  defaults: {
    desiredMargin: 25,
    overheadRate: 15,
    callOutFee: 0,
  },
  persona: "You are a helpful quoting assistant for a services business.",
  instructions: "",
  standards: "Standard Labor Rate: $90/hour"
});

export function ProfileFormDialog({ children, profile, onProfileSaved }: ProfileFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  
  const isEditing = !!profile;
  
  const formMethods = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile || getDefaultValues(),
  });

  React.useEffect(() => {
    if (isOpen) {
        formMethods.reset(profile || getDefaultValues());
    }
  }, [isOpen, profile, formMethods]);
  
  const onSubmit = (values: ProfileFormValues) => {
    onProfileSaved(values);
    setIsOpen(false);
    toast({
        title: isEditing ? "Profile Updated" : "Profile Created",
        description: `"${values.name}" has been saved.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Quoting Profile' : 'Create New Quoting Profile'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the details for the "${profile?.name}" profile.` : 'Create a new profile for the AI to use when generating quotes.'}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-4">
            <ProfileForm />
            <DialogFooter>
               <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
