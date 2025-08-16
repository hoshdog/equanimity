// src/components/auth-provider.tsx
'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/app-layout';

const publicRoutes = ['/auth'];

interface OrgContextType {
  orgId: string | null;
}

const OrgContext = createContext<OrgContextType>({ orgId: null });

export const useOrg = () => {
    const context = useContext(OrgContext);
    if (!context) {
        throw new Error("useOrg must be used within an AuthProvider");
    }
    return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Since auth is removed for local dev, we simulate a logged-in and set-up user.
  const loading = false;
  const user = { uid: 'dev-user' }; // Mock user
  
  // For this demo, we'll hardcode the org ID. In a real app, this would come from the user's profile.
  const orgId = 'test-org';

  useEffect(() => {
    // If auth is not loading and the user is on a public/setup route, redirect.
    if (!loading && publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [pathname, router, loading]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For any auth-related pages, show nothing while redirecting.
  if (publicRoutes.includes(pathname)) {
    return null;
  }
  
  // Always render the main app layout for any other route.
  return (
    <OrgContext.Provider value={{ orgId }}>
        <SidebarProvider>
            <AppLayout>
                {children}
            </AppLayout>
        </SidebarProvider>
    </OrgContext.Provider>
  );
}
