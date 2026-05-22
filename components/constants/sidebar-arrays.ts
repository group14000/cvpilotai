import { FileText, LayoutDashboard, LucideIcon } from 'lucide-react';

export interface MainSidebarItem {
  id: number;
  name: string;
  href: string;
  icon: LucideIcon;
}

export const mainSidebarItems: MainSidebarItem[] = [
  {
    id: 1,
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 2,
    name: 'Resumes',
    href: '/resumes',
    icon: FileText,
  },
];
