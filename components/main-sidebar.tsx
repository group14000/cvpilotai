'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from './ui/sidebar';
import { FileText, Settings, LogOut, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { mainSidebarItems } from './constants/sidebar-arrays';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useUser, SignOutButton } from '@clerk/nextjs';

const MainSidebar: React.FC = () => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user, isLoaded } = useUser();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className="border-border border-r">
      {/* Header */}
      <SidebarHeader className="border-border border-b px-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="from-primary to-primary/80 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br">
              <FileText className="text-primary-foreground h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground text-sm font-bold">
                  CVPilot
                </span>
                <span className="text-muted-foreground text-xs">AI Resume</span>
              </div>
            )}
          </Link>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-3 py-6">
        <SidebarMenu className="gap-2">
          {mainSidebarItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    'group relative px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md transition-all',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <div className="bg-primary absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* Divider */}
        <div className="bg-border my-4 h-px" />

        {/* Secondary Actions */}
        <div className="space-y-2">
          <SidebarMenuButton
            asChild
            className="group text-muted-foreground hover:text-foreground hover:bg-muted/50 relative px-3 py-2.5 text-sm font-medium transition-all duration-200"
          >
            <Link href="/settings">
              <div className="text-muted-foreground group-hover:text-foreground flex h-5 w-5 items-center justify-center rounded-md transition-all">
                <Settings className="h-4 w-4" />
              </div>
              <span className="truncate">Settings</span>
            </Link>
          </SidebarMenuButton>
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-border border-t px-0 py-3">
        <div className="px-3">
          {isLoaded && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all duration-200',
                    'hover:bg-muted/50 focus:ring-primary/50 focus:ring-2 focus:outline-none'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* User Avatar */}
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || 'User'}
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="from-primary/40 to-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                        <span className="text-primary text-xs font-semibold">
                          {(user.fullName ||
                            user.emailAddresses[0]?.emailAddress ||
                            'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="min-w-0 text-left">
                        <p className="text-foreground truncate text-xs font-semibold">
                          {user.fullName || 'User'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.emailAddresses[0]?.emailAddress || 'No email'}
                        </p>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <SignOutButton>
                    <button className="flex w-full cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Loading State */
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="bg-muted h-8 w-8 shrink-0 animate-pulse rounded-lg" />
              {!isCollapsed && (
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="bg-muted h-3 w-20 animate-pulse rounded-sm" />
                  <div className="bg-muted/50 h-2 w-32 animate-pulse rounded-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default MainSidebar;
