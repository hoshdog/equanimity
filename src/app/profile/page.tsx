// src/app/profile/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect away from profile page since auth is disabled for local dev
    router.replace('/');
  }, [router]);

  // Render a loader while redirecting
  return <div className="flex-1 p-8 pt-6 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
}
