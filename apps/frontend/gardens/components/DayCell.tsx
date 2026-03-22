'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';

export interface DayEntry {
  address: string;
  notes: string;
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
}

const DayCell: FC<DayCellProps> = ({
  date,
  value,
  onChange,
  id,
  dataIndex,
  readOnly = false,
  isWeekend = false,
}) => {
  const day = Number(date.slice(-2));
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const touchStartTime = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  
  // Format date for Hebrew display

  useEffect(() => {
    if (open) {
      setAddress(value?.address ?? '');
      setNotes(value?.notes ?? '');
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
    const val = address || notes ? { address, notes } : null;
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
  const isEmpty = !value?.address && !value?.notes;
  const hasContent = !isEmpty;
  const isToday = date === new Date().toISOString().split('T')[0];
  
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
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm hover:shadow-md' 
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
          ${hasContent ? 'text-blue-700' : 'text-foreground'}
          ${isToday ? 'font-bold' : ''}
        `}>
          {day}
        </span>
        
        {/* Content indicator */}
        {hasContent && (
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-bounce-in" />
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
              {/* Header */}
              <div className="px-6 py-4 border-b bg-blue-50 text-center">
                <h2 id={`day-${date}-title`} className="text-xl font-bold text-blue-900">
                  יום {format(parseISO(date), 'dd/MM')}
                </h2>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5" id={`day-${date}-desc`}>
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="label text-right">כתובת</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="הכנס כתובת"
                      className="input text-right placeholder:text-right"
                      inputMode="text"
                      autoComplete="street-address"
                    />
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
                  </div>
                </div>

                {/* Bulk Actions - show only if there is content */}
                {(address.trim() || notes.trim()) && (
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
                  <button type="button" className="btn btn-primary btn-lg w-full" onClick={() => save()}>
                    שמור
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
