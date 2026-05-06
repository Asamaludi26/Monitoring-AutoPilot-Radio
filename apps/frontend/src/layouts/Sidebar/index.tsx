import { PanelLeftClose, PanelLeftOpen, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { filterMenuByRole } from './sidebarConfig';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import type { UserRole } from '@/types';

export function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const role: UserRole = user?.role ?? 'VIEWER';
  const menuItems = filterMenuByRole(role);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
          sidebarCollapsed ? 'w-[60px]' : 'w-[220px]',
        )}
        aria-label="Sidebar"
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-sidebar-border px-3',
            sidebarCollapsed ? 'justify-center' : 'gap-2',
          )}
        >
          <Radio className="h-5 w-5 shrink-0 text-sidebar-primary" aria-hidden="true" />
          {!sidebarCollapsed && (
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              RSOCP
            </span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <SidebarNav items={menuItems} collapsed={sidebarCollapsed} />
        </ScrollArea>

        {/* Footer */}
        <SidebarFooter collapsed={sidebarCollapsed} />

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-full text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
