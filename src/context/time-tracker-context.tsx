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

    const pauseTimer = useCallback(() => {
        setIsTimerActive(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        if (intervalRef.current) return; // Already running
        setIsTimerActive(true);
        intervalRef.current = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
    }, []);
    
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            pauseTimer();
        }, INACTIVITY_TIMEOUT);
    }, [pauseTimer]);


    // Effect to manage the automatic timer based on user activity
    useEffect(() => {
        const handleActivity = () => {
            if (document.visibilityState === 'visible') {
                if (!isTimerActive) {
                    startTimer();
                }
                resetInactivityTimer();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                pauseTimer();
            } else {
                // When tab becomes visible again, reset inactivity timer
                resetInactivityTimer();
            }
        };

        if (context) {
            // Restore time for the current context
            const contextKey = `${context.type}-${context.id}`;
            setTimeSpent(timeStore.current[contextKey] || 0);
            
            // Start tracking
            handleActivity();

            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                // Store current time before cleanup
                timeStore.current[contextKey] = timeSpent;
                pauseTimer();
                window.removeEventListener('mousemove', handleActivity);
                window.removeEventListener('keydown', handleActivity);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                 if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current);
                }
            };
        } else {
            // When there's no context, ensure everything is stopped
            pauseTimer();
            setTimeSpent(0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context, resetInactivityTimer, pauseTimer, startTimer, isTimerActive]); // isTimerActive is needed here


    const logTime = async (): Promise<number> => {
        const user = auth.currentUser;
        if (timeSpent < 1 || !user || !context) {
            toast({ variant: 'destructive', title: 'Cannot log time', description: 'No time has been tracked.' });
            return 0;
        }

        if (isTimerActive) {
            pauseTimer();
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
            
            // Reset time for this context
            const contextKey = `${context.type}-${context.id}`;
            timeStore.current[contextKey] = 0;
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
