// src/components/app-layout.tsx
'use client'

import { AppSidebar } from '@/app/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppSidebar />
            <SidebarInset>
              {children}
               <div className="md:hidden fixed bottom-4 left-4 z-50">
                <SidebarTrigger asChild>
                    <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SidebarTrigger>
              </div>
            </SidebarInset>
        </>
    )
}
