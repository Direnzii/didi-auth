import { LOCK_CONFIG } from '../constants/storage';
import type { LockData } from '../types';

/**
 * Gets the lock duration based on lock count
 */
export const getLockDuration = (lockCount: number): number => {
  const index = Math.min(lockCount, LOCK_CONFIG.LOCK_DURATIONS.length - 1);
  return LOCK_CONFIG.LOCK_DURATIONS[index];
};

/**
 * Checks if currently locked
 */
export const isCurrentlyLocked = (lockData: LockData): boolean => {
  return lockData.lockUntil !== null && Date.now() < lockData.lockUntil;
};

/**
 * Gets remaining lock time in seconds
 */
export const getRemainingLockTime = (lockUntil: number | null): number => {
  if (!lockUntil) return 0;
  const remaining = Math.max(0, lockUntil - Date.now());
  return Math.ceil(remaining / 1000);
};

