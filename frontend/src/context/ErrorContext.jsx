import { createContext, useState, useCallback, useMemo } from 'react';

export const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);

  const showError = useCallback((message, type = 'error') => {
    setError({ message, type });
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const errorValue = useMemo(() => ({
    error,
    showError,
    clearError,
  }), [error, showError, clearError]);

  return (
    <ErrorContext.Provider value={errorValue}>
      {children}
    </ErrorContext.Provider>
  );
}
