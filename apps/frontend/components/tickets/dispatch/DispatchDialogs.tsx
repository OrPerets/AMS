import { useMemo } from 'react';
import { Building2, Command, HelpCircle, Keyboard, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import type { BuildingOption, DispatchPreset, DispatchTicket, UnitOption, VendorOption } from './types';

type PaletteItem =
  | { id: string; type: 'ticket'; label: string; meta: string; action: () => void }
  | { id: string; type: 'building'; label: string; meta: string; action: () => void }
  | { id: string; type: 'preset'; label: string; meta: string; action: () => void };

export function DispatchDialogs({
  helpOpen,
  commandOpen,
  savePresetOpen,
  createOpen,
  commandQuery,
  presetName,
  createBuildings,
  createUnits,
  unitsLoading,
  createSubmitting,
  selectedPresetName,
  searchTickets,
  searchBuildings,
  searchPresets,
  createForm,
  onHelpOpenChange,
  onCommandOpenChange,
  onSavePresetOpenChange,
  onCreateOpenChange,
  onCommandQueryChange,
  onPresetNameChange,
  onSavePreset,
  onCreateFormChange,
  onCreateTicket,
}: {
  helpOpen: boolean;
  commandOpen: boolean;
  savePresetOpen: boolean;
  createOpen: boolean;
  commandQuery: string;
  presetName: string;
  createBuildings: BuildingOption[];
  createUnits: UnitOption[];
  unitsLoading: boolean;
  createSubmitting: boolean;
  selectedPresetName: string;
  searchTickets: DispatchTicket[];
  searchBuildings: Array<{ id: number; name: string }>;
  searchPresets: DispatchPreset[];
  createForm: {
    buildingId: string;
    unitId: string;
    category: string;
    severity: string;
    residentContact: string;
    description: string;
    photos: FileList | null;
  };
  onHelpOpenChange: (open: boolean) => void;
  onCommandOpenChange: (open: boolean) => void;
  onSavePresetOpenChange: (open: boolean) => void;
  onCreateOpenChange: (open: boolean) => void;
  onCommandQueryChange: (value: string) => void;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onCreateFormChange: (next: Partial<{ buildingId: string; unitId: string; category: string; severity: string; residentContact: string; description: string; photos: FileList | null }>) => void;
  onCreateTicket: () => void;
}) {
  const paletteItems = useMemo<PaletteItem[]>(() => {
    const ticketItems = searchTickets.slice(0, 6).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: 'ticket' as const,
      label: `#${ticket.id} · ${ticket.title}`,
      meta: `${ticket.building.name} • ${ticket.unit.number}`,
      action: () => {
        window.location.href = `/tickets/${ticket.id}`;
      },
    }));

    const buildingItems = searchBuildings.slice(0, 5).map((building) => ({
      id: `building-${building.id}`,
      type: 'building' as const,
      label: building.name,
      meta: 'מעבר לעמוד הבניין',
      action: () => {
        window.location.href = `/buildings/${building.id}`;
      },
    }));

    const presetItems = searchPresets.slice(0, 5).map((preset) => ({
      id: `preset-${preset.id}`,
      type: 'preset' as const,
      label: preset.name,
      meta: preset.builtin ? 'תצוגת מערכת' : 'תצוגה אישית',
      action: () => {
        window.dispatchEvent(new CustomEvent('dispatch:apply-preset', { detail: preset.id }));
      },
    }));

    return [...presetItems, ...ticketItems, ...buildingItems];
  }, [searchBuildings, searchPresets, searchTickets]);

  return (
    <>
      <Dialog open={helpOpen} onOpenChange={onHelpOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              קיצורי מקלדת
            </DialogTitle>
            <DialogDescription>הקיצורים זמינים כל עוד הפוקוס אינו בתוך שדה טקסט.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ShortcutRow shortcut="J / K" description="מעבר בין הקריאות בתור" />
            <ShortcutRow shortcut="Enter" description="פתיחת הקריאה הנבחרת לעמוד מלא" />
            <ShortcutRow shortcut="A" description="פוקוס על שיוך טכנאי" />
            <ShortcutRow shortcut="S" description="פוקוס על עדכון סטטוס" />
            <ShortcutRow shortcut="/" description="פוקוס על שדה החיפוש" />
            <ShortcutRow shortcut="?" description="פתיחת שכבת העזרה" />
            <ShortcutRow shortcut="Cmd/Ctrl + K" description="פתיחת לוח הפקודות" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={commandOpen} onOpenChange={onCommandOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              לוח פקודות
            </DialogTitle>
            <DialogDescription>נווט לקריאה, בניין או תצוגה שמורה מתוך המסך.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={commandQuery} onChange={(event) => onCommandQueryChange(event.target.value)} placeholder="חפש קריאה, בניין או תצוגה..." autoFocus />
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {paletteItems.length ? (
                paletteItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.action();
                      onCommandOpenChange(false);
                    }}
                    className="flex w-full items-start justify-between rounded-2xl border border-slate-200 p-4 text-right transition hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium text-slate-950">{item.label}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.meta}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {item.type === 'ticket' ? 'קריאה' : item.type === 'building' ? 'בניין' : 'תצוגה'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  לא נמצאו תוצאות.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={savePresetOpen} onOpenChange={onSavePresetOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שמור תצוגה אישית</DialogTitle>
            <DialogDescription>
              התצוגה הנוכחית תשמר מקומית בדפדפן. התצוגה הפעילה כרגע: {selectedPresetName}
            </DialogDescription>
          </DialogHeader>
          <Input value={presetName} onChange={(event) => onPresetNameChange(event.target.value)} placeholder="לדוגמה: מעליות דחופות בהרצליה" />
          <DialogFooter>
            <Button variant="outline" onClick={() => onSavePresetOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={onSavePreset} disabled={!presetName.trim()}>
              שמור תצוגה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              פתיחת קריאה חדשה
            </DialogTitle>
            <DialogDescription>טופס יצירה מודרך שמרכז את כל פרטי הפנייה לפני שליחה למוקד.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">בניין</label>
              <Select value={createForm.buildingId} onValueChange={(value) => onCreateFormChange({ buildingId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר בניין" />
                </SelectTrigger>
                <SelectContent>
                  {createBuildings.map((building) => (
                    <SelectItem key={building.id} value={String(building.id)}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">יחידה</label>
              <Select value={createForm.unitId} onValueChange={(value) => onCreateFormChange({ unitId: value })}>
                <SelectTrigger disabled={!createForm.buildingId || unitsLoading}>
                  <SelectValue placeholder={unitsLoading ? 'טוען יחידות...' : 'בחר יחידה'} />
                </SelectTrigger>
                <SelectContent>
                  {createUnits.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.number}
                      {unit.floor ? ` • קומה ${unit.floor}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">קטגוריה</label>
              <Select value={createForm.category} onValueChange={(value) => onCreateFormChange({ category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="כללי">כללי</SelectItem>
                  <SelectItem value="חשמל">חשמל</SelectItem>
                  <SelectItem value="אינסטלציה">אינסטלציה</SelectItem>
                  <SelectItem value="מעליות">מעליות</SelectItem>
                  <SelectItem value="גישה וביטחון">גישה וביטחון</SelectItem>
                  <SelectItem value="ניקיון">ניקיון</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">רמת חומרה</label>
              <Select value={createForm.severity} onValueChange={(value) => onCreateFormChange({ severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">רגילה</SelectItem>
                  <SelectItem value="HIGH">דחופה</SelectItem>
                  <SelectItem value="URGENT">בהולה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">איש קשר</label>
              <Input
                value={createForm.residentContact}
                onChange={(event) => onCreateFormChange({ residentContact: event.target.value })}
                placeholder="טלפון, שם או הערת תיאום רלוונטית"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">תיאור התקלה</label>
              <Textarea
                rows={6}
                value={createForm.description}
                onChange={(event) => onCreateFormChange({ description: event.target.value })}
                placeholder="תאר בקצרה מה קרה, מה ההשפעה, והאם נדרשת גישה מיוחדת או טיפול מיידי"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">צירוף תמונות</label>
              <Input type="file" multiple accept="image/*" onChange={(event) => onCreateFormChange({ photos: event.target.files })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onCreateOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={onCreateTicket} disabled={createSubmitting}>
              {createSubmitting ? 'יוצר...' : 'פתח קריאה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShortcutRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
      <span className="font-semibold text-slate-950">{shortcut}</span>
      <span className="text-slate-500">{description}</span>
    </div>
  );
}
