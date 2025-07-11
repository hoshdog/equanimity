// src/app/settings/billing-rates/page.tsx
'use client';

import * as React from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Pencil, DollarSign, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

type TierFormValues = z.infer<typeof tierSchema>;

interface PricingTierDialogProps {
    tier?: TierFormValues;
    onSave: (data: TierFormValues) => void;
    children: React.ReactNode;
}

function PricingTierDialog({ tier, onSave, children }: PricingTierDialogProps) {
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
                                                <Input type="number" className="pr-8" placeholder="25" {...field} />
                                            </div></FormControl>
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
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`scaledPricing.${index}.from`}
                                            render={({ field: fromField }) => (
                                                <FormItem className="flex-1"><FormLabel className="sr-only">From Value</FormLabel><FormControl>
                                                     <div className="relative">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input type="number" className="pl-8" placeholder="From $" {...fromField} disabled={index === 0} />
                                                    </div>
                                                </FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                        <span className="text-sm text-muted-foreground">and above</span>
                                        <FormField
                                            control={form.control}
                                            name={`scaledPricing.${index}.markup`}
                                            render={({ field: markupField }) => (
                                                <FormItem className="flex-1"><FormLabel className="sr-only">Markup</FormLabel><FormControl>
                                                    <div className="relative">
                                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input type="number" className="pr-8" placeholder="Markup %" {...markupField} />
                                                    </div>
                                                </FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={index === 0}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
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

export default function BillingRatesPage() {
    const { toast } = useToast();
    const [tiers, setTiers] = React.useState<TierFormValues[]>([
        { id: 'tier-1', name: 'Standard', priceBasedOn: 'trade', defaultMarkup: 30, isDefault: true, enableScaledPricing: false },
        { id: 'tier-2', name: 'Wholesale', priceBasedOn: 'cost', defaultMarkup: 15, isDefault: false, enableScaledPricing: false },
        { 
            id: 'tier-3', 
            name: 'Scaled Pricing Example', 
            priceBasedOn: 'trade', 
            defaultMarkup: 50, 
            isDefault: false, 
            enableScaledPricing: true,
            scaledPricing: [
                { from: 0, markup: 50 },
                { from: 100, markup: 40 },
                { from: 500, markup: 30 },
            ]
        },
    ]);

    const handleSave = (data: TierFormValues) => {
        setTiers(prev => {
            const existingIndex = prev.findIndex(t => t.id === data.id);
            if (data.isDefault) {
                // Ensure only one default
                prev.forEach(t => t.isDefault = false);
            }
            if (existingIndex > -1) {
                const updatedTiers = [...prev];
                updatedTiers[existingIndex] = data;
                return updatedTiers;
            }
            return [...prev, data];
        });
        toast({ title: 'Success', description: `Pricing Tier "${data.name}" has been saved.`});
    };
    
    const handleDelete = (tierId: string) => {
        if (window.confirm("Are you sure you want to delete this pricing tier?")) {
             setTiers(prev => prev.filter(t => t.id !== tierId));
             toast({ title: 'Tier Deleted', variant: 'destructive', description: `The pricing tier has been deleted.`});
        }
    }


    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Pricing Tiers</CardTitle>
                    <CardDescription>
                        Manage different pricing levels for customers or jobs. These are used to calculate markup.
                    </CardDescription>
                </div>
                 <PricingTierDialog onSave={handleSave}>
                     <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Pricing Tier
                    </Button>
                </PricingTierDialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tier Name</TableHead>
                            <TableHead>Price Based On</TableHead>
                            <TableHead>Default Markup</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tiers.map(tier => (
                            <TableRow key={tier.id}>
                                <TableCell className="font-medium">{tier.name}</TableCell>
                                <TableCell className="capitalize">{tier.priceBasedOn}</TableCell>
                                <TableCell>{tier.defaultMarkup}%</TableCell>
                                <TableCell>{tier.isDefault ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <PricingTierDialog tier={tier} onSave={handleSave}>
                                             <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                             </Button>
                                        </PricingTierDialog>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tier.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}