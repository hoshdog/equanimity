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

    const pauseTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsTimerActive(false);
    }, []);

    const startTimer = useCallback(() => {
        if (intervalRef.current) return; // Already running
        setIsTimerActive(true);
        intervalRef.current = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (document.hidden) {
            pauseTimer();
            return;
        }

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
              description: "Timer paused due to inactivity. Move your mouse to resume.",
            });
        }, 60000); // 1 minute
    }, [isTimerActive, pauseTimer, startTimer, toast]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                pauseTimer();
            } else if (context) { // Only resume if there's a context
                resetInactivityTimer();
            }
        };

        const handleActivity = () => {
            if (context) { // Only track activity if there's a context
                resetInactivityTimer();
            }
        };

        // If context is cleared, stop everything.
        if (!context) {
            pauseTimer();
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            setTimeSpent(0); // Reset time when context is cleared
        } else {
            // If context is set, start tracking activity.
            resetInactivityTimer();
        }


        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [context, resetInactivityTimer, pauseTimer]);

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
