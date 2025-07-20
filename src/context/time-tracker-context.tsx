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
    timeSpent: number; // in seconds
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

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
    const [timeSpent, setTimeSpent] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [context, setContext] = useState<TrackableContext>(null);
    
    const { toast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeStore = useRef<Record<string, number>>({});
    
    // Use a ref to hold the current timer active state to avoid including it in useCallback dependencies
    const isTimerActiveRef = useRef(isTimerActive);
    isTimerActiveRef.current = isTimerActive;

    const pauseTimer = useCallback(() => {
        setIsTimerActive(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        if (intervalRef.current) return;
        setIsTimerActive(true);
        intervalRef.current = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(pauseTimer, INACTIVITY_TIMEOUT);
    }, [pauseTimer]);

    const handleActivity = useCallback(() => {
        if (document.visibilityState === 'visible') {
            if (!isTimerActiveRef.current) {
                startTimer();
            }
            resetInactivityTimer();
        }
    }, [startTimer, resetInactivityTimer]);


    // This effect runs when the context changes.
    // It's responsible for saving the time from the *previous* context
    // and setting up the timer for the *new* context.
    useEffect(() => {
        const previousContextKey = context ? `${context.type}-${context.id}` : null;
        
        // This function will be called on cleanup, which happens just before
        // the effect runs for the next context, or when the component unmounts.
        return () => {
            // If there was a previous context and time was tracked, log it.
            if (previousContextKey && timeStore.current[previousContextKey] > 0) {
                 logTime(timeStore.current[previousContextKey], context!);
                 // Clear the stored time after logging.
                 timeStore.current[previousContextKey] = 0;
            }

            // Cleanup for the current context
            pauseTimer();
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            document.removeEventListener('visibilitychange', handleActivity);
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context]); // This effect now ONLY runs when the context itself changes.

    // This effect manages the current time being tracked in the local state and ref store.
    useEffect(() => {
        if (context) {
            const contextKey = `${context.type}-${context.id}`;
            // Load saved time for this context or default to 0
            setTimeSpent(timeStore.current[contextKey] || 0);

             // Set up activity listeners for the new context
            handleActivity();
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            document.addEventListener('visibilitychange', handleActivity);
        } else {
             setTimeSpent(0);
        }

    }, [context, handleActivity]);

    // Update the time store ref whenever timeSpent changes
    useEffect(() => {
        if (context) {
            const contextKey = `${context.type}-${context.id}`;
            timeStore.current[contextKey] = timeSpent;
        }
    }, [timeSpent, context]);


    const logTime = async (durationInSeconds: number, contextToLog: TrackableContext): Promise<number> => {
        const user = auth.currentUser;
        if (durationInSeconds < 1 || !user || !contextToLog) {
            return 0;
        }

        const MINUTE_BLOCK = 5;
        const totalSecondsInBlock = MINUTE_BLOCK * 60;
        const billedSeconds = Math.ceil(durationInSeconds / totalSecondsInBlock) * totalSecondsInBlock;
        const timeInHours = billedSeconds / 3600;

        try {
            await addTimesheetEntry({
                userId: user.uid,
                date: new Date(),
                durationHours: timeInHours,
                notes: `Work on ${contextToLog.type}: ${contextToLog.name}`,
                jobId: `${contextToLog.type.toUpperCase()}-${contextToLog.id}`,
                isBillable: true,
            });
            
            toast({ title: 'Time Logged Automatically', description: `${(billedSeconds/60).toFixed(0)} minutes logged to your timesheet for ${contextToLog.name}.` });
            
            return timeInHours;
        } catch (error) {
            console.error("Failed to log time:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not log time entry.' });
            return 0;
        }
    };
    
    // A function to manually trigger logging, though it won't be used if the button is removed.
    // Kept for potential future use or for other parts of the app.
    const manualLogTime = async (): Promise<number> => {
        if (isTimerActive) {
            pauseTimer();
        }
        return logTime(timeSpent, context);
    }
    
    const value = {
        timeSpent,
        isTimerActive,
        context,
        setContext,
        logTime: manualLogTime,
    };

    return (
        <TimeTrackerContext.Provider value={value}>
            {children}
        </TimeTrackerContext.Provider>
    );
}