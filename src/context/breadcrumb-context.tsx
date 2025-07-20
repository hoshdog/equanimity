// src/context/breadcrumb-context.tsx
'use client';

import React, { createContext, useState, useContext, useCallback } from 'react';

interface BreadcrumbContextType {
  breadcrumbs: { [path: string]: string };
  setBreadcrumbs: (breadcrumbs: { [path: string]: string }) => void;
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
  const [breadcrumbs, setBreadcrumbs] = useState<{ [path: string]: string }>({});

  const handleSetBreadcrumbs = useCallback((newBreadcrumbs: { [path: string]: string }) => {
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  const value = {
    breadcrumbs,
    setBreadcrumbs: handleSetBreadcrumbs,
  };

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}
