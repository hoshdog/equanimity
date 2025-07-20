import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { TimeTrackerProvider } from '@/context/time-tracker-context';

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
        className={inter.className}
        suppressHydrationWarning={true}
      >
        <TimeTrackerProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TimeTrackerProvider>
        <Toaster />
      </body>
    </html>
  );
}
