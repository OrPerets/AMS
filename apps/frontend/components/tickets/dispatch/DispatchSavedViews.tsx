import { BookmarkPlus, RotateCcw, Star } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { DispatchPreset } from './types';

export function DispatchSavedViews({
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenSaveDialog,
  onResetFilters,
}: {
  presets: DispatchPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenSaveDialog: () => void;
  onResetFilters: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Star className="h-4 w-4 text-amber-300" />
            תצוגות שמורות
          </div>
          <p className="text-xs leading-5 text-slate-300">
            שמירה מקומית של מסננים ותורים כדי לחזור למסכי עבודה חוזרים בלחיצה אחת.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={selectedPresetId} onValueChange={onSelectPreset}>
            <SelectTrigger className="min-w-[230px] border-white/10 bg-slate-950/30 text-white">
              <SelectValue placeholder="בחר תצוגה" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                  {preset.builtin ? ' · מערכת' : ' · אישי'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={onOpenSaveDialog}>
            <BookmarkPlus className="me-2 h-4 w-4" />
            שמור תצוגה
          </Button>
          <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={onResetFilters}>
            <RotateCcw className="me-2 h-4 w-4" />
            איפוס
          </Button>
        </div>
      </div>
    </div>
  );
}
