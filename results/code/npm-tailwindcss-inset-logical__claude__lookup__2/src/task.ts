/**
 * Tailwind classes for an absolutely positioned close button, 1rem from the
 * top and 1rem from the trailing edge of its card (right in LTR, left in RTL).
 *
 * Uses the logical `inset-e-*` utility (`inset-inline-end`), which flips with
 * text direction. Assumes the default spacing scale where `4` is 1rem, and
 * that the card is a positioned element (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
