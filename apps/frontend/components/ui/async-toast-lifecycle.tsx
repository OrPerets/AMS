"use client";

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface AsyncToastOptions<T> {
  pending: string;
  success: string | ((data: T) => string);
  error?: string | ((err: unknown) => string);
  undoAction?: () => void | Promise<void>;
  openAction?: { label: string; onClick: () => void };
  detailsAction?: { label: string; onClick: () => void };
}

export function asyncToast<T>(
  promise: Promise<T>,
  options: AsyncToastOptions<T>,
): Promise<T> {
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-skeleton-lifecycle');

  if (!featureEnabled) {
    return promise;
  }

  const toastId = sonnerToast.promise(promise, {
    loading: options.pending,
    success: (data: T) => {
      const message = typeof options.success === 'function'
        ? options.success(data)
        : options.success;
      return message;
    },
    error: (err: unknown) => {
      const message = typeof options.error === 'function'
        ? options.error(err)
        : options.error ?? 'Operation failed';
      return message;
    },
  });

  if (options.undoAction) {
    promise.then(() => {
      sonnerToast('Action completed', {
        action: {
          label: 'Undo',
          onClick: () => {
            void options.undoAction?.();
          },
        },
        duration: 8000,
      });
    });
  }

  if (options.openAction) {
    promise.then(() => {
      sonnerToast.dismiss(toastId as string | number);
      sonnerToast('Done', {
        action: {
          label: options.openAction!.label,
          onClick: options.openAction!.onClick,
        },
        duration: 5000,
      });
    });
  }

  return promise;
}

export function successMicroAffirmation(
  message: string,
  options?: { icon?: string; duration?: number },
) {
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-skeleton-lifecycle');
  if (!featureEnabled) return;

  sonnerToast.success(message, {
    duration: options?.duration ?? 2500,
    icon: options?.icon,
  });
}

interface CancellableToastOptions {
  message: string;
  onCancel: () => void;
  duration?: number;
}

export function cancellableProgressToast({ message, onCancel, duration = 10000 }: CancellableToastOptions) {
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-skeleton-lifecycle');
  if (!featureEnabled) return;

  return sonnerToast(message, {
    duration,
    action: {
      label: 'Cancel',
      onClick: onCancel,
    },
    cancel: {
      label: 'Dismiss',
      onClick: () => {},
    },
  });
}
