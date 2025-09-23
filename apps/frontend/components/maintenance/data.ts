import { addDays, subDays } from "date-fns";

export const maintenanceStats = [
  {
    title: "משימות פתוחות",
    value: 12,
    trend: "+3 השבוע",
    color: "text-emerald-600",
  },
  {
    title: "משימות באיחור",
    value: 2,
    trend: "-1 מהשבוע שעבר",
    color: "text-red-600",
  },
  {
    title: "תחזוקה מונעת",
    value: 18,
    trend: "+5 החודש",
    color: "text-blue-600",
  },
  {
    title: "עלות חודשית",
    value: "₪24,300",
    trend: "+12% לעומת התקופה",
    color: "text-amber-600",
  },
];

export const maintenanceEvents = [
  {
    id: 1,
    date: new Date(),
    title: "בדיקת מערכת ספרינקלרים",
    description: "בדיקה חודשית לפי תקן",
    category: "בטיחות",
    status: "scheduled",
    assignee: "טל כהן",
  },
  {
    id: 2,
    date: addDays(new Date(), 1),
    title: "תחזוקת מעלית B",
    description: "בדיקת שמן וכיול חיישנים",
    category: "מעליות",
    status: "scheduled",
    assignee: "חברת מעליות",
  },
  {
    id: 3,
    date: subDays(new Date(), 1),
    title: "ניקוי מזגנים קומה 4",
    description: "ניקוי פילטרים והחלפת חלקים",
    category: "מיזוג",
    status: "completed",
    assignee: "אביתר בן חיים",
  },
];

export const maintenanceTasks = [
  {
    id: "MS-1045",
    building: "מגדל האופרה",
    unit: "קומה 12",
    category: "בטיחות",
    priority: "גבוהה",
    status: "מתוכנן",
    nextDate: addDays(new Date(), 2).toISOString(),
    assignee: "טל כהן",
  },
  {
    id: "MS-1046",
    building: "מגדל לב העיר",
    unit: "קומה 7",
    category: "חשמל",
    priority: "בינונית",
    status: "בהכנה",
    nextDate: addDays(new Date(), 4).toISOString(),
    assignee: "קבוצת חשמל",
  },
  {
    id: "MS-1047",
    building: "בית הפסגה",
    unit: "קומה 2",
    category: "מיזוג",
    priority: "גבוהה",
    status: "באיחור",
    nextDate: subDays(new Date(), 1).toISOString(),
    assignee: "שירותי מיזוג",
  },
  {
    id: "MS-1048",
    building: "מגדל האופרה",
    unit: "קומה 3",
    category: "מערכת מים",
    priority: "נמוכה",
    status: "הושלם",
    nextDate: subDays(new Date(), 2).toISOString(),
    assignee: "טל כהן",
  },
];

export const maintenanceHistory = [
  {
    id: "H-3098",
    title: "בדיקת גלאי עשן",
    date: subDays(new Date(), 2).toISOString(),
    cost: 1200,
    technician: "טל כהן",
    status: "verified",
    notes: "כל הגלאים תקינים",
  },
  {
    id: "H-3097",
    title: "תחזוקת משאבות מים",
    date: subDays(new Date(), 7).toISOString(),
    cost: 3200,
    technician: "חיים לוי",
    status: "pending",
    notes: "בדיקה נוספת נדרשת בחודש הבא",
  },
  {
    id: "H-3096",
    title: "החלפת פילטרים HVAC",
    date: subDays(new Date(), 10).toISOString(),
    cost: 2100,
    technician: "שירותי מיזוג",
    status: "verified",
    notes: "בוצע בהצלחה",
  },
];

export const maintenanceCostTrend = [
  { month: "ינו", preventive: 8200, corrective: 4300 },
  { month: "פבר", preventive: 7600, corrective: 3900 },
  { month: "מרץ", preventive: 9100, corrective: 4800 },
  { month: "אפר", preventive: 9800, corrective: 5200 },
  { month: "מאי", preventive: 10400, corrective: 6100 },
  { month: "יונ", preventive: 9400, corrective: 4500 },
];

export const workOrderSummaries = [
  {
    id: "WO-7781",
    title: "תיקון דלת גישה",
    supplier: "נוליב דלתות",
    status: "IN_PROGRESS",
    scheduled: addDays(new Date(), 1).toISOString(),
    costEstimate: 1800,
  },
  {
    id: "WO-7779",
    title: "שיפוץ חדר מכונות",
    supplier: "הנדסה מתקדמת",
    status: "APPROVED",
    scheduled: addDays(new Date(), 5).toISOString(),
    costEstimate: 8500,
  },
  {
    id: "WO-7776",
    title: "החלפת גופי תאורה",
    supplier: "חשמל העיר",
    status: "COMPLETED",
    scheduled: subDays(new Date(), 3).toISOString(),
    costEstimate: 2300,
  },
];

export const assetSummaries = [
  {
    id: "A-502",
    name: "יחידת צ'ילר מרכזית",
    category: "HVAC",
    status: "OPERATIONAL",
    location: "חדר מכונות קומה -2",
    nextMaintenance: addDays(new Date(), 15).toISOString(),
    documentsCount: 7,
    maintenanceCount: 24,
  },
  {
    id: "A-503",
    name: "גנרטור חירום",
    category: "ELECTRICAL",
    status: "MAINTENANCE",
    location: "קומה גג",
    nextMaintenance: addDays(new Date(), 7).toISOString(),
    documentsCount: 4,
    maintenanceCount: 18,
  },
];

export const maintenanceFilters = {
  buildings: ["מגדל האופרה", "בית הפסגה", "מגדל לב העיר"],
  categories: ["בטיחות", "מיזוג", "מערכת מים", "חשמל"],
  priorities: ["גבוהה", "בינונית", "נמוכה"],
  statuses: ["מתוכנן", "בהכנה", "באיחור", "הושלם"],
};
