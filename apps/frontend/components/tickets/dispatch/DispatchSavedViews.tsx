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
    <div className="rounded-[24px] border border-subtle-border bg-background/92 p-4 shadow-elevation-1 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Star className="h-4 w-4 text-primary" />
            תצוגות שמורות
          </div>
          <p className="text-xs leading-5 text-secondary-foreground">
            שמירה מקומית של מסננים ותורים כדי לחזור למסכי עבודה חוזרים בלחיצה אחת.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={selectedPresetId} onValueChange={onSelectPreset}>
            <SelectTrigger className="min-w-[230px] border-subtle-border bg-white text-foreground">
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
          <Button variant="outline" className="border-primary/14 bg-white/82 text-foreground hover:bg-white" onClick={onOpenSaveDialog}>
            <BookmarkPlus className="me-2 h-4 w-4" />
            שמור תצוגה
          </Button>
          <Button variant="outline" className="border-primary/14 bg-white/82 text-foreground hover:bg-white" onClick={onResetFilters}>
            <RotateCcw className="me-2 h-4 w-4" />
            איפוס
          </Button>
        </div>
      </div>
    </div>
  );
}
