import type { UserRole } from '@/types';

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  roles: UserRole[];
  badge?: string;
  children?: MenuItem[];
}

export const ALL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    iconName: 'LayoutDashboard',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
  },
  {
    id: 'devices',
    label: 'Devices',
    path: '/devices',
    iconName: 'Router',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
  },
  {
    id: 'rf-analytics',
    label: 'RF Analytics',
    path: '/rf-analytics',
    iconName: 'Waves',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
  },
  {
    id: 'orchestration',
    label: 'Orchestration',
    path: '/orchestration',
    iconName: 'Workflow',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    path: '/compliance',
    iconName: 'ShieldCheck',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'topology',
    label: 'Topology',
    path: '/topology',
    iconName: 'Network',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
  },
  {
    id: 'alerts',
    label: 'Alerts',
    path: '/alerts',
    iconName: 'Bell',
    roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'],
  },
  {
    id: 'audit',
    label: 'Audit Log',
    path: '/audit',
    iconName: 'ClipboardList',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
];

export function filterMenuByRole(role: UserRole): MenuItem[] {
  return ALL_MENU_ITEMS.filter((item) => item.roles.includes(role));
}
