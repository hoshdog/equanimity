'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateHrActionItems,
  GenerateHrActionItemsOutput,
} from '@/ai/flows/generate-hr-action-items';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ListChecks, FileText } from 'lucide-react';

const formSchema = z.object({
  topic: z
    .string()
    .min(5, 'Please enter a topic with at least 5 characters.'),
});

export default function CompliancePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateHrActionItemsOutput | null>(
    null
  );
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateHrActionItems(values);
      setResult(response);
    } catch (error) {
      console.error('Error generating action items:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Failed to generate action items. The AI may be busy or the topic too broad. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">HR Compliance</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Compliance Assistant</CardTitle>
            <CardDescription>
              Enter a topic, and the AI will research the latest Australian
              labor laws and generate a set of compliance action items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., "new whistleblower protection laws"'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific for best results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    'Generate Action Items'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Generated Actions</CardTitle>
            <CardDescription>
              The AI-generated summary and action items will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="mt-4 text-lg font-semibold">
                  AI is researching...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This may take a moment.
                </p>
              </div>
            )}
            {!loading && !result && (
              <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Action items will be generated here.
                </p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Summary of Findings
                  </h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
                    {result.summary}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Action Items
                  </h4>
                  <ul className="space-y-2 text-sm list-decimal pl-5">
                    {result.actionItems.map((item, index) => (
                      <li key={index} className="pl-2">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
