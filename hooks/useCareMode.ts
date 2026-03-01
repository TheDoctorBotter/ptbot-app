import { useContext } from 'react';
import { CareModeContext } from '@/contexts/CareModeContext';

export type { CareMode } from '@/contexts/CareModeContext';

/**
 * Global hook for care mode (adult orthopedic vs. pediatric development).
 * All consumers share the same state via CareModeContext.
 */
export function useCareMode() {
  return useContext(CareModeContext);
}
