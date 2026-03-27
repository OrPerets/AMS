export { useHomeBlueprint } from './hooks/use-home-blueprint';
export { buildHomeBlueprint, buildFallbackBlueprint } from './api/home-data';
export type {
  HomeBlueprintState,
  RoleKey,
  ResidentHomeData,
  AdminMobileHomeData,
  PmMobileHomeData,
  TechMobileHomeData,
  AccountantMobileHomeData,
  TicketsSnapshot,
  WorkOrderSnapshot,
  BuildingSnapshot,
  OperationsCalendarSnapshot,
  InvoiceRow,
  CollectionsSummary,
  BudgetSnapshot,
} from './model/types';
export {
  formatDueWindow,
  formatRelativeAge,
  getOccupancyRate,
} from './model/formatters';
