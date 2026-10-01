import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { targetApi } from '../api';
import { Target, CollectionSummaryResponse } from '../types';

interface TargetContextType {
  targets: Target[];
  selectedTarget: Target | null;
  isLoadingTargets: boolean;
  targetsError: string | null;
  selectTarget: (target: Target) => void;
  refreshTargets: (selectTargetId?: string) => Promise<void>;
  isCollectionRunning: boolean;
  collectionSummary: CollectionSummaryResponse | null;
  collectionError: string | null;
  triggerCollection: (targetId: string) => Promise<CollectionSummaryResponse | null>;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

const TargetContext = createContext<TargetContextType | undefined>(undefined);

export const TargetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [isLoadingTargets, setIsLoadingTargets] = useState<boolean>(true);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  const [isCollectionRunning, setIsCollectionRunning] = useState<boolean>(false);
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummaryResponse | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const refreshTargets = useCallback(async (selectTargetId?: string) => {
    setIsLoadingTargets(true);
    setTargetsError(null);
    try {
      const response = await targetApi.listTargets(0, 100);
      setTargets(response.items || []);

      if (response.items && response.items.length > 0) {
        if (selectTargetId) {
          const match = response.items.find((t) => t.id === selectTargetId);
          setSelectedTarget(match || response.items[0]);
        } else {
          // Keep current selection if valid, otherwise pick first
          setSelectedTarget((prev) => {
            if (prev) {
              const stillExists = response.items.find((t) => t.id === prev.id);
              if (stillExists) return stillExists;
            }
            return response.items[0];
          });
        }
      } else {
        setSelectedTarget(null);
      }
    } catch (err) {
      setTargetsError(err instanceof Error ? err.message : 'Failed to load assessment targets');
      setSelectedTarget(null);
    } finally {
      setIsLoadingTargets(false);
    }
  }, []);

  useEffect(() => {
    refreshTargets();
  }, [refreshTargets]);

  const selectTarget = (target: Target) => {
    setSelectedTarget(target);
    setCollectionError(null);
    setCollectionSummary(null);
  };

  const triggerCollection = async (targetId: string): Promise<CollectionSummaryResponse | null> => {
    setIsCollectionRunning(true);
    setCollectionError(null);
    setCollectionSummary(null);

    // Optimistically mark target as in_progress
    setSelectedTarget((prev) => prev ? { ...prev, assessment_status: 'in_progress' } : null);

    try {
      const summary = await targetApi.collectDomain(targetId);
      setCollectionSummary(summary);
      
      // Update selected target with new status
      await refreshTargets(targetId);
      return summary;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Collection pipeline execution failed';
      setCollectionError(msg);
      await refreshTargets(targetId);
      return null;
    } finally {
      setIsCollectionRunning(false);
    }
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  return (
    <TargetContext.Provider
      value={{
        targets,
        selectedTarget,
        isLoadingTargets,
        targetsError,
        selectTarget,
        refreshTargets,
        isCollectionRunning,
        collectionSummary,
        collectionError,
        triggerCollection,
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
      }}
    >
      {children}
    </TargetContext.Provider>
  );
};

export const useTarget = (): TargetContextType => {
  const context = useContext(TargetContext);
  if (!context) {
    throw new Error('useTarget must be used within a TargetProvider');
  }
  return context;
};
