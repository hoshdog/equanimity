// src/app/settings/billing-rates/pricing-tier-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2, DollarSign, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const scaledPriceSchema = z.object({
  from: z.coerce.number().min(0, "Must be a positive value."),
  markup: z.coerce.number().min(0, "Markup must be a positive percentage."),
});

const tierSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Tier name must be at least 3 characters."),
  priceBasedOn: z.enum(['trade', 'cost']),
  defaultMarkup: z.coerce.number().min(0).max(100),
  isDefault: z.boolean(),
  enableScaledPricing: z.boolean(),
  scaledPricing: z.array(scaledPriceSchema).optional(),
});

export type TierFormValues = z.infer<typeof tierSchema>;

interface PricingTierDialogProps {
    tier?: TierFormValues;
    onSave: (data: TierFormValues) => void;
    children: React.ReactNode;
}

export function PricingTierDialog({ tier, onSave, children }: PricingTierDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const isEditing = !!tier;

    const form = useForm<TierFormValues>({
        resolver: zodResolver(tierSchema),
        defaultValues: isEditing ? tier : {
            id: `tier-${Date.now()}`,
            name: '',
            priceBasedOn: 'trade',
            defaultMarkup: 25,
            isDefault: false,
            enableScaledPricing: false,
            scaledPricing: [{ from: 0, markup: 25 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "scaledPricing",
    });
    
    const scaledPricingWatch = form.watch('scaledPricing');

    React.useEffect(() => {
        if (isOpen) {
            form.reset(isEditing ? tier : {
                id: `tier-${Date.now()}`,
                name: '',
                priceBasedOn: 'trade',
                defaultMarkup: 25,
                isDefault: false,
                enableScaledPricing: false,
                scaledPricing: [{ from: 0, markup: 25 }],
            });
        }
    }, [isOpen, isEditing, tier, form]);

    const onSubmit = (data: TierFormValues) => {
        onSave(data);
        setIsOpen(false);
    };

    const enableScaledPricing = form.watch('enableScaledPricing');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Pricing Tier' : 'Create Pricing Tier'}</DialogTitle>
                    <DialogDescription>
                        Define a pricing tier to manage markups on trade or cost prices.
                    </DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tier Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Standard, Wholesale" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="priceBasedOn"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price Based On</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl><RadioGroupItem value="trade" /></FormControl>
                                                        <FormLabel className="font-normal">Trade Price</FormLabel>
                                                    </FormItem>
                                                     <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl><RadioGroupItem value="cost" /></FormControl>
                                                        <FormLabel className="font-normal">Cost Price</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="isDefault"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 shadow-sm">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Default Pricing Tier</FormLabel>
                                                <FormDescription>
                                                    This tier will be selected by default for new quotes.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="space-y-4">
                                 <FormField
                                    control={form.control}
                                    name="defaultMarkup"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Default Markup</FormLabel>
                                            <FormControl><div className="relative">
                                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pr-8" placeholder="25" {...field} disabled={enableScaledPricing} />
                                            </div></FormControl>
                                            <FormDescription>
                                                Used when scaled pricing is disabled.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="enableScaledPricing"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>Enable Scaled Pricing</FormLabel>
                                                <FormDescription>
                                                   Apply different markups based on price.
                                                </FormDescription>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                             </div>
                        </div>

                        {enableScaledPricing && (
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium">Scaled Pricing Brackets</h4>
                                <div className="space-y-2">
                                {fields.map((field, index) => {
                                    const nextBracket = scaledPricingWatch && scaledPricingWatch[index + 1];
                                    const hasUpperLimit = !!nextBracket;
                                    const markup = scaledPricingWatch ? scaledPricingWatch[index].markup : 0;
                                    const margin = markup > 0 ? (markup / (100 + markup)) * 100 : 0;
                                    
                                    return (
                                        <div key={field.id} className="flex items-center gap-2 p-2 rounded-md border bg-secondary/30">
                                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`scaledPricing.${index}.from`}
                                                    render={({ field: fromField }) => (
                                                        <FormItem className="flex-1"><FormLabel>From</FormLabel><FormControl>
                                                            <div className="relative">
                                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input type="number" className="pl-8" placeholder="From $" {...fromField} disabled={index === 0} />
                                                            </div>
                                                        </FormControl><FormMessage /></FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`scaledPricing.${index}.markup`}
                                                    render={({ field: markupField }) => (
                                                        <FormItem className="flex-1"><FormLabel>Markup</FormLabel><FormControl>
                                                            <div className="relative">
                                                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input type="number" className="pr-8" placeholder="Markup %" {...markupField} />
                                                            </div>
                                                        </FormControl><FormMessage /></FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center justify-center gap-1 w-28">
                                                {hasUpperLimit ? (
                                                    <>
                                                        <Badge variant="outline" className="w-full justify-center">
                                                            Margin: {margin.toFixed(1)}%
                                                        </Badge>
                                                        <div className="text-xs text-muted-foreground text-center">
                                                           (for items up to ${nextBracket.from})
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Badge variant="outline" className="w-full justify-center">
                                                       Margin: {margin.toFixed(1)}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={index === 0}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ from: 0, markup: 0 })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Bracket
                                </Button>
                            </div>
                        )}
                        
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">{isEditing ? 'Save Changes' : 'Create Tier'}</Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
