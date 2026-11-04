/**
 * Tailwind classes for a close button absolutely positioned 1rem from the top
 * and 1rem from the trailing edge of its card (right in LTR, left in RTL).
 * The card must be `relative` (or otherwise a positioned ancestor).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 end-4";
}
