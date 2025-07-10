"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
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
  Waves,
  LogOut
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/scheduling', label: 'Scheduling', icon: Calendar },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/payroll', label: 'Payroll', icon: Banknote },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/leave', label: 'Leave', icon: Plane },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0 text-primary hover:bg-primary/10">
            <Waves className="h-5 w-5" />
        </Button>
        <span className={cn("text-lg font-semibold text-primary", state === 'collapsed' && 'hidden')}>
          Equanimity
        </span>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="w-full"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
         <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="person" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className={cn("flex flex-col", state === 'collapsed' && "hidden")}>
                <span className="text-sm font-semibold">Jane Doe</span>
                <span className="text-xs text-muted-foreground">jane.doe@example.com</span>
            </div>
             <Button variant="ghost" size="icon" className={cn("ml-auto", state === 'collapsed' && "hidden")}>
                <LogOut className="h-5 w-5" />
             </Button>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
