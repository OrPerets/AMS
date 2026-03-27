import {
  TicketStatusMap,
  TicketSeverityMap,
  InvoiceStatusMap,
  CollectionStatusMap,
  ReminderStateMap,
  MaintenanceStatusMap,
  WorkOrderStatusMap,
  BudgetStatusMap,
  ResidentRequestStatusMap,
  ScheduleStatusMap,
  getStatusLabel,
  getStatusLabelEn,
} from '../dto/status-enums';
import {
  TICKET_STATUSES,
  TICKET_SEVERITIES,
  WORK_ORDER_STATUSES,
  BUDGET_STATUSES,
  SCHEDULE_STATUSES,
} from '../validation/prisma-enums';

describe('Status enum maps — contract tests', () => {
  describe('TicketStatusMap', () => {
    it('covers all Prisma TicketStatus values', () => {
      for (const status of TICKET_STATUSES) {
        expect(TicketStatusMap[status]).toBeDefined();
        expect(TicketStatusMap[status].key).toBe(status);
        expect(TicketStatusMap[status].label).toBeTruthy();
        expect(TicketStatusMap[status].labelEn).toBeTruthy();
      }
    });

    it('has no extra keys beyond Prisma enum', () => {
      const mapKeys = Object.keys(TicketStatusMap);
      expect(mapKeys).toEqual(expect.arrayContaining([...TICKET_STATUSES]));
      expect(mapKeys.length).toBe(TICKET_STATUSES.length);
    });
  });

  describe('TicketSeverityMap', () => {
    it('covers all Prisma TicketSeverity values', () => {
      for (const severity of TICKET_SEVERITIES) {
        expect(TicketSeverityMap[severity]).toBeDefined();
        expect(TicketSeverityMap[severity].rank).toBeGreaterThan(0);
      }
    });

    it('URGENT has highest rank', () => {
      expect(TicketSeverityMap.URGENT.rank).toBeGreaterThan(TicketSeverityMap.HIGH.rank);
      expect(TicketSeverityMap.HIGH.rank).toBeGreaterThan(TicketSeverityMap.NORMAL.rank);
    });
  });

  describe('WorkOrderStatusMap', () => {
    it('covers all Prisma WorkOrderStatus values', () => {
      for (const status of WORK_ORDER_STATUSES) {
        expect(WorkOrderStatusMap[status]).toBeDefined();
        expect(WorkOrderStatusMap[status].label).toBeTruthy();
      }
    });
  });

  describe('BudgetStatusMap', () => {
    it('covers all Prisma BudgetStatus values', () => {
      for (const status of BUDGET_STATUSES) {
        expect(BudgetStatusMap[status]).toBeDefined();
      }
    });
  });

  describe('ScheduleStatusMap', () => {
    it('covers all Prisma ScheduleStatus values', () => {
      for (const status of SCHEDULE_STATUSES) {
        expect(ScheduleStatusMap[status]).toBeDefined();
      }
    });
  });

  describe('InvoiceStatusMap', () => {
    it('has all expected statuses', () => {
      expect(InvoiceStatusMap.PENDING).toBeDefined();
      expect(InvoiceStatusMap.PAID).toBeDefined();
      expect(InvoiceStatusMap.OVERDUE).toBeDefined();
    });
  });

  describe('CollectionStatusMap', () => {
    it('has all expected statuses', () => {
      const keys = Object.keys(CollectionStatusMap);
      expect(keys).toContain('CURRENT');
      expect(keys).toContain('PAST_DUE');
      expect(keys).toContain('IN_COLLECTIONS');
      expect(keys).toContain('PROMISE_TO_PAY');
      expect(keys).toContain('RESOLVED');
    });
  });

  describe('ReminderStateMap', () => {
    it('has all expected states', () => {
      expect(Object.keys(ReminderStateMap).length).toBe(5);
    });
  });

  describe('MaintenanceStatusMap', () => {
    it('has all expected statuses', () => {
      expect(Object.keys(MaintenanceStatusMap).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('ResidentRequestStatusMap', () => {
    it('has all expected statuses', () => {
      const keys = Object.keys(ResidentRequestStatusMap);
      expect(keys).toContain('SUBMITTED');
      expect(keys).toContain('IN_REVIEW');
      expect(keys).toContain('COMPLETED');
      expect(keys).toContain('CLOSED');
    });
  });

  describe('getStatusLabel', () => {
    it('returns Hebrew label for known status', () => {
      expect(getStatusLabel(TicketStatusMap, 'OPEN')).toBe('פתוחה');
      expect(getStatusLabel(InvoiceStatusMap, 'PAID')).toBe('שולם');
    });

    it('returns raw key for unknown status', () => {
      expect(getStatusLabel(TicketStatusMap, 'UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getStatusLabelEn', () => {
    it('returns English label for known status', () => {
      expect(getStatusLabelEn(TicketStatusMap, 'OPEN')).toBe('Open');
      expect(getStatusLabelEn(InvoiceStatusMap, 'OVERDUE')).toBe('Overdue');
    });

    it('returns raw key for unknown status', () => {
      expect(getStatusLabelEn(TicketStatusMap, 'INVALID')).toBe('INVALID');
    });
  });
});

describe('Status enum snapshot contracts', () => {
  it('TicketStatusMap matches snapshot', () => {
    expect(TicketStatusMap).toMatchSnapshot();
  });

  it('TicketSeverityMap matches snapshot', () => {
    expect(TicketSeverityMap).toMatchSnapshot();
  });

  it('InvoiceStatusMap matches snapshot', () => {
    expect(InvoiceStatusMap).toMatchSnapshot();
  });

  it('CollectionStatusMap matches snapshot', () => {
    expect(CollectionStatusMap).toMatchSnapshot();
  });

  it('WorkOrderStatusMap matches snapshot', () => {
    expect(WorkOrderStatusMap).toMatchSnapshot();
  });

  it('MaintenanceStatusMap matches snapshot', () => {
    expect(MaintenanceStatusMap).toMatchSnapshot();
  });
});
