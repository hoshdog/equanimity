
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
  Menu,
  Receipt,
  ChevronLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

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
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === 'expanded' && sidebarRef.current) {
        let maxWidth = 0;
        
        // Measure only navigation items
        const navSpans = sidebarRef.current.querySelectorAll('[data-sidebar="menu-button"] > span');
        navSpans.forEach(span => {
            const htmlSpan = span as HTMLElement;
            const currentDisplay = htmlSpan.style.display;
            htmlSpan.style.display = 'inline-block';
            if (htmlSpan.scrollWidth > maxWidth) {
                maxWidth = htmlSpan.scrollWidth;
            }
            htmlSpan.style.display = currentDisplay;
        });

        if (maxWidth > 0) {
            // Approx width for icon, padding, gaps, and logout button
            const extraSpace = 90; 
            const newWidth = maxWidth + extraSpace;
            
            const styleId = 'dynamic-sidebar-width';
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `:root { --sidebar-width: ${newWidth}px; }`;
        }
    }
  }, [state]);


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  return (
    <Sidebar ref={sidebarRef}>
      <SidebarHeader>
        <div className="flex items-center justify-between">
           <div className={cn("flex items-center gap-2", state === 'collapsed' && 'invisible')}>
              <Waves className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">
                Equanimity
              </span>
            </div>
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
         <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="person" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex flex-col overflow-hidden",
              "group-data-[state=collapsed]:hidden"
            )}>
                <span className="text-sm font-semibold whitespace-nowrap">Jane Doe</span>
                <span className="text-xs text-muted-foreground truncate">jane.doe@example.com</span>
            </div>
             <Button variant="ghost" size="icon" className={cn(
              "ml-auto h-8 w-8",
              "group-data-[state=collapsed]:hidden"
             )}>
                <LogOut className="h-4 w-4" />
             </Button>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
