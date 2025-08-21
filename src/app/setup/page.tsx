// src/app/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Waves, Building, Image as ImageIcon, Paintbrush, ArrowRight, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { addCompany } from '@/lib/company';
import { updateUserProfile } from '@/lib/users';
import { onAuthStateChanged } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const step1Schema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
});

const step2Schema = z.object({
  logoUrl: z.string().url("Please enter a valid URL.").optional(),
});

const step3Schema = z.object({
  themeColor: z.string().startsWith('#', "Must be a valid hex color code.").length(7, "Must be a valid hex color code."),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

const steps = [
  { id: 1, title: 'Company Details', icon: Building, schema: step1Schema },
  { id: 2, title: 'Company Branding', icon: ImageIcon, schema: step2Schema },
  { id: 3, title: 'Preferences', icon: Paintbrush, schema: step3Schema },
];

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const currentSchema = steps[currentStep - 1].schema;

  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      companyName: '',
      logoUrl: '',
      themeColor: '#3498db',
    },
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
        if (user) {
            setUser(user);
        } else {
            router.push('/auth');
        }
    });
    return () => unsubscribe();
  }, [router]);

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - submit the form
        await handleSubmit();
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to complete setup.' });
        return;
    }
    setLoading(true);
    try {
        const values = form.getValues();
        const companyData = {
            name: values.companyName,
            logoUrl: values.logoUrl,
            ownerUid: user.uid,
            preferences: {
                themeColor: values.themeColor,
            }
        };
        const companyId = await addCompany(companyData);
        await updateUserProfile(user.uid, { companyId });
        
        toast({ title: "Setup Complete!", description: "Welcome to Trackle. Redirecting you to the dashboard." });
        
        // Force a reload or redirect to ensure AuthProvider re-evaluates the user's setup status
        window.location.href = '/';

    } catch (error) {
        console.error("Setup failed:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete company setup.' });
    } finally {
        setLoading(false);
    }
  }

  const progress = (currentStep / steps.length) * 100;
  const CurrentIcon = steps[currentStep - 1].icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Waves className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Company Setup</CardTitle>
          <CardDescription className="text-center">Let's get your company details configured.</CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center gap-2 mb-6">
                <CurrentIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{steps[currentStep - 1].title}</h3>
            </div>
            <Form {...form}>
                <form className="space-y-6">
                    {currentStep === 1 && (
                        <FormField control={form.control} name="companyName" render={({ field }) => (
                            <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g., Innovate Corp" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    )}
                     {currentStep === 2 && (
                        <FormField control={form.control} name="logoUrl" render={({ field }) => (
                            <FormItem><FormLabel>Company Logo URL</FormLabel><FormControl><Input placeholder="https://example.com/logo.png" {...field} /></FormControl><FormMessage /><FormDescription>Enter the URL of your company logo. You can update the file later.</FormDescription></FormItem>
                        )}/>
                    )}
                     {currentStep === 3 && (
                        <FormField control={form.control} name="themeColor" render={({ field }) => (
                            <FormItem><FormLabel>Primary Brand Color</FormLabel><FormControl>
                                <div className="flex items-center gap-2">
                                <Input type="color" className="h-10 w-16 p-1" {...field} />
                                <Input type="text" className="flex-1" {...field} />
                                </div>
                            </FormControl><FormMessage /><FormDescription>Choose a color that represents your brand.</FormDescription></FormItem>
                        )}/>
                    )}
                </form>
            </Form>
        </CardContent>
        <div className="p-6 pt-0 flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNext} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {currentStep === steps.length ? 'Finish Setup' : 'Next'}
                {currentStep < steps.length && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
        </div>
      </Card>
    </div>
  );
}
