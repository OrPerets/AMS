"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface FileUploadProps {
  label?: string;
  hint?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect?: (file: File | null) => void;
  onUpload?: (file: File) => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = "העלה מסמך",
  hint = "קבצי PDF, תמונות או מסמכים",
  accept = "application/pdf,image/*",
  maxSizeMb = 10,
  onFileSelect,
  onUpload,
  className,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [isUploading, setUploading] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileSelect?.(null);
  }, [onFileSelect]);

  const handleFile = useCallback(
    (incoming: File | null) => {
      if (!incoming) {
        reset();
        return;
      }

      if (incoming.size > maxSizeMb * 1024 * 1024) {
        setError(`הקובץ גדול מדי. הגודל המקסימלי הוא ${maxSizeMb}MB.`);
        return;
      }

      setError(null);
      setFile(incoming);
      onFileSelect?.(incoming);
    },
    [maxSizeMb, onFileSelect, reset]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragging(false);
      if (disabled) return;
      const droppedFile = event.dataTransfer.files?.[0];
      handleFile(droppedFile || null);
    },
    [disabled, handleFile]
  );

  const onBrowse = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const upload = useCallback(async () => {
    if (!file || !onUpload) return;
    try {
      setUploading(true);
      await onUpload(file);
      reset();
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה בעת העלאת הקובץ.");
    } finally {
      setUploading(false);
    }
  }, [file, onUpload, reset]);

  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <label
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 px-6 py-8 text-center transition-colors",
          disabled && "cursor-not-allowed opacity-60",
          !disabled && "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">גרור ושחרר קובץ כאן</p>
        <p className="text-xs text-muted-foreground">או לחץ לבחירה מהמחשב</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          size="sm"
          onClick={onBrowse}
          disabled={disabled}
        >
          בחר קובץ
        </Button>
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
        <p className="mt-1 text-[11px] text-muted-foreground">מקסימום {maxSizeMb}MB</p>
      </label>

      {file && (
        <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onUpload && (
              <Button
                type="button"
                size="sm"
                onClick={upload}
                disabled={disabled || isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> מעלה...
                  </span>
                ) : (
                  "העלה"
                )}
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={reset}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
