// src/app/projects/[id]/timeline/page.tsx
'use client';

import * as React from 'react';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Calendar, GanttChartSquare, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TimelineItem, Employee } from '@/lib/types';
import { TimelineGanttView } from './timeline-gantt-view';
import { ItemFormDialog } from './item-form-dialog';
import { getProject } from '@/lib/projects';
import { getEmployees } from '@/lib/employees';


// This is a placeholder hook. For a production app, use TanStack Query or SWR.
function useTimelineData(projectId: string): { items: TimelineItem[]; employees: Employee[]; loading: boolean } {
  const [items, setItems] = React.useState<TimelineItem[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!projectId) return;

    let unsubItems: () => void;
    let isMounted = true;

    async function fetchData() {
        try {
            const emps = await getEmployees();
            if (isMounted) setEmployees(emps);

            const q = query(collection(db, `projects/${projectId}/timelineItems`), orderBy('startDate'));
            unsubItems = onSnapshot(q, (snapshot) => {
                const timelineItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as TimelineItem));
                 if (isMounted) setItems(timelineItems);
            }, (error) => {
                console.error("Failed to fetch timeline items:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load timeline data.' });
            });

        } catch (error) {
             console.error("Failed to fetch employees:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not load employee data.' });
        } finally {
            if (isMounted) setLoading(false);
        }
    }

    fetchData();

    return () => {
        isMounted = false;
        if (unsubItems) unsubItems();
    };
  }, [projectId, toast]);

  return { items, employees, loading };
}

export default function TimelinePage({ params }: { params: { id: string } }) {
  const { id: projectId } = use(params);
  const { items, employees, loading } = useTimelineData(projectId);
  const [project, setProject] = React.useState<{ name: string } | null>(null);

  React.useEffect(() => {
      async function fetchProject() {
          const projectData = await getProject(projectId);
          if (projectData) {
              setProject(projectData);
          }
      }
      fetchProject();
  }, [projectId]);

  const handleRecalculatePath = async () => {
    // Placeholder for calling the Cloud Function
    alert('This would call the `calculateCriticalPath` Cloud Function.');
  };

  const conflictingItems = React.useMemo(() => items.filter(item => item.conflict?.isConflict), [items]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GanttChartSquare className="h-6 w-6 text-primary" />
            Project Timeline
          </CardTitle>
          <CardDescription>
            Visual timeline for {project?.name || 'this project'}. Drag and connect tasks to create dependencies.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <Button variant="outline" onClick={handleRecalculatePath}>
            <Calendar className="mr-2 h-4 w-4" />
            Find Critical Path
          </Button>
          <ItemFormDialog projectId={projectId} allItems={items} employees={employees}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
          </ItemFormDialog>
        </div>
      </CardHeader>
      <CardContent>
        {conflictingItems.length > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertTriangle className="h-5 w-5"/>
                <div>
                    <h4 className="font-bold">Resource Conflicts Detected</h4>
                    <p>{conflictingItems.length} task(s) have scheduling conflicts with other projects. Hover over the conflict icon for details.</p>
                </div>
            </div>
        )}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TimelineGanttView items={items} projectId={projectId} employees={employees} />
        )}
      </CardContent>
    </Card>
  );
}
