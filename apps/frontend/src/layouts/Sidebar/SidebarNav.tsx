import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Router,
  Waves,
  Workflow,
  ShieldCheck,
  Network,
  Bell,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MenuItem } from './sidebarConfig';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Router,
  Waves,
  Workflow,
  ShieldCheck,
  Network,
  Bell,
  ClipboardList,
};

interface SidebarNavProps {
  items: MenuItem[];
  collapsed: boolean;
}

export function SidebarNav({ items, collapsed }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = ICON_MAP[item.iconName];
        return (
          <Tooltip key={item.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground',
                    collapsed && 'justify-center px-2',
                  )
                }
                aria-label={item.label}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </nav>
  );
}
