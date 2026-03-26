import { severityRank, getSeverityLabel } from '../../../shared/domain';

export { severityRank, getSeverityLabel };

export function formatDueWindow(value?: string): string {
  if (!value) return 'לא הוגדר';
  const due = new Date(value);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return 'עבר';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours <= 0) {
    return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}ד`;
  }
  return `${diffHours}ש`;
}

export function formatRelativeAge(value?: string): string {
  if (!value) return 'ללא זמן הקצאה';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  return `נפתח לפני ${diffHours} שעות`;
}

export function getOccupancyRate(occupiedUnits: number, vacantUnits: number): number {
  const totalUnits = occupiedUnits + vacantUnits;
  if (!totalUnits) return 0;
  return Math.round((occupiedUnits / totalUnits) * 100);
}
