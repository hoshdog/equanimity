
"use client";

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
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
  LogOut,
  BrainCircuit,
  User,
  ClipboardList,
  ChevronLeft,
  Receipt,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/jobs', label: 'Jobs', icon: ClipboardList },
  { href: '/customers', label: 'Customers', icon: User },
  { href: '/scheduling', label: 'Scheduling', icon: Calendar },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/payroll', label: 'Payroll', icon: Banknote },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/leave', label: 'Leave', icon: Plane },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/invoicing', label: 'Invoicing', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/training', label: 'Training', icon: BrainCircuit },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
           <div className={cn("flex items-center gap-2", state === 'collapsed' && 'invisible')}>
              <Waves className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">
                Equanimity
              </span>
            </div>
            <SidebarTrigger className="group-data-[state=expanded]:rotate-180">
              <ChevronLeft className="h-5 w-5" />
            </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
               <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{children: item.label, side: 'right'}}
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
      <SidebarFooter>
         <div className="flex flex-col items-center text-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="person" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex flex-col",
              "group-data-[state=collapsed]:hidden"
            )}>
                <span className="text-sm font-semibold">Jane Doe</span>
                <span className="text-xs text-muted-foreground">jane.doe@example.com</span>
            </div>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
