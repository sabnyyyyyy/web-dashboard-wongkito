// Role & access rules. The role of an account is derived from its login ID prefix
// (OWN-001 → Owner, KSR-001 → Kasir), so it can never be chosen at login time.

import type { DashboardTab } from '@/app/_context/AppContext';
import type { UserRole } from '@/types';

export const LOGIN_ID_PREFIX: Record<UserRole, string> = {
  superadmin: 'OWN',
  kasir: 'KSR',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Owner Admin',
  kasir: 'Kasir',
};

const LOGIN_ID_PATTERN = /^(OWN|KSR)-(\d{3,})$/;

export const normalizeLoginId = (raw: string): string => raw.trim().toUpperCase();

export const roleFromLoginId = (loginId: string): UserRole | null => {
  const match = LOGIN_ID_PATTERN.exec(normalizeLoginId(loginId));
  if (!match) return null;
  return match[1] === LOGIN_ID_PREFIX.superadmin ? 'superadmin' : 'kasir';
};

// Next free ID for a role, e.g. KSR-004 when KSR-001..003 exist.
export const generateLoginId = (role: UserRole, existingIds: string[]): string => {
  const prefix = LOGIN_ID_PREFIX[role];
  const maxNumber = existingIds.reduce((max, id) => {
    const match = LOGIN_ID_PATTERN.exec(id);
    return match && match[1] === prefix ? Math.max(max, Number(match[2])) : max;
  }, 0);
  return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
};

// Tabs each role may open. Anything not listed is blocked, even if navigated to directly.
const ROLE_TABS: Record<UserRole, readonly DashboardTab[]> = {
  superadmin: [
    'dashboard',
    'overview',
    'pos',
    'orders',
    'menu',
    'inventory',
    'reports',
    'attendance',
    'team',
    'notifications',
    'profile',
    'settings',
  ],
  kasir: ['dashboard', 'overview', 'pos', 'orders', 'inventory', 'reports', 'attendance', 'notifications', 'profile'],
};

export const canAccessTab = (role: UserRole | undefined, tab: DashboardTab): boolean =>
  !!role && ROLE_TABS[role].includes(tab);
