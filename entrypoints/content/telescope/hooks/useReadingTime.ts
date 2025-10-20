import { useMemo } from 'react';
import { ReadingTimeCalculator } from '../models/ReadingTimeCalculator';

/**
 * Custom hook that calculates reading time for HTML content
 *
 * This hook wraps the pure TypeScript ReadingTimeCalculator business logic
 * and provides React integration with memoization.
 *
 * @param content - HTML content string to analyze
 * @returns Formatted reading time string (e.g., "5 min read") or null if content is invalid
 *
 * @example
 * ```tsx
 * const readingTime = useReadingTime(previewContent);
 * // Returns: "5 min read" or null
 *
 * {readingTime && <span>{readingTime}</span>}
 * ```
 */
export function useReadingTime(content: string): string | null {
  return useMemo(() => {
    if (!content) {
      return null;
    }
    return ReadingTimeCalculator.estimateReadingTime(content);
  }, [content]);
}
