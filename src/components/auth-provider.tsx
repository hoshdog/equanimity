// src/components/auth-provider.tsx
'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/app-layout';
import { onAuthStateChanged, User } from '@/lib/auth';

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

  // For development, we'll simulate an admin user being logged in.
  const [user, setUser] = useState<User | object>({ uid: 'admin-dev', email: 'admin@example.com' });
  const [loading, setLoading] = useState(false);
  
  // In a real app, you would use this effect to listen for auth changes:
  /*
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  */
  
  // For this demo, we'll hardcode the org ID. In a real app, this would come from the user's profile.
  const orgId = 'test-org';

  useEffect(() => {
    // If the user is logged in (even our mock user) and on a public route, redirect to the dashboard.
    if (!loading && user && publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [pathname, router, loading, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Since we have a mock user, this will be skipped, and the app will render.
  if (!user && !publicRoutes.includes(pathname)) {
    router.push('/auth');
    return null;
  }

  // Don't render the main layout on public routes.
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
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
