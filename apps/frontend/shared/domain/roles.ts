export const AppRole = {
  ADMIN: 'ADMIN',
  PM: 'PM',
  TECH: 'TECH',
  RESIDENT: 'RESIDENT',
  ACCOUNTANT: 'ACCOUNTANT',
  MASTER: 'MASTER',
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: 'מנהל מערכת',
  PM: 'מנהל נכסים',
  TECH: 'טכנאי',
  RESIDENT: 'דייר',
  ACCOUNTANT: 'רואה חשבון',
  MASTER: 'מנהל-על',
};

export function getRoleLabel(role: AppRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function isManagementRole(role: AppRole): boolean {
  return role === 'ADMIN' || role === 'PM' || role === 'MASTER';
}

export function isFieldRole(role: AppRole): boolean {
  return role === 'TECH';
}
