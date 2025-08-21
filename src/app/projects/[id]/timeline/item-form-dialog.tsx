// src/app/projects/[id]/timeline/item-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { TimelineItem, Employee, OptionType } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { format, parseISO } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  type: z.enum(['job', 'task']),
  jobId: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  dependencies: z.array(z.string()).default([]),
  assignedResourceIds: z.array(z.string()).default([]), // New field
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

interface ItemFormDialogProps {
  children: React.ReactNode;
  projectId: string;
  itemToEdit?: TimelineItem;
  allItems: TimelineItem[];
  employees: Employee[];
}

export function ItemFormDialog({ children, projectId, itemToEdit, allItems, employees }: ItemFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const isEditing = !!itemToEdit;

  const defaultValues = {
    name: itemToEdit?.name || '',
    type: itemToEdit?.type || 'job',
    jobId: itemToEdit?.jobId || '',
    startDate: itemToEdit ? format(parseISO(itemToEdit.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: itemToEdit ? format(parseISO(itemToEdit.endDate), 'yyyy-MM-dd') : format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd'),
    dependencies: itemToEdit?.dependencies || [],
    assignedResourceIds: itemToEdit?.assignedResourceIds || [],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  React.useEffect(() => {
      form.reset(defaultValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemToEdit, isOpen]);
  
  // This is a simplified check. A full implementation would use the Cloud Function.
  const checkForClientSideCycle = (itemId: string, newDependencies: string[]): boolean => {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const itemsMap = new Map(allItems.map(item => [item.id, item]));
    
    function detectCycle(currentId: string): boolean {
        visited.add(currentId);
        stack.add(currentId);
        
        // Check current node's proposed dependencies
        const dependencies = currentId === itemId ? newDependencies : itemsMap.get(currentId)?.dependencies || [];

        for (const depId of dependencies) {
            if (stack.has(depId)) return true; // Cycle detected
            if (!visited.has(depId)) {
                if (detectCycle(depId)) return true;
            }
        }
        stack.delete(currentId);
        return false;
    }
    return detectCycle(itemId);
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    
    // Perform client-side cycle check before submitting
    if (isEditing && checkForClientSideCycle(itemToEdit.id, values.dependencies)) {
         toast({ variant: 'destructive', title: 'Circular Dependency Detected', description: 'This change would create a dependency loop. Please correct the dependencies.' });
         setLoading(false);
         return;
    }

    try {
      const dataToSave = {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      };
      
      const collectionRef = collection(db, 'projects', projectId, 'timelineItems');
      if (isEditing) {
        const docRef = doc(collectionRef, itemToEdit.id);
        await updateDoc(docRef, dataToSave);
        toast({ title: 'Item Updated', description: `"${values.name}" has been updated.` });
      } else {
        await addDoc(collectionRef, dataToSave);
        toast({ title: 'Item Added', description: `"${values.name}" has been added to the timeline.` });
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save item:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the timeline item.' });
    } finally {
      setLoading(false);
    }
  }

  const dependencyOptions: OptionType[] = allItems
    .filter(item => item.id !== itemToEdit?.id) // Can't depend on itself
    .map(item => ({ value: item.id, label: item.name }));
    
  const employeeOptions: OptionType[] = employees
    .map(emp => ({ value: emp.id, label: emp.name }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Timeline Item' : 'Add New Timeline Item'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for "${itemToEdit?.name}".` : 'Add a new job or task to the project timeline.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel><FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="job" /></FormControl><FormLabel className="font-normal">Job</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="task" /></FormControl><FormLabel className="font-normal">Task</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl><FormMessage /></FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
             <FormField
              control={form.control}
              name="assignedResourceIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Resources</FormLabel>
                  <FormControl>
                    <MultiSelect
                        options={employeeOptions}
                        selected={employeeOptions.filter(opt => field.value.includes(opt.value))}
                        onChange={(selectedOptions) => field.onChange(selectedOptions.map(opt => opt.value))}
                        placeholder="Select staff members..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="dependencies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prerequisites (Dependencies)</FormLabel>
                  <FormControl>
                    <MultiSelect
                        options={dependencyOptions}
                        selected={dependencyOptions.filter(opt => field.value.includes(opt.value))}
                        onChange={(selectedOptions) => field.onChange(selectedOptions.map(opt => opt.value))}
                        placeholder="Select items that must be finished first..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {itemToEdit?.validationError && (
                 <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5"/>
                    <p>{itemToEdit.validationError}</p>
                 </div>
             )}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
