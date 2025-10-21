/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified delay has elapsed since the last call.
 *
 * @param fn - The function to debounce (can be sync or async)
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns A debounced version of the function with a cancel method
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 500);
 *
 * // Call multiple times rapidly
 * debouncedSearch('hello');
 * debouncedSearch('hello world'); // Only this will execute after 500ms
 *
 * // Cancel pending execution
 * debouncedSearch.cancel();
 * ```
 */
export function debounce<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  delay: number = 300
): ((...args: Args) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
