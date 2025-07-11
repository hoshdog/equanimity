"use client";

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Clock,
  Banknote,
  Users,
  Plane,
  FileText,
  ShoppingCart,
  Warehouse,
  ShieldCheck,
  BrainCircuit,
  Building2,
  Receipt,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';


const navItems = [
  // Core
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Building2 },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/jobs', label: 'Jobs', icon: ClipboardList },
  { href: '/scheduling', label: 'Scheduling', icon: Calendar },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  // Financial
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/invoicing', label: 'Invoicing', icon: Receipt },
  { href: '/payroll', label: 'Payroll', icon: Banknote },
  // Company & HR
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/leave', label: 'Leave', icon: Plane },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/training', label: 'AI Training', icon: BrainCircuit },
  // Assets
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
               <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                className="w-full"
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
