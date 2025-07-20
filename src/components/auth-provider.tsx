// src/components/auth-provider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/app-layout';

const publicRoutes = ['/auth'];
const setupRoute = '/setup';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Since auth is removed for local dev, we simulate a logged-in and set-up user.
  const loading = false;
  const user = { uid: 'dev-user' }; // Mock user
  const needsSetup = false; 

  useEffect(() => {
    // If auth is not loading and the user is on a public/setup route, redirect.
    if (!loading && (publicRoutes.includes(pathname) || pathname === setupRoute)) {
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
  if (publicRoutes.includes(pathname) || pathname === setupRoute) {
    return null;
  }
  
  // Always render the main app layout for any other route.
  return (
    <SidebarProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </SidebarProvider>
  );
}
