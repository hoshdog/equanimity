// src/app/projects/[id]/timeline/page.tsx
'use client';

import * as React from 'react';
import { use(params) } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Calendar, GanttChartSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TimelineItem } from '@/lib/types';
import { TimelineGanttView } from './timeline-gantt-view';
import { ItemFormDialog } from './item-form-dialog';
import { getProject } from '@/lib/projects';

// This is a placeholder hook. For a production app, use TanStack Query or SWR.
function useTimelineItems(projectId: string): { items: TimelineItem[]; loading: boolean } {
  const [items, setItems] = React.useState<TimelineItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, `projects/${projectId}/timelineItems`), orderBy('startDate'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const timelineItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TimelineItem));
      setItems(timelineItems);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch timeline items:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load timeline data.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, toast]);

  return { items, loading };
}

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { items, loading } = useTimelineItems(projectId);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GanttChartSquare className="h-6 w-6 text-primary" />
            Project Timeline
          </CardTitle>
          <CardDescription>
            Visual timeline for {project?.name || 'this project'}. Drag and connect tasks to create dependencies.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRecalculatePath}>
            <Calendar className="mr-2 h-4 w-4" />
            Find Critical Path
          </Button>
          <ItemFormDialog projectId={projectId} allItems={items}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
          </ItemFormDialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TimelineGanttView items={items} projectId={projectId} />
        )}
      </CardContent>
    </Card>
  );
}
