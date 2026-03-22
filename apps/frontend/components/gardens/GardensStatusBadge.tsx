import { Badge } from '../ui/badge';
import { GardensStatus, formatStatusLabel } from '../../lib/gardens';

export function GardensStatusBadge({ status }: { status: GardensStatus }) {
  const variant =
    status === 'APPROVED'
      ? 'success'
      : status === 'SUBMITTED'
      ? 'info'
      : status === 'NEEDS_CHANGES'
      ? 'warning'
      : 'outline';

  return <Badge variant={variant}>{formatStatusLabel(status)}</Badge>;
}
