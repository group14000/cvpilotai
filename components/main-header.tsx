'use client';

import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';
import { UserButton } from '@clerk/nextjs';

const MainHeader: React.FC = () => {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-50 flex h-14 items-center gap-4 border-b px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-end">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
