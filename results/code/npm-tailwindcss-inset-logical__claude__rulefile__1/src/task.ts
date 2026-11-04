/**
 * Tailwind classes for an absolutely positioned close button placed 1rem from
 * the top and 1rem from the trailing edge of its card. `inset-e-4` uses the
 * logical `inset-inline-end` property, so it flips to the left in RTL layouts.
 * The card must be a positioned element (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
