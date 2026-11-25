'use client';

import { useEffect, useState } from 'react';

// Returns `value` once it has stopped changing for `delayMs`. Search boxes use it so a long
// list is filtered once per pause in typing instead of on every keystroke.
export const useDebounce = <T,>(value: T, delayMs = 250): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
