// src/app/quotes/quote-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/lib/types';
import { addQuote } from '@/lib/quotes';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { getDocs, query, collection, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const createQuoteSchema = z.object({
    projectId: z.string().min(1, "Please select a project."),
});

type CreateQuoteValues = z.infer<typeof createQuoteSchema>;

interface QuoteFormDialogProps {
  onQuoteCreated?: (quoteId: string) => void;
  initialProjectId?: string;
  children?: React.ReactNode;
}


export function QuoteFormDialog({ onQuoteCreated, initialProjectId, children }: QuoteFormDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<CreateQuoteValues>({
        resolver: zodResolver(createQuoteSchema),
        defaultValues: { projectId: initialProjectId || "" },
    });
    
    React.useEffect(() => {
        if (initialProjectId) {
            form.setValue('projectId', initialProjectId);
        }
    }, [initialProjectId, form]);

    React.useEffect(() => {
        if (!isOpen) return;
        async function fetchProjects() {
            setLoading(true);
            try {
                const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load projects." });
            } finally {
                setLoading(false);
            }
        }
        if (!initialProjectId) {
            fetchProjects();
        }
    }, [isOpen, toast, initialProjectId]);

    const projectOptions = projects.map(p => ({ value: p.id, label: `${p.name} (${p.customerName})`}));

    async function onSubmit(values: CreateQuoteValues) {
        setLoading(true);
        const projectQuery = query(collection(db, 'projects'), where('id', '==', values.projectId));
        const projectSnapshot = await getDocs(projectQuery);
        const selectedProject = projects.find(p => p.id === values.projectId);

        if (!selectedProject) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected project.' });
            setLoading(false);
            return;
        }

        try {
            const newQuoteData = {
                projectId: selectedProject.id,
                projectName: selectedProject.name,
                customerId: selectedProject.customerId,
                quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
                quoteDate: new Date(),
                expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                status: 'Draft' as const,
                lineItems: [{ id: 'item-0', description: "", quantity: 1, unitPrice: 0, taxRate: 10 }],
                subtotal: 0,
                totalDiscount: 0,
                totalTax: 0,
                totalAmount: 0,
                version: 1,
            };
            const newQuoteId = await addQuote(newQuoteData);
            toast({ title: "Quote Created", description: "Redirecting to the new quote..." });
            setIsOpen(false);
            onQuoteCreated?.(newQuoteId);
            router.push(`/quotes/${newQuoteId}`);
        } catch (error) {
            console.error("Failed to create quote", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create quote.' });
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || <Button><PlusCircle className="mr-2 h-4 w-4" />New Quote</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Quote</DialogTitle>
                    <DialogDescription>Select the project this quote is for. You can add details on the next screen.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                       {initialProjectId ? (
                         <p>Creating a quote for project: <strong>{projects.find(p => p.id === initialProjectId)?.name}</strong></p>
                       ) : (
                         <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project</FormLabel>
                                    <SearchableCombobox
                                        options={projectOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select a project"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                       )}
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Create Quote"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
