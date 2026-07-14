import { Transaction } from '../types';

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
}

/**
 * Calculates the current active consecutive day streak and longest consecutive day streak.
 * Dates are processed using local timezone date strings (YYYY-MM-DD).
 */
export function calculateStreak(
  transactions: Transaction[], 
  todayStr: string = new Date().toISOString().split('T')[0]
): StreakResult {
  if (!transactions || transactions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeToday: false };
  }

  // Extract date portion (YYYY-MM-DD) from transaction dates and get unique dates
  const uniqueDates = Array.from(
    new Set(
      transactions
        .filter(t => t.date)
        .map(t => t.date.substring(0, 10))
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeToday: false };
  }

  const latestDateStr = uniqueDates[0];
  const activeToday = latestDateStr === todayStr;

  // Time stamp parser mapping YYYY-MM-DD to UTC midnight milliseconds to prevent any timezone shifts
  const parseToMidnightUTC = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const todayMs = parseToMidnightUTC(todayStr);
  const latestMs = parseToMidnightUTC(latestDateStr);

  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysSinceLatest = Math.round((todayMs - latestMs) / oneDayMs);

  let currentStreak = 0;
  // If the latest transaction is from today (0 days ago) or yesterday (1 day ago), the streak is alive
  if (daysSinceLatest <= 1) {
    currentStreak = 1;
    let currentMs = latestMs;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevMs = parseToMidnightUTC(uniqueDates[i]);
      const diffDays = Math.round((currentMs - prevMs) / oneDayMs);
      
      if (diffDays === 1) {
        currentStreak++;
        currentMs = prevMs;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }
  }

  // Calculate longest streak historically
  let longestStreak = 0;
  let tempStreak = 0;
  let lastMs: number | null = null;

  // Sort ascending for historical sequential analysis
  const sortedAsc = [...uniqueDates].sort((a, b) => a.localeCompare(b));
  for (const dateStr of sortedAsc) {
    const currentMs = parseToMidnightUTC(dateStr);
    if (lastMs === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currentMs - lastMs) / oneDayMs);
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    lastMs = currentMs;
  }
  
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  return { currentStreak, longestStreak, activeToday };
}
