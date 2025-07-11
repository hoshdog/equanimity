// src/app/training/profile-form.tsx
'use client';

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
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
import { DollarSign, Percent, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function LaborRatesManager() {
  const { control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "laborRates",
  });
  
  const laborErrors = errors.laborRates as any;

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <FormLabel>Labor Rates</FormLabel>
          <FormDescription>Define employee types and their billable rates.</FormDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ employeeType: "", standardRate: 0, overtimeRate: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Labor Type
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
                <div className="grid grid-cols-12 gap-2 flex-grow">
                    <div className="col-span-12 sm:col-span-5">
                       <FormField
                          control={control}
                          name={`laborRates.${index}.employeeType`}
                          render={({ field }) => (
                              <FormItem><FormLabel className="sr-only">Employee Type</FormLabel><FormControl><Input placeholder="e.g., Lead Technician" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                        <FormField
                            control={control}
                            name={`laborRates.${index}.standardRate`}
                            render={({ field }) => (
                                <FormItem><FormLabel className="sr-only">Standard Rate</FormLabel><FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
                                        <Input type="number" placeholder="Std. Rate" className="pl-6" {...field} />
                                    </div>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                        <FormField
                            control={control}
                            name={`laborRates.${index}.overtimeRate`}
                            render={({ field }) => (
                                <FormItem><FormLabel className="sr-only">Overtime Rate</FormLabel><FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
                                        <Input type="number" placeholder="OT Rate" className="pl-6" {...field} />
                                    </div>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                    </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
            </div>
        ))}
      </div>
      {laborErrors && laborErrors.root && <FormMessage>{laborErrors.root.message}</FormMessage>}
    </div>
  );
}


function MaterialAndServiceRatesManager() {
  const { control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materialAndServiceRates",
  });
  
  const materialErrors = errors.materialAndServiceRates as any;

  return (
     <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <FormLabel>Material & Service Rates</FormLabel>
          <FormDescription>Common parts, materials, or fixed-price services.</FormDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", cost: 0, unit: "each" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Rate
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="grid grid-cols-12 gap-2 flex-grow">
              <div className="col-span-12 sm:col-span-6">
                <FormField
                  control={control}
                  name={`materialAndServiceRates.${index}.description`}
                  render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Description</FormLabel><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <FormField
                  control={control}
                  name={`materialAndServiceRates.${index}.cost`}
                  render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Cost</FormLabel><FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
                        <Input type="number" placeholder="Cost" className="pl-6" {...field} />
                      </div>
                    </FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <FormField
                  control={control}
                  name={`materialAndServiceRates.${index}.unit`}
                  render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Unit</FormLabel><FormControl><Input placeholder="per hour, each" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
       {materialErrors && materialErrors.root && <FormMessage>{materialErrors.root.message}</FormMessage>}
    </div>
  );
}


export function ProfileForm() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
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
       
       <LaborRatesManager />
       <MaterialAndServiceRatesManager />

      <Separator />

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
    </div>
  );
}
