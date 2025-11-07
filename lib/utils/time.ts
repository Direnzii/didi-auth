/**
 * Formats milliseconds to human-readable time
 * @param ms - Milliseconds
 * @returns Formatted string (e.g., "5h", "20 minuto(s)")
 */
export const formatLockTime = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h`;
  return `${minutes} minuto(s)`;
};

/**
 * Formats seconds to countdown timer format
 * @param seconds - Seconds remaining
 * @returns Formatted string (e.g., "1h 23m 45s")
 */
export const formatRemainingTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

/**
 * Gets current date in DD-MM-YYYY format
 */
export const getCurrentDateFormatted = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

