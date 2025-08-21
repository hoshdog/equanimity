// src/components/auth-provider.tsx
'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// SidebarProvider removed - handled by AppLayout
// Removed - AppLayout is handled by template.tsx
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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  
  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  
  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser);
      
      // In a real implementation, fetch the user's organization from Firestore
      // For now, we'll use a development org ID if the user is authenticated
      if (authUser) {
        // TODO: Fetch actual organization ID from user profile in Firestore
        setOrgId('test-org'); // Temporary until proper org management is implemented
      } else {
        setOrgId(null);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle redirects for authenticated users on public routes
  useEffect(() => {
    if (!loading && user && publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [pathname, router, loading, user]);

  // Handle redirects for unauthenticated users on protected routes
  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/auth');
    }
  }, [loading, user, pathname, router]);

  // NOW WE CAN HAVE CONDITIONAL RETURNS
  
  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (!user && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render the main layout on public routes
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }
  
  // Render the main app layout for authenticated users on protected routes
  return (
    <OrgContext.Provider value={{ orgId: orgId || 'test-org' }}>
      {children}
    </OrgContext.Provider>
  );
}