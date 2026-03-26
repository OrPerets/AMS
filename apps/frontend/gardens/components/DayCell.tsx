'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';

export interface DayEntry {
  address: string;
  notes: string;
}

export interface DayBuildingOption {
  id: number;
  name: string;
  location: string;
  address?: string | null;
}

interface DayCellProps {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  value?: DayEntry;
  onChange: (
    date: string,
    value: DayEntry | null,
    bulk?: 'weekdays' | 'weekends' | 'all',
  ) => void;
  /** Optional id for the button (used for keyboard nav) */
  id?: string;
  /** Index of the cell within the grid */
  dataIndex?: number;
  /** Whether this day is in read-only mode */
  readOnly?: boolean;
  /** Whether this is a weekend day */
  isWeekend?: boolean;
  /** Available building choices for the assignment */
  buildingOptions?: DayBuildingOption[];
  /** Whether building choices are still loading */
  buildingsLoading?: boolean;
}

const DayCell: FC<DayCellProps> = ({
  date,
  value,
  onChange,
  id,
  dataIndex,
  readOnly = false,
  isWeekend = false,
  buildingOptions = [],
  buildingsLoading = false,
}) => {
  const day = Number(date.slice(-2));
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [buildingQuery, setBuildingQuery] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const touchStartTime = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setAddress(value?.address ?? '');
      setNotes(value?.notes ?? '');
      setBuildingQuery('');
    }
  }, [value, open]);

  // Hydration-safe portal mounting and scroll lock
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = originalOverflow;
    };
  }, [open]);
  
  // Enhanced touch handlers for mobile
  const handleTouchStart = useCallback(() => {
    if (readOnly) return;
    touchStartTime.current = Date.now();
    setIsPressed(true);
  }, [readOnly]);
  
  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    const touchDuration = Date.now() - touchStartTime.current;
    
    // Long press (>500ms) for quick actions in future
    if (touchDuration > 500) {
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  }, []);
  
  const handleClick = useCallback(() => {
    if (readOnly) return;
    
    setOpen(true);
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }, [readOnly]);

  const save = (bulk?: 'weekdays' | 'weekends' | 'all') => {
    const trimmedAddress = address.trim();
    const trimmedNotes = notes.trim();
    const val = trimmedAddress ? { address: trimmedAddress, notes: trimmedNotes } : null;
    onChange(date, val, bulk);
    setOpen(false);
  };

  const clear = () => {
    setAddress('');
    setNotes('');
    onChange(date, null);
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input,button,select,textarea,a[href]',
      );
      focusable?.[0]?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
        }
        if (e.key === 'Tab' && focusable && focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else if (returnFocus.current) {
      returnFocus.current.focus();
      returnFocus.current = null;
    }
  }, [open]);

  // Determine cell appearance based on state
  const isEmpty = !value?.address?.trim();
  const hasContent = !isEmpty;
  const isToday = date === new Date().toISOString().split('T')[0];
  const normalizedAddress = address.trim();
  const effectiveBuildingOptions = useMemo(() => {
    const options = [...buildingOptions];
    if (normalizedAddress && !options.some((option) => option.location === normalizedAddress)) {
      options.unshift({
        id: -1,
        name: 'כתובת שמורה',
        location: normalizedAddress,
        address: normalizedAddress,
      });
    }
    return options;
  }, [buildingOptions, normalizedAddress]);
  const filteredBuildingOptions = useMemo(() => {
    const query = buildingQuery.trim();
    if (!query) {
      return effectiveBuildingOptions;
    }

    return effectiveBuildingOptions.filter((option) => {
      const haystack = `${option.name} ${option.address || ''} ${option.location}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [buildingQuery, effectiveBuildingOptions]);
  const matchedBuilding = effectiveBuildingOptions.find((option) => option.location === normalizedAddress);
  const allowManualFallback = !buildingsLoading && effectiveBuildingOptions.length === 0;
  
  return (
    <>
      <button
        type="button"
        id={id}
        data-index={dataIndex}
        role="gridcell"
        aria-selected={hasContent}
        aria-label={`יום ${day}${hasContent ? ' – קיים שיבוץ' : ''}${readOnly ? ' – לקריאה בלבד' : ''}`}
        disabled={readOnly}
        className={`
          relative aspect-square w-full min-h-[44px] rounded-2xl border transition-all duration-200
          touch-manipulation focus-ring-mobile text-hebrew
          ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105 active:scale-95'}
          ${isPressed && !readOnly ? 'scale-95' : ''}
          ${hasContent 
            ? 'border-[hsl(var(--primary)/0.34)] bg-[linear-gradient(180deg,rgba(255,245,225,0.95)_0%,rgba(255,255,255,0.98)_100%)] shadow-sm hover:shadow-md' 
            : 'bg-background border-border hover:bg-muted/50'
          }
          ${isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${isWeekend ? 'bg-orange-50/50 border-orange-200/50' : ''}
        `}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        {/* Day number */}
        <span className={`
          text-sm font-medium
          ${hasContent ? 'text-primary' : 'text-foreground'}
          ${isToday ? 'font-bold' : ''}
        `}>
          {day}
        </span>
        
        {/* Content indicator */}
        {hasContent && (
          <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-primary animate-bounce-in" />
        )}
        
        {/* Today indicator */}
        {isToday && (
          <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full animate-pulse-success" />
        )}
        
        {/* Weekend indicator */}
        {isWeekend && !hasContent && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-60" />
        )}
      </button>
      
      {/* Modal dialog - Render via portal to escape transformed ancestors (mobile Safari fix) */}
      {open && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] modal-backdrop bg-black/50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`day-${date}-title`}
              aria-describedby={`day-${date}-desc`}
              lang="he"
              dir="rtl"
              className="w-full sm:max-w-md bg-white text-hebrew rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85dvh] overflow-hidden flex flex-col animate-slide-up sm:animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b bg-blue-50 text-center sm:px-6 sm:py-4">
                <h2 id={`day-${date}-title`} className="text-lg font-bold text-blue-900 sm:text-xl">
                  יום {format(parseISO(date), 'dd/MM')}
                </h2>
                <p className="mt-1 text-sm text-blue-900/70">סמן בניין אחד ליום הזה, והוסף הערה רק אם צריך.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5" id={`day-${date}-desc`}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="label mb-0 text-right">בחירת בניין</label>
                      {matchedBuilding ? (
                        <span className="rounded-full border border-primary/16 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          {matchedBuilding.name}
                        </span>
                      ) : null}
                    </div>

                    {effectiveBuildingOptions.length > 5 ? (
                      <input
                        type="search"
                        value={buildingQuery}
                        onChange={(e) => setBuildingQuery(e.target.value)}
                        placeholder="חיפוש לפי שם בניין או כתובת"
                        className="input text-right placeholder:text-right"
                        inputMode="search"
                      />
                    ) : null}

                    {buildingsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-16 animate-pulse rounded-[18px] border border-border/70 bg-muted/35" />
                        ))}
                      </div>
                    ) : filteredBuildingOptions.length ? (
                      <div className="max-h-64 space-y-2 overflow-y-auto pe-1">
                        {filteredBuildingOptions.map((option) => {
                          const selected = option.location === normalizedAddress;
                          return (
                            <button
                              key={`${option.id}-${option.location}`}
                              type="button"
                              className={`w-full rounded-[20px] border px-4 py-3 text-right transition-all duration-200 ${
                                selected
                                  ? 'border-primary/34 bg-primary/8 shadow-[0_12px_26px_rgba(163,101,18,0.12)]'
                                  : 'border-border/80 bg-background hover:border-primary/20 hover:bg-muted/30'
                              }`}
                              onClick={() => setAddress(option.location)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-foreground">{option.name}</div>
                                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {option.address || option.location}
                                  </div>
                                </div>
                                <span
                                  className={`mt-0.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    selected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'border border-border/70 bg-muted/30 text-muted-foreground'
                                  }`}
                                >
                                  {selected ? 'נבחר' : 'בחר'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : allowManualFallback ? (
                      <div className="space-y-2">
                        <div className="rounded-[18px] border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
                          רשימת הבניינים לא נטענה כרגע. אפשר להזין כתובת ידנית כגיבוי כדי לא לעצור את ההגשה.
                        </div>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="הזן כתובת ידנית"
                          className="input text-right placeholder:text-right"
                          inputMode="text"
                          autoComplete="street-address"
                        />
                      </div>
                    ) : (
                      <div className="rounded-[18px] border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        לא נמצאה התאמה לחיפוש הנוכחי. נסה מילה אחרת או נקה את החיפוש.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label text-right">הערות</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="הערות נוספות"
                      className="input text-right placeholder:text-right min-h-[84px] resize-y"
                      rows={3}
                    />
                    <p className="help-text text-right">ההערה נשמרת יחד עם הבניין שנבחר עבור היום הזה.</p>
                  </div>
                </div>

                {/* Bulk Actions - show only if there is content */}
                {normalizedAddress && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground text-center mb-3">החל על ימים נוספים</p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        className="btn btn-secondary w-full"
                        onClick={() => save('weekdays')}
                      >
                        ימי השבוע
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost w-full text-orange-700 border-orange-200 hover:bg-orange-50"
                          onClick={() => save('weekends')}
                        >
                          סופ״ש
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost w-full text-purple-700 border-purple-200 hover:bg-purple-50"
                          onClick={() => save('all')}
                        >
                          כל החודש
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Action - only when existing value */}
                {(value?.address || value?.notes) && (
                  <div className="pt-2 border-t">
                    <button type="button" className="btn btn-destructive w-full" onClick={clear}>
                      מחק שיבוץ
                    </button>
                  </div>
                )}
              </div>

              {/* Primary actions footer */}
              <div className="px-5 sm:px-6 py-3 sm:py-4 border-t bg-white safe-bottom">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className="btn btn-secondary btn-lg w-full" onClick={() => setOpen(false)}>
                    בטל
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg w-full"
                    onClick={() => save()}
                    disabled={!normalizedAddress}
                  >
                    שמור יום
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default DayCell;
