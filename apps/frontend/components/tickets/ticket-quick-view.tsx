import * as React from 'react';
import { AmsDrawer } from '../ui/ams-drawer';

export function TicketQuickView({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <AmsDrawer
      isOpen={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      placement="bottom"
      size="lg"
      bodyClassName="max-h-[68dvh] overflow-y-auto"
    >
        {children}
    </AmsDrawer>
  );
}
