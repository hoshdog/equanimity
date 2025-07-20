// src/context/breadcrumb-context.tsx
'use client';

import React, { createContext, useState, useContext, useCallback } from 'react';

interface BreadcrumbContextType {
  // The value is now a simple string for the dynamic part of the breadcrumb
  dynamicTitle: string | null;
  setDynamicTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);

  const handleSetTitle = useCallback((title: string | null) => {
    setDynamicTitle(title);
  }, []);

  const value = {
    dynamicTitle,
    setDynamicTitle: handleSetTitle,
  };

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}