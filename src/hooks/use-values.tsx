"use client";

import { useCallback, useState } from "react";

/**
 * Minimal controlled-form state. `onValueChange` is keyed to `T`, so each field
 * value is type-checked against the property it targets.
 */
export const useValues = <T extends object>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);

  const onValueChange = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onReset = useCallback((next: T = initialValues) => setValues(next), [initialValues]);

  return { values, setValues, onValueChange, onReset };
};
