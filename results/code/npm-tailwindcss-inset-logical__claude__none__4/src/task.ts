/**
 * Tailwind classes for an absolutely positioned close button placed 1rem from
 * the top and 1rem from the trailing edge of its card. `end-4` is a logical
 * property (inset-inline-end), so it flips to the left in RTL layouts.
 * The card must be a positioned element (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 end-4";
}
