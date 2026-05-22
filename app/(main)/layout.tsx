import { ReactNode } from 'react';
import MainHeader from '@/components/main-header';
import MainSidebar from '@/components/main-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <MainHeader />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
