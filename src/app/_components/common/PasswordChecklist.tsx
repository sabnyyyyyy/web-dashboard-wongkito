'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/password';

// Live list of the password rules under a "new password" field: grey until typing starts,
// then green or red per rule.
export const PasswordChecklist: React.FC<{ password: string }> = ({ password }) => (
  <ul className="mt-2 space-y-0.5 text-[11px]" aria-label="Syarat password">
    {PASSWORD_RULES.map((rule) => {
      const ok = rule.test(password);
      const color = password === '' ? 'text-stone-400' : ok ? 'text-emerald-600' : 'text-red-500';
      return (
        <li key={rule.label} className={`flex items-center gap-1.5 ${color}`}>
          {ok ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
          <span>{rule.label}</span>
        </li>
      );
    })}
  </ul>
);
