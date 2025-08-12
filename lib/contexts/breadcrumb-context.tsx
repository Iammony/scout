'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { BreadcrumbItem } from '@/components/ui/breadcrumb-nav';

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  updateBreadcrumb: (index: number, item: Partial<BreadcrumbItem>) => void;
  navigateTo: (index: number) => void;
  reset: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([
    { label: 'Home', icon: undefined, isActive: true }
  ]);

  const setBreadcrumbs = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
    const updatedBreadcrumbs = newBreadcrumbs.map((item, index) => ({
      ...item,
      isActive: index === newBreadcrumbs.length - 1
    }));
    setBreadcrumbsState(updatedBreadcrumbs);
  }, []);

  const addBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbsState(prev => {
      const updated = prev.map(crumb => ({ ...crumb, isActive: false }));
      return [...updated, { ...item, isActive: true }];
    });
  }, []);

  const updateBreadcrumb = useCallback((index: number, updates: Partial<BreadcrumbItem>) => {
    setBreadcrumbsState(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    );
  }, []);

  const navigateTo = useCallback((index: number) => {
    setBreadcrumbsState(prev => {
      const newBreadcrumbs = prev.slice(0, index + 1);
      return newBreadcrumbs.map((item, i) => ({
        ...item,
        isActive: i === index
      }));
    });
  }, []);

  const reset = useCallback(() => {
    setBreadcrumbsState([
      { label: 'Home', icon: undefined, isActive: true }
    ]);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      updateBreadcrumb,
      navigateTo,
      reset
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}

// Hook for easy breadcrumb management in components
export function useBreadcrumbNavigation() {
  const { setBreadcrumbs, addBreadcrumb, navigateTo } = useBreadcrumb();

  // Helper functions for common navigation patterns
  const setHomeBreadcrumb = useCallback(() => {
    setBreadcrumbs([{ label: 'Home', isActive: true }]);
  }, [setBreadcrumbs]);

  const setCreateJourneyBreadcrumb = useCallback(() => {
    setBreadcrumbs([
      { label: 'Home', isActive: false },
      { label: 'Create Journey', isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const setViewCardBreadcrumb = useCallback((destination: string) => {
    setBreadcrumbs([
      { label: 'Home', isActive: false },
      { label: `Travel to ${destination}`, isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const setMobileCaptureBreadcrumb = useCallback(() => {
    setBreadcrumbs([
      { label: 'Home', isActive: false },
      { label: 'Capture Location', isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const setFormStepBreadcrumb = useCallback((stepName: string, stepNumber?: number) => {
    const stepLabel = stepNumber ? `Step ${stepNumber}: ${stepName}` : stepName;
    setBreadcrumbs([
      { label: 'Home', isActive: false },
      { label: 'Create Journey', isActive: false },
      { label: stepLabel, isActive: true }
    ]);
  }, [setBreadcrumbs]);

  return {
    setHomeBreadcrumb,
    setCreateJourneyBreadcrumb,
    setViewCardBreadcrumb,
    setMobileCaptureBreadcrumb,
    setFormStepBreadcrumb,
    navigateTo,
    addBreadcrumb
  };
}