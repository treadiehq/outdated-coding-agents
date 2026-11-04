/**
 * Tailwind classes for a card's close button. `inset-e-4` sets
 * `inset-inline-end`, so the button flips sides in right-to-left layouts.
 * The card must be a positioned ancestor (e.g. `relative`).
 */
export function closeButtonClasses(): string {
  return "absolute top-4 inset-e-4";
}
