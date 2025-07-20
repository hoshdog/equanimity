
// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Phone, Brain, Award, PlusCircle, Trash2, Upload } from "lucide-react";
import { onAuthStateChanged } from '@/lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { getUserProfile, updateUserProfile } from '@/lib/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const certificationSchema = z.object({
    name: z.string().min(2, "Certification name is required."),
    expiryDate: z.string().min(10, "Please enter a valid expiry date (YYYY-MM-DD)."),
});

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  phone: z.string().optional(),
  photoURL: z.string().url("Please enter a valid URL.").optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(certificationSchema).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [newSkill, setNewSkill] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', phone: '', photoURL: '', skills: [], certifications: [] },
  });

  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({
    control: form.control,
    name: "certifications",
  });
  
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
      control: form.control,
      name: "skills",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setProfile(userProfile);
          form.reset({
            displayName: userProfile.displayName || '',
            phone: userProfile.phone || '',
            photoURL: userProfile.photoURL || '',
            skills: userProfile.skills || [],
            certifications: userProfile.certifications || [],
          });
        }
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/auth';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [form]);

  const handleAddSkill = () => {
    if (newSkill.trim() !== "") {
        appendSkill(newSkill.trim());
        setNewSkill("");
    }
  };

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, values);
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update your profile.' });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex-1 p-8 pt-6 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your personal details and contact information.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="photoURL"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Profile Picture</FormLabel>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={field.value} alt={profile?.displayName} data-ai-hint="person" />
                                        <AvatarFallback>{profile?.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow space-y-2">
                                        <FormControl>
                                            <Input placeholder="https://example.com/your-photo.jpg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        <FormDescription>
                                            Enter the URL of your profile image.
                                        </FormDescription>
                                    </div>
                                </div>
                            </FormItem>
                        )}
                        />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="displayName" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                 </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Skills</CardTitle><CardDescription>List your professional skills.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        {skillFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Input value={field.value as string} readOnly className="bg-secondary" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                     <div className="flex items-center gap-2">
                        <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a new skill" onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault(); handleAddSkill();}}}/>
                        <Button type="button" onClick={handleAddSkill}><PlusCircle className="mr-2 h-4 w-4"/>Add Skill</Button>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Certifications & Licenses</CardTitle><CardDescription>Manage your professional qualifications.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {certFields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                                <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Certification Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`certifications.${index}.expiryDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCert(index)} className="mt-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendCert({ name: '', expiryDate: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4"/>Add Certification
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
