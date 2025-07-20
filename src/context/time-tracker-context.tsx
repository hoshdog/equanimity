// src/context/time-tracker-context.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addTimesheetEntry, startTrackingSession, stopTrackingSession, getActiveTrackingSession } from '@/lib/timesheets';
import { auth } from '@/lib/auth';
import { onAuthStateChanged, User } from 'firebase/auth';

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
    startTracking: () => void;
    stopTracking: () => void;
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
    const [user, setUser] = useState<User | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    
    const { toast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Effect to check for an active session when user or context changes
    useEffect(() => {
        if (!user) return;
        
        const checkSession = async () => {
            const session = await getActiveTrackingSession(user.uid);
            if (session) {
                setActiveSessionId(session.id);
                setContext(session.context);
                setIsTimerActive(true);
                const elapsed = Math.floor((new Date().getTime() - session.startTime.toDate().getTime()) / 1000);
                setTimeSpent(elapsed);
            } else {
                setActiveSessionId(null);
                setIsTimerActive(false);
                setTimeSpent(0);
                // Do not clear context here, as it might be set by a page navigation
            }
        };

        checkSession();
    }, [user, context?.id]); // Re-check when context ID changes specifically


     // Effect to manage the timer interval
    useEffect(() => {
        if (isTimerActive) {
            intervalRef.current = setInterval(() => {
                setTimeSpent(prev => prev + 1);
            }, 1000);
        } else {
            clearTimer();
        }
        return () => clearTimer();
    }, [isTimerActive, clearTimer]);


    const startTracking = useCallback(async () => {
        if (!user || !context || isTimerActive) return;

        try {
            const sessionId = await startTrackingSession(user.uid, context);
            setActiveSessionId(sessionId);
            setIsTimerActive(true);
            setTimeSpent(0);
            toast({ title: 'Timer Started', description: `Tracking time for ${context.name}.` });
        } catch (error) {
            console.error("Failed to start tracking:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start the timer.' });
        }
    }, [user, context, isTimerActive, toast]);

    const stopTracking = useCallback(async () => {
        if (!user || !activeSessionId) return;

        try {
            const finalDuration = await stopTrackingSession(activeSessionId);
            setIsTimerActive(false);
            setTimeSpent(finalDuration); // Show final duration
            setActiveSessionId(null);
            toast({ title: 'Timer Stopped', description: `Total time tracked: ${(finalDuration / 60).toFixed(0)} minutes.` });
        } catch (error) {
            console.error("Failed to stop tracking:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not stop the timer.' });
        }
    }, [user, activeSessionId, toast]);

    const logTime = async (): Promise<number> => {
        const user = auth.currentUser;
        if (timeSpent < 1 || !user || !context) {
            toast({ variant: 'destructive', title: 'Cannot log time', description: 'No time has been tracked.' });
            return 0;
        }

        if (isTimerActive) {
            toast({ variant: 'destructive', title: 'Timer Active', description: 'Please stop the timer before logging time.' });
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
        startTracking,
        stopTracking,
        logTime,
    };

    return (
        <TimeTrackerContext.Provider value={value}>
            {children}
        </TimeTrackerContext.Provider>
    );
}
