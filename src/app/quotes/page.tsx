// src/app/quotes/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateQuoteFromPrompt,
  GenerateQuoteFromPromptOutput,
} from '@/ai/flows/generate-quote-from-prompt';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  prompt: z
    .string()
    .min(15, 'Please provide a more detailed job description (at least 15 characters).'),
});

export default function QuotesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuoteFromPromptOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateQuoteFromPrompt(values);
      setResult(response);
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate quote. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Quote Generation</CardTitle>
            <CardDescription>
              Describe the job, and the AI will generate a professional quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Supply and install 3 downlights in the kitchen, and replace 5 GPOs in the living room.'"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be as descriptive as possible for the best results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Quote'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="lg:col-span-3">
          {!result && !loading && (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">
                Your generated quote will appear here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a job description to get started.
              </p>
            </Card>
          )}
          {loading && (
            <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="mt-4 text-lg font-semibold">
                AI is preparing your quote...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This may take a few moments.
              </p>
            </Card>
          )}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary" />
                  Generated Quote
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm p-4 rounded-md bg-muted whitespace-pre-wrap font-sans">
                  {result.quote}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
