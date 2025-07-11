// src/app/settings/settings-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Building, DollarSign, CreditCard, Palette, Mail, MessageSquare, Link2, FileText, Hammer, Boxes, Banknote, User, BookOpen } from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'Company',
    href: '/settings',
    icon: <Building className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Billing Rates',
    href: '/settings/billing-rates',
    icon: <DollarSign className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Bills & Purchases',
    href: '/settings/bills',
    icon: <CreditCard className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Document Themes',
    href: '/settings/themes',
    icon: <Palette className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Email',
    href: '/settings/email',
    icon: <Mail className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    icon: <Link2 className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Invoices',
    href: '/settings/invoices',
    icon: <FileText className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Jobs',
    href: '/settings/jobs',
    icon: <Hammer className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Kits',
    href: '/settings/kits',
    icon: <Boxes className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Payments',
    href: '/settings/payments',
    icon: <Banknote className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Plan & Billing',
    href: '/settings/plan',
    icon: <User className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Price List',
    href: '/settings/prices',
    icon: <BookOpen className="mr-2 h-4 w-4" />,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {sidebarNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
