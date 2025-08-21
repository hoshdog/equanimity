// src/context/time-tracker-context.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addTimesheetEntry } from '@/lib/timesheets';
import { auth } from '@/lib/auth';
import { useOrg } from '@/components/auth-provider';

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
    const { orgId } = useOrg();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeStore = useRef<Record<string, number>>({});
    const previousContextRef = useRef<TrackableContext>(null);

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
        if (document.visibilityState === 'visible') {
            inactivityTimerRef.current = setTimeout(pauseTimer, INACTIVITY_TIMEOUT);
        }
    }, [pauseTimer]);

    const logTime = useCallback(async (durationInSeconds: number, contextToLog: TrackableContext) => {
        const authInstance = auth();
        const user = authInstance.currentUser;
        if (durationInSeconds < 60 || !user || !contextToLog || !orgId) { // Only log if more than a minute and org is available
            return 0;
        }

        const MINUTE_BLOCK = 5;
        const totalSecondsInBlock = MINUTE_BLOCK * 60;
        const billedSeconds = Math.ceil(durationInSeconds / totalSecondsInBlock) * totalSecondsInBlock;
        const timeInHours = billedSeconds / 3600;

        try {
            await addTimesheetEntry({
                userId: user.uid,
                orgId: orgId,
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
    }, [toast, orgId]);
    
    // Effect to handle context changes
    useEffect(() => {
        // Log time for the previous context before switching
        if (previousContextRef.current) {
            const oldContextKey = `${previousContextRef.current.type}-${previousContextRef.current.id}`;
            const timeToLog = timeStore.current[oldContextKey] || 0;
            if (timeToLog > 0) {
                logTime(timeToLog, previousContextRef.current);
                timeStore.current[oldContextKey] = 0; // Reset after logging
            }
        }
        
        // Setup for new context
        if (context) {
            const contextKey = `${context.type}-${context.id}`;
            setTimeSpent(timeStore.current[contextKey] || 0);
            startTimer(); // Start immediately
        } else {
            pauseTimer();
            setTimeSpent(0);
        }
        
        // Update the previous context ref for the next change
        previousContextRef.current = context;
    }, [context, logTime, pauseTimer, startTimer]);
    
    // Separate effect for activity listeners to prevent memory leaks
    useEffect(() => {
        if (!context) {
            return; // No listeners needed if no context
        }
        
        const activityHandler = () => {
            if (document.visibilityState === 'visible') {
                if (!isTimerActiveRef.current) {
                    startTimer();
                }
                resetInactivityTimer();
            }
        };
        
        // Add activity listeners
        window.addEventListener('mousemove', activityHandler);
        window.addEventListener('keydown', activityHandler);
        document.addEventListener('visibilitychange', activityHandler);
        
        // Start inactivity timer
        resetInactivityTimer();
        
        // Cleanup function
        return () => {
            window.removeEventListener('mousemove', activityHandler);
            window.removeEventListener('keydown', activityHandler);
            document.removeEventListener('visibilitychange', activityHandler);
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [context, startTimer, resetInactivityTimer]);
    
     // Update the time store ref whenever timeSpent changes for the current context
    useEffect(() => {
        if (context) {
            const contextKey = `${context.type}-${context.id}`;
            timeStore.current[contextKey] = timeSpent;
        }
    }, [timeSpent, context]);
    
    const value = {
        timeSpent,
        isTimerActive,
        context,
        setContext,
    };

    return (
        <TimeTrackerContext.Provider value={value}>
            {children}
        </TimeTrackerContext.Provider>
    );
}
