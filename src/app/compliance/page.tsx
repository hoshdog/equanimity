'use client';

import { useEffect, useState } from 'react';
import {
  generateComplianceHealthCheck,
  ComplianceHealthCheckOutput,
  ComplianceArea,
} from '@/ai/flows/generate-compliance-health-check';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ListChecks, FileText, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ComplianceHealthCheckOutput | null>(null);
  const { toast } = useToast();

  const fetchHealthCheck = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateComplianceHealthCheck();
      setResult(response);
    } catch (error) {
      console.error('Error generating compliance health check:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Failed to generate compliance health check. The AI may be busy. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Compliance Health Check</h2>
        <Button variant="outline" onClick={fetchHealthCheck} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Automated Compliance Overview</CardTitle>
          <CardDescription>
            The AI has generated a high-level compliance checklist based on common Australian workplace regulations.
            This is not legal advice and should be used as a starting point for ensuring your business is compliant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="mt-4 text-lg font-semibold">
                AI is generating your compliance health check...
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
                Compliance checklist will be generated here.
              </p>
              <Button onClick={fetchHealthCheck} className="mt-4">Generate Checklist</Button>
            </div>
          )}
          {result && (
             <Accordion type="multiple" defaultValue={result.complianceAreas.map(area => area.areaName)} className="w-full">
              {result.complianceAreas.map((area) => (
                <AccordionItem value={area.areaName} key={area.areaName}>
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                      {area.areaName}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-4 pl-2">{area.summary}</p>
                    <div className="space-y-3">
                      {area.checklistItems.map((item, index) => (
                         <div key={index} className="flex items-start space-x-3 p-3 rounded-md border bg-secondary/30">
                           <Checkbox id={`${area.areaName}-${index}`} className="mt-1" />
                           <label htmlFor={`${area.areaName}-${index}`} className="text-sm font-normal leading-snug">
                            {item}
                           </label>
                         </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
