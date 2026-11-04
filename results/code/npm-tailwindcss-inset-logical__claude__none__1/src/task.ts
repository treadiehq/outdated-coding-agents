/**
 * Tailwind classes for a close button absolutely positioned 1rem from the top
 * and 1rem from the trailing edge of its card. `end-4` uses the logical
 * `inset-inline-end` property, so it flips to the left in RTL layouts.
 * The parent card must be positioned (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 end-4";
}
