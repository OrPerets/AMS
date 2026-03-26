import type { RefObject } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, BrainCircuit, ClipboardCheck, Factory, MessageSquareText, Route, Sparkles, Users } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import type { DispatchResponse, DispatchTicket, SmartTriagePreview, TechnicianOption, VendorOption } from './types';
import { DetailMetric, formatRelative, severityLabels } from './presentation';

type TechnicianInsight = TechnicianOption & {
  activeCount: number;
  riskCount: number;
  breachedCount: number;
  urgentCount: number;
  loadLabel: string;
  recommended: boolean;
};

export function DispatchActionRail({
  ticket,
  dispatchData,
  technicians,
  vendors,
  canDispatch,
  assignmentTarget,
  supplierTarget,
  statusTarget,
  severityTarget,
  costEstimate,
  newNote,
  bulkSelectionCount,
  technicianTriggerRef,
  statusTriggerRef,
  severityTriggerRef,
  onAssignmentTargetChange,
  onSupplierTargetChange,
  onStatusTargetChange,
  onSeverityTargetChange,
  onCostEstimateChange,
  onNewNoteChange,
  onAssignTechnician,
  onAssignSupplier,
  onUpdateStatus,
  onUpdateSeverity,
  onAddNote,
  onBulkAssignTechnician,
  onBulkUpdateStatus,
  onBulkUpdateSeverity,
  assigning,
  assigningSupplier,
  updatingStatus,
  updatingSeverity,
  addingNote,
  escalating,
  onEscalateTicket,
  triagePreview,
  triageLoading,
  onRunTriage,
  onApplyTriage,
  onUseDraftResponse,
}: {
  ticket: DispatchTicket | null;
  dispatchData: DispatchResponse | null;
  technicians: TechnicianInsight[];
  vendors: VendorOption[];
  canDispatch: boolean;
  assignmentTarget: string;
  supplierTarget: string;
  statusTarget: DispatchTicket['status'];
  severityTarget: DispatchTicket['severity'];
  costEstimate: string;
  newNote: string;
  bulkSelectionCount: number;
  technicianTriggerRef: RefObject<HTMLButtonElement | null>;
  statusTriggerRef: RefObject<HTMLButtonElement | null>;
  severityTriggerRef: RefObject<HTMLButtonElement | null>;
  onAssignmentTargetChange: (value: string) => void;
  onSupplierTargetChange: (value: string) => void;
  onStatusTargetChange: (value: DispatchTicket['status']) => void;
  onSeverityTargetChange: (value: DispatchTicket['severity']) => void;
  onCostEstimateChange: (value: string) => void;
  onNewNoteChange: (value: string) => void;
  onAssignTechnician: () => void;
  onAssignSupplier: () => void;
  onUpdateStatus: () => void;
  onUpdateSeverity: () => void;
  onAddNote: () => void;
  onBulkAssignTechnician: () => void;
  onBulkUpdateStatus: () => void;
  onBulkUpdateSeverity: () => void;
  assigning: boolean;
  assigningSupplier: boolean;
  updatingStatus: boolean;
  updatingSeverity: boolean;
  addingNote: boolean;
  escalating: boolean;
  onEscalateTicket: () => void;
  triagePreview: SmartTriagePreview | null;
  triageLoading: boolean;
  onRunTriage: () => void;
  onApplyTriage: () => void;
  onUseDraftResponse: () => void;
}) {
  const showEscalation = ticket && (ticket.slaState === 'AT_RISK' || ticket.slaState === 'DUE_TODAY' || ticket.slaState === 'BREACHED');
  const fieldClassName = 'border-primary/12 bg-white';

  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border-primary/10 bg-card/96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="h-5 w-5" />
            Smart triage
          </CardTitle>
          <CardDescription>מיון חכם של הקריאה: קטגוריה, עדיפות, מטפל מומלץ וניסוח תגובה מוכן לצוות או לדייר.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full rounded-full" variant="outline" onClick={onRunTriage} disabled={!ticket || triageLoading}>
            <Sparkles className="me-2 h-4 w-4" />
            {triageLoading ? 'מנתח...' : 'נתח את הקריאה הנבחרת'}
          </Button>

          {triagePreview ? (
            <div className="space-y-4 rounded-[24px] border border-primary/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{triagePreview.category}</Badge>
                  <Badge variant={triagePreview.severity === 'URGENT' ? 'destructive' : triagePreview.severity === 'HIGH' ? 'warning' : 'secondary'}>
                    {triagePreview.severity === 'URGENT' ? 'בהולה' : triagePreview.severity === 'HIGH' ? 'דחופה' : 'רגילה'}
                  </Badge>
                  <Badge variant="gold">ביטחון {Math.round(triagePreview.confidence * 100)}%</Badge>
                </div>
                <p className="text-sm font-medium text-slate-900">{triagePreview.summary}</p>
              </div>

              <div className="space-y-2 rounded-2xl border border-primary/12 bg-white/88 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">למה זו ההמלצה</div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {triagePreview.reasons.map((reason) => (
                    <li key={reason} className="rounded-xl bg-slate-50 px-3 py-2">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-primary/12 bg-white/88 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">מטפל מומלץ</div>
                {triagePreview.suggestedAssignee ? (
                  <div className="mt-2 space-y-1">
                    <div className="font-medium text-slate-900">{triagePreview.suggestedAssignee.email}</div>
                    <div className="text-sm text-slate-600">{triagePreview.suggestedAssignee.reason}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-600">לא נמצאה המלצת שיוך מובהקת. אפשר להסתמך על לוח העומסים הידני.</div>
                )}
              </div>

              <div className="space-y-2 rounded-2xl border border-primary/12 bg-white/88 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">טיוטת תגובה</div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{triagePreview.draftResponse}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={onApplyTriage}>
                  החל המלצות על הפאנל
                </Button>
                <Button variant="outline" onClick={onUseDraftResponse}>
                  הוסף את הטיוטה לעדכון
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm leading-7 text-slate-500">
              אחרי הניתוח תופיע כאן המלצה ישימה למיון, דחיפות, שיוך ונוסח תגובה. זהו שכבת ה"וואו" של המוקד.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-card/96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5" />
            פאנל פעולה
          </CardTitle>
          <CardDescription>שיוך, סטטוס, עדיפות וספקים בלי לאבד הקשר מתוך התצוגה המפוצלת.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">שיוך טכנאי</p>
            <div className="flex flex-col gap-3">
              <Select value={assignmentTarget} onValueChange={onAssignmentTargetChange} disabled={!canDispatch}>
                <SelectTrigger ref={technicianTriggerRef} className={fieldClassName}>
                  <SelectValue placeholder="בחר מטפל" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">ללא שיוך</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem key={technician.id} value={String(technician.id)}>
                      {technician.email} · {technician.loadLabel}
                      {technician.recommended ? ' · מומלץ' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid gap-2">
                {technicians.slice(0, 4).map((technician) => (
                  <div key={technician.id} className="flex items-center justify-between rounded-xl border border-subtle-border bg-background/86 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">{technician.email}</div>
                      <div className="text-xs text-slate-500">
                        {technician.activeCount} פעילות · {technician.riskCount} בסיכון · {technician.breachedCount} חריגות
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {technician.recommended ? <Badge variant="success">הכי פנוי</Badge> : null}
                      {technician.breachedCount > 0 ? <Badge variant="warning">יש חריגות</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={onAssignTechnician} disabled={!canDispatch || assigning || assignmentTarget === 'UNASSIGNED' || !ticket}>
                {assigning ? 'משייך...' : 'שייך טכנאי'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">יצירת הזמנת עבודה לספק</p>
            <div className="grid gap-3">
              <Select value={supplierTarget} onValueChange={onSupplierTargetChange} disabled={!canDispatch}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder="בחר ספק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">ללא ספק</SelectItem>
                  {vendors.filter((vendor) => vendor.isActive).map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name} · {vendor.skills.join(', ') || 'ללא מיומנויות'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={costEstimate}
                onChange={(event) => onCostEstimateChange(event.target.value)}
                placeholder="אומדן עלות (אופציונלי)"
                className={fieldClassName}
              />
              <Button variant="outline" className="rounded-full" onClick={onAssignSupplier} disabled={!ticket || !canDispatch || assigningSupplier || supplierTarget === 'NONE'}>
                <Factory className="me-2 h-4 w-4" />
                {assigningSupplier ? 'יוצר...' : 'פתח הזמנת עבודה'}
              </Button>
            </div>
            {ticket?.workOrders.length ? (
              <div className="space-y-2 rounded-2xl border border-subtle-border bg-background/86 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">הזמנות פעילות</div>
                {ticket.workOrders.map((workOrder) => (
                  <Link
                    key={workOrder.id}
                    href={`/work-orders/${workOrder.id}`}
                    className="flex items-center justify-between rounded-xl border border-subtle-border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <span>{workOrder.supplierName}</span>
                    <span className="font-semibold">#{workOrder.id} • {workOrder.status}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">סטטוס</p>
              <Select value={statusTarget} onValueChange={(value) => onStatusTargetChange(value as DispatchTicket['status'])}>
                <SelectTrigger ref={statusTriggerRef} className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">פתוח</SelectItem>
                  <SelectItem value="ASSIGNED">הוקצה</SelectItem>
                  <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
                  <SelectItem value="RESOLVED">נפתר</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="rounded-full" onClick={onUpdateStatus} disabled={!ticket || updatingStatus}>
                {updatingStatus ? 'מעדכן...' : 'עדכן סטטוס'}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">עדיפות</p>
              <Select value={severityTarget} onValueChange={(value) => onSeverityTargetChange(value as DispatchTicket['severity'])}>
                <SelectTrigger ref={severityTriggerRef} className={fieldClassName}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">{severityLabels.NORMAL}</SelectItem>
                  <SelectItem value="HIGH">{severityLabels.HIGH}</SelectItem>
                  <SelectItem value="URGENT">{severityLabels.URGENT}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="rounded-full" onClick={onUpdateSeverity} disabled={!ticket || updatingSeverity}>
                {updatingSeverity ? 'מעדכן...' : 'עדכן עדיפות'}
              </Button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <DetailMetric label="איש קשר" value={ticket?.residentContact || 'לא הוזן'} />
            <DetailMetric label="עדכון אחרון" value={ticket ? formatRelative(ticket.latestActivityAt) : '-'} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-card/96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            פעולות מרובות
          </CardTitle>
          <CardDescription>
            {bulkSelectionCount ? `${bulkSelectionCount} קריאות נבחרו לפעולה מרוכזת.` : 'בחר כמה קריאות מהתור כדי להחיל פעולות בבת אחת.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={onBulkAssignTechnician} disabled={!bulkSelectionCount || assignmentTarget === 'UNASSIGNED' || assigning}>
            <Users className="me-2 h-4 w-4" />
            שיוך הטכנאי שנבחר לכל הבחירה
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onBulkUpdateStatus} disabled={!bulkSelectionCount || updatingStatus}>
            <ClipboardCheck className="me-2 h-4 w-4" />
            החלת הסטטוס הנוכחי על כל הבחירה
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onBulkUpdateSeverity} disabled={!bulkSelectionCount || updatingSeverity}>
            <Activity className="me-2 h-4 w-4" />
            החלת העדיפות הנוכחית על כל הבחירה
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-card/96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            מפת סיכון ותיעוד מהיר
          </CardTitle>
          <CardDescription>צמצום הקלקות במסך: ספירת חריגות לצד כתיבת עדכון ליומן.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-subtle-border bg-background/86 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">תמונה כוללת</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>דורש מיון</span>
                  <span className="font-semibold">{dispatchData?.riskSummary.triage ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>לא הוקצה</span>
                  <span className="font-semibold">{dispatchData?.riskSummary.unassigned ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>בסיכון</span>
                  <span className="font-semibold">{dispatchData?.riskSummary.atRisk ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>יעד היום</span>
                  <span className="font-semibold">{dispatchData?.riskSummary.dueToday ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-rose-700">
                  <span>חריגות</span>
                  <span className="font-semibold">{dispatchData?.riskSummary.breached ?? 0}</span>
                </div>
              </div>
              {showEscalation ? (
                <Button className="mt-4 w-full" variant="warning" onClick={onEscalateTicket} disabled={escalating}>
                  <AlertTriangle className="me-2 h-4 w-4" />
                  {escalating ? 'מסלים...' : 'הסלמה ניהולית'}
                </Button>
              ) : null}
            </div>

            <div className="rounded-2xl border border-subtle-border bg-background/86 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">עדכון ליומן / לדייר</div>
              <Textarea
                value={newNote}
                onChange={(event) => onNewNoteChange(event.target.value)}
                rows={6}
                placeholder="כתוב עדכון, תיאום הגעה, סיכום טיפול או הערה תפעולית"
                className={fieldClassName}
              />
              <Button className="mt-3 w-full" onClick={onAddNote} disabled={addingNote || !newNote.trim() || !ticket}>
                <MessageSquareText className="me-2 h-4 w-4" />
                {addingNote ? 'שומר...' : 'הוסף עדכון'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
