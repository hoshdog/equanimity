import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/app-sidebar';
import { cn } from '@/lib/utils';
import { Menu, Waves } from 'lucide-react';

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
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}>
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div className="md:hidden flex items-center justify-between p-2 border-b">
                 <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Waves className="h-5 w-5" />
                  Equanimity
                 </div>
                 <SidebarTrigger>
                    <Menu />
                 </SidebarTrigger>
              </div>
              {children}
            </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
