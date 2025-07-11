// src/app/training/profile-form.tsx
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Percent } from 'lucide-react';

export function ProfileForm() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Electrical & General Contracting" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="A short description of what this profile is for."
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
                control={control}
                name="defaults.desiredMargin"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Target Margin</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="25" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={control}
                name="defaults.overheadRate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Overhead Rate</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="15" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={control}
                name="defaults.callOutFee"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Call-out Fee</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="0" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
       </div>

      <FormField
        control={control}
        name="persona"
        render={({ field }) => (
          <FormItem>
            <FormLabel>AI Persona</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., You are an expert electrical estimator..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormDescription>
                Instruct the AI on the role it should take when generating the quote.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Instructions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., Always include a 5% contingency for unforeseen issues..."
                rows={4}
                {...field}
              />
            </FormControl>
             <FormDescription>
                Provide specific rules or defaults for the AI to follow.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="standards"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schedule of Rates & Costs</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Standard Labor Rate: $95/hour..."
                rows={8}
                {...field}
              />
            </FormControl>
             <FormDescription>
                This is the core data the AI uses for material and labor calculations.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
