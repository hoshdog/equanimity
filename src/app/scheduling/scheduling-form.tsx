"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  suggestTechniciansForScheduling,
  SuggestTechniciansForSchedulingOutput,
} from "@/ai/flows/suggest-technicians-for-scheduling";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, UserCheck } from "lucide-react";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { getEmployees } from "@/lib/employees";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  taskDescription: z.string().min(10, {
    message: "Task description must be at least 10 characters.",
  }),
  availableTechnicians: z.array(z.string()).min(1, {
    message: "Please select at least one technician.",
  }),
});

// This data should come from your Training page / database in a real app.
const mockPastTasks = JSON.stringify([
  { task: "Fix HVAC unit", technician: "Alice Johnson", efficiency: 0.9, accuracy: 0.95 },
  { task: "Repair plumbing leak", technician: "Bob Smith", efficiency: 0.8, accuracy: 0.98 },
  { task: "Install new lighting", technician: "Charlie Brown", efficiency: 0.92, accuracy: 0.91 },
  { task: "Fix HVAC unit", technician: "Diana Prince", efficiency: 0.85, accuracy: 0.88 },
  { task: "Repair plumbing leak", technician: "Ethan Hunt", efficiency: 0.88, accuracy: 0.92 },
]);

export function SchedulingForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestTechniciansForSchedulingOutput | null>(null);
  const [technicianOptions, setTechnicianOptions] = useState<OptionType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTechs() {
        try {
            const employees = await getEmployees();
            const options = employees.filter(e => e.status === 'Active').map(e => ({ value: e.id, label: e.name }));
            setTechnicianOptions(options);
            // Set all active technicians as default selection
            form.setValue('availableTechnicians', options.map(o => o.value));
        } catch (error) {
            console.error("Failed to fetch technicians:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load available technicians." });
        }
    }
    fetchTechs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskDescription: "",
      availableTechnicians: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const technicianLabels = values.availableTechnicians.map(value => {
        const tech = technicianOptions.find(t => t.value === value);
        return tech ? tech.label : value;
      });

      const response = await suggestTechniciansForScheduling({
        taskDescription: values.taskDescription,
        availableTechnicians: technicianLabels,
        pastTaskData: mockPastTasks,
      });
      setResult(response);
    } catch (error) {
      console.error("Error suggesting technicians:", error);
      toast({ variant: "destructive", title: "Error", description: "The AI failed to generate suggestions. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="taskDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 'Emergency repair of a commercial HVAC unit, requires knowledge of Series-5 compressors.'"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="availableTechnicians"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Technicians</FormLabel>
                <MultiSelect
                    options={technicianOptions}
                    selected={technicianOptions.filter(option => field.value.includes(option.value))}
                    onChange={(selectedOptions) => field.onChange(selectedOptions.map(option => option.value))}
                    placeholder="Select technicians..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suggesting...
              </>
            ) : (
              "Suggest Technicians"
            )}
          </Button>
        </form>
      </Form>
      {result && (
        <Card className="mt-6 bg-secondary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-5 w-5" />
                AI Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4"/> Recommended Technicians</h4>
              <ul className="list-disc pl-5 mt-2 text-sm">
                {result.suggestedTechnicians.map((tech, index) => (
                  <li key={index} className="font-medium">{tech}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Reasoning</h4>
              <p className="text-sm text-muted-foreground mt-1">{result.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    