// src/components/app-layout.tsx
'use client'

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AppHeader } from '@/app/components/app-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              <div className="flex-1 p-4 md:p-8 pt-6">
                 {children}
              </div>
               <div className="md:hidden fixed bottom-4 left-4 z-50">
                <SidebarTrigger asChild>
                    <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SidebarTrigger>
              </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
