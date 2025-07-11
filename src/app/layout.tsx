import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/app-sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Equanimity',
  description: 'HR and Project Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}
        suppressHydrationWarning={true}
      >
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
               <div className="md:hidden fixed bottom-4 left-4 z-20">
                <SidebarTrigger asChild>
                    <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SidebarTrigger>
              </div>
            </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
