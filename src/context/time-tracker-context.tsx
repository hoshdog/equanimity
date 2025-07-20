
// src/context/time-tracker-context.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addTimesheetEntry } from '@/lib/timesheets';
import { auth } from '@/lib/auth';

type TrackableContext = {
    type: 'project' | 'quote' | 'job';
    id: string;
    name: string;
} | null;

interface TimeTrackerContextType {
    timeSpent: number;
    isTimerActive: boolean;
    context: TrackableContext;
    setContext: (context: TrackableContext) => void;
    logTime: () => Promise<number>; // Returns the duration in hours
}

const TimeTrackerContext = createContext<TimeTrackerContextType | null>(null);

export function useTimeTracker() {
    const context = useContext(TimeTrackerContext);
    if (!context) {
        throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
    }
    return context;
}

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
    const [timeSpent, setTimeSpent] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [context, setContext] = useState<TrackableContext>(null);
    const { toast } = useToast();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = useCallback(() => {
        if (intervalRef.current) return;
        setIsTimerActive(true);
        intervalRef.current = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
    }, []);

    const pauseTimer = useCallback(() => {
        setIsTimerActive(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (!isTimerActive) {
            startTimer();
        }

        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            pauseTimer();
            toast({
              title: "Timer Paused",
              description: "Timer paused due to inactivity.",
            });
        }, 60000); // 1 minute
    }, [isTimerActive, startTimer, pauseTimer, toast]);


    useEffect(() => {
        // Stop everything if there's no context
        if (!context) {
            pauseTimer();
            setTimeSpent(0);
            return;
        }

        // --- Event handlers ---
        const handleActivity = () => {
            if (document.hidden) return; // Don't restart timer if tab is not visible
            resetInactivityTimer();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                pauseTimer();
            } else {
                handleActivity(); // Restart inactivity timer when tab becomes visible
            }
        };

        // --- Setup and Teardown ---
        handleActivity(); // Start timer immediately when context is set
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        
        // Cleanup function
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            pauseTimer(); // Ensure timer is cleared on unmount/context change
        };
    // Re-run this entire effect ONLY when the context or the memoized functions change.
    }, [context, pauseTimer, resetInactivityTimer]);


    const logTime = async (): Promise<number> => {
        const user = auth.currentUser;
        if (timeSpent < 1 || !user || !context) {
            toast({ variant: 'destructive', title: 'Cannot log time', description: 'Not enough time tracked or no active context.' });
            return 0;
        }

        const MINUTE_BLOCK = 5;
        const totalSecondsInBlock = MINUTE_BLOCK * 60;
        const billedSeconds = Math.ceil(timeSpent / totalSecondsInBlock) * totalSecondsInBlock;
        const timeInHours = billedSeconds / 3600;

        try {
            await addTimesheetEntry({
                userId: user.uid,
                date: new Date(),
                durationHours: timeInHours,
                notes: `Work on ${context.type}: ${context.name}`,
                jobId: `${context.type.toUpperCase()}-${context.id}`,
                isBillable: true,
            });
            
            toast({ title: 'Time Logged', description: `${(billedSeconds/60).toFixed(0)} minutes logged to your timesheet.` });
            setTimeSpent(0);
            pauseTimer(); // Explicitly pause after logging
            return timeInHours;
        } catch (error) {
            console.error("Failed to log time:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not log time entry.' });
            return 0;
        }
    };
    
    const value = {
        timeSpent,
        isTimerActive,
        context,
        setContext,
        logTime,
    };

    return (
        <TimeTrackerContext.Provider value={value}>
            {children}
        </TimeTrackerContext.Provider>
    );
}
