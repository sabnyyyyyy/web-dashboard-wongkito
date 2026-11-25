'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Short-lived success/info message ("Stok berhasil diperbarui!").
// A new message restarts the timer, and the timer is cleared when the page unmounts.
export const useToast = (durationMs = 3500) => {
  const [toastMessage, setToastMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      setToastMessage(message);
      timer.current = setTimeout(() => setToastMessage(''), durationMs);
    },
    [durationMs]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { toastMessage, showToast };
};
