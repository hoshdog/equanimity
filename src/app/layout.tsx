import type { Metadata } from 'next';
import { Inter, Poppins, Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { TimeTrackerProvider } from '@/context/time-tracker-context';
import { BreadcrumbProvider } from '@/context/breadcrumb-context';
import ErrorBoundary from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-logo',
  weight: ['400', '500', '600', '700']
});
const nunito = Nunito({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Trackle - Tackle work. Track everything. Simplify success.',
  description: 'Tackle work. Track everything. Simplify success. Comprehensive business management platform featuring project tracking, invoice management, employee scheduling, and seamless accounting integration. The friendly alternative to complex enterprise solutions.',
  keywords: 'business management, project tracking, invoice management, employee scheduling, HR, field service, accounting integration, SimPro alternative, Xero integration, MYOB integration',
  authors: [{ name: 'Trackle Team' }],
  openGraph: {
    title: 'Trackle - Tackle work. Track everything. Simplify success.',
    description: 'Comprehensive business management platform featuring project tracking, invoice management, and employee scheduling. The friendly alternative to complex enterprise solutions.',
    type: 'website',
    siteName: 'Trackle',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trackle - Tackle work. Track everything. Simplify success.',
    description: 'The friendly business management platform that simplifies project tracking, invoicing, and employee management.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${nunito.variable} ${inter.className}`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <TimeTrackerProvider>
            <BreadcrumbProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </BreadcrumbProvider>
          </TimeTrackerProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
