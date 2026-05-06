import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-sidebar-border p-3',
        collapsed && 'items-center',
      )}
    >
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={collapsed ? 'right' : 'top'}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      </Tooltip>

      {!collapsed && user && (
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-sidebar-foreground">
              {user.name}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">{user.role}</span>
          </div>
        </div>
      )}

      {collapsed && user && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Avatar className="h-7 w-7 cursor-pointer">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">
            {user.name} · {user.role}
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            onClick={handleLogout}
            className={cn(
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive',
              collapsed ? 'h-9 w-9' : 'w-full justify-start gap-2',
            )}
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">Log out</TooltipContent>}
      </Tooltip>

      {collapsed && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Profile</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
