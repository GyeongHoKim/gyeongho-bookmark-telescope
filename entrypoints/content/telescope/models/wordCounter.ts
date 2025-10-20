/**
 * Word counting utility for reading time estimation
 * Strips HTML tags and counts words in text content
 */

/**
 * Counts words in HTML content by stripping tags and counting text tokens
 * @param htmlContent - Raw HTML string to analyze
 * @returns Number of words found, or 0 if content is invalid
 */
export function countWords(htmlContent: string): number {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return 0;
  }

  // Strip HTML tags - replace with spaces to preserve word boundaries
  const textOnly = htmlContent.replace(/<[^>]*>/g, ' ');

  // Normalize whitespace and split into words
  const words = textOnly
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return words.length;
}
