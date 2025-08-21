'use client';

import * as React from 'react';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Site } from '@/lib/types';

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSiteAdded: (site: Site) => void;
  customerId: string;
}

const siteSchema = z.object({
  name: z.string().min(2, 'Site name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  suburb: z.string().min(2, 'Suburb is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().regex(/^\d{4}$/, 'Please enter a valid 4-digit postal code'),
});

type SiteFormData = z.infer<typeof siteSchema>;

export function AddSiteDialog({ open, onOpenChange, onSiteAdded, customerId }: AddSiteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: '',
      address: '',
      suburb: '',
      state: 'NSW',
      postalCode: '',
    },
  });

  const onSubmit = async (data: SiteFormData) => {
    setIsLoading(true);
    try {
      // Create new site object
      const newSite: Site = {
        id: `site-${Date.now()}`,
        name: data.name,
        address: data.address,
        suburb: data.suburb,
        state: data.state,
        postalCode: data.postalCode,
        customerId: customerId,
        country: 'Australia',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In a real app, this would save to the database
      // For now, we'll add to the mock data
      const { mockDataService } = await import('@/lib/mock-data');
      await mockDataService.addSite(newSite);

      toast({
        title: 'Site Added',
        description: `${data.name} has been added successfully.`,
      });

      onSiteAdded(newSite);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to add site:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add site. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Site Location</DialogTitle>
          <DialogDescription>
            Create a new site location for this customer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Office, Warehouse A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="suburb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suburb *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sydney" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="NSW" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="2000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Site
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}