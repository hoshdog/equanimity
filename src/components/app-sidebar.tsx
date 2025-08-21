"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
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
  Building2,
  Receipt,
  User,
  ClipboardList,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import Image from 'next/image';
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
  { href: '/settings', label: 'Settings', icon: Receipt },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const [isDarkTheme, setIsDarkTheme] = React.useState(true);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Check theme on mount and when it changes
  React.useEffect(() => {
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(hasDarkClass || (!htmlElement.classList.contains('light') && prefersDark));
    };

    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  // Keyboard shortcut for toggling sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Calculate logo size - responsive to sidebar state
  const logoSize = state === 'collapsed' ? 32 : 96; // Smaller when collapsed
  
  // Select appropriate logo based on theme
  const logoSrc = isDarkTheme 
    ? "/assets/trackle_logo_light_compressed.png" 
    : "/assets/trackle_logo_dark_compressed.png";

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-3">
        {/* Horizontal layout: Logo and Collapse button side by side */}
        <div className="flex items-center gap-3">
          {/* Logo/Brand - Responsive size based on sidebar state */}
          <div className={cn(
            "shrink-0 flex items-center justify-center transition-all duration-200",
            state === 'collapsed' ? "w-8 h-8" : "w-24 h-24"
          )}>
            <Image
              src={logoSrc}
              alt="Trackle Logo"
              width={logoSize}
              height={logoSize}
              className={cn(
                "object-contain transition-all duration-200",
                state === 'collapsed' ? "scale-75" : "scale-100"
              )}
              priority
            />
          </div>
          
          {/* Collapse button next to logo (desktop only) */}
          {!isMobile && (
            <div className="flex items-center">
              <SidebarTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 text-primary hover:bg-primary/10 h-8 w-8 focus:ring-2 focus:ring-primary/20 transition-colors"
                  title={`${state === 'collapsed' ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
                >
                  {state === 'collapsed' ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </SidebarTrigger>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
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