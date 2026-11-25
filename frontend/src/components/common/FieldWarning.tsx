'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Red hint under a form field; renders nothing when there is no message.
export const FieldWarning: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
      <AlertTriangle className="w-3 h-3 shrink-0" />
      <span>{message}</span>
    </p>
  ) : null;

// Border classes for a field that has a warning.
export const invalidFieldClass = 'border-red-400 focus:border-red-500 bg-red-50/40';
