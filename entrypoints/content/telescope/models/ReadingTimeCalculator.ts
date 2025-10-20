/**
 * Reading Time Calculator
 * Calculates and formats reading time estimates based on word count
 * Uses fixed reading speed of 200 words per minute
 */

import { countWords } from './WordCounter';

export class ReadingTimeCalculator {
  /**
   * Fixed reading speed in words per minute
   * Based on average adult reading speed for technical content
   */
  static readonly WORDS_PER_MINUTE = 200;

  /**
   * Calculate reading time in minutes based on HTML content
   * @param htmlContent - HTML content string to analyze
   * @returns Reading time in minutes (fractional)
   */
  static calculateMinutes(htmlContent: string): number {
    const wordCount = countWords(htmlContent);
    return wordCount / this.WORDS_PER_MINUTE;
  }

  /**
   * Format reading time as human-readable string
   * @param minutes - Reading time in minutes
   * @returns Formatted string or null for invalid input
   *
   * Format examples:
   * - 0.5 minutes → "< 1 min read"
   * - 5 minutes → "5 min read"
   * - 75 minutes → "1 hour 15 min read"
   */
  static formatReadingTime(minutes: number): string | null {
    // Validate input
    if (minutes <= 0 || !isFinite(minutes)) {
      return null;
    }

    // Less than 1 minute
    if (minutes < 1) {
      return '< 1 min read';
    }

    // Less than 60 minutes - show minutes only
    if (minutes < 60) {
      return `${Math.round(minutes)} min read`;
    }

    // 60+ minutes - format as hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (remainingMinutes === 0) {
      return `${hours} hour read`;
    }

    return `${hours} hour ${remainingMinutes} min read`;
  }

  /**
   * Calculate and format reading time in one step
   * @param htmlContent - HTML content to analyze
   * @returns Formatted reading time string or null if invalid
   */
  static estimateReadingTime(htmlContent: string): string | null {
    const minutes = this.calculateMinutes(htmlContent);
    return this.formatReadingTime(minutes);
  }
}
