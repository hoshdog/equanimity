// src/components/auth-provider.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { getUserProfile } from '@/lib/users';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/components/app-layout';

const publicRoutes = ['/auth'];
const setupRoute = '/setup';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile && !profile.companyId) {
          setNeedsSetup(true);
        } else {
          setNeedsSetup(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.includes(pathname);
    const isSetupPage = pathname === setupRoute;

    if (!user && !isPublic) {
      router.push('/auth');
    } else if (user) {
      if (needsSetup && !isSetupPage) {
        router.push(setupRoute);
      } else if (!needsSetup && (isPublic || isSetupPage)) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, needsSetup, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (needsSetup && pathname !== setupRoute)) {
     // Render children for public pages like /auth, or if redirecting
     return <>{children}</>;
  }
  
  // If user is logged in and setup is complete (or they are on the setup page), render the app layout
  if (user) {
      if (pathname === setupRoute) {
          return <>{children}</>;
      }
      return (
          <SidebarProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </SidebarProvider>
      );
  }

  return <>{children}</>;
}
