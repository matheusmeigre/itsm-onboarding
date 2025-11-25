import { useState, useEffect } from 'react';

interface UseDebouncedValueOptions {
  delay?: number;
}

export function useDebouncedValue<T>(value: T, options: UseDebouncedValueOptions = {}): T {
  const { delay = 300 } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
